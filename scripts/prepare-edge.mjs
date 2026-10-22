import {cp,mkdir} from 'node:fs/promises';
const target='supabase/functions/shabashka';
await mkdir(target,{recursive:true});
for(const dir of ['api','_lib'])await cp(dir,`${target}/${dir}`,{recursive:true});
console.log('Edge Function dependencies prepared. Deploy shabashka with verify_jwt=false; webhook authentication is checked by the handler.');
