import './no-env.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newDb} from 'pg-mem';
import session from 'express-session';
import request from 'supertest';
import {createMailSender,MailDeliveryError} from '../src/auth/mail.js';
import {createAuth as createAuthImplementation} from '../src/auth/index.js';
import {createApp} from '../src/app.js';
import {createFixture} from '../../tests/fixtures.js';
import {verify} from '../src/auth/crypto.js';
import {dishImage} from '../src/lib/presentation.js';
const createAuth = options => createAuthImplementation({recaptchaVerifier: async () => true, ...options});

const quiet={warn(){},error(){}};
test('temporary SMTP failure retries same message; permanent failure is sanitized',async()=>{
 let calls=[];const sender=createMailSender({sendMail:async m=>{calls.push(m);if(calls.length===1)throw Object.assign(new Error('private details'),{code:'ECONNRESET'});return {accepted:['example']};}},{logger:quiet});
 await sender('recipient@example.invalid','OTP','same-secret-otp');assert.equal(calls.length,2);assert.equal(calls[0].text,calls[1].text);
 const logs=[];const failed=createMailSender({sendMail:async()=>{throw Object.assign(new Error('do-not-log-this-password'),{code:'EAUTH'});}},{logger:{error:(...v)=>logs.push(v)}});
 await assert.rejects(failed('private@example.invalid','OTP','private-code'),MailDeliveryError);
 assert(!JSON.stringify(logs).includes('private'));assert(!JSON.stringify(logs).includes('password'));
 const rejected=createMailSender({sendMail:async()=>({accepted:[],rejected:['recipient@example.invalid']})},{logger:quiet});await assert.rejects(rejected('recipient@example.invalid','OTP','123456'),MailDeliveryError);
});

test('failed first OTP can recover via registration/resend; failed resend preserves old OTP',async()=>{
 const memory=newDb();const {Pool}=memory.adapters.createPg();const pool=new Pool();
 await pool.query(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8'));
 let failing=true;const calls=[];
 const auth=createAuth({pool,mailLogger:quiet,sessionStore:new session.MemoryStore(),mailer:{sendMail:async m=>{calls.push(m);if(failing)throw Object.assign(new Error('simulated SMTP failure'),{code:'EAUTH'});return {accepted:[m.to]};}}});
 const app=createApp({db:createFixture().db,auth});const agent=request.agent(app);
 const page=await agent.get('/register');const csrf=page.text.match(/name="_csrf" value="([^"]+)"/)[1];
 const post=(path,body)=>agent.post(path).type('form').send({_csrf:csrf,...body});
 const e='otp-delivery@example.com',password='original-registration-password';
 async function register(p=password){return post('/register',{email:e,password:p,confirmPassword:p});}
 try{
  const first=await register();assert.equal(first.status,303);assert.equal((await pool.query('SELECT * FROM block8_auth.activation')).rows.length,0);
  assert.equal((await pool.query('SELECT status FROM block8_auth.users')).rows[0].status,'pending');
  failing=false;const again=await register('different-registration-password');assert.equal(again.status,303);
  assert.equal((await pool.query('SELECT * FROM block8_auth.users')).rows.length,1);
  assert(await verify(password,(await pool.query('SELECT password_hash FROM block8_auth.users')).rows[0].password_hash));
  const old=(await pool.query('SELECT * FROM block8_auth.activation')).rows[0];const acceptedCount=calls.length;
  const duplicate=await register();assert.equal(duplicate.status,303);assert.equal(calls.length,acceptedCount,'cooldown must prevent duplicate sending');
  await post('/activate/resend',{email:e}).expect(303);
  await auth.drainMail();assert.equal(calls.length,acceptedCount);
  await pool.query("UPDATE block8_auth.activation SET last_sent_at=now()-interval '2 minutes',attempts=3");
  await pool.query("UPDATE block8_auth.mail_cooldowns SET available_at=now()-interval '1 second'");
  failing=true;await post('/activate/resend',{email:e}).expect(303);await auth.drainMail();
  const afterFailure=(await pool.query('SELECT * FROM block8_auth.activation')).rows[0];
  assert.equal(afterFailure.hash,old.hash);assert.equal(afterFailure.attempts,3);assert.equal(+new Date(afterFailure.expires_at),+new Date(old.expires_at));
  await pool.query("UPDATE block8_auth.mail_cooldowns SET available_at=now()-interval '1 second'");
  failing=false;await post('/activate/resend',{email:e}).expect(303);await auth.drainMail();
  const updated=(await pool.query('SELECT * FROM block8_auth.activation')).rows[0];
  assert.notEqual(updated.hash,old.hash);assert.equal(updated.attempts,3);
  const otp=calls.at(-1).text.match(/\d{6}/)[0];
  await post('/activate',{email:e,otp}).expect(303).expect('Location','/login');
 }finally{await auth.drainMail();await pool.end();}
});

test('SSR maps the known blocked dish URL to a real local JPEG without changing the source record',async()=>{
 const dish={name:'Chả cá Lã Vọng',imagePath:'https://www.huongnghiepaau.com/wp-content/uploads/2018/01/cach-lam-cha-ca-la-vong.jpg'};
 const original=dish.imagePath;assert.equal(dishImage(dish),'/images/cha-ca-la-vong.jpg');assert.equal(dish.imagePath,original);
 assert.equal(dishImage({...dish,imagePath:'/images/custom.jpg'}),'/images/custom.jpg');
 const bytes=await readFile(new URL('../public/images/cha-ca-la-vong.jpg',import.meta.url));assert.equal(bytes[0],255);assert.equal(bytes[1],216);
 const fixture=createFixture();fixture.storage.dish.push({...fixture.storage.dish[0],id:6555,...dish});
 const auth={pool:{},middleware:(req,res,next)=>next(),router:(req,res,next)=>{res.locals.csrf='test';res.locals.user=null;next();},csrf:(req,res,next)=>next()};
 const app=createApp({db:fixture.db,auth});
 const page=await request(app).get('/').expect(200);assert(page.text.includes('/images/cha-ca-la-vong.jpg'));assert(!page.text.includes(original));
 await request(app).get('/images/cha-ca-la-vong.jpg').expect(200).expect('Content-Type',/image\/jpeg/);
});

test('failed reset email preserves previous reset link and successful delivery replaces it',async()=>{
 const {hashPassword,digest}=await import('../src/auth/crypto.js');
 const memory=newDb();const {Pool}=memory.adapters.createPg();const pool=new Pool();
 await pool.query(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8'));
 const user=(await pool.query("INSERT INTO block8_auth.users(email,password_hash,status) VALUES('reset-delivery@example.com',$1,'active') RETURNING id",[await hashPassword('original-reset-password')])).rows[0];
 await pool.query('INSERT INTO block8_auth.resets(hash,user_id,expires_at) VALUES($1,$2,$3)',[digest('previous-reset-link'),user.id,new Date(Date.now()+900000)]);
 let fail=true;const messages=[];
 const auth=createAuth({pool,mailLogger:quiet,sessionStore:new session.MemoryStore(),mailer:{sendMail:async m=>{if(fail)throw Object.assign(new Error('simulated'),{code:'EAUTH'});messages.push(m);return {accepted:[m.to]};}}});
 const agent=request.agent(createApp({db:createFixture().db,auth}));
 try{
   const page=await agent.get('/forgot');const csrf=page.text.match(/name="_csrf" value="([^"]+)"/)[1];
   await agent.post('/forgot').type('form').send({_csrf:csrf,email:'reset-delivery@example.com'}).expect(200);await auth.drainMail();
   assert.equal((await pool.query('SELECT used_at FROM block8_auth.resets')).rows[0].used_at,null);
   fail=false;await agent.post('/forgot').type('form').send({_csrf:csrf,email:'reset-delivery@example.com'}).expect(200);await auth.drainMail();
   assert((await pool.query('SELECT used_at FROM block8_auth.resets WHERE hash=$1',[digest('previous-reset-link')])).rows[0].used_at);
   assert.equal(messages.length,1);assert.equal((await pool.query('SELECT * FROM block8_auth.resets')).rows.length,2);
 }finally{await auth.drainMail();await pool.end();}
});
