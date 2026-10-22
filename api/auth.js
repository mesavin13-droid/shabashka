import process from 'node:process';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {getDb} from '../_lib/db.js';
import {json} from '../_lib/http.js';
import {signSession} from '../_lib/auth.js';
export const hashSecret=value=>createHash('sha256').update(value).digest('hex');
export function createAuthHandler({database=getDb,env=process.env}={}){return async(req,res)=>{
 if(req.method!=='POST')return json(res,405,{error:'Метод не поддерживается'});
 res.setHeader('Cache-Control','no-store');
 const db=database();if(!db||!env.TELEGRAM_WEBHOOK_SECRET)return json(res,503,{error:'Вход временно недоступен'});
 try{
  const b=req.body||{};
  if(b.action==='start'){
   const id=randomUUID(),secret=randomBytes(32).toString('hex'),code=String(randomBytes(4).readUInt32BE()%1000000).padStart(6,'0');
   const {error}=await db.from('login_challenges').insert({id,secret_hash:hashSecret(secret),code,expires_at:new Date(Date.now()+300000).toISOString()});if(error)throw error;
   return json(res,200,{id,secret,code,botUrl:`https://t.me/${env.TELEGRAM_BOT_USERNAME||'shabashkanskbot'}?start=login_${id}`,expiresIn:300});
  }
  if(b.action==='poll'&&/^[a-f0-9-]{36}$/i.test(b.id||'')&&/^[a-f0-9]{64}$/.test(b.secret||'')){
   const {data,error}=await db.rpc('shabashka_consume_login',{challenge_id:b.id,poll_hash:hashSecret(b.secret)});if(error)throw error;
   const u=data?.[0];return json(res,200,u?{token:signSession({id:u.telegram_id,name:u.telegram_name},env)}:{pending:true});
  }
  return json(res,400,{error:'Некорректный запрос'});
 }catch{return json(res,503,{error:'Не удалось подтвердить вход. Попробуй ещё раз.'})}
}}
export default createAuthHandler();
