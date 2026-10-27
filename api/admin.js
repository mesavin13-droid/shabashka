import process from 'node:process';
import {json} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
import {requireAdmin,isAdmin} from '../_lib/auth.js';
import {sendTelegram} from '../_lib/bot.js';
import {notifyMatchingCandidates} from '../_lib/notify-candidates.js';
const categories=['Склад','Доставка','Уборка','Стройка','Мероприятия','Общепит','Торговля','Другое'];
const transitions={approve:['pending','published'],reject:['pending','rejected'],archive:['published','archived'],restore:['archived','published'],close:['published','closed']};
export function createAdminHandler({database=getDb,env=process.env,send=sendTelegram}={}){return async(req,res)=>{
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Метод не поддерживается'});
 res.setHeader('Cache-Control','no-store');
 let user;try{user=await requireAdmin(req,env)}catch{return json(res,401,{error:'Ошибка авторизации'})}
 if(!user)return json(res,403,{error:'Требуется доступ администратора'});
 const db=database();if(!db)return json(res,503,{error:'База данных не настроена'});
 try{
  if(req.method==='GET'){
   const [jobsRes,profilesRes,rolesRes,blocksRes]=await Promise.all([
    db.from('jobs').select('*').order('created_at',{ascending:false}).limit(500),
    db.from('candidate_profiles').select('telegram_id,display_name,title,categories,districts,desired_pay,pay_unit,schedule,experience,about,contact,is_public,notify_telegram,created_at,updated_at').order('updated_at',{ascending:false}).limit(500),
    db.from('user_roles').select('telegram_id,role,created_at,updated_at').limit(1000),
    db.from('user_blocks').select('telegram_id,reason,blocked_by,created_at').order('created_at',{ascending:false}).limit(1000)
   ]);
   for(const result of [jobsRes,profilesRes,rolesRes,blocksRes])if(result.error)throw result.error;
   const map=new Map();
   const ensure=id=>{const key=String(id);if(!map.has(key))map.set(key,{telegram_id:key,role:null,name:'',resume:null,is_blocked:false,block_reason:'',blocked_at:null});return map.get(key)};
   for(const row of rolesRes.data||[]){const u=ensure(row.telegram_id);u.role=row.role}
   for(const profile of profilesRes.data||[]){const u=ensure(profile.telegram_id);u.resume=profile;u.name=profile.display_name;if(!u.role)u.role='job_seeker'}
   for(const block of blocksRes.data||[]){const u=ensure(block.telegram_id);u.is_blocked=true;u.block_reason=block.reason||'';u.blocked_at=block.created_at}
   const users=[...map.values()].sort((a,b)=>Number(b.is_blocked)-Number(a.is_blocked)||(a.name||a.telegram_id).localeCompare(b.name||b.telegram_id,'ru'));
   return json(res,200,{jobs:jobsRes.data||[],users});
  }
  const b=req.body||{};
  if(['delete_resume','block_user','unblock_user'].includes(b.action)){
   const telegramId=String(b.telegram_id||'');
   if(!/^[0-9]{1,20}$/.test(telegramId))return json(res,400,{error:'Некорректный Telegram ID'});
   if(isAdmin(telegramId,env))return json(res,400,{error:'Нельзя блокировать администратора или удалять его резюме'});
   if(b.action==='delete_resume'){
    const {data:profile,error:profileError}=await db.from('candidate_profiles').select('id').eq('telegram_id',telegramId).maybeSingle();
    if(profileError)throw profileError;
    if(!profile)return json(res,404,{error:'У пользователя нет резюме'});
    const {error:notificationsError}=await db.from('candidate_job_notifications').delete().eq('profile_id',profile.id);
    if(notificationsError)throw notificationsError;
    const {error:deleteError}=await db.from('candidate_profiles').delete().eq('telegram_id',telegramId);
    if(deleteError)throw deleteError;
    return json(res,200,{ok:true});
   }
   if(b.action==='block_user'){
    const reason=typeof b.reason==='string'?b.reason.trim().slice(0,300):'';
    const {error}=await db.from('user_blocks').upsert({telegram_id:telegramId,reason,blocked_by:String(user.id),created_at:new Date().toISOString()},{onConflict:'telegram_id'});
    if(error)throw error;
    return json(res,200,{ok:true,blocked:true});
   }
   const {error}=await db.from('user_blocks').delete().eq('telegram_id',telegramId);
   if(error)throw error;
   return json(res,200,{ok:true,blocked:false});
  }
  if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(String(b.id||'')))return json(res,400,{error:'Некорректный ID'});
  if(!['edit',...Object.keys(transitions)].includes(b.action))return json(res,400,{error:'Некорректное действие'});
  const {data:existing,error:findError}=await db.from('jobs').select('id,type,status,updated_at').eq('id',b.id).single();
  if(findError||!existing)return json(res,404,{error:'Объявление не найдено'});
  if(b.action==='close'&&existing.type!=='vacancy')return json(res,400,{error:'Закрывать можно только вакансии'});
  if(b.updated_at&&b.updated_at!==existing.updated_at)return json(res,409,{error:'Объявление изменилось. Обнови список перед сохранением.'});
  const update={updated_at:new Date().toISOString()};
  if(b.action!=='edit'){
   const [from,to]=transitions[b.action];if(existing.status!==from)return json(res,409,{error:'Статус объявления уже изменился'});
   update.status=to;if(to==='closed')update.closed_at=new Date().toISOString();else if(to==='published')update.closed_at=null;if(to==='published')update.source_allowed=true;
  }else{
   const f=b.fields||{};
   if(f.is_urgent!==undefined){if(typeof f.is_urgent!=='boolean')return json(res,400,{error:'Некорректное значение срочности'});update.is_urgent=f.is_urgent}
    for(const [key,max] of Object.entries({title:90,summary:4000,district:60,schedule:120,payment_terms:200})){
    if(f[key]!==undefined){if(typeof f[key]!=='string'||f[key].length>max)return json(res,400,{error:'Проверь длину текстовых полей'});update[key]=f[key].trim()}
   }
   if(f.title!==undefined&&!update.title)return json(res,400,{error:'Название не может быть пустым'});
   if(f.category!==undefined){if(!categories.includes(f.category))return json(res,400,{error:'Некорректная категория'});update.category=f.category}
   if(f.pay_unit!==undefined){if(!['час','смена','день','месяц','задача'].includes(f.pay_unit))return json(res,400,{error:'Некорректный период оплаты'});update.pay_unit=f.pay_unit}
   for(const [key,max] of [['pay_amount',99999999],['workers_needed',99]])if(f[key]!==undefined){const v=f[key]===null||f[key]===''?null:Number(f[key]);if(v!==null&&(!Number.isInteger(v)||v<0||v>max))return json(res,400,{error:'Некорректная сумма или количество людей'});update[key]=key==='workers_needed'?(v??1):v}
   if(f.work_date!==undefined){const d=f.work_date;if(d&&!(/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T12:00:00Z'))&&new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d))return json(res,400,{error:'Некорректная дата'});update.work_date=d||null}
  }
  let query=db.from('jobs').update(update).eq('id',b.id).eq('status',existing.status);
  if(existing.updated_at)query=query.eq('updated_at',existing.updated_at);
  const {data,error}=await query.select('id');if(error)throw error;
  if(!data?.length)return json(res,409,{error:'Объявление уже изменено. Обнови список.'});
  if(update.status==='published'){
   try{const {data:publishedJob}=await db.from('jobs').select('*').eq('id',b.id).maybeSingle();if(publishedJob)await notifyMatchingCandidates({database:db,job:publishedJob,send,env})}catch{console.error('Candidate alerts failed after publishing job')}
  }
  return json(res,200,{ok:true});
 }catch{return json(res,503,{error:'Не удалось сохранить изменения'})}
}}
export default createAdminHandler();
