import {mkdir,readFile,writeFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
let html=await readFile('index.html','utf8');
const backend=process.env.PUBLIC_API_BASE||'https://boitfowyftzlmsocbejz.supabase.co/functions/v1/shabashka';
if(backend){const url=new URL(backend);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw new Error('Invalid backend URL');html=html.replace('<head>','<head>\n<meta name="api-base" content="'+url.href.replace(/\/$/,'')+'">')}
await writeFile('dist/index.html',html);
await cp('assets','dist/assets',{recursive:true});
console.log('Live frontend built. API requests use the configured backend.');
