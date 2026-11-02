import {createMailSender,createMailTasks} from './mail.js';
import {createActivationDelivery} from './activation.js';
import './config.js';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import pg from 'pg';
import {Router} from 'express';
import nodemailer from 'nodemailer';
import {secret,origin,recaptchaSiteKey} from './config.js';
import {createRecaptchaVerifier,RecaptchaUnavailableError} from './recaptcha.js';
import {email,token,digest,mac,validPassword,hashPassword,verify} from './crypto.js';
const Store=connectPg(session);
const dummyHash=hashPassword('dummy-password-for-timing');
export function createAuth({schema='block8_auth',siteOrigin=origin,sessionStore,mailLogger=console,recaptchaVerifier=createRecaptchaVerifier(),pool=new pg.Pool({connectionString:process.env.SSR_DATABASE_URL||process.env.DATABASE_URL}),mailer=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT||587),secure:process.env.SMTP_PORT==='465',requireTLS:true,connectionTimeout:10000,greetingTimeout:10000,socketTimeout:15000,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASSWORD}})}={}){
 siteOrigin = new URL(siteOrigin).origin;
 if(!/^[a-z][a-z0-9_]*$/.test(schema))throw new Error('Invalid auth schema');
 const sql=s=>s.replaceAll('block8_auth.',schema+'.');
 const q=(s,p=[])=>pool.query(sql(s),p);
 const middleware=session({name:'sid',secret:secret(),store:sessionStore || new Store({pool,schemaName:schema,tableName:'session',createTableIfMissing:false,disableTouch:true}),resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:siteOrigin.startsWith('https:'),maxAge:8*3600000}});
 const router=Router();
 async function tx(fn){const c=await pool.connect();try{await c.query('BEGIN');const v=await fn({query:(s,p)=>c.query(sql(s),p)});await c.query('COMMIT');return v;}catch(e){await c.query('ROLLBACK');throw e;}finally{c.release();}}
 async function count(key,increment=false){if(increment)await q(`INSERT INTO block8_auth.limits(key,count) VALUES($1,1) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN block8_auth.limits.started_at<now()-interval '15 minutes' THEN 1 ELSE block8_auth.limits.count+1 END,started_at=CASE WHEN block8_auth.limits.started_at<now()-interval '15 minutes' THEN now() ELSE block8_auth.limits.started_at END`,[key]);const r=(await q("SELECT count,locked_until FROM block8_auth.limits WHERE key=$1 AND (started_at>now()-interval '15 minutes' OR locked_until>now())",[key])).rows[0];return r?.count||0;}
 async function quota(req,purpose,e,a,b){const x=await count(`${purpose}:email:${e}`,true),y=await count(`${purpose}:ip:${req.ip}`,true);return x>a||y>b;}
 const send=createMailSender(mailer,{from:process.env.SMTP_FROM,logger:mailLogger});
 const deliverActivation=createActivationDelivery({transaction:tx,send});
 const mailTasks=createMailTasks(mailLogger);
 async function claimResend(email) {
   return tx(async client=>{
     const key=`activation:${email}`;
     await client.query('INSERT INTO block8_auth.mail_cooldowns(key,available_at) VALUES($1,$2) ON CONFLICT(key) DO NOTHING',[key,new Date(0)]);
     const cooldown=(await client.query('SELECT available_at>now() AS waiting FROM block8_auth.mail_cooldowns WHERE key=$1 FOR UPDATE',[key])).rows[0];
     if(cooldown.waiting)return false;
     await client.query("UPDATE block8_auth.mail_cooldowns SET available_at=now()+interval '60 seconds' WHERE key=$1",[key]);
     return true;
   });
 }
 function form(req,res,mode,message='',status=200,extra={}){res.status(status).render('auth/index',{title:'Tài khoản',mode,message,email:email(req.body?.email||req.query.email||req.session.activationEmail),resendUntil:req.session.activationResendUntil||0,redirect:typeof req.query.redirect==='string'?req.query.redirect:'',resetAvailable:true,recaptchaSiteKey,...extra});}
 const limited=(req,res,mode)=>form(req,res,mode,'Quá nhiều yêu cầu. Vui lòng thử lại sau.',429);
 async function captcha(req){try{return await recaptchaVerifier(String(req.body['g-recaptcha-response']||''),req.ip);}catch(error){if(error instanceof RecaptchaUnavailableError)return 'unavailable';throw error;}}
 router.use(async(req,res,next)=>{if(req.session.absoluteExpiry && Date.now()>=req.session.absoluteExpiry){delete req.session.userId;} if(req.path==='/reset')res.set('Referrer-Policy','no-referrer');res.set('Cache-Control','no-store');req.session.csrf ||=token();res.locals.csrf=req.session.csrf;res.locals.user=null;if(req.session.userId){const u=(await q('SELECT id,email,name,status,version FROM block8_auth.users WHERE id=$1',[req.session.userId])).rows[0];if(u?.status==='active'&&u.version===req.session.version)res.locals.user=u;else delete req.session.userId;}next();});
 function csrf(req,res,next){if(['GET','HEAD','OPTIONS'].includes(req.method))return next();if(req.body?._csrf!==req.session.csrf)return res.status(403).render('errors/index',{title:'Lỗi 403',status:403,message:'Biểu mẫu không hợp lệ. Vui lòng tải lại trang.'});next();}
 const requireAuth=(req,res,next)=>res.locals.user?next():res.redirect(303,'/login');
 router.use(['/admin','/dishes','/restaurants','/api/restaurants'],requireAuth);
 router.get('/signup',(req,res)=>res.redirect(303,'/register'));
 for(const mode of ['login','register','activate','forgot'])router.get(`/${mode}`,(req,res)=>{
 const message=mode==='activate'?'Nếu thông tin phù hợp, yêu cầu gửi OTP đã được xử lý. Email có thể đến chậm; hãy kiểm tra hộp thư đến, thư rác hoặc yêu cầu gửi lại mã.':mode==='login'&&req.session.passwordResetComplete?'Mật khẩu đã đổi. Vui lòng đăng nhập bằng mật khẩu mới.':mode==='login'&&req.session.activationComplete?'Email đã được xác minh. Vui lòng đăng nhập bằng mật khẩu của bạn.':'';
 if(mode==='login'){delete req.session.activationComplete;delete req.session.passwordResetComplete;}
 form(req,res,mode,message,200,{resetToken:mode==='reset'?String(req.query.token||''):''});
 });
 router.get('/reset',async(req,res)=>{
   const value=typeof req.query.token==='string'?req.query.token:'';
   const valid=value && (await q('SELECT hash FROM block8_auth.resets WHERE hash=$1 AND used_at IS NULL AND expires_at>now()',[digest(value)])).rows.length>0;
   return form(req,res,'reset',valid?'':'Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.',valid?200:400,{resetToken:valid?value:'',resetAvailable:Boolean(valid)});
 });
 function activationRedirect(req,res){return new Promise((resolve,reject)=>req.session.save(err=>{if(err)return reject(err);res.redirect(303,'/activate');resolve();}));}

 router.use((req,res,next)=>{
   if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
   const source = req.headers.origin;
   if (!source || source === siteOrigin) return next();
   // Chrome sends Origin: null for native forms on a no-referrer page.
   // Only the reset route may use this fallback; require browser same-origin
   // Fetch Metadata AND the existing session-bound CSRF token.
   if (req.path === '/reset' && source === 'null' && req.headers['sec-fetch-site'] === 'same-origin') {
     return csrf(req,res,next);
   }
   return res.status(403).render('errors/index',{
     title:'Lỗi 403',status:403,message:'Nguồn gửi biểu mẫu không hợp lệ. Vui lòng mở lại trang từ website.'
   });
 });
 router.post('/register',csrf,async(req,res)=>{const e=email(req.body.email);if(await quota(req,'register',e,3,10))return limited(req,res,'register');const captchaResult=await captcha(req);if(captchaResult==='unavailable')return form(req,res,'register','Dịch vụ CAPTCHA tạm thời không khả dụng. Vui lòng thử lại sau.',503);if(!captchaResult)return form(req,res,'register','Vui lòng xác nhận reCAPTCHA.',400);if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)||!validPassword(req.body.password))return form(req,res,'register','Email hợp lệ; mật khẩu cần 15–128 ký tự.',400);
 const existing=(await q('SELECT status FROM block8_auth.users WHERE email=$1',[e])).rows[0];if(existing?.status==='active')return form(req,res,'register','Email này đã được đăng ký. Vui lòng đăng nhập để tiếp tục.',400);
 const inserted=await q('INSERT INTO block8_auth.users(email,name,password_hash) VALUES($1,$2,$3) ON CONFLICT(email) DO NOTHING RETURNING id',[e,String(req.body.name||'').slice(0,100),await hashPassword(req.body.password)]);if(!inserted.rows.length){const current=(await q('SELECT status FROM block8_auth.users WHERE email=$1',[e])).rows[0];if(current?.status==='active')return form(req,res,'register','Email này đã được đăng ký. Vui lòng đăng nhập để tiếp tục.',400);}await deliverActivation(e);req.session.activationEmail=e;req.session.activationResendUntil=Date.now()+60000;await activationRedirect(req,res);});
 router.post('/activate/resend',csrf,async(req,res)=>{
 const e=email(req.body.email);
 if(await quota(req,'resend',e,5,20))return limited(req,res,'activate');
 // These checks apply to every requested email, including unknown accounts.
 if(!await claimResend(e))return limited(req,res,'activate');
 mailTasks.afterResponse(res,()=>deliverActivation(e));
 req.session.activationEmail=e;
 req.session.activationResendUntil=Date.now()+60000;
 await activationRedirect(req,res);
 });
 router.post('/activate',csrf,async(req,res)=>{const e=email(req.body.email);if(await quota(req,'activate',e,30,100))return limited(req,res,'activate');const result=await tx(async c=>{const u=(await c.query('SELECT * FROM block8_auth.users WHERE email=$1 FOR UPDATE',[e])).rows[0];if(!u)return 'bad';const a=(await c.query("SELECT * FROM block8_auth.activation WHERE user_id=$1 AND purpose='activation' FOR UPDATE",[u.id])).rows[0];if(!a||a.used_at||u.status!=='pending')return 'bad';if(new Date(a.locked_until)>new Date())return 'locked';if(a.locked_until){a.attempts=0;await c.query('UPDATE block8_auth.activation SET attempts=0,locked_until=NULL WHERE user_id=$1',[u.id]);}if(new Date(a.expires_at)<new Date()||a.hash!==mac(`${u.id}:${String(req.body.otp||'').trim()}`)){await c.query("UPDATE block8_auth.activation SET attempts=attempts+1,locked_until=CASE WHEN attempts+1>=5 THEN now()+interval '15 minutes' ELSE NULL END WHERE user_id=$1",[u.id]);return a.attempts+1>=5?'locked':'bad';}await c.query("UPDATE block8_auth.users SET status='active',email_verified_at=now() WHERE id=$1",[u.id]);await c.query('UPDATE block8_auth.activation SET used_at=now() WHERE user_id=$1',[u.id]);return 'ok';});if(result==='locked')return limited(req,res,'activate');if(result==='ok'){
 req.session.activationComplete=true;delete req.session.activationEmail;delete req.session.activationResendUntil;
 await new Promise((resolve,reject)=>req.session.save(err=>err?reject(err):resolve()));return res.redirect(303,'/login');
 }form(req,res,'activate','Mã không hợp lệ, đã hết hạn hoặc đã được sử dụng.',400);});
 router.post('/login',csrf,async(req,res)=>{const e=email(req.body.email),ek=`login:email:${e}`,ik=`login:ip:${req.ip}`;const a=await count(ek),b=await count(ik);if(a>=10||b>=50)return limited(req,res,'login');const needsCaptcha=a>=3||b>=10;const captchaResult=needsCaptcha?await captcha(req):true;if(captchaResult==='unavailable')return form(req,res,'login','Dịch vụ CAPTCHA tạm thời không khả dụng. Vui lòng thử lại sau.',503);if(needsCaptcha&&!captchaResult)return form(req,res,'login','Vui lòng xác nhận reCAPTCHA.',400);const u=(await q('SELECT * FROM block8_auth.users WHERE email=$1',[e])).rows[0];const stored=u?.password_hash||await dummyHash;const correct=await verify(req.body.password,stored);
 if(!correct||u?.status!=='active'){const x=await count(ek,true),y=await count(ik,true);if(x>=10||y>=50)await q("UPDATE block8_auth.limits SET locked_until=now()+interval '15 minutes' WHERE key=ANY($1)",[[...(x>=10?[ek]:[]),...(y>=50?[ik]:[])]]);if(x>=10||y>=50)return limited(req,res,'login');return form(req,res,'login','Thông tin đăng nhập không hợp lệ.',400);}
 await new Promise((resolve,reject)=>req.session.regenerate(e=>e?reject(e):resolve()));req.session.userId=u.id;req.session.version=u.version;req.session.csrf=token();req.session.cookie.maxAge=req.body.remember?7*86400000:8*3600000;req.session.absoluteExpiry=Date.now()+req.session.cookie.maxAge;await new Promise((resolve,reject)=>req.session.save(e=>e?reject(e):resolve()));const target=String(req.body.redirect||'');res.redirect(303,/^\/(dishes|restaurants|admin)(\/|\?|$)/.test(target)&&!target.includes('\\')?target:'/dishes');});
 router.post('/logout',csrf,(req,res,next)=>req.session.destroy(e=>{if(e)return next(e);res.clearCookie('sid',{path:'/'});res.redirect(303,'/login');}));
 router.post('/forgot',csrf,async(req,res)=>{
 const e=email(req.body.email);
 if(await quota(req,'forgot',e,3,10))return limited(req,res,'forgot');
 // Do not look up the account or wait for SMTP on the HTTP response path.
 mailTasks.afterResponse(res,async()=>{
   const user=(await q('SELECT * FROM block8_auth.users WHERE email=$1',[e])).rows[0];
   if(!user)return;
   const t=token();
   await tx(async client=>{
     await client.query('SELECT id FROM block8_auth.users WHERE id=$1 FOR UPDATE',[user.id]);
     await send(e,'Đặt lại mật khẩu',`${siteOrigin}/reset?token=${t}`);
     await client.query('UPDATE block8_auth.resets SET used_at=now() WHERE user_id=$1 AND used_at IS NULL',[user.id]);
     await client.query('INSERT INTO block8_auth.resets(hash,user_id,expires_at) VALUES($1,$2,$3)',[digest(t),user.id,new Date(Date.now()+900000)]);
   });
 });
 form(req,res,'forgot','Nếu email có tài khoản, yêu cầu gửi hướng dẫn đã được xử lý. Kiểm tra hộp thư đến và thư rác; nếu chưa nhận được, hãy thử lại sau.');
 });
 router.post('/reset',csrf,async(req,res)=>{res.set('Referrer-Policy','no-referrer');if(await quota(req,'reset',req.ip,10,10))return limited(req,res,'reset');if(!validPassword(req.body.password))return form(req,res,'reset','Mật khẩu cần 15–128 ký tự.',400,{resetToken:String(req.body.token||'')});const h=await hashPassword(req.body.password);const recipient=await tx(async c=>{const candidate=(await c.query('SELECT user_id FROM block8_auth.resets WHERE hash=$1',[digest(req.body.token)])).rows[0];if(!candidate)return false;const user=(await c.query('SELECT id,email FROM block8_auth.users WHERE id=$1 FOR UPDATE',[candidate.user_id])).rows[0];const r=(await c.query('SELECT * FROM block8_auth.resets WHERE hash=$1 FOR UPDATE',[digest(req.body.token)])).rows[0];if(!r||r.used_at||new Date(r.expires_at)<new Date())return false;await c.query('UPDATE block8_auth.users SET password_hash=$1,version=version+1 WHERE id=$2',[h,r.user_id]);await c.query('UPDATE block8_auth.resets SET used_at=now() WHERE user_id=$1 AND used_at IS NULL',[r.user_id]);await c.query("DELETE FROM block8_auth.session WHERE sess->>'userId'=$1",[String(r.user_id)]);return user.email;});if(recipient){
   await new Promise((resolve,reject)=>req.session.regenerate(err=>err?reject(err):resolve()));
   req.session.csrf=token();req.session.passwordResetComplete=true;
   await new Promise((resolve,reject)=>req.session.save(err=>err?reject(err):resolve()));
   mailTasks.afterResponse(res,()=>send(recipient,'Mật khẩu đã được thay đổi',`Mật khẩu tài khoản của bạn đã được thay đổi. Các phiên đăng nhập cũ đã kết thúc. Nếu bạn không thực hiện thay đổi này, hãy yêu cầu đặt lại mật khẩu tại ${siteOrigin}/forgot.`));
   return res.redirect(303,'/login');
 }form(req,res,'reset','Liên kết không hợp lệ, đã hết hạn hoặc đã được sử dụng.',400,{resetToken:'',resetAvailable:false});});
 return {middleware,router,csrf,requireAuth,pool,drainMail:()=>mailTasks.drain()};
}
