import test from 'node:test';
import assert from 'node:assert/strict';
import {createTelegramHandler} from '../api/telegram.js';
import {prepareImport,siteJobUrl} from '../_lib/import-job.js';
import {createJobsHandler} from '../api/jobs.js';
import {signSession,verifySession} from '../_lib/auth.js';
import {createAdminHandler} from '../api/admin.js';
import {parseMessage} from '../_lib/parser.js';
const message={message_id:7,date:1792600000,from:{id:101},chat:{id:101,type:'private'},text:'Требуются грузчики на склад\nЛенинский район\nЗавтра с 9 до 18. Оплата 3 500 ₽ за смену.\nРазгрузка коробок. Выплаты после смены. Писать @test_contact',forward_origin:{type:'channel',chat:{id:-10044,username:'vacancies_test',title:'Вакансии НСК'},message_id:42}};
function fakeDb(){const rows=[];let fail=false;return {rows,set fail(v){fail=v},from(){let action='read',value,conditions=[],or,limit;const q={select(){return q},order(){return q},eq(k,v){conditions.push([k,v]);return q},or(v){or=v;return q},limit(n){limit=n;return q},insert(v){action='insert';value=v;return q},update(v){action='update';value=v;return q},single(){return q.then(x=>({...x,data:x.data?.[0]||null}))},then(resolve,reject){if(fail)return Promise.resolve({data:null,error:{code:'db_error'}}).then(resolve,reject);let found=rows.filter(r=>conditions.every(([k,v])=>r[k]===v));if(or){const parts=or.split(',').map(x=>{const [k,,...value]=x.split('.');return [k,value.join('.')]});found=found.filter(r=>parts.some(([k,v])=>r[k]===v))}if(action==='insert'){if(rows.some(r=>r.content_hash===value.content_hash||r.source_key===value.source_key))return Promise.resolve({data:null,error:{code:'23505'}}).then(resolve,reject);found=[{...value,id:'12345678-1234-1234-1234-123456789abc'}];rows.push(...found)}if(action==='update')found.forEach(r=>Object.assign(r,value));return Promise.resolve({data:limit?found.slice(0,limit):found,error:null}).then(resolve,reject)}};return q}}}
function fixture({allowed=true,auto=true}={}){const db=fakeDb(),sent=[],answers=[];const handler=createTelegramHandler({database:()=>db,allowedAdmin:id=>allowed&&id===101,send:async(...v)=>{sent.push(v);return {ok:true}},answer:async(...v)=>answers.push(v),env:{TELEGRAM_WEBHOOK_SECRET:'test-secret',TELEGRAM_AUTO_PUBLISH:auto?'true':'false',SITE_URL:'https://jobs.example'}});return {db,sent,answers,async call(body,secret='test-secret'){const res={code:0,setHeader(){},status(n){this.code=n;return this},json(v){this.body=v;return this}};await handler({method:'POST',headers:{'x-telegram-bot-api-secret-token':secret},body},res);return res}}}
test('forward → published categorized row with full description and receipt link',async()=>{const f=fixture(),r=await f.call({update_id:1,message});assert.equal(r.code,200);assert.equal(f.db.rows.length,1);const job=f.db.rows[0];assert.equal(job.status,'published');assert.equal(job.category,'Склад');assert.equal(job.title,'Требуются грузчики на склад');assert.equal(job.pay_amount,3500);assert.equal(job.pay_unit,'смена');assert.match(job.summary,/\nЛенинский/);assert.match(job.summary,/@test_contact/);assert.equal(job.source_url,'https://t.me/vacancies_test/42');assert.match(f.sent[0][1],/Опубликовано/);assert.match(f.sent[0][2].reply_markup.inline_keyboard[0][0].url,/#job=/)});
test('duplicate webhook and same text from a different source do not publish twice',async()=>{const f=fixture();await f.call({update_id:1,message});await f.call({update_id:1,message});await f.call({update_id:2,message:{...message,message_id:8,forward_origin:{...message.forward_origin,message_id:43}}});assert.equal(f.db.rows.length,1);assert.match(f.sent.at(-1)[1],/Повтор не добавлен/)});
test('wrong webhook secret is rejected before accessing DB',async()=>{const f=fixture();assert.equal((await f.call({update_id:1,message},'bad')).code,403);assert.equal(f.db.rows.length,0);assert.equal(f.sent.length,0)});
test('other Telegram accounts and group chats cannot publish',async()=>{const f=fixture({allowed:false});await f.call({update_id:1,message});assert.equal(f.db.rows.length,1);assert.equal(f.db.rows[0].status,'pending');assert.deepEqual(f.sent[0][2].reply_markup.inline_keyboard,[]);await f.call({update_id:2,callback_query:{id:'no',from:{id:101},data:`approve:${f.db.rows[0].id}`}});assert.equal(f.db.rows[0].status,'pending');assert.match(f.answers[0][1],/Только администратор/);const g=fixture();await g.call({update_id:1,message:{...message,chat:{id:-1,type:'group'}}});assert.equal(g.db.rows.length,0)});
test('photo caption is imported, photo without a caption gets instructions',async()=>{const f=fixture();await f.call({update_id:1,message:{...message,text:undefined,caption:message.text,photo:[{}]}});assert.equal(f.db.rows.length,1);await f.call({update_id:2,message:{...message,text:undefined,photo:[{}]}});assert.match(f.sent.at(-1)[1],/Фото без текста/)});
test('manual review remains opt-in',async()=>{const f=fixture({auto:false});await f.call({update_id:1,message});assert.equal(f.db.rows[0].status,'pending');assert.match(f.sent[0][1],/на проверку/)});
test('published job can be archived and restored from Telegram',async()=>{const f=fixture();await f.call({update_id:1,message});const id=f.db.rows[0].id;const cb=action=>({update_id:2,callback_query:{id:'cb',from:{id:101},data:`${action}:${id}`,message:{chat:{id:101}}}});await f.call(cb('archive'));assert.equal(f.db.rows[0].status,'archived');await f.call(cb('restore'));assert.equal(f.db.rows[0].status,'published')});
test('a DB failure never produces a success reply',async()=>{const f=fixture();f.db.fail=true;const result=await f.call({update_id:1,message});assert.equal(result.code,500);assert.equal(f.sent.length,0)});
test('contact details and long description are retained',()=>{const description='Задачи: раскладывать товары.\n'.repeat(70)+'Контакт: @test_contact';const j=prepareImport({...message,text:'Комплектовщики на склад\n'+description},101);assert.equal(j.summary.length,('Комплектовщики на склад\n'+description).length);assert.match(j.summary,/@test_contact/)});
test('professional category is chosen over workplace word',()=>assert.equal(parseMessage('Требуется повар на склад\nГотовить обеды. Оплата 4000 рублей за смену.').category,'Общепит'));
test('duration of a shift does not turn pay into hourly rate',()=>{const j=parseMessage('Грузчик на склад. 3500 ₽ за смену, смена 9 часов.');assert.equal(j.pay_unit,'смена');assert.equal(parseMessage('Уборка офиса. Оплата 250 ₽ в час.').pay_amount,250);assert.equal(parseMessage('Уборка офиса. Оплата 250 ₽ в час.').pay_unit,'час')});
test('relative date is anchored to Novosibirsk and survives month rollover',()=>{const j=parseMessage('Завтра нужен курьер. 3500 рублей за день.',new Date('2026-10-31T20:00:00Z'));assert.equal(j.work_date,'2026-11-02')});
test('receipt URLs require HTTPS and contain no credentials',()=>{assert.equal(siteJobUrl('http://jobs.example','a'),null);assert.equal(siteJobUrl('https://user:pass@jobs.example','a'),null);assert.equal(siteJobUrl('https://jobs.example','abc'),'https://jobs.example/#job=abc')});

test('the website feed exposes an import immediately and hides it after archiving',async()=>{const f=fixture();await f.call({update_id:1,message});const feed=createJobsHandler({database:()=>f.db});const request=async()=>{const res={setHeader(){},status(n){this.code=n;return this},json(v){this.body=v}};await feed({method:'GET',query:{}},res);return res.body};assert.equal((await request()).jobs.length,1);await f.call({update_id:2,callback_query:{id:'cb',from:{id:101},data:`archive:${f.db.rows[0].id}`,message:{chat:{id:101}}}});assert.equal((await request()).jobs.length,0)});

test('a failed Telegram receipt does not undo an already published import',async()=>{const db=fakeDb();const handler=createTelegramHandler({database:()=>db,allowedAdmin:()=>true,send:async()=>{throw new Error('CHAT_NOT_FOUND')},env:{TELEGRAM_WEBHOOK_SECRET:'secret'}});const res={setHeader(){},status(n){this.code=n;return this},json(){}};await handler({method:'POST',headers:{'x-telegram-bot-api-secret-token':'secret'},body:{update_id:1,message}},res);assert.equal(res.code,200);assert.equal(db.rows[0].status,'published')});

test('taxi transport offered by employer does not classify a warehouse shift as delivery',()=>{const j=parseMessage('Срочно!! Сегодня в ночь!\nОтправим на такси\nУл. Тестовая, 300\nБлижайшее до 08:00 (-1ч обеда)\nТребуется: 1 человека\nОплата: 300 руб/час\nСклад бытовой химии, работа включает погрузочно-разгрузочные работы, перемещение товара по складу, управление рохлей и стрейчивание паллет.');assert.equal(j.category,'Склад');assert.equal(j.title,'Работник склада');assert.equal(j.schedule,'Сегодня · до 08:00');assert.equal(j.pay_unit,'час')});

test('signed web sessions reject tampering and expiry',()=>{
 const env={TELEGRAM_WEBHOOK_SECRET:'server-secret'},u={id:'101',name:'Admin'},now=Date.now();
 const token=signSession(u,env,now);assert.deepEqual(verifySession(token,env,now),u);
 assert.equal(verifySession(token+'a',env,now),null);
 assert.equal(verifySession(token,{TELEGRAM_WEBHOOK_SECRET:'wrong'},now),null);
 assert.equal(verifySession(token,env,now+86401000),null);
});
test('web admin edits published jobs, archives/restores and denies employers',async()=>{
 const f=fixture();await f.call({update_id:1,message});const db=f.db,id=db.rows[0].id;
 const env={TELEGRAM_WEBHOOK_SECRET:'secret',TELEGRAM_ADMIN_IDS:'101'};
 const handler=createAdminHandler({database:()=>db,env});
 const call=async(body,user='101',method='POST')=>{const res={setHeader(){},status(n){this.code=n;return this},json(v){this.body=v}};await handler({method,headers:{authorization:'Bearer '+signSession({id:user,name:'Test'},env)},body},res);return res};
 assert.equal((await call({action:'edit',id,fields:{title:'Changed',summary:'Contact @employer',pay_unit:'час',pay_amount:400}})).code,200);
 assert.equal(db.rows[0].title,'Changed');assert.equal(db.rows[0].status,'published');
 assert.equal((await call({action:'edit',id,fields:{pay_amount:-1}})).code,400);
 assert.equal((await call({action:'archive',id},'202')).code,403);
 assert.equal((await call({action:'archive',id})).code,200);assert.equal(db.rows[0].status,'archived');
 assert.equal((await call({action:'restore',id})).code,200);assert.equal(db.rows[0].status,'published');
 assert.equal((await call({action:'reject',id})).code,409);
 assert.equal((await call({},'101','GET')).body.jobs.length,1);
});
test('employer moderation notifications include review buttons for administrator only',async()=>{
 const db=fakeDb(),sent=[];const h=createTelegramHandler({database:()=>db,allowedAdmin:()=>false,send:async(...args)=>sent.push(args),env:{TELEGRAM_WEBHOOK_SECRET:'secret',TELEGRAM_ADMIN_IDS:'999'}});
 const res={setHeader(){},status(n){this.code=n;return this},json(){}};
 await h({method:'POST',headers:{'x-telegram-bot-api-secret-token':'secret'},body:{update_id:1,message}},res);
 assert.equal(db.rows[0].status,'pending');assert.equal(sent.length,2);assert.equal(sent[1][0],'999');
 assert.match(sent[1][2].reply_markup.inline_keyboard[0][0].callback_data,/^approve:/);
 assert.deepEqual(sent[0][2].reply_markup.inline_keyboard,[]);
});

test('admin forwarding an employer pending vacancy publishes the existing row',async()=>{
 const f=fixture({allowed:false});await f.call({update_id:1,message});assert.equal(f.db.rows[0].status,'pending');
 const sent=[];const h=createTelegramHandler({database:()=>f.db,allowedAdmin:()=>true,send:async(...args)=>sent.push(args),env:{TELEGRAM_WEBHOOK_SECRET:'secret'}});
 const res={setHeader(){},status(n){this.code=n;return this},json(){}};
 await h({method:'POST',headers:{'x-telegram-bot-api-secret-token':'secret'},body:{update_id:2,message}},res);
 assert.equal(res.code,200);assert.equal(f.db.rows.length,1);assert.equal(f.db.rows[0].status,'published');assert.match(sent[0][1],/Опубликовано/);
});
