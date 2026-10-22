import process from 'node:process';
import {json} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
import {requireAdmin} from '../_lib/auth.js';
const categories=['Склад','Доставка','Уборка','Стройка','Мероприятия','Общепит','Торговля','Другое'];
const transitions={approve:['pending','published'],reject:['pending','rejected'],archive:['published','archived'],restore:['archived','published']};
export function createAdminHandler({database=getDb,env=process.env}={}){return async(req,res)=>{
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Метод не поддерживается'});
 res.setHeader('Cache-Control','no-store');
 let user;try{user=await requireAdmin(req,env)}catch{return json(res,401,{error:'Ошибка авторизации'})}
 if(!user)return json(res,403,{error:'Требуется доступ администратора'});
 const db=database();if(!db)return json(res,503,{error:'База данных не настроена'});
 try{
  if(req.method==='GET'){
   const {data,error}=await db.from('jobs').select('*').order('created_at',{ascending:false}).limit(500);
   if(error)throw error;return json(res,200,{jobs:data});
  }
  const b=req.body||{};
  if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(String(b.id||'')))return json(res,400,{error:'Некорректный ID'});
  if(!['edit',...Object.keys(transitions)].includes(b.action))return json(res,400,{error:'Некорректное действие'});
  const {data:existing,error:findError}=await db.from('jobs').select('id,status,updated_at').eq('id',b.id).single();
  if(findError||!existing)return json(res,404,{error:'Объявление не найдено'});
  if(b.updated_at&&b.updated_at!==existing.updated_at)return json(res,409,{error:'Объявление изменилось. Обнови список перед сохранением.'});
  const update={updated_at:new Date().toISOString()};
  if(b.action!=='edit'){
   const [from,to]=transitions[b.action];if(existing.status!==from)return json(res,409,{error:'Статус объявления уже изменился'});
   update.status=to;if(to==='published')update.source_allowed=true;
  }else{
   const f=b.fields||{};
   if(f.is_urgent!==undefined){if(typeof f.is_urgent!=='boolean')return json(res,400,{error:'Некорректное значение срочности'});update.is_urgent=f.is_urgent}\n   for(const [key,max] of Object.entries({title:90,summary:4000,district:60,schedule:120,payment_terms:200})){
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
  return json(res,200,{ok:true});
 }catch{return json(res,503,{error:'Не удалось сохранить изменения'})}
}}
export default createAdminHandler();
