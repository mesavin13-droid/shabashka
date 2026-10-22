import {json,onlyMethod} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
import {demoJobs} from '../_lib/demo.js';
const fields='id,title,type,category,summary,district,city,pay_amount,pay_unit,schedule,work_date,workers_needed,payment_terms,source_name,source_url,created_at';
export function createJobsHandler({database=getDb}={}){return async function handler(req,res){
 if(!onlyMethod(req,res,'GET'))return;
 const id=req.query?.id;
 if(id!==undefined&&(typeof id!=='string'||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)))return json(res,400,{error:'Некорректный ID'});
 const db=database();
 if(!db)return json(res,200,{mode:'demo',jobs:id?demoJobs.filter(j=>j.id===id):demoJobs});
 try{
  let query=db.from('jobs').select(fields).eq('status','published');
  if(id)query=query.eq('id',id);else query=query.order('created_at',{ascending:false});
  const {data,error}=await query.limit(id?1:150);if(error)throw error;
  return json(res,200,{mode:'live',jobs:data});
 }catch{console.error('jobs feed failed');return json(res,503,{error:'Каталог временно недоступен'})}
}}
export default createJobsHandler();
