import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdsHandler,validateAd,activeAd} from '../api/ads.js';
import {signSession} from '../_lib/auth.js';
const fields={enabled:true,title:'Работа рядом',body:'Вакансии Новосибирска',button_text:'Открыть',target_url:'https://t.me/shabashkanskbot',image_url:'',advertiser:'ШАБАШКА',erid:'',starts_at:null,ends_at:null};
function fixture(){
 let row={id:1,...fields,updated_at:'2026-10-21T00:00:00Z'};
 const db={from(){let change,filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},update(v){change=v;return q},single(){return q.then(r=>({...r,data:r.data[0]||null}))},then(resolve,reject){let found=filters.every(([k,v])=>row[k]===v);if(found&&change)row={...row,...change};return Promise.resolve({data:found?[row]:[],error:null}).then(resolve,reject)}};return q}};
 const env={TELEGRAM_ADMIN_IDS:'101',TELEGRAM_WEBHOOK_SECRET:'test-secret'},handler=createAdsHandler({database:()=>db,env});
 return {get row(){return row},set row(v){row=v},async call(method='GET',body,uid,query={}){const res={setHeader(){},status(v){this.code=v;return this},json(v){this.body=v}};await handler({method,query,body,headers:uid?{authorization:'Bearer '+signSession({id:uid,name:'Test'},env)}:{}},res);return res}};
}
test('only active, scheduled advertisements are shown publicly',async()=>{
 const f=fixture();assert.equal((await f.call()).body.ad.title,fields.title);
 f.row={...f.row,enabled:false};assert.equal((await f.call()).body.ad,null);
 f.row={...f.row,enabled:true,starts_at:'2999-01-01T00:00:00Z'};assert.equal((await f.call()).body.ad,null);
 f.row={...f.row,starts_at:null,ends_at:'2000-01-01T00:00:00Z'};assert.equal((await f.call()).body.ad,null);
});
test('employers and anonymous visitors cannot edit or read disabled ad settings',async()=>{
 const f=fixture();for(const uid of [undefined,'202']){
  assert.equal((await f.call('POST',{fields},uid)).code,403);
  assert.equal((await f.call('GET',null,uid,{manage:'1'})).code,403);
 }
});
test('administrator can save, preview disabled settings and detect concurrent edits',async()=>{
 const f=fixture();assert.equal((await f.call('POST',{fields:{...fields,enabled:false,title:'Рекламодатель'},updated_at:f.row.updated_at},'101')).code,200);
 assert.equal((await f.call('GET',null,'101',{manage:'1'})).body.ad.title,'Рекламодатель');
 assert.equal((await f.call()).body.ad,null);
 assert.equal((await f.call('POST',{fields,updated_at:'stale'},'101')).code,409);
});
test('unsafe links, invalid dates and oversized copy cannot be published',()=>{
 for(const target_url of ['javascript:alert(1)','http://example.com','https://user:password@example.com'])assert.throws(()=>validateAd({...fields,target_url}));
 assert.throws(()=>validateAd({...fields,image_url:'data:image/svg+xml,foo'}));
 assert.throws(()=>validateAd({...fields,ends_at:'not-a-date'}));
 assert.throws(()=>validateAd({...fields,title:'x'.repeat(101)}));
 assert.throws(()=>validateAd({...fields,starts_at:'2026-10-23',ends_at:'2026-10-22'}));
 assert.equal(validateAd(fields).image_url,'');
});
test('the campaign stops precisely at the scheduled end',()=>{
 const now=Date.now();assert.equal(activeAd({...fields,ends_at:new Date(now).toISOString()},now),false);
 assert.equal(activeAd({...fields,starts_at:new Date(now).toISOString()},now),true);
});
