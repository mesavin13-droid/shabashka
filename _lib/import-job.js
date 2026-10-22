import {parseMessage,getForwardSource,fingerprint} from './parser.js';
// The webhook determines whether the sender may publish immediately.
export function prepareImport(message,adminId,{autoPublish=true,now=new Date()}={}){
 const text=String(message.text||message.caption||'').trim();
 if(text.length<15||text.length>4000)throw new Error('TEXT_LENGTH');
 const parsed=parseMessage(text,now),source=getForwardSource(message),{flags,...fields}=parsed;
 return {...fields,source_name:source.name,source_username:source.channel_username,source_url:source.source_url,source_key:source.source_key,source_allowed:true,content_hash:fingerprint(text),status:autoPublish?'published':'pending',review_flags:flags,imported_by:String(adminId)};
}
export function siteJobUrl(base,id){try{const u=new URL(base);if(u.protocol!=='https:'||u.username||u.password)return null;u.pathname='/';u.search='';u.hash=`job=${encodeURIComponent(id)}`;return u.href}catch{return null}}
export function importReceipt(job,id,siteUrl,{canManage=true}={}){
 const published=job.status==='published';
 return {text:`${published?'Опубликовано на сайте':'Сохранено на проверку'}\n\n${job.title}\nКатегория: ${job.category}\nОплата: ${job.pay_amount!==null?`${job.pay_amount.toLocaleString('ru-RU')} ₽ / ${job.pay_unit}`:'не указана'}\nРайон: ${job.district||'не указан'}\nГрафик: ${job.schedule}${job.work_date?` (${job.work_date})`:''}${job.review_flags.length?'\n\nЗамечания: '+job.review_flags.join('; '):''}`,reply_markup:{inline_keyboard:[...(published&&siteJobUrl(siteUrl,id)?[[{text:'Открыть на сайте',url:siteJobUrl(siteUrl,id)}]]:[]),...(canManage?[[{text:published?'Снять с сайта':'Опубликовать',callback_data:`${published?'archive':'approve'}:${id}`}]]:[])]}};
}
