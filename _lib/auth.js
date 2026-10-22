import {Buffer} from 'node:buffer';
import process from 'node:process';
import {createHmac, timingSafeEqual} from 'node:crypto';
import {createRemoteJWKSet,jwtVerify} from 'jose';
const jwks=createRemoteJWKSet(new URL('https://oauth.telegram.org/.well-known/jwks.json'));
const adminIds=(env=process.env)=>new Set((env.TELEGRAM_ADMIN_IDS||'').split(',').map(s=>s.trim()).filter(Boolean));
export const isAdmin=(id,env=process.env)=>adminIds(env).has(String(id));
export function validateMiniApp(initData,token=process.env.TELEGRAM_BOT_TOKEN) {
  if(!initData||!token||initData.length>8192)return null;
  const p=new URLSearchParams(initData),hash=p.get('hash'),authDate=Number(p.get('auth_date'));
  if(!hash||!/^([a-f0-9]{64})$/i.test(hash)||!Number.isFinite(authDate)||Math.abs(Date.now()/1000-authDate)>3600)return null;
  const fields=[...p].filter(([k])=>k!=='hash').sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${k}=${v}`).join('\n');
  const secret=createHmac('sha256','WebAppData').update(token).digest();
  const check=createHmac('sha256',secret).update(fields).digest();
  if(!timingSafeEqual(check,Buffer.from(hash,'hex')))return null;
  try{return JSON.parse(p.get('user')||'null');}catch{return null;}
}
export async function getIdentity(req,env=process.env){
  const auth=String(req.headers.authorization||'');
  if(auth.startsWith('Bearer shb.'))return verifySession(auth.slice(7),env);
  if(auth.startsWith('Bearer ') && env.TELEGRAM_CLIENT_ID){
    const {payload}=await jwtVerify(auth.slice(7),jwks,{issuer:'https://oauth.telegram.org',audience:String(env.TELEGRAM_CLIENT_ID),algorithms:['RS256','ES256']});
    return {id:String(payload.id||payload.sub),name:payload.name||''};
  }
  const data=req.headers['x-telegram-init-data'];
  if(typeof data==='string'){
    const user=validateMiniApp(data,env.TELEGRAM_BOT_TOKEN);
    if(user?.id)return {id:String(user.id),name:user.first_name||''};
  }
  return null;
}
export async function requireAdmin(req,env=process.env){
  const user=await getIdentity(req,env);
  return user && isAdmin(user.id,env)?user:null;
}

export function signSession(user,env=process.env,now=Date.now()){
 if(!env.TELEGRAM_WEBHOOK_SECRET)throw new Error('Login not configured');
 const payload=Buffer.from(JSON.stringify({id:String(user.id),name:String(user.name||'').slice(0,100),exp:Math.floor(now/1000)+86400})).toString('base64url');
 return `shb.${payload}.${createHmac('sha256',env.TELEGRAM_WEBHOOK_SECRET).update('session:'+payload).digest('base64url')}`;
}
export function verifySession(token,env=process.env,now=Date.now()){
 if(!env.TELEGRAM_WEBHOOK_SECRET||token.length>2048)return null;
 const [prefix,payload,sig,...rest]=token.split('.');if(prefix!=='shb'||!payload||!sig||rest.length)return null;
 const expected=createHmac('sha256',env.TELEGRAM_WEBHOOK_SECRET).update('session:'+payload).digest();
 const actual=Buffer.from(sig,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;
 try{const u=JSON.parse(Buffer.from(payload,'base64url').toString());return /^\d{1,20}$/.test(u.id)&&u.exp>now/1000?{id:u.id,name:String(u.name||'')}:null}catch{return null}
}
