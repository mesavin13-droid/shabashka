import process from 'node:process';
import {json} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
import {requireAdmin} from '../_lib/auth.js';
export function secureUrl(value,{optional=false}={}){
 if(optional&&!value)return '';
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.href.length<=2000?u.href:null}catch{return null}
}
export function activeAd(ad,now=Date.now()){
 return !!ad?.enabled&&(!ad.starts_at||Date.parse(ad.starts_at)<=now)&&(!ad.ends_at||Date.parse(ad.ends_at)>now);
}
export function validateAd(fields){
 if(!fields||typeof fields!=='object'||typeof fields.enabled!=='boolean')throw new Error('Проверь настройки баннера');
 const ad={enabled:fields.enabled};
 for(const [key,max,required] of [['title',100,true],['body',500,true],['button_text',40,true],['advertiser',120,true],['erid',150,false]]){
  if(typeof fields[key]!=='string'||fields[key].length>max||required&&!fields[key].trim())throw new Error('Заполни название, текст, кнопку и рекламодателя');
  ad[key]=fields[key].trim();
 }
 ad.target_url=secureUrl(fields.target_url);ad.image_url=secureUrl(fields.image_url,{optional:true});
 if(ad.target_url===null||ad.image_url===null)throw new Error('Ссылки должны начинаться с https:// и не содержать логин или пароль');
 for(const key of ['starts_at','ends_at']){
  const value=fields[key];if(value!==null&&value!==''&&value!==undefined&&(typeof value!=='string'||!Number.isFinite(Date.parse(value))))throw new Error('Проверь даты показа');
  ad[key]=value?new Date(value).toISOString():null;
 }
 if(ad.starts_at&&ad.ends_at&&Date.parse(ad.ends_at)<=Date.parse(ad.starts_at))throw new Error('Окончание показа должно быть позже начала');
 return ad;
}
const publicFields='id,enabled,title,body,button_text,target_url,image_url,advertiser,erid,starts_at,ends_at,updated_at';
export function createAdsHandler({database=getDb,env=process.env}={}){return async(req,res)=>{
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Метод не поддерживается'});
 const manage=req.method==='POST'||req.query?.manage==='1';
 if(manage){let user;try{user=await requireAdmin(req,env)}catch{}if(!user)return json(res,403,{error:'Требуется доступ администратора'})}
 const db=database();if(!db)return json(res,503,{error:'База данных не настроена'});
 try{
  if(req.method==='GET'){
   const {data,error}=await db.from('advertisements').select(publicFields).eq('id',1).single();if(error)throw error;
   return json(res,200,{ad:manage||activeAd(data)?data:null});
  }
  let ad;try{ad=validateAd(req.body?.fields)}catch(e){return json(res,400,{error:e.message})}
  let q=db.from('advertisements').update({...ad,updated_at:new Date().toISOString()}).eq('id',1);
  if(req.body.updated_at)q=q.eq('updated_at',req.body.updated_at);
  const {data,error}=await q.select(publicFields);if(error)throw error;
  if(!data?.length)return json(res,409,{error:'Настройки изменились. Обнови панель и повтори сохранение.'});
  return json(res,200,{ad:data[0],ok:true});
 }catch{return json(res,503,{error:'Не удалось загрузить или сохранить баннер'})}
}}
export default createAdsHandler();
