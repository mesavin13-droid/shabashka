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
const adminFields=publicFields+',campaign_id';
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
async function recordAdEvent(req,res,db){
 const body=req.body||{},eventType=body.event_type,sessionId=String(body.session_id||'');
 if(!['impression','click'].includes(eventType)||!UUID.test(sessionId))return json(res,400,{error:'Некорректное событие рекламы'});
 const {data:ad,error:adError}=await db.from('advertisements').select('id,campaign_id,enabled,starts_at,ends_at').eq('id',1).maybeSingle();
 if(adError)throw adError;
 if(!ad)return json(res,404,{error:'Баннер не найден'});
 if(eventType==='impression'&&!activeAd(ad))return json(res,409,{error:'Баннер не активен'});
 const {error}=await db.from('advertisement_events').insert({ad_id:ad.id,campaign_id:ad.campaign_id,event_type:eventType,session_id:sessionId});
 if(error?.code==='23505'&&eventType==='impression')return json(res,200,{ok:true,duplicate:true});
 if(error)throw error;
 return json(res,200,{ok:true});
}
async function getAdStatistics(db,adId,campaignId){
 const since=new Date(Date.now()-30*24*60*60*1000).toISOString();
 const count=(type,from)=>{let q=db.from('advertisement_events').select('id',{count:'exact',head:true}).eq('ad_id',adId).eq('campaign_id',campaignId).eq('event_type',type);if(from)q=q.gte('created_at',from);return q};
 const results=await Promise.all([count('impression'),count('click'),count('impression',since),count('click',since)]);
 for(const r of results)if(r.error)throw r.error;
 const [impressions,clicks,last30Impressions,last30Clicks]=results.map(r=>Number(r.count)||0);
 return {impressions,clicks,ctr:impressions?clicks/impressions*100:0,last30Days:{impressions:last30Impressions,clicks:last30Clicks,ctr:last30Impressions?last30Clicks/last30Impressions*100:0}};
}
async function uploadAdImage(req,res,db){
 const upload=req.body?.upload;
 if(!upload||typeof upload.data!=='string'||upload.data.length>2500000)return json(res,400,{error:'Выбери фото не больше 1,8 МБ после подготовки'});
 const contentType=upload.contentType;
 if(!['image/jpeg','image/png','image/webp'].includes(contentType))return json(res,400,{error:'Поддерживаются JPG, PNG и WebP'});
 let binary;try{binary=atob(upload.data)}catch{return json(res,400,{error:'Файл изображения повреждён'})}
 if(binary.length>1800000)return json(res,413,{error:'Фото превышает допустимый размер 1,8 МБ'});
 const bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));
 const jpeg=contentType==='image/jpeg'&&bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const png=contentType==='image/png'&&bytes.length>=8&&[137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
 const webp=contentType==='image/webp'&&bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP';
 if(!jpeg&&!png&&!webp)return json(res,400,{error:'Содержимое файла не похоже на выбранный формат изображения'});
 const ext=contentType==='image/jpeg'?'jpg':contentType==='image/png'?'png':'webp';
 const path='ads/'+Date.now()+'-'+Math.random().toString(36).slice(2,14)+'.'+ext;
 const {error}=await db.storage.from('ad-images').upload(path,bytes,{contentType,cacheControl:'31536000',upsert:false});
 if(error)throw error;
 const result=db.storage.from('ad-images').getPublicUrl(path);
 if(!result?.data?.publicUrl)throw new Error('Не удалось получить публичный URL изображения');
 return json(res,200,{ok:true,image_url:result.data.publicUrl});
}
export function createAdsHandler({database=getDb,env=process.env}={}){return async(req,res)=>{
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Метод не поддерживается'});
 const tracking=req.query?.event==='track';
 const manage=!tracking&&(req.method==='POST'||req.query?.manage==='1');
 if(manage){let user;try{user=await requireAdmin(req,env)}catch{}if(!user)return json(res,403,{error:'Требуется доступ администратора'})}
 const db=database();if(!db)return json(res,503,{error:'База данных не настроена'});
 try{
  if(tracking){if(req.method!=='POST')return json(res,405,{error:'Метод не поддерживается'});return await recordAdEvent(req,res,db)}
  if(req.method==='GET'){
   const {data,error}=await db.from('advertisements').select(manage?adminFields:publicFields).eq('id',1).single();if(error)throw error;
   if(manage){const stats=await getAdStatistics(db,data.id,data.campaign_id);return json(res,200,{ad:data,stats})}
   return json(res,200,{ad:activeAd(data)?data:null});
  }
  if(req.query?.upload==='1'){try{return await uploadAdImage(req,res,db)}catch{return json(res,503,{error:'Не удалось загрузить фото. Проверь Storage и повтори попытку'})}}
  let ad;try{ad=validateAd(req.body?.fields)}catch(e){return json(res,400,{error:e.message})}
  const {data:current,error:currentError}=await db.from('advertisements').select('campaign_id,title,body,button_text,target_url,image_url,advertiser,erid').eq('id',1).single();if(currentError)throw currentError;
  const campaignFields=['title','body','button_text','target_url','image_url','advertiser','erid'];
  const campaignChanged=campaignFields.some(key=>String(current[key]||'')!==String(ad[key]||''));
  const campaignId=campaignChanged?globalThis.crypto.randomUUID():current.campaign_id;
  let q=db.from('advertisements').update({...ad,campaign_id:campaignId,updated_at:new Date().toISOString()}).eq('id',1);
  if(req.body.updated_at)q=q.eq('updated_at',req.body.updated_at);
  const {data,error}=await q.select(publicFields);if(error)throw error;
  if(!data?.length)return json(res,409,{error:'Настройки изменились. Обнови панель и повтори сохранение.'});
  return json(res,200,{ad:data[0],ok:true});
 }catch(error){console.error('ad request failed',error?.message||'unknown');return json(res,503,{error:'Не удалось загрузить статистику или настройки баннера'})}
}}
export default createAdsHandler();
