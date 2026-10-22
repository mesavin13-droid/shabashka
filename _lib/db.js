import process from 'node:process';
import {createClient} from '@supabase/supabase-js';
let db;
export function getDb(){
  const url=process.env.SUPABASE_URL; const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!db) db=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  return db;
}
export function isAllowedSource(username){
  if(!username)return false;
  const allowed=(process.env.ALLOWED_SOURCE_CHANNELS||'').split(',').map(x=>x.toLowerCase().trim().replace(/^@/,'')).filter(Boolean);
  return allowed.includes(username.toLowerCase());
}
