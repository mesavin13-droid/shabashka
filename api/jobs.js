import process from 'node:process';
import {json,onlyMethod} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
import {demoJobs} from '../_lib/demo.js';
import {getIdentity,isAdmin} from '../_lib/auth.js';
const fields='id,title,type,status,category,summary,district,city,pay_amount,pay_unit,schedule,work_date,workers_needed,payment_terms,source_name,source_url,is_urgent,created_at,closed_at';
export function createJobsHandler({database=getDb,env=process.env}={}){return async function handler(req,res){
 if(!onlyMethod(req,res,'GET'))return;
 const id=req.query?.id;
 if(id!==undefined&&(typeof id!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)))return json(res,400,{error:'Некорректный ID'});
 const db=database();
 if(!db)return json(res,200,{mode:'demo',jobs:id?demoJobs.filter(j=>j.id===id):demoJobs});
 try{
  const {error:purgeError}=await db.rpc('shabashka_purge_expired_closed_jobs');
  if(purgeError)throw purgeError;
  const cutoff=new Date(Date.now()-3*60*60*1000).toISOString();
  let query=db.from('jobs').select(`${fields},imported_by,source_key`)
   .in('status',['published','closed'])
   .or(`status.eq.published,and(status.eq.closed,closed_at.gte.${cutoff})`);
  if(id)query=query.eq('id',id);else query=query.order('created_at',{ascending:false});
  const {data,error}=await query.limit(id?1:150);if(error)throw error;
  let viewer=null;try{viewer=await getIdentity(req,env)}catch{}
  const admin=Boolean(viewer?.id&&isAdmin(viewer.id,env));
  const jobs=(data||[]).map(({imported_by,source_key,...job})=>({
   ...job,
   can_close:admin||Boolean(viewer?.id&&String(imported_by||'')===String(viewer.id)&&String(source_key||'').startsWith('manual:'))
  }));
  const response={mode:'live',jobs};
  if(id&&req.query?.track==='1'&&data?.[0]?.type==='vacancy'&&data[0]?.status==='published'){
   const viewerKey=req.headers?.['x-viewer-key'];
   if(typeof viewerKey==='string'&&/^[A-Za-z0-9_-]{16,80}$/.test(viewerKey)){
    const {data:tracked,error:trackError}=await db.rpc('shabashka_record_job_view',{p_job_id:id,p_viewer_key:viewerKey});
    if(trackError)throw trackError;
    const row=Array.isArray(tracked)?tracked[0]:tracked;
    if(row)response.stats={views:Number(row.views)||0,unique_views:Number(row.unique_views)||0};
   }
  }
  return json(res,200,response);
 }catch{console.error('jobs feed failed');return json(res,503,{error:'Каталог временно недоступен'})}
}}
export default createJobsHandler();
