import process from 'node:process';
import {json} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
import {getIdentity} from '../_lib/auth.js';
export function createRoleHandler({database=getDb,env=process.env}={}){return async(req,res)=>{
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Метод не поддерживается'});
 res.setHeader('Cache-Control','no-store');
 let user=null;try{user=await getIdentity(req,env)}catch{}
 if(!user?.id)return json(res,401,{error:'Войди через Telegram'});
 const db=database();if(!db)return json(res,503,{error:'База данных не настроена'});
 try{
  if(req.method==='GET'){const {data,error}=await db.from('user_roles').select('role').eq('telegram_id',String(user.id)).maybeSingle();if(error)throw error;return json(res,200,{role:data?.role||null})}
  const role=req.body?.role;if(!['job_seeker','employer'].includes(role))return json(res,400,{error:'Выбери роль'});
  const {data,error}=await db.from('user_roles').upsert({telegram_id:String(user.id),role,updated_at:new Date().toISOString()},{onConflict:'telegram_id'}).select('role').single();
  if(error)throw error;return json(res,200,{role:data.role,ok:true});
 }catch{return json(res,503,{error:'Не удалось сохранить тип аккаунта'})}
}}
export default createRoleHandler();
