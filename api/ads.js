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
 const manage=req.method==='POST'||req.query?.manage==='1';
 if(manage){let user;try{user=await requireAdmin(req,env)}catch{}if(!user)return json(res,403,{error:'Требуется доступ администратора'})}
 const db=database();if(!db)return json(res,503,{error:'База данных не настроена'});
 try{
  if(req.method==='GET'){
   const {data,error}=await db.from('advertisements').select(publicFields).eq('id',1).single();if(error)throw error;
   return json(res,200,{ad:manage||activeAd(data)?data:null});
  }
  if(req.query?.upload==='1'){try{return await uploadAdImage(req,res,db)}catch{return json(res,503,{error:'Не удалось загрузить фото. Проверь Storage и повтори попытку'})}}
  let ad;try{ad=validateAd(req.body?.fields)}catch(e){return json(res,400,{error:e.message})}
  let q=db.from('advertisements').update({...ad,updated_at:new Date().toISOString()}).eq('id',1);
  if(req.body.updated_at)q=q.eq('updated_at',req.body.updated_at);
  const {data,error}=await q.select(publicFields);if(error)throw error;
  if(!data?.length)return json(res,409,{error:'Настройки изменились. Обнови панель и повтори сохранение.'});
  return json(res,200,{ad:data[0],ok:true});
 }catch{return json(res,503,{error:'Не удалось загрузить или сохранить баннер'})}
}}
export default createAdsHandler();
