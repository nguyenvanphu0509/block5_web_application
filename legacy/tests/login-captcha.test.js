import './no-env.cjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newDb} from 'pg-mem';
import session from 'express-session';
import request from 'supertest';
import {createFixture} from '../../tests/fixtures.js';

process.env.RECAPTCHA_SITE_KEY='isolated-public-site-key';
const {createAuth}=await import('../src/auth/index.js');
const {createApp}=await import('../src/app.js');
const {hashPassword}=await import('../src/auth/crypto.js');
const {RecaptchaUnavailableError}=await import('../src/auth/recaptcha.js');
const email='captcha-login@example.invalid',password='valid-login-password-123';
const csrfFrom=response=>response.text.match(/name="_csrf" value="([^"]+)"/)[1];
function assertCaptcha(response,required) {
  assert.equal(response.text.includes('class="g-recaptcha"'),required);
  assert.equal(response.text.includes('https://www.google.com/recaptcha/api.js'),required);
}
async function setup(t) {
  const {Pool}=newDb().adapters.createPg();
  const pool=new Pool();
  t.after(()=>pool.end());
  await pool.query(await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8'));
  await pool.query("INSERT INTO block8_auth.users(email,password_hash,status) VALUES($1,$2,'active')",[email,await hashPassword(password)]);
  const verifications=[];
  const auth=createAuth({pool,sessionStore:new session.MemoryStore(),mailer:{sendMail:async()=>{}},recaptchaVerifier:async response=>{
    verifications.push(response);
    if(response==='service-unavailable')throw new RecaptchaUnavailableError();
    return response==='valid-token';
  }});
  return {pool,verifications,app:createApp({db:createFixture().db,auth})};
}

test('login skips CAPTCHA initially, shows it after three failures and enforces it across reloads',async t=>{
  const {app,pool,verifications}=await setup(t);
  const first=request.agent(app);
  const initial=await first.get('/login').expect(200);
  assertCaptcha(initial,false);
  await first.post('/login').type('form').send({_csrf:csrfFrom(initial),email,password}).expect(303);
  assert.equal(verifications.length,0,'normal login must not call the CAPTCHA verifier');
  assertCaptcha(await first.get('/register').expect(200),true);

  const browser=request.agent(app);
  const csrf=csrfFrom(await browser.get('/login').expect(200));
  const login=(data={})=>browser.post('/login').type('form').send({_csrf:csrf,email,password,...data});
  for(let attempt=1;attempt<=3;attempt++) {
    const failed=await login({password:'wrong'}).expect(400);
    assertCaptcha(failed,attempt===3);
  }
  assert.equal(verifications.length,0,'the first three failures must not require CAPTCHA');
  assertCaptcha(await browser.get('/login').expect(200),true);
  await login().expect(400);
  await login({'g-recaptcha-response':'invalid-token'}).expect(400);
  const unavailable=await login({'g-recaptcha-response':'service-unavailable'}).expect(503);
  assertCaptcha(unavailable,true);
  assert.equal((await pool.query('SELECT count FROM block8_auth.limits WHERE key=$1',[`login:email:${email}`])).rows[0].count,3);

  const stranger=request.agent(app);
  const fresh=csrfFrom(await stranger.get('/login').expect(200));
  const challenged=await stranger.post('/login').type('form').send({_csrf:fresh,email,password}).expect(400);
  assertCaptcha(challenged,true);
  assertCaptcha(await stranger.get('/login').expect(200),true);
  await login({'g-recaptcha-response':'valid-token'}).expect(303).expect('Location','/dishes');
});

test('IP failures challenge a fresh browser; lockouts remain enforced and expired counters stop requiring CAPTCHA',async t=>{
  const {app,pool,verifications}=await setup(t);
  const first=request.agent(app);
  const initial=csrfFrom(await first.get('/login').expect(200));
  await first.post('/login').type('form').send({_csrf:initial,email,password:'wrong'}).expect(400);
  const ipKey=(await pool.query('SELECT key FROM block8_auth.limits')).rows.find(row=>row.key.startsWith('login:ip:')).key;
  await pool.query('UPDATE block8_auth.limits SET count=10 WHERE key=$1',[ipKey]);

  const browser=request.agent(app);
  const challenged=await browser.get('/login').expect(200);
  assertCaptcha(challenged,true);
  const csrf=csrfFrom(challenged);
  const login=(data={})=>browser.post('/login').type('form').send({_csrf:csrf,email,password,...data});
  await login().expect(400);
  assert.deepEqual(verifications,['']);
  await pool.query("UPDATE block8_auth.limits SET count=50,locked_until=now()+interval '15 minutes' WHERE key=$1",[ipKey]);
  await login({'g-recaptcha-response':'valid-token'}).expect(429);
  assert.deepEqual(verifications,[''],'correct CAPTCHA and password must not bypass a lockout');

  await pool.query('UPDATE block8_auth.limits SET started_at=$1,locked_until=NULL',[new Date(Date.now()-16*60000)]);
  assertCaptcha(await browser.get('/login').expect(200),false);
  await login().expect(303).expect('Location','/dishes');
  assert.deepEqual(verifications,[''],'expired failure counters must not require CAPTCHA');
});
