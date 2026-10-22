import process from 'node:process';
import {json,onlyMethod} from '../_lib/http.js';
import {getDb} from '../_lib/db.js';
export default function handler(req,res){if(!onlyMethod(req,res,'GET'))return;return json(res,200,{mode:getDb()?'live':'demo',botUsername:process.env.TELEGRAM_BOT_USERNAME||'shabashkanskbot',botLogin:true,telegramClientId:process.env.TELEGRAM_CLIENT_ID||null});}
