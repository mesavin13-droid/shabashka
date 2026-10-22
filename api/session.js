import {json,onlyMethod} from '../_lib/http.js';
import {getIdentity,isAdmin,signSession} from '../_lib/auth.js';
export default async function handler(req,res){
  if(!onlyMethod(req,res,'GET'))return;
  try{
    const user=await getIdentity(req);
    const token=user?signSession({id:user.id,name:user.name}):null;
    return json(res,200,{user:user?{id:user.id,name:user.name,admin:isAdmin(user.id)}:null,...(token?{token}:{})});
  }catch{return json(res,401,{error:'Авторизация не прошла'});}
}
