// Run only in a trusted server terminal with secrets set as environment variables.
// No token is accepted on the command line or written to disk / console.
const required=['TELEGRAM_BOT_TOKEN','TELEGRAM_WEBHOOK_SECRET','TELEGRAM_ADMIN_IDS','SITE_URL'];
for(const key of required)if(!process.env[key])throw new Error(`Set ${key} in the secure environment`);
const site=new URL(process.env.SITE_URL);
if(site.protocol!=='https:'||site.username||site.password)throw new Error('SITE_URL must be a clean HTTPS URL');
if(!/^[A-Za-z0-9_-]{1,256}$/.test(process.env.TELEGRAM_WEBHOOK_SECRET))throw new Error('Invalid TELEGRAM_WEBHOOK_SECRET format');
if(!process.env.TELEGRAM_ADMIN_IDS.split(',').every(x=>/^\d+$/.test(x.trim())))throw new Error('TELEGRAM_ADMIN_IDS must contain numeric IDs');
async function call(method,data){let response;try{response=await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data||{}),signal:AbortSignal.timeout(15000)})}catch{throw new Error(`Telegram ${method} connection failed`)}const body=await response.json();if(!response.ok||!body.ok)throw new Error(`Telegram ${method} failed (${response.status})`);return body.result}
const me=await call('getMe');
if(me.username.toLowerCase()!==(process.env.TELEGRAM_BOT_USERNAME||'shabashkanskbot').toLowerCase())throw new Error('Bot token belongs to a different bot. No webhook was changed.');
const url=new URL('/api/telegram',site).href;
await call('setWebhook',{url,secret_token:process.env.TELEGRAM_WEBHOOK_SECRET,allowed_updates:['message','callback_query'],drop_pending_updates:false});
const info=await call('getWebhookInfo');
if(info.url!==url)throw new Error('Webhook URL did not match');
console.log(`Webhook configured for @${me.username}. Pending messages: ${info.pending_update_count}.`);
if(info.last_error_message)console.log('Telegram reports a prior delivery error. Forward a fresh test vacancy and verify the website.');
