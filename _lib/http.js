export function json(res,status,obj){res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');return res.status(status).json(obj);}
export function onlyMethod(req,res,method){if(req.method!==method){res.setHeader('Allow',method);json(res,405,{error:'Метод не поддерживается'});return false;}return true;}
