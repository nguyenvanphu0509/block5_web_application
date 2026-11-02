// Read-only catalog inspection; only an isolated auth schema is created/dropped.
import '../src/auth/config.js';
import '../../api/src/config/env.js';
import {mkdir} from 'node:fs/promises';
import pg from 'pg';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {createDatabaseClient} from '../../api/src/db/client.js';
import {createApp} from '../src/app.js';
import {createAuth} from '../src/auth/index.js';
import {hashPassword} from '../src/auth/crypto.js';
import {createApi} from '../../api/src/app.js';
import {createWebServer} from '../../web/server.js';
import {browserLaunchOptions} from './browser-launch.js';
const pool=new pg.Pool({connectionString:process.env.DATABASE_URL});const db=createDatabaseClient();const schema=`block8_visual_${Date.now()}`;const servers=[];let browser;
async function listen(app,port){const server=await new Promise((resolve,reject)=>{const s=app.listen(port,'127.0.0.1',()=>resolve(s));s.on('error',reject);});servers.push(server);}
try{
 await pool.query((await readFile(new URL('../migrations/001-auth.sql',import.meta.url),'utf8')).replaceAll('block8_auth',schema));
 await pool.query(`INSERT INTO ${schema}.users(email,name,password_hash,status,email_verified_at) VALUES($1,'QA',$2,'active',now())`,['qa@example.invalid',await hashPassword('visual-qa-password-only')]);
 await listen(createApp({db,auth:createAuth({pool,schema,mailer:{sendMail:async()=>{}}})}),3001);await listen(createApi({db,origin:'http://localhost:5173'}),3000);await listen(createWebServer(),5173);
 browser=await chromium.launch(browserLaunchOptions());
 const ssr=await browser.newContext(),spa=await browser.newContext();await spa.addInitScript(()=>localStorage.setItem('viet_cuisine_user',JSON.stringify({id:'qa',username:'QA',email:'qa@example.invalid'})));
 const page=await ssr.newPage();await page.goto('http://localhost:3001/login');await page.locator('[name=email]').fill('qa@example.invalid');await page.locator('[name=password]').fill('visual-qa-password-only');await Promise.all([page.waitForURL('**/dishes'),page.locator('button[type=submit]').first().click()]);
 const first=await db.dish.findFirst({orderBy:{id:'asc'}});const targets=process.env.QA_QUICK?['/dishes','/login']:['/','/dishes',`/dishes/${first.id}`,'/admin/dishes','/admin/dishes/new','/login','/register'];await mkdir('legacy/artifacts',{recursive:true});
 const failures=[];
 for(const [label,context,base] of (process.env.QA_QUICK?[['ssr',ssr,'http://localhost:3001']]:[['ssr',ssr,'http://localhost:3001'],['spa',spa,'http://localhost:5173']])){const p=await context.newPage();p.on("pageerror",e=>console.log("Browser error:",e.message));for(const width of [1440,390]){await p.setViewportSize({width,height:1000});for(const path of targets){const response=await p.goto(base+path,{waitUntil:'domcontentloaded'});await p.waitForTimeout(800);if(path==='/login'||path==='/register')await p.waitForSelector('.g-recaptcha',{timeout:15000}).catch(()=>{});if(response.status()>=400)failures.push(`${label} ${path}: HTTP ${response.status()}`);const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);if(overflow)failures.push(`${label} ${path} ${width}: horizontal overflow`);await p.screenshot({path:`legacy/artifacts/${label}-${width}-${path.replaceAll('/','_')||'home'}.png`,fullPage:true});}}await p.close();}
 console.log(JSON.stringify({failures},null,2));if(failures.length)process.exitCode=1;
}finally{await browser?.close();for(const s of servers)await new Promise(resolve=>{s.close(resolve);s.closeAllConnections();});await db.$disconnect();await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);await pool.end();}
