import process from 'node:process';
import {getIdentity,isAdmin} from '../_lib/auth.js';
import {sendTelegram} from '../_lib/bot.js';
import {json} from '../_lib/http.js';
const clean=(v,n=160)=>String(v??'').replace(/[<>]/g,'').trim().slice(0,n);
export function createApplicationsHandler({database,env=process.env,send=sendTelegram}={}){return async function(req,res){
 const db=database();if(!db)return json(res,503,{error:'База данных не настроена'});
 let user=null;try{user=await getIdentity(req,env)}catch{}
 const admin=user&&isAdmin(user.id,env);
 try{
  if(req.method==='GET'){
   if(!user?.id)return json(res,401,{error:'Войди через Telegram'});
   const jobId=clean(req.query?.job_id,64);
   if(jobId){
    const {data:job,error}=await db.from('jobs').select('id,status').eq('id',jobId).maybeSingle();
    if(error||!job||job.status!=='published')return json(res,404,{error:'Вакансия не найдена'});
    const {data:mine,error:e}=await db.from('job_applications').select('id,status,created_at').eq('job_id',jobId).eq('applicant_telegram_id',String(user.id)).maybeSingle();if(e)throw e;
    const {data:stats,error:se}=await db.from('job_stats').select('views,unique_views').eq('job_id',jobId).maybeSingle();if(se)throw se;
    return json(res,200,{mine:mine||null,stats:stats||{views:0,unique_views:0}});
   }
   const {data:role}=await db.from('user_roles').select('role').eq('telegram_id',String(user.id)).maybeSingle();
   if(role?.role==='employer'||admin){
    let q=db.from('job_applications').select('id,job_id,applicant_telegram_id,applicant_name,status,created_at,updated_at,jobs!inner(title,imported_by,status)').order('created_at',{ascending:false}).limit(200);
    if(!admin)q=q.eq('jobs.imported_by',String(user.id));
    const {data,error}=await q;if(error)throw error;
    return json(res,200,{applications:data||[]});
   }
   const {data,error}=await db.from('job_applications').select('id,job_id,applicant_name,status,created_at,jobs!inner(title,status)').eq('applicant_telegram_id',String(user.id)).order('created_at',{ascending:false}).limit(100);if(error)throw error;
   return json(res,200,{applications:data||[]});
  }
  if(req.method!=='POST')return json(res,405,{error:'Метод не поддерживается'});
  if(!user?.id)return json(res,401,{error:'Войди через Telegram, чтобы откликнуться'});
  const b=req.body||{},action=clean(b.action,30),jobId=clean(b.job_id,64);
  if(action==='view'){
   if(!/^[0-9a-f-]{36}$/i.test(jobId))return json(res,400,{error:'Некорректная вакансия'});
   const {data:job,error}=await db.from('jobs').select('id,status').eq('id',jobId).maybeSingle();if(error)throw error;if(!job||job.status!=='published')return json(res,404,{error:'Вакансия недоступна'});
   const viewer=String(user.id);
   const {data:existing,error:ve}=await db.from('job_viewers').select('job_id').eq('job_id',jobId).eq('viewer_key',viewer).maybeSingle();if(ve)throw ve;
   let isNewViewer=false;
   if(!existing){const {error:ins}=await db.from('job_viewers').insert({job_id:jobId,viewer_key:viewer});if(!ins)isNewViewer=true;else if(ins.code!=='23505')throw ins;}
   const {data:cur,error:ce}=await db.from('job_stats').select('views,unique_views').eq('job_id',jobId).maybeSingle();if(ce)throw ce;
   const next={job_id:jobId,views:Number(cur?.views||0)+1,unique_views:Number(cur?.unique_views||0)+(isNewViewer?1:0),updated_at:new Date().toISOString()};
   const {error:up}=await db.from('job_stats').upsert(next,{onConflict:'job_id'});if(up)throw up;
   const {data:stats}=await db.from('job_stats').select('views,unique_views').eq('job_id',jobId).maybeSingle();return json(res,200,{ok:true,stats:stats||{views:1,unique_views:1}});
  }
  if(action==='apply'){
   if(!/^[0-9a-f-]{36}$/i.test(jobId))return json(res,400,{error:'Некорректная вакансия'});
   const {data:job,error}=await db.from('jobs').select('id,title,category,district,city,pay_amount,pay_unit,schedule,imported_by,status').eq('id',jobId).maybeSingle();if(error)throw error;if(!job||job.status!=='published')return json(res,404,{error:'Вакансия недоступна'});
   const {data:role}=await db.from('user_roles').select('role').eq('telegram_id',String(user.id)).maybeSingle();if(role?.role!=='job_seeker'&&!admin)return json(res,403,{error:'Откликаться может аккаунт «Ищу работу»'});
   const {data:profile}=await db.from('candidate_profiles').select('display_name,title,contact,categories').eq('telegram_id',String(user.id)).maybeSingle();
   const {data:existing,error:ee}=await db.from('job_applications').select('id,status,created_at').eq('job_id',jobId).eq('applicant_telegram_id',String(user.id)).maybeSingle();if(ee)throw ee;
   if(existing&&existing.status!=='withdrawn')return json(res,200,{ok:true,duplicate:true,application:existing,message:'Ты уже откликался на эту вакансию'});
   let application;
   if(existing){const {data,error:ue}=await db.from('job_applications').update({status:'new',applicant_name:clean(profile?.display_name||user.name,100),updated_at:new Date().toISOString()}).eq('id',existing.id).select('id,status,created_at').single();if(ue)throw ue;application=data;}
   else {const {data,error:ie}=await db.from('job_applications').insert({job_id:jobId,applicant_telegram_id:String(user.id),applicant_name:clean(profile?.display_name||user.name,100)}).select('id,status,created_at').single();if(ie?.code==='23505')return json(res,200,{ok:true,duplicate:true,message:'Ты уже откликался на эту вакансию'});if(ie)throw ie;application=data;}
   let notified=false;
   const employerId=String(job.imported_by||'');
   if(/^\d{1,20}$/.test(employerId)&&employerId!==String(user.id)){
    const pay=job.pay_amount==null?'Оплата уточняется':job.pay_amount+' ₽'+(job.pay_unit?' / '+job.pay_unit:'');
    try{await send(Number(employerId),'📩 Новый отклик на ШАБАШКУ\n\nВакансия: '+clean(job.title,140)+'\nКандидат: '+clean(profile?.display_name||user.name||'Соискатель',100)+'\nКем работает: '+clean(profile?.title||'Не указано',100)+'\nКонтакт: '+clean(profile?.contact||'Откройте отклики в приложении',140)+'\nОплата: '+pay+'\n\nОткрой панель работодателя в ШАБАШКЕ, чтобы посмотреть отклик.',{},env.TELEGRAM_BOT_TOKEN);notified=true;}catch(e){console.error('employer notification failed');}
   }
   const {data:stats}=await db.from('job_stats').select('views,unique_views').eq('job_id',jobId).maybeSingle();
   return json(res,201,{ok:true,duplicate:false,application,notified,stats:stats||{views:0,unique_views:0}});
  }
  if(action==='status'){
   const appId=clean(b.application_id,64),status=clean(b.status,20);
   if(!/^[0-9a-f-]{36}$/i.test(appId)||!['viewed','suitable','rejected','hired','withdrawn'].includes(status))return json(res,400,{error:'Некорректный статус'});
   const {data:app,error:ae}=await db.from('job_applications').select('id,applicant_telegram_id,job_id,jobs!inner(imported_by)').eq('id',appId).maybeSingle();if(ae)throw ae;if(!app)return json(res,404,{error:'Отклик не найден'});
   const owner=String(app.jobs?.imported_by||'')===String(user.id);
   if(!admin&&!owner&&String(app.applicant_telegram_id)!==String(user.id))return json(res,403,{error:'Нет доступа к этому отклику'});
   const {data,error:ue}=await db.from('job_applications').update({status,updated_at:new Date().toISOString()}).eq('id',appId).select('id,status').single();if(ue)throw ue;
   return json(res,200,{ok:true,application:data});
  }
  return json(res,400,{error:'Неизвестное действие'});
 }catch(e){console.error('applications request failed');return json(res,503,{error:'Не удалось обработать отклик. Попробуй ещё раз.'})}
}}
