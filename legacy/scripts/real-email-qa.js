// Browser-only QA against the already-running website. Does not import server config.
// Run with --require ./legacy/tests/no-env.cjs to forbid opening environment files.
import {chromium} from 'playwright';
import {randomBytes} from 'node:crypto';
import {createInterface} from 'node:readline';
import {mkdir} from 'node:fs/promises';
const address=process.argv[2];
if(!address?.includes('@'))throw new Error('Provide the authorized recipient alias');
const password=randomBytes(24).toString('base64url');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const lines=createInterface({input:process.stdin,crlfDelay:Infinity});
try{
 await mkdir('legacy/artifacts',{recursive:true});
 await page.goto('http://localhost:3001/register',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('[data-captcha] img')?.naturalWidth>0&&!document.querySelector('[type=submit]').disabled);
 await page.locator('[name=email]').fill(address);
 await page.locator('[name=password]').fill(password);
 await page.locator('[name=name]').fill('Kiểm thử OTP');
 await page.locator('[data-captcha] img').screenshot({path:'legacy/artifacts/real-otp-captcha.png'});
 console.log(JSON.stringify({state:'CAPTCHA_READY',email:address}));
 for await(const line of lines){
  const command=JSON.parse(line);
  if(command.action==='register'){
   await page.locator('[name=captcha]').fill(command.code);
   const response=page.waitForResponse(r=>r.request().method()==='POST'&&new URL(r.url()).pathname==='/register');
   await page.locator('[type=submit]').first().click();const r=await response;
   await page.waitForLoadState('domcontentloaded');
   console.log(JSON.stringify({state:'REGISTER_RESULT',status:r.status(),path:new URL(page.url()).pathname,notice:await page.locator('.auth-notice').allTextContents()}));
  }else if(command.action==='activate'){
   await page.locator('[name=otp]').fill(command.code);
   await Promise.all([page.waitForURL('**/login',{waitUntil:'domcontentloaded'}),page.getByRole('button',{name:'Xác minh email',exact:true}).click()]);
   await page.waitForFunction(()=>!document.querySelector('[type=submit]').disabled);
   await page.locator('[name=email]').fill(address);await page.locator('[name=password]').fill(password);
   await page.locator('[name=redirect]').evaluate(input=>input.value='/admin');
   await Promise.all([page.waitForURL('**/admin/dishes',{waitUntil:'domcontentloaded'}),page.getByRole('button',{name:'Đăng nhập',exact:true}).click()]);
   console.log(JSON.stringify({state:'ACTIVATED_AND_LOGIN_OK',path:new URL(page.url()).pathname}));
   // End the QA session; do not perform any catalog writes.
   await Promise.all([page.waitForURL('**/login',{waitUntil:'domcontentloaded'}),page.getByRole('button',{name:'Đăng xuất',exact:true}).first().click()]);
   console.log(JSON.stringify({state:'LOGOUT_OK'}));break;
  }else if(command.action==='quit'){break;}
 }
}finally{lines.close();await browser.close();}
