import {Buffer} from 'node:buffer';
import process from 'node:process';
import {timingSafeEqual} from 'node:crypto';
import {getDb} from '../_lib/db.js';
import {isAdmin} from '../_lib/auth.js';
import {prepareImport,importReceipt} from '../_lib/import-job.js';
import {sendTelegram,answerCallback,reviewButtons} from '../_lib/bot.js';
import {json,onlyMethod} from '../_lib/http.js';
import {notifyMatchingCandidates} from '../_lib/notify-candidates.js';
function sameSecret(a,b){if(!a||!b)return false;const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y)}
export function createTelegramHandler({database=getDb,allowedAdmin=isAdmin,send=sendTelegram,answer=answerCallback,env=process.env}={}){return async function handler(req,res){
 if(!onlyMethod(req,res,'POST'))return;
 if(!sameSecret(req.headers['x-telegram-bot-api-secret-token'],env.TELEGRAM_WEBHOOK_SECRET))return json(res,403,{error:'Forbidden'});
 const u=req.body||{};if(!Number.isSafeInteger(u.update_id))return json(res,400,{error:'Invalid update'});
 const m=u.message,actor=m?.from||u.callback_query?.from;
 if(!actor)return json(res,200,{ok:true});
 try{
  if(m?.chat?.type==='private'&&/^\/id(?:@\w+)?(?:\s|$)/i.test(m.text||'')){await send(m.chat.id,`Твой Telegram ID: ${actor.id}`);return json(res,200,{ok:true})}
  const admin=allowedAdmin(actor.id);
  if(m&&m.chat?.type!=='private')return json(res,200,{ok:true});
  const db=database();if(!db)return json(res,503,{error:'База не настроена'});
  if(!admin){const {data:block,error:blockError}=await db.from('user_blocks').select('telegram_id,reason').eq('telegram_id',String(actor.id)).maybeSingle();if(blockError)throw blockError;if(block){const message='Доступ к ШАБАШКА ограничен. По вопросам обратись к администратору @papadim1.';if(m)await send(m.chat.id,message);else if(u.callback_query)await answer(u.callback_query.id,'Доступ ограничен');return json(res,200,{ok:true,blocked:true})}}
  const loginStart=m?.text?.match(/^\/start(?:@\w+)? login_([0-9a-f-]{36})$/i);
  if(loginStart){
   const {data:c,error}=await db.from('login_challenges').select('id,code,expires_at,consumed_at').eq('id',loginStart[1]).single();
   if(error||!c||c.consumed_at||new Date(c.expires_at)<=new Date()){await send(m.chat.id,'Ссылка для входа устарела. Нажми «Войти» на сайте ещё раз.');return json(res,200,{ok:true})}
   await send(m.chat.id,`Вход на сайт ШАБАШКА. Код: ${c.code}\n\nПодтверждай только если ты сам нажал «Войти» на сайте и видишь там такой же код.`,{reply_markup:{inline_keyboard:[[{text:`Подтвердить вход · ${c.code}`,callback_data:`login:${c.id}`}]]}});return json(res,200,{ok:true});
  }
  if(u.callback_query?.data?.startsWith('login:')){
   const cb=u.callback_query,id=cb.data.slice(6);if(!/^[a-f0-9-]{36}$/i.test(id))return json(res,200,{ok:true});
   const {data:c}=await db.from('login_challenges').select('id,expires_at,consumed_at,approved_at').eq('id',id).single();
   if(!c||c.consumed_at||c.approved_at||new Date(c.expires_at)<=new Date()){await answer(cb.id,'Ссылка устарела или уже использована');return json(res,200,{ok:true})}
   const {data:changed,error}=await db.from('login_challenges').update({telegram_id:String(actor.id),telegram_name:String(actor.first_name||'').slice(0,100),approved_at:new Date().toISOString()}).eq('id',id).is('approved_at',null).select('id');if(error)throw error;
   await answer(cb.id,changed?.length?'Вход подтверждён. Вернись на сайт.':'Уже подтверждено');return json(res,200,{ok:true});
  }
  if(u.callback_query?.data?.startsWith('role:')){
   const cb=u.callback_query,role=cb.data.slice(5);
   if(!['job_seeker','employer'].includes(role)){await answer(cb.id,'Неизвестный тип аккаунта');return json(res,200,{ok:true})}
   const {error}=await db.from('user_roles').upsert({telegram_id:String(actor.id),role,updated_at:new Date().toISOString()},{onConflict:'telegram_id'});
   if(error)throw error;
   await answer(cb.id,'Выбор сохранён');
   const site=String(env.SITE_URL||'https://shabashka-nsk.vercel.app').replace(/\/$/,'');
   if(role==='job_seeker'){
    await send(cb.message?.chat?.id||actor.id,'Ты выбрал «Ищу работу». Заполни резюме на сайте и отметь категории — я буду присылать сюда подходящие новые вакансии.\\n\\nЧтобы изменить роль, отправь /start.',{reply_markup:{inline_keyboard:[[{text:'Заполнить резюме',url:site+'/#profile'}],[{text:'Старт / выбор роли',url:'https://t.me/'+(env.TELEGRAM_BOT_USERNAME||'') }]]}});
   }else{
    await send(cb.message?.chat?.id||actor.id,'Ты выбрал «Работодатель». Присылай текст вакансии или фото с подписью — объявление поступит на модерацию. На сайте можно смотреть резюме исполнителей.\\n\\nЧтобы изменить роль, отправь /start.',{reply_markup:{inline_keyboard:[[{text:'Открыть ШАБАШКА',url:site}],[{text:'Задать вопрос · @papadim1',url:'https://t.me/papadim1'}]]}});
   }
   return json(res,200,{ok:true});
  }
  if(u.callback_query){
   if(!admin){await answer(u.callback_query.id,'Только администратор может управлять объявлениями');return json(res,200,{ok:true})}
   const cb=u.callback_query,match=String(cb.data||'').match(/^(approve|reject|archive|restore|edit):([0-9a-f-]{36})$/i);
   if(!match){await answer(cb.id,'Неизвестное действие');return json(res,200,{ok:true})}
   const [,action,id]=match;
   if(action==='edit'){await answer(cb.id,'Редактирование доступно в панели сайта');return json(res,200,{ok:true})}
   const {data:job,error:findError}=await db.from('jobs').select('id,status').eq('id',id).single();
   if(findError)throw findError;
   const transitions={approve:['pending','published'],reject:['pending','rejected'],archive:['published','archived'],restore:['archived','published']},[from,to]=transitions[action];
   if(!job||job.status!==from){await answer(cb.id,'Уже обработано');return json(res,200,{ok:true})}
   const {data:changed,error}=await db.from('jobs').update({status:to,updated_at:new Date().toISOString()}).eq('id',id).eq('status',from).select('id');if(error)throw error;
   if(!changed?.length){await answer(cb.id,'Уже обработано');return json(res,200,{ok:true})}
   await answer(cb.id,to==='published'?'Опубликовано':to==='archived'?'Снято с сайта':'Отклонено');
   if(to==='published'){
    try{const {data:publishedJob}=await db.from('jobs').select('*').eq('id',id).maybeSingle();if(publishedJob)await notifyMatchingCandidates({database:db,job:publishedJob,send,env})}catch{console.error('Candidate alerts failed after Telegram publish')}
   }
   if(action==='archive'&&cb.message?.chat?.id){try{await send(cb.message.chat.id,'Объявление снято с сайта. Можно вернуть его обратно.',{reply_markup:{inline_keyboard:[[{text:'Вернуть на сайт',callback_data:`restore:${id}`}]]}})}catch{console.error('Archived; Telegram receipt delivery failed')}}
   return json(res,200,{ok:true});
  }
  if(!m)return json(res,200,{ok:true});
  if(/^\/(?:start|help)(?:@\w+)?(?:\s|$)/i.test(m.text||'')){
   const {data:savedRole,error:roleError}=await db.from('user_roles').select('role').eq('telegram_id',String(actor.id)).maybeSingle();
   if(roleError)throw roleError;
   const site=String(env.SITE_URL||'https://shabashka-nsk.vercel.app').replace(/\/$/,'');
   const text=admin?'Привет, администратор! Перешли вакансию текстом или фото с подписью — я обработаю объявление.':savedRole?.role==='job_seeker'?'Ты выбрал роль «Ищу работу». Я пришлю сюда новые вакансии по категориям из твоего резюме.':savedRole?.role==='employer'?'Ты выбрал роль «Работодатель». Присылай вакансию текстом или фото с подписью. После модерации я сообщу результат. На сайте можно смотреть резюме исполнителей.':'Добро пожаловать в ШАБАШКА! Выбери, зачем ты пришёл — я настрою возможности и Telegram-уведомления.';
   await send(m.chat.id,text,{reply_markup:{inline_keyboard:[
    [{text:'🔎 Ищу работу',callback_data:'role:job_seeker'},{text:'🧰 Я работодатель',callback_data:'role:employer'}],
    [{text:'Открыть ШАБАШКА',url:site}],
    [{text:'Задать вопрос · @papadim1',url:'https://t.me/papadim1'}]
   ]}});return json(res,200,{ok:true})
  }
  if(!admin){
   const {data:savedRole,error:roleError}=await db.from('user_roles').select('role').eq('telegram_id',String(actor.id)).maybeSingle();
   if(roleError)throw roleError;
   if(!savedRole?.role){await send(m.chat.id,'Сначала выбери свою роль:',{reply_markup:{inline_keyboard:[[{text:'🔎 Ищу работу',callback_data:'role:job_seeker'},{text:'🧰 Я работодатель',callback_data:'role:employer'}]]}});return json(res,200,{ok:true})}
   if(savedRole.role==='job_seeker'){await send(m.chat.id,'Ты выбрал роль «Ищу работу». Заполни резюме и выбери категории на сайте, чтобы получать подходящие вакансии. Отправлять вакансии могут работодатели.',{reply_markup:{inline_keyboard:[[{text:'Заполнить резюме',url:String(env.SITE_URL||'https://shabashka-nsk.vercel.app').replace(/\/$/,'')+'/#profile'}]]}});return json(res,200,{ok:true})}
  }
  let record;try{record=prepareImport(m,actor.id,{autoPublish:admin&&env.TELEGRAM_AUTO_PUBLISH!=='false'})}catch(e){if(e.message!=='TEXT_LENGTH')throw e;await send(m.chat.id,'Пришли текст вакансии от 15 до 4000 символов. Подойдёт и фото с подписью. Фото без текста пока не распознаю.');return json(res,200,{ok:true})}
  const {data:existing,error:lookupError}=await db.from('jobs').select('id,status').or(`source_key.eq.${record.source_key},content_hash.eq.${record.content_hash}`).limit(1);if(lookupError)throw lookupError;
  if(existing?.length){
   const prior=existing[0];
   if(admin&&record.status==='published'&&prior.status==='pending'){
    const {data:changed,error}=await db.from('jobs').update({status:'published',source_allowed:true,updated_at:new Date().toISOString()}).eq('id',prior.id).eq('status','pending').select('id');if(error)throw error;
    if(changed?.length){const publishedRecord={...record,id:prior.id,status:'published'};try{await notifyMatchingCandidates({database:db,job:publishedRecord,send,env})}catch{console.error('Candidate alerts failed after duplicate publish')}const receipt=importReceipt(record,prior.id,env.SITE_URL);try{await send(m.chat.id,receipt.text,{reply_markup:receipt.reply_markup})}catch{console.error('Published; receipt delivery failed')}return json(res,200,{ok:true})}
   }
   await send(m.chat.id,'Эта вакансия уже есть в базе. Повтор не добавлен.');return json(res,200,{ok:true})
  }
  const {data:job,error}=await db.from('jobs').insert(record).select('id').single();
  if(error){if(error.code==='23505'){await send(m.chat.id,'Такая вакансия уже добавлена.');return json(res,200,{ok:true})}throw error}
  if(record.status==='published'){try{await notifyMatchingCandidates({database:db,job:{...record,id:job.id},send,env})}catch{console.error('Candidate alerts failed after new publish')}}
  const receipt=importReceipt(record,job.id,env.SITE_URL,{canManage:admin});try{await send(m.chat.id,receipt.text,{reply_markup:receipt.reply_markup})}catch{console.error('Import saved; Telegram receipt delivery failed')}
  if(!admin&&record.status==='pending'){
   for(const adminId of (env.TELEGRAM_ADMIN_IDS||'').split(',').map(x=>x.trim()).filter(Boolean)){
    try{await send(adminId,`На модерации: объявление работодателя\n\n${record.title}\nКатегория: ${record.category}\n\n${record.summary.slice(0,3400)}`,{reply_markup:reviewButtons(job.id,true,env.SITE_URL)})}catch{console.error('Moderation notification delivery failed')}
   }
  }
  return json(res,200,{ok:true});
 }catch{console.error('telegram webhook failed');return json(res,500,{error:'Не удалось обработать сообщение. Telegram повторит доставку.'})}
}}
export default createTelegramHandler();
