import process from 'node:process';
export async function sendTelegram(chatId,text,extra={},token=process.env.TELEGRAM_BOT_TOKEN){
  if(!token)return {ok:false};
  const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:chatId,text,...extra}),signal:AbortSignal.timeout(9000)});
  const body=await r.json();if(!r.ok||!body.ok)throw new Error('TELEGRAM_SEND_FAILED');return body;
}
export async function answerCallback(callbackId,text,token=process.env.TELEGRAM_BOT_TOKEN){
  if(!token)return;
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({callback_query_id:callbackId,text,show_alert:false}),signal:AbortSignal.timeout(5000)}).catch(()=>{});
}
export function reviewButtons(id,canPublish,siteUrl){return {inline_keyboard:[...(canPublish?[[{text:'✅ Опубликовать',callback_data:`approve:${id}`}]]:[]),[{text:'🚫 Отклонить',callback_data:`reject:${id}`},...(siteUrl?[{text:'✏️ Изменить на сайте',url:siteUrl+'#admin'}]:[{text:'✏️ Изменить на сайте',callback_data:`edit:${id}`}])]]};}
