import test from 'node:test';
import {fork} from 'node:child_process';
import {once} from 'node:events';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import pg from 'pg';
import request from 'supertest';
import '../../api/src/config/env.js';
import {createAuth} from '../src/auth/index.js';
import {createApp} from '../src/app.js';
import {createFixture} from '../../tests/fixtures.js';
import {hashPassword,verify,mac,digest} from '../src/auth/crypto.js';
process.env.SSR_SESSION_SECRET='test-only-secret-with-at-least-32-characters';
test('scrypt hashes are salted and passwords verify',async()=>{const a=await hashPassword('long-password-for-test');assert(await verify('long-password-for-test',a));assert(!await verify('wrong',a));assert.notEqual(a,await hashPassword('long-password-for-test'));});
test('SSR auth PostgreSQL contracts', {skip:!process.env.DATABASE_URL&&!process.env.TEST_DATABASE_URL},async t=>{
 const schema=`block8_test_${Date.now()}`;const pool=new pg.Pool({connectionString:process.env.TEST_DATABASE_URL||process.env.DATABASE_URL,connectionTimeoutMillis:10000});
 const migration=(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8')).replaceAll('block8_auth',schema);
 const q=(s,p=[])=>pool.query(s.replaceAll('block8_auth',schema),p);const messages=[];
 try{await pool.query(migration);const auth=createAuth({schema,pool,mailer:{sendMail:async m=>messages.push(m)}});const fixture=createFixture();const app=createApp({db:fixture.db||fixture,auth});
 const agent=request.agent(app);const get=await agent.get('/login').expect(200);const csrf=get.text.match(/name="_csrf" value="([^"]+)"/)[1];
 const post=(path,data={})=>agent.post(path).type('form').send({_csrf:csrf,...data});
 await t.test('SSR forms and all CRUD routes reject anonymous requests',async()=>{assert(get.text.includes('Đăng nhập'));for(const route of ['/dishes','/dishes/1','/restaurants/1','/api/restaurants/suggestions','/admin',...['dishes','chefs','ingredients','restaurants'].flatMap(r=>[`/admin/${r}`,`/admin/${r}/new`,`/admin/${r}/1`,`/admin/${r}/1/edit`,`/admin/${r}/1/delete`])])await agent.get(route).expect(303).expect('Location','/login');for(const verb of ['post','patch','delete'])await agent[verb]('/admin/dishes/1').expect(303);await post('/login',{email:'x@example.com',password:'wrong',_csrf:'wrong'}).expect(403);});
 async function challenge(purpose,answer='ABC234'){const r=await agent.get(`/captcha?purpose=${purpose}`).expect(200);await q('UPDATE block8_auth.captcha SET hash=$1 WHERE id=$2',[mac(answer),r.body.id]);return {challengeId:r.body.id,captcha:answer};}
 const password='a-long-test-password-123';
 await t.test('register CAPTCHA, pending, OTP and single use',async()=>{await post('/register',{email:'test@example.com',password}).expect(400);await post('/register',{email:'test@example.com',password,role:'admin',...await challenge('register')}).expect(303);let u=(await q('SELECT * FROM block8_auth.users')).rows[0];assert.equal(u.role,'viewer');assert.equal(u.status,'pending');await post('/login',{email:u.email,password}).expect(400);assert.equal(messages.length,1);const otp=messages[0].text.match(/\d{6}/)[0];assert.notEqual((await q('SELECT hash FROM block8_auth.activation')).rows[0].hash,otp);const activation=await Promise.all([post('/activate',{email:u.email,otp}),post('/activate',{email:u.email,otp})]);assert.deepEqual(activation.map(r=>r.status).sort(),[303,400]);await post('/activate',{email:u.email,otp}).expect(400);await agent.get('/admin').expect(303);});
 let cookie;
 await t.test('login rotates sid, session persists across app instances and logout revokes',async()=>{const login=await post('/login',{email:'test@example.com',password}).expect(303);cookie=login.headers['set-cookie'][0].split(';')[0];assert(cookie.startsWith('sid='));assert(login.headers['set-cookie'][0].includes('HttpOnly'));const second=createApp({db:fixture.db||fixture,auth:createAuth({schema,pool,mailer:{sendMail:async()=>{}}})});await request(second).get('/admin').set('Cookie',cookie).expect(302);
async function worker(){const child=fork(new URL('./server-fixture.js',import.meta.url),{env:{...process.env,AUTH_TEST_SCHEMA:schema},stdio:['ignore','ignore','inherit','ipc']});const [ready]=await once(child,'message');return {child,url:`http://127.0.0.1:${ready.port}`};}
const first=await worker();await request(first.url).get('/admin').set('Cookie',cookie).expect(302);first.child.send('stop');await once(first.child,'exit');const restarted=await worker();await request(restarted.url).get('/admin').set('Cookie',cookie).expect(302);restarted.child.send('stop');await once(restarted.child,'exit');const page=await agent.get('/login');const fresh=page.text.match(/name="_csrf" value="([^"]+)"/)[1];await agent.post('/logout').type('form').send({_csrf:fresh}).expect(303);await request(app).get('/admin').set('Cookie',cookie).expect(303).expect('Location','/login');});
 await t.test('reset GET does not consume token, POST consumes and revokes',async()=>{const live=request.agent(app);const loginPage=await live.get('/login');const liveCsrf=loginPage.text.match(/name="_csrf" value="([^"]+)"/)[1];const logged=await live.post('/login').type('form').send({_csrf:liveCsrf,email:'test@example.com',password}).expect(303);const oldSid=logged.headers['set-cookie'][0].split(';')[0];const page=await agent.get('/forgot');const fresh=page.text.match(/name="_csrf" value="([^"]+)"/)[1];await agent.post('/forgot').type('form').send({_csrf:fresh,email:'test@example.com'}).expect(200);await auth.drainMail();const tok=new URL(messages.findLast(message=>message.subject==='Đặt lại mật khẩu').text).searchParams.get('token');await agent.get(`/reset?token=${tok}`).expect(200);assert.equal((await q('SELECT used_at FROM block8_auth.resets WHERE hash=$1',[digest(tok)])).rows[0].used_at,null);await agent.post('/reset').type('form').send({_csrf:fresh,token:tok,password:'new-long-test-password'}).expect(303);await request(app).get('/admin').set('Cookie',oldSid).expect(303).expect('Location','/login');const afterReset=await agent.get('/login');const resetCsrf=afterReset.text.match(/name="_csrf" value="([^"]+)"/)[1];await agent.post('/reset').type('form').send({_csrf:resetCsrf,token:tok,password:'new-long-test-password'}).expect(400);});

 await t.test('OTP resend retains attempts, replaces old code, expiry and lock are enforced',async()=>{
 const page=await agent.get('/activate');const fresh=page.text.match(/name="_csrf" value="([^"]+)"/)[1];const e='pending@example.com';
 const u=(await q("INSERT INTO block8_auth.users(email,password_hash) SELECT $1,password_hash FROM block8_auth.users WHERE email='test@example.com' RETURNING id",[e])).rows[0];
 await q("INSERT INTO block8_auth.activation(user_id,hash,expires_at,attempts,last_sent_at) VALUES($1,$2,now()+interval '10 minutes',3,now()-interval '2 minutes')",[u.id,mac(`${u.id}:123456`)]);
 await agent.post('/activate/resend').type('form').send({_csrf:fresh,email:e}).expect(303);await auth.drainMail();assert.equal((await q('SELECT attempts FROM block8_auth.activation WHERE user_id=$1',[u.id])).rows[0].attempts,3);
 const otp=messages.at(-1).text.match(/\d{6}/)[0];await agent.post('/activate').type('form').send({_csrf:fresh,email:e,otp:'123456'}).expect(400);assert.equal((await q('SELECT attempts FROM block8_auth.activation WHERE user_id=$1',[u.id])).rows[0].attempts,4);
 await agent.post('/activate').type('form').send({_csrf:fresh,email:e,otp}).expect(303);
 await q("UPDATE block8_auth.users SET status='pending' WHERE id=$1",[u.id]);await q("UPDATE block8_auth.activation SET used_at=NULL,attempts=0,expires_at=now()-interval '1 second' WHERE user_id=$1",[u.id]);await agent.post('/activate').type('form').send({_csrf:fresh,email:e,otp}).expect(400);
 await q("UPDATE block8_auth.activation SET locked_until=now()+interval '15 minutes' WHERE user_id=$1",[u.id]);await agent.post('/activate').type('form').send({_csrf:fresh,email:e,otp}).expect(429);await agent.post('/activate/resend').type('form').send({_csrf:fresh,email:e}).expect(429);
 });
 await t.test('authenticated normal and multipart writes reject CSRF, including foreign Origin',async()=>{
 const live=request.agent(app);const page=await live.get('/login');const fresh=page.text.match(/name="_csrf" value="([^"]+)"/)[1];await live.post('/login').set('Origin','https://foreign.invalid').type('form').send({_csrf:fresh,email:'test@example.com',password:'new-long-test-password'}).expect(403);
 await live.post('/login').type('form').send({_csrf:fresh,email:'test@example.com',password:'new-long-test-password'}).expect(303);
 await live.post('/admin/chefs').type('form').send({name:'Must not persist'}).expect(403);
 await live.post('/admin/dishes').field('_csrf','wrong').attach('imageFile',Buffer.from('not-an-image'),'test.png').expect(403);
 await live.get('/admin/dishes/new').expect(200);
 });
 await t.test('CAPTCHA binds session and purpose, expires, and cannot replay',async()=>{
 const page=await agent.get('/register');const fresh=page.text.match(/name="_csrf" value="([^"]+)"/)[1];
 const data=await challenge('login');await agent.post('/register').type('form').send({_csrf:fresh,email:'other@example.com',password,...data}).expect(400);
 const valid=await challenge('register');const stranger=request.agent(app);const other=await stranger.get('/register');const otherCsrf=other.text.match(/name="_csrf" value="([^"]+)"/)[1];await stranger.post('/register').type('form').send({_csrf:otherCsrf,email:'another@example.com',password,...valid}).expect(400);
 await q("UPDATE block8_auth.captcha SET expires_at=now()-interval '1 second' WHERE id=$1",[valid.challengeId]);await agent.post('/register').type('form').send({_csrf:fresh,email:'other@example.com',password,...valid}).expect(400);
 });
 await t.test('brute-force state survives a new browser; correct password cannot bypass lock',async()=>{
 const page=await agent.get('/login');const fresh=page.text.match(/name="_csrf" value="([^"]+)"/)[1];
 for(let i=0;i<3;i++)await agent.post('/login').type('form').send({_csrf:fresh,email:'absent@example.com',password:'wrong'}).expect(400);
 const before=(await q('SELECT count FROM block8_auth.limits WHERE key=$1',['login:email:absent@example.com'])).rows[0].count;
 await agent.post('/login').type('form').send({_csrf:fresh,email:'absent@example.com',password:'wrong'}).expect(400);assert.equal((await q('SELECT count FROM block8_auth.limits WHERE key=$1',['login:email:absent@example.com'])).rows[0].count,before);
 await q("UPDATE block8_auth.limits SET count=10,locked_until=now()+interval '15 minutes' WHERE key=$1",['login:email:absent@example.com']);
 const stranger=request.agent(app);const p=await stranger.get('/login');await stranger.post('/login').type('form').send({_csrf:p.text.match(/name="_csrf" value="([^"]+)"/)[1],email:'absent@example.com',password}).expect(429);
 });
 }finally{await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await pool.end();}
});
