import {json,onlyMethod} from '../_lib/http.js';
import {getIdentity,isAdmin} from '../_lib/auth.js';
export default async function handler(req,res){
  if(!onlyMethod(req,res,'GET'))return;
  try{const user=await getIdentity(req);return json(res,200,{user:user?{id:user.id,name:user.name,admin:isAdmin(user.id)}:null});}
  catch{return json(res,401,{error:'Авторизация не прошла'});}
}
