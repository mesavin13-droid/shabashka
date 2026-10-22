import process from 'node:process';
import {sendTelegram} from './bot.js';

const safeText=(value,max=250)=>String(value??'').replace(/[<>]/g,'').trim().slice(0,max);
const publicSite=(env=process.env)=>String(env.SITE_URL||'https://shabashka-nsk.vercel.app').replace(/\/$/,'');

export async function notifyMatchingCandidates({database,job,send=sendTelegram,env=process.env}={}){
  if(!job||job.type!=='vacancy'||job.status!=='published'||!job.category)return {matched:0,sent:0};
  const db=typeof database==='function'?database():database;
  if(!db)return {matched:0,sent:0};
  const {data:categoryProfiles,error:categoryError}=await db.from('candidate_profiles')
    .select('id,telegram_id,display_name,title,categories')
    .eq('notify_telegram',true).contains('categories',[job.category]).limit(500);
  if(categoryError)throw categoryError;
  const {data:allProfiles,error:allError}=await db.from('candidate_profiles')
    .select('id,telegram_id,display_name,title,categories')
    .eq('notify_telegram',true).contains('categories',['Все']).limit(500);
  if(allError)throw allError;
  const {data:blockedRows,error:blockedError}=await db.from('user_blocks').select('telegram_id');
  if(blockedError)throw blockedError;
  const blockedIds=new Set((blockedRows||[]).map(row=>String(row.telegram_id)));
  const profiles=[...(categoryProfiles||[]),...(allProfiles||[])].filter((p,i,a)=>a.findIndex(x=>x.id===p.id)===i&&!blockedIds.has(String(p.telegram_id)));
  let sentCount=0;
  const jobId=String(job.id);
  for(const profile of profiles){
    if(!/^\d{1,20}$/.test(String(profile.telegram_id||'')))continue;
    const {data:claim,error:claimError}=await db.from('candidate_job_notifications')
      .insert({profile_id:profile.id,job_id:jobId,status:'pending'}).select('id').maybeSingle();
    if(claimError){
      if(claimError.code==='23505')continue;
      console.error('candidate notification claim failed');
      continue;
    }
    if(!claim?.id)continue;
    const title=safeText(job.title,120);
    const pay=job.pay_amount==null?'Оплата уточняется':String(job.pay_amount)+' ₽'+(job.pay_unit?' / '+safeText(job.pay_unit,30):'');
    const district=safeText(job.district||'Новосибирск',80);
    const details=safeText(job.summary||'',450);
    const link=publicSite(env)+'/#job='+encodeURIComponent(jobId);
    const text='🔔 Новая вакансия по твоему профилю\n\n'+title+'\nКатегория: '+safeText(job.category,60)+'\nРайон: '+district+'\nОплата: '+pay+(job.schedule?'\nВремя: '+safeText(job.schedule,100):'')+(details?'\n\n'+details:'')+'\n\nТы выбрал эту категорию в резюме на ШАБАШКА.';
    try{
      await send(profile.telegram_id,text,{reply_markup:{inline_keyboard:[[{text:'Открыть вакансию',url:link}],[{text:'Открыть ШАБАШКА',url:publicSite(env)}]]}});
      await db.from('candidate_job_notifications').update({status:'sent',sent_at:new Date().toISOString(),attempts:1,last_error:null}).eq('id',claim.id);
      sentCount++;
    }catch(error){
      await db.from('candidate_job_notifications').update({status:'failed',attempts:1,last_error:safeText(error?.message||'Telegram send failed',200)}).eq('id',claim.id);
    }
  }
  return {matched:profiles.length,sent:sentCount};
}
