import process from 'node:process';
import {createClient} from '@supabase/supabase-js';
const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'authorization,content-type,x-telegram-init-data,x-telegram-bot-api-secret-token','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
let ready:Promise<Record<string,Function>>|undefined;
async function runtime(){
 if(!ready)ready=(async()=>{
  const url=Deno.env.get('SUPABASE_URL')!;
  const keys=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
  const key=keys.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if(!url||!key)throw new Error('Server database is not configured');
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await db.rpc('shabashka_runtime_config');if(error)throw new Error('Server secrets are not configured');
  const env={TELEGRAM_BOT_TOKEN:data.shabashka_bot_token||'',TELEGRAM_WEBHOOK_SECRET:data.shabashka_webhook_secret||'',SITE_URL:data.shabashka_site_url||'',TELEGRAM_ADMIN_IDS:'1401549617',TELEGRAM_BOT_USERNAME:'shabashkanskbot',TELEGRAM_AUTO_PUBLISH:'true'};
  const [jobs,telegram,auth,bot,admin,login,ads]=await Promise.all([import('./api/jobs.js'),import('./api/telegram.js'),import('./_lib/auth.js'),import('./_lib/bot.js'),import('./api/admin.js'),import('./api/auth.js'),import('./api/ads.js')]);
  return {
   config:(req:any,res:any)=>req.method==='GET'?res.status(200).json({mode:'live',botUsername:env.TELEGRAM_BOT_USERNAME,telegramClientId:null,botLogin:true}):res.status(405).json({error:'Method not allowed'}),
   jobs:jobs.createJobsHandler({database:()=>db}),
   telegram:telegram.createTelegramHandler({database:()=>db,env,allowedAdmin:(id:number)=>auth.isAdmin(id,env),send:(chatId:number,text:string,extra:object={})=>bot.sendTelegram(chatId,text,extra,env.TELEGRAM_BOT_TOKEN),answer:(id:string,text:string)=>bot.answerCallback(id,text,env.TELEGRAM_BOT_TOKEN)}),
   session:async(req:any,res:any)=>{if(req.method!=='GET')return res.status(405).json({error:'Method not allowed'});try{const user=await auth.getIdentity(req,env);const token=user?auth.signSession({id:user.id,name:user.name},env):null;res.status(200).json({user:user?{...user,admin:auth.isAdmin(user.id,env)}:null,...(token?{token}:{})})}catch{res.status(401).json({error:'Unauthorized'})}},
   auth:login.createAuthHandler({database:()=>db,env}),
   ads:ads.createAdsHandler({database:()=>db,env}),
   admin:admin.createAdminHandler({database:()=>db,env})
  };
 })().catch(e=>{ready=undefined;throw e});
 return ready;
}
Deno.serve(async request=>{
 if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 const url=new URL(request.url),name=url.pathname.split('/').filter(Boolean).at(-1)||'';
 if(!['config','jobs','telegram','session','admin','auth','ads'].includes(name))return Response.json({error:'Not found'},{status:404,headers:cors});
 try{
  const handlers=await runtime();let body;
  if(request.method==='POST'){const length=Number(request.headers.get('content-length')||0);if(length>100000)return Response.json({error:'Message too large'},{status:413,headers:cors});try{const text=await request.text();if(text.length>100000)return Response.json({error:'Message too large'},{status:413,headers:cors});body=JSON.parse(text)}catch{return Response.json({error:'Invalid JSON'},{status:400,headers:cors})}}
  let status=200,result:unknown={};const headers:Record<string,string>={...cors};
  const res={setHeader(k:string,v:string){headers[k]=v},status(n:number){status=n;return this},json(v:unknown){result=v;return this}};
  await handlers[name]({method:request.method,headers:Object.fromEntries(request.headers),query:Object.fromEntries(url.searchParams),body},res);
  return Response.json(result,{status,headers});
 }catch{return Response.json({error:'Server temporarily unavailable'},{status:503,headers:cors})}
});
