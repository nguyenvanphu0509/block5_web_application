import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newDb} from 'pg-mem';
import session from 'express-session';
import request from 'supertest';
import {createAuth as createAuthImplementation} from '../src/auth/index.js';
import {createApp} from '../src/app.js';
import {createFixture} from '../../tests/fixtures.js';
import {browserLaunchOptions} from '../scripts/browser-launch.js';
const createAuth = options => createAuthImplementation({recaptchaVerifier: async () => true, ...options});

test('registration → dedicated OTP URL → login; no environment files or real email', async () => {
 const memory = newDb();
 const {Pool} = memory.adapters.createPg();
 const pool = new Pool();
 await pool.query(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8'));
 const messages=[];
 const auth=createAuth({pool,sessionStore:new session.MemoryStore(),mailer:{sendMail:async message=>messages.push(message)}});
 const app=createApp({db:createFixture().db,auth});
 const browser=request.agent(app);
 const csrfFrom=res=>res.text.match(/name="_csrf" value="([^"]+)"/)[1];
 const register=await browser.get('/register').expect(200);
 const csrf=csrfFrom(register);
 const payload={_csrf:csrf,email:'New@Example.com',password:'valid-long-password-123'};
 await browser.post('/register').type('form').send(payload).expect(303).expect('Location','/activate');
 assert.equal(messages.length,1);
 assert.equal((await pool.query('SELECT * FROM block8_auth.users')).rows.length,1);
 for(let i=0;i<2;i++) {
   const otpPage=await browser.get('/activate').expect(200);
   assert.match(otpPage.text,/name="otp"/);
   assert.match(otpPage.text,/new@example.com/);
   assert.match(otpPage.text,/Xác minh email/);
 }
 assert.equal(messages.length,1,'refreshing the OTP page must not register again or send another email');
 const pending=await pool.query('SELECT status FROM block8_auth.users');assert.equal(pending.rows[0].status,'pending');
 await browser.post('/login').type('form').send({_csrf:csrf,email:'new@example.com',password:payload.password}).expect(400);
 const otp=messages[0].text.match(/\d{6}/)[0];
 await browser.post('/activate').type('form').send({_csrf:csrf,email:'new@example.com',otp:'000000'}).expect(400);
 await browser.post('/activate').type('form').send({_csrf:csrf,email:'new@example.com',otp}).expect(303).expect('Location','/login');
 await browser.get('/admin').expect(303).expect('Location','/login');
 const login=await browser.get('/login').expect(200);assert.match(login.text,/Email đã được xác minh/);
 await browser.post('/activate').type('form').send({_csrf:csrf,email:'new@example.com',otp}).expect(400);
 await browser.post('/login').type('form').send({_csrf:csrfFrom(login),email:'new@example.com',password:payload.password}).expect(303).expect('Location','/dishes');
 await browser.get('/admin').expect(302).expect('Location','/admin/dishes');
 const duplicateRegister=await browser.get('/register').expect(200);
 const duplicateCsrf=csrfFrom(duplicateRegister);
 const duplicate=await browser.post('/register').type('form').send({_csrf:duplicateCsrf,email:'NEW@example.com',password:payload.password}).expect(400);
 assert.match(duplicate.text,/Email này đã được đăng ký/);
 assert.equal(messages.length,1,'active accounts must not receive another activation email');
 await pool.end();
});

test('browser: displayed CAPTCHA, double-click protection, OTP page and login redirect', async () => {
 const {chromium}=await import('playwright');
 const memory=newDb();const {Pool}=memory.adapters.createPg();const pool=new Pool();
 await pool.query(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8'));
 const messages=[];let app;
 const {createServer}=await import('node:http');
 const server=await new Promise(resolve=>{const s=createServer((req,res)=>app(req,res));s.listen(0,'127.0.0.1',()=>resolve(s));});
 const siteOrigin=`http://127.0.0.1:${server.address().port}`;
 const auth=createAuth({pool,siteOrigin,sessionStore:new session.MemoryStore(),mailer:{sendMail:async message=>messages.push(message)}});
 app=createApp({db:createFixture().db,auth,origin:siteOrigin});
 let registrations=0;server.on('request',req=>{if(req.method==='POST'&&req.url==='/register')registrations++;});
 let browser;
 try {
   browser=await chromium.launch(browserLaunchOptions());
   const page=await browser.newPage({viewport:{width:390,height:1000}});
   const base=`http://127.0.0.1:${server.address().port}`;
   await page.route(/^https:\/\//,route=>route.abort());
   await page.goto(base+'/register',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!document.querySelector('[type=submit]').disabled);
   await page.locator('[name=email]').fill('browser@example.com');
   await page.locator('[name=password]').fill('valid-browser-password-123');
   const submitted=page.waitForResponse(response=>response.request().method()==='POST'&&new URL(response.url()).pathname==='/register');
   await page.locator('[type=submit]').first().evaluate(button=>{button.click();button.click();});
   const registration=await submitted;assert.equal(registration.status(),303);
   await page.waitForURL('**/activate',{waitUntil:'domcontentloaded'});
   assert.equal(registrations,1);
   assert.equal(messages.length,1);
   assert(await page.locator('[name=otp]').isVisible());
   await page.reload({waitUntil:'domcontentloaded'});assert.equal(registrations,1);assert.equal(messages.length,1);
   const otp=messages[0].text.match(/\d{6}/)[0];
   await page.locator('[name=otp]').fill(otp);
   await Promise.all([page.waitForURL('**/login',{waitUntil:'domcontentloaded'}),page.getByRole('button',{name:'Xác minh email',exact:true}).click()]);
   assert(await page.getByRole('status').filter({hasText:'Email đã được xác minh'}).isVisible());
   assert.equal((await pool.query('SELECT status FROM block8_auth.users')).rows[0].status,'active');
   await page.waitForFunction(()=>!document.querySelector('[type=submit]').disabled);
   await page.locator('[name=email]').fill('browser@example.com');
   await page.locator('[name=password]').fill('valid-browser-password-123');
   await page.locator('[name=redirect]').evaluate(input=>input.value='/admin');
   await Promise.all([page.waitForURL('**/admin/dishes',{waitUntil:'domcontentloaded'}),page.getByRole('button',{name:'Đăng nhập',exact:true}).click()]);
   await page.locator('[data-account-menu] > summary').click();
   assert(await page.getByRole('button',{name:'Đăng xuất',exact:true}).first().isVisible());
   // Reset pages intentionally hide the token from Referer. Exercise native POST.
   await page.goto(base+'/forgot',{waitUntil:'domcontentloaded'});
   await page.locator('[name=email]').fill('browser@example.com');
   await Promise.all([page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/forgot'),page.locator('[type=submit]').click()]);
   await auth.drainMail();
   const resetLink=messages.findLast(message=>message.subject==='Đặt lại mật khẩu').text;
   await page.goto(resetLink,{waitUntil:'domcontentloaded'});
   await page.locator('[name=password]').fill('new-browser-password-456');
   const resetResponse=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/reset');
   await page.locator('[type=submit]').click();
   const reset=await resetResponse;
   assert.equal(reset.status(),303,`Native reset POST Origin: ${reset.request().headers().origin}`);
   await page.waitForURL('**/login',{waitUntil:'domcontentloaded'});
   assert(await page.getByRole('status').filter({hasText:'Mật khẩu đã đổi'}).isVisible());
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!document.querySelector('[type=submit]').disabled);
   await page.locator('[name=email]').fill('browser@example.com');
   await page.locator('[name=password]').fill('new-browser-password-456');
   await page.locator('[name=redirect]').evaluate(input=>input.value='/admin');
   await Promise.all([page.waitForURL('**/admin/dishes',{waitUntil:'domcontentloaded'}),page.getByRole('button',{name:'Đăng nhập',exact:true}).click()]);

 } finally {
   await browser?.close();
   await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});
   await auth.drainMail();
   await pool.end();
 }
});

test('reset rejects foreign/null cross-site Origin and missing CSRF without consuming token', async () => {
 const {digest,hashPassword,verify}=await import('../src/auth/crypto.js');
 const memory=newDb();const {Pool}=memory.adapters.createPg();const pool=new Pool();
 await pool.query(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8'));
 const stored=await hashPassword('original-password-123');
 const user=(await pool.query("INSERT INTO block8_auth.users(email,password_hash,status,email_verified_at) VALUES('reset@example.com',$1,'active',now()) RETURNING id",[stored])).rows[0];
 const resetToken='isolated-reset-token';
 await pool.query("INSERT INTO block8_auth.resets(hash,user_id,expires_at) VALUES($1,$2,now()+interval '15 minutes')",[digest(resetToken),user.id]);
 const app=createApp({db:createFixture().db,auth:createAuth({pool,sessionStore:new session.MemoryStore(),mailer:{sendMail:async()=>{}}})});
 const agent=request.agent(app);const page=await agent.get('/reset?token='+resetToken).expect(200);
 assert.equal(page.headers['referrer-policy'],'no-referrer');
 const csrf=page.text.match(/name="_csrf" value="([^"]+)"/)[1];
 const payload={_csrf:csrf,token:resetToken,password:'replacement-password-456'};
 await agent.post('/reset').set('Origin','https://foreign.invalid').type('form').send(payload).expect(403);
 await agent.post('/reset').set('Origin','null').set('Sec-Fetch-Site','cross-site').type('form').send(payload).expect(403);
 await agent.post('/reset').set('Origin','null').set('Sec-Fetch-Site','same-origin').type('form').send({...payload,_csrf:'wrong'}).expect(403);
 assert.equal((await pool.query('SELECT used_at FROM block8_auth.resets')).rows[0].used_at,null);
 assert.equal((await pool.query('SELECT password_hash FROM block8_auth.users')).rows[0].password_hash,stored);
 await agent.post('/reset').set('Origin','null').set('Sec-Fetch-Site','same-origin').type('form').send(payload).expect(303).expect('Location','/login');
 const changed=(await pool.query('SELECT * FROM block8_auth.users')).rows[0];
 assert(await verify(payload.password,changed.password_hash));assert(!await verify('original-password-123',changed.password_hash));
 assert.equal(changed.version,2);
 const login=await agent.get('/login').expect(200);const fresh=login.text.match(/name="_csrf" value="([^"]+)"/)[1];
 await agent.post('/reset').set('Origin','null').set('Sec-Fetch-Site','same-origin').type('form').send({...payload,_csrf:fresh}).expect(400);
 await pool.end();
});

test('main safeguards: private email work, reset links, OTP purpose and multipart delete', {timeout:15000}, async () => {
 const {hashPassword,digest}=await import('../src/auth/crypto.js');
 const {Pool}=newDb().adapters.createPg();const pool=new Pool();
 await pool.query(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8'));
 const messages=[];let release;
 const mailGate=new Promise(resolve=>{release=resolve;});
 const auth=createAuth({pool,sessionStore:new session.MemoryStore(),mailer:{sendMail:async message=>{
   if(message.subject==='Đặt lại mật khẩu')await mailGate;
   messages.push(message);return {accepted:[message.to]};
 }}});
 const fixture=createFixture();const agent=request.agent(createApp({db:fixture.db,auth}));
 const password='main-safeguards-password-123';
 const user=(await pool.query("INSERT INTO block8_auth.users(email,password_hash,status) VALUES('main@example.invalid',$1,'active') RETURNING id",[await hashPassword(password)])).rows[0];
 const csrfFrom=res=>res.text.match(/name="_csrf" value="([^"]+)"/)[1];
 let csrf=csrfFrom(await agent.get('/forgot'));
 const post=(path,data={})=>agent.post(path).type('form').send({_csrf:csrf,...data});
 try {
   // Neither existing nor unknown email waits for the (blocked) SMTP sender.
   const existing=await post('/forgot',{email:'main@example.invalid'}).expect(200);
   const missing=await post('/forgot',{email:'missing@example.invalid'}).expect(200);
   assert.equal(existing.text.match(/<p class="auth-notice"[^>]*>(.*?)<\/p>/s)[1],missing.text.match(/<p class="auth-notice"[^>]*>(.*?)<\/p>/s)[1]);
   assert.equal(messages.length,0);
   release();await auth.drainMail();
   const link=messages.find(message=>message.subject==='Đặt lại mật khẩu').text;
   const token=new URL(link).searchParams.get('token');
   await agent.get('/reset?token='+token).expect(200);
   assert.equal((await pool.query('SELECT used_at FROM block8_auth.resets WHERE hash=$1',[digest(token)])).rows[0].used_at,null);
   for(const [value,expires,used] of [['expired',new Date(Date.now()-60000),null],['used',new Date(Date.now()+60000),new Date()]]) {
     await pool.query('INSERT INTO block8_auth.resets(hash,user_id,expires_at,used_at) VALUES($1,$2,$3,$4)',[digest(value),user.id,expires,used]);
   }
   for(const path of ['/reset','/reset?token=wrong','/reset?token=expired','/reset?token=used']) {
     const invalid=await agent.get(path).expect(400);
     assert(!invalid.text.includes('id="auth-password"'));assert(invalid.text.includes('Yêu cầu liên kết mới'));
   }
   const replacement='replacement-main-password-456';
   await post('/reset',{token,password:replacement}).expect(303).expect('Location','/login');
   await auth.drainMail();
   const notice=messages.filter(message=>message.subject==='Mật khẩu đã được thay đổi');
   assert.equal(notice.length,1);assert(!notice[0].text.includes(replacement));
   await agent.get('/reset?token='+token).expect(400);
   await agent.get('/admin').expect(303);
   csrf=csrfFrom(await agent.get('/login'));
   await post('/login',{email:'main@example.invalid',password:replacement}).expect(303);
   csrf=csrfFrom(await agent.get('/admin/dishes'));
   const count=fixture.storage.dish.length;const id=fixture.storage.dish.at(-1).id;
   await agent.post(`/admin/dishes/${id}?_method=DELETE`).field('unrelated','value').expect(403);
   assert.equal(fixture.storage.dish.length,count);
   await post(`/admin/dishes/${id}?_method=DELETE`).expect(303);
   assert.equal(fixture.storage.dish.length,count-1);

   const pending=(await pool.query('INSERT INTO block8_auth.users(email,password_hash) VALUES($1,$2) RETURNING id',['pending@example.invalid',await hashPassword(password)])).rows[0];
   // Both emails have the same public acceptance and 60-second request cooldown.
   for(const e of ['pending@example.invalid','unknown@example.invalid']) {
     await post('/activate/resend',{email:e}).expect(303);
     await post('/activate/resend',{email:e}).expect(429);
   }
   await auth.drainMail();
   const challenge=(await pool.query('SELECT * FROM block8_auth.activation WHERE user_id=$1',[pending.id])).rows[0];
   assert.equal(challenge.purpose,'activation');
   const otp=messages.find(message=>message.to==='pending@example.invalid').text.match(/\d{6}/)[0];
   await pool.query("UPDATE block8_auth.activation SET purpose='other' WHERE user_id=$1",[pending.id]);
   await post('/activate',{email:'pending@example.invalid',otp}).expect(400);
   assert.equal((await pool.query('SELECT status FROM block8_auth.users WHERE id=$1',[pending.id])).rows[0].status,'pending');
   await pool.query("UPDATE block8_auth.activation SET purpose='activation' WHERE user_id=$1",[pending.id]);
   await post('/activate',{email:'pending@example.invalid',otp}).expect(303);
 } finally {release();await auth.drainMail();await pool.end();}
});
