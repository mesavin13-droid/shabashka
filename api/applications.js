import process from 'node:process';
import {json} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
import {getIdentity} from '../_lib/auth.js';
import {sendTelegram} from '../_lib/bot.js';

const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const validStatuses=new Set(['viewed','suitable','rejected','hired']);
const clean=(value,max=100)=>typeof value==='string'?value.trim().slice(0,max):'';

export function createApplicationsHandler({database=getDb,env=process.env,send=sendTelegram}={}){
 return async function handler(req,res){
  if(!['GET','POST'].includes(req.method)){
   res.setHeader('Allow','GET, POST');
   return json(res,405,{error:'Метод не поддерживается'});
  }
  res.setHeader('Cache-Control','no-store');
  const db=database();
  if(!db)return json(res,503,{error:'База данных не настроена'});

  let user=null;
  try{user=await getIdentity(req,env)}catch{}
  if(!user?.id||!/^[0-9]{1,20}$/.test(String(user.id)))return json(res,401,{error:'Войди через Telegram'});
  const telegramId=String(user.id);

  try{
   const {data:roleRow,error:roleError}=await db.from('user_roles').select('role').eq('telegram_id',telegramId).maybeSingle();
   if(roleError)throw roleError;
   const role=roleRow?.role||null;

   if(req.method==='GET'){
    const view=clean(req.query?.view||'mine',20);
    if(view==='mine'){
     const {data:apps,error}=await db.from('job_applications').select('id,job_id,applicant_telegram_id,applicant_name,status,created_at,updated_at').eq('applicant_telegram_id',telegramId).order('created_at',{ascending:false}).limit(100);
     if(error)throw error;
     const ids=[...new Set((apps||[]).map(a=>a.job_id))];
     let jobs=[];
     if(ids.length){const {data,error:jobsError}=await db.from('jobs').select('id,title,status,category,district,pay_amount,pay_unit,schedule,source_url').in('id',ids);if(jobsError)throw jobsError;jobs=jobs||[]}
     const byId=new Map(jobs.map(j=>[j.id,j]));
     return json(res,200,{applications:(apps||[]).map(a=>({...a,job:byId.get(a.job_id)||null}))});
    }
    if(view==='received'){
     if(role!=='employer')return json(res,403,{error:'Раздел доступен работодателям'});
     const {data:owned,error:ownedError}=await db.from('jobs').select('id,title,status,category,district,pay_amount,pay_unit,schedule,source_url').eq('imported_by',telegramId).like('source_key','manual:%').eq('type','vacancy').order('created_at',{ascending:false}).limit(150);
     if(ownedError)throw ownedError;
     const jobList=owned||[],ids=jobList.map(j=>j.id);
     if(!ids.length)return json(res,200,{applications:[],jobs:jobList});
     const {data:apps,error:appsError}=await db.from('job_applications').select('id,job_id,applicant_telegram_id,applicant_name,status,created_at,updated_at').in('job_id',ids).order('created_at',{ascending:false}).limit(300);
     if(appsError)throw appsError;
     const byId=new Map(jobList.map(j=>[j.id,j]));
     return json(res,200,{applications:(apps||[]).map(a=>({...a,job:byId.get(a.job_id)||null})),jobs:jobList});
    }
    return json(res,400,{error:'Неизвестный вид списка'});
   }

   const body=req.body||{};
   if(body.action==='status'){
    if(role!=='employer')return json(res,403,{error:'Раздел доступен работодателям'});
    const applicationId=clean(body.application_id,36),status=clean(body.status,20);
    if(!UUID.test(applicationId)||!validStatuses.has(status))return json(res,400,{error:'Некорректный отклик или статус'});
    const {data:application,error:applicationError}=await db.from('job_applications').select('id,job_id,status').eq('id',applicationId).maybeSingle();
    if(applicationError)throw applicationError;
    if(!application)return json(res,404,{error:'Отклик не найден'});
    const {data:job,error:jobError}=await db.from('jobs').select('id,imported_by,source_key').eq('id',application.job_id).maybeSingle();
    if(jobError)throw jobError;
    if(!job||String(job.imported_by)!==telegramId||!String(job.source_key||'').startsWith('manual:'))return json(res,403,{error:'Нет доступа к этому отклику'});
    const {data:updated,error:updateError}=await db.from('job_applications').update({status,updated_at:new Date().toISOString()}).eq('id',applicationId).select('id,status,updated_at').single();
    if(updateError)throw updateError;
    return json(res,200,{ok:true,application:updated});
   }

   if(body.action&&body.action!=='apply')return json(res,400,{error:'Неизвестное действие'});
   if(role!=='job_seeker')return json(res,403,{error:'Чтобы откликнуться, выбери роль «Ищу работу»'});
   const jobId=clean(body.job_id,36);
   if(!UUID.test(jobId))return json(res,400,{error:'Некорректная вакансия'});
   const {data:job,error:jobError}=await db.from('jobs').select('id,title,type,status,category,pay_amount,pay_unit,source_key,source_url,imported_by').eq('id',jobId).maybeSingle();
   if(jobError)throw jobError;
   if(!job||job.status!=='published'||job.type!=='vacancy')return json(res,404,{error:'Вакансия не найдена или уже неактуальна'});
   const manualOwner=String(job.source_key||'').startsWith('manual:')&&String(job.imported_by||'')===telegramId;
   if(manualOwner)return json(res,400,{error:'Нельзя откликнуться на собственную вакансию'});

   const {data:existing,error:existingError}=await db.from('job_applications').select('id,status,created_at').eq('job_id',jobId).eq('applicant_telegram_id',telegramId).maybeSingle();
   if(existingError)throw existingError;
   let application;
   if(existing&&existing.status!=='withdrawn')return json(res,200,{ok:true,alreadyApplied:true,application:existing});
   if(existing){
    const {data,error:updateError}=await db.from('job_applications').update({status:'new',applicant_name:clean(user.name,100)||'Соискатель',updated_at:new Date().toISOString()}).eq('id',existing.id).select('id,status,created_at').single();
    if(updateError)throw updateError;application=data;
   }else{
    const {data,error:insertError}=await db.from('job_applications').insert({job_id:jobId,applicant_telegram_id:telegramId,applicant_name:clean(user.name,100)||'Соискатель',status:'new'}).select('id,status,created_at').single();
    if(insertError){
     if(insertError.code==='23505')return json(res,200,{ok:true,alreadyApplied:true});
     throw insertError;
    }
    application=data;
   }

   // A forwarded third-party listing is not owned by the person who forwarded it.
   // Notify only the Telegram account attached to a manually submitted vacancy.
   const ownerId=String(job.imported_by||'');
   if(String(job.source_key||'').startsWith('manual:')&&/^[0-9]{1,20}$/.test(ownerId)&&ownerId!==telegramId){
    try{
     const {data:ownerRole,error:ownerRoleError}=await db.from('user_roles').select('role').eq('telegram_id',ownerId).maybeSingle();
     if(ownerRoleError)throw ownerRoleError;
     if(ownerRole?.role==='employer'){
      const title=clean(job.title,180)||'Вакансия';
      const applicant=clean(user.name,100)||'Соискатель';
      const message=`Новый отклик на вакансию «${title}»\n\nСоискатель: ${applicant}\nКатегория: ${clean(job.category,60)||'не указана'}\nОплата: ${job.pay_amount==null?'по договорённости':`${Number(job.pay_amount).toLocaleString('ru-RU')} ₽${job.pay_unit?` / ${clean(job.pay_unit,30)}`:''}`}\n\nОткрой ШАБАШКА → «Мои объявления», чтобы обработать отклик.`;
      await send(Number(ownerId),message,{},env.TELEGRAM_BOT_TOKEN);
     }
    }catch{console.error('Application saved; employer notification failed')}
   }
   return json(res,200,{ok:true,alreadyApplied:false,application});
  }catch(error){
   console.error('Applications handler failed',error?.message||'unknown');
   return json(res,503,{error:'Не удалось обработать отклик. Попробуй ещё раз.'});
  }
 };
}

export default createApplicationsHandler();
