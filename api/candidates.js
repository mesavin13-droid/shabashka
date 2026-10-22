import process from 'node:process';
import {json} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
import {getIdentity,isAdmin} from '../_lib/auth.js';

const categories=['Склад','Доставка','Стройка','Уборка','Мероприятия','Общепит','Торговля','Другое','Все'];
const districts=['Ленинский','Октябрьский','Центральный','Кировский','Заельцовский','Первомайский','Калининский','Дзержинский','Железнодорожный','Советский'];
const publicFields='id,display_name,title,categories,districts,desired_pay,pay_unit,schedule,experience,about,contact,is_public,created_at,updated_at';
const ownFields=publicFields+',notify_telegram';
const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';

export function createCandidatesHandler({database=getDb,env=process.env}={}){
 return async(req,res)=>{
  if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Метод не поддерживается'});
  res.setHeader('Cache-Control','no-store');
  const db=database();if(!db)return json(res,503,{error:'База данных не настроена'});
  let user=null;try{user=await getIdentity(req,env)}catch{}
  try{
   if(user?.id){const {data:block,error:blockError}=await db.from('user_blocks').select('telegram_id').eq('telegram_id',String(user.id)).maybeSingle();if(blockError)throw blockError;if(block)return json(res,403,{error:'Доступ к аккаунту ограничен. Напиши администратору @papadim1.'})}
   if(req.method==='GET'){
    let role=null;if(user?.id){if(isAdmin(user.id,env))role='employer';else{const {data:roleRow,error:roleError}=await db.from('user_roles').select('role').eq('telegram_id',String(user.id)).maybeSingle();if(roleError)throw roleError;role=roleRow?.role||null}}
    const {data:profileRows,error:profilesError}=role==='employer'?await db.from('candidate_profiles').select('telegram_id,'+publicFields).eq('is_public',true).order('updated_at',{ascending:false}).limit(150):{data:[],error:null};
    if(profilesError)throw profilesError;
    let profiles=profileRows||[];
    if(role==='employer'){
     const {data:blockedRows,error:blockedError}=await db.from('user_blocks').select('telegram_id');
     if(blockedError)throw blockedError;
     const blockedIds=new Set((blockedRows||[]).map(row=>String(row.telegram_id)));
     profiles=profiles.filter(profile=>!blockedIds.has(String(profile.telegram_id))).map(({telegram_id,...profile})=>profile);
    }
    let mine=null;
    if(user?.id){const {data,error:mineError}=await db.from('candidate_profiles').select(ownFields).eq('telegram_id',String(user.id)).maybeSingle();if(mineError)throw mineError;mine=data||null}
    return json(res,200,{profiles:profiles||[],mine});
   }
   if(!user?.id)return json(res,401,{error:'Войди через Telegram, чтобы создать резюме'});
   const b=req.body||{};
   if(b.action==='delete'){
    const {data:profile,error:profileError}=await db.from('candidate_profiles').select('id').eq('telegram_id',String(user.id)).maybeSingle();
    if(profileError)throw profileError;
    if(profile?.id){const {error:notificationsError}=await db.from('candidate_job_notifications').delete().eq('profile_id',profile.id);if(notificationsError)throw notificationsError}
    const {error}=await db.from('candidate_profiles').delete().eq('telegram_id',String(user.id));if(error)throw error;
    return json(res,200,{ok:true,mine:null});
   }
   const display_name=clean(b.display_name,80),title=clean(b.title,100),about=clean(b.about,1200),experience=clean(b.experience,120),schedule=clean(b.schedule,120),contact=clean(b.contact,120);
   const cats=Array.isArray(b.categories)?[...new Set(b.categories.filter(x=>categories.includes(x)))].slice(0,9):[];
   const areas=Array.isArray(b.districts)?[...new Set(b.districts.filter(x=>districts.includes(x)))].slice(0,10):[];
   const desired_pay=b.desired_pay===''||b.desired_pay===null||b.desired_pay===undefined?null:Number(b.desired_pay);
   const pay_unit=['час','смена','день','месяц','договорная'].includes(b.pay_unit)?b.pay_unit:'смена';
   const is_public=b.is_public!==false,notify_telegram=b.notify_telegram!==false;
   if(display_name.length<2||title.length<3)return json(res,400,{error:'Укажи имя и кем хочешь работать'});
   if(!cats.length||cats.includes('Все')&&cats.length>1)return json(res,400,{error:'Выбери одну или несколько категорий для поиска вакансий'});
   if(!Number.isInteger(desired_pay)&&desired_pay!==null||desired_pay!==null&&(desired_pay<0||desired_pay>10000000))return json(res,400,{error:'Проверь желаемую оплату'});
   if(is_public&&contact.length<3)return json(res,400,{error:'Для публикации резюме укажи контакт для связи'});
   const values={telegram_id:String(user.id),display_name,title,categories:cats,districts:areas,desired_pay,pay_unit,schedule,experience,about,contact,is_public,notify_telegram,updated_at:new Date().toISOString()};
   const {data,error}=await db.from('candidate_profiles').upsert(values,{onConflict:'telegram_id'}).select(ownFields).single();
   if(error)throw error;
   return json(res,200,{ok:true,mine:data});
  }catch(error){
   console.error('candidate profile request failed');
   return json(res,503,{error:'Не удалось сохранить резюме. Попробуй ещё раз.'});
  }
 };
}
export default createCandidatesHandler();
