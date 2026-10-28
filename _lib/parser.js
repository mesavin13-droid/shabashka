import {createHash} from 'node:crypto';
const categories=[
 ['Доставка',/курьер|доставк|водител|такси|экспедитор/i],
 ['Общепит',/повар|официант|бариста|пекарь|кондитер|су[- ]?шеф/i],
 ['Уборка',/уборщи|клинер|клининг|мойщик|посудомой|уборк/i],
 ['Стройка',/строит|стройк|монтаж|отделк|маляр|штукатур|электрик|бетон|сварщик|плиточник|сантехник/i],
 ['Мероприятия',/промоутер|мероприят|аниматор|хостес|регистрац.{0,12}гост/i],
 ['Торговля',/продав|мерчендайзер|торгов|кассир/i],
 ['Склад',/грузчик|разнорабоч|склад|кладовщик|упаков|комплектов|фасов|разгруз|погруз|стеллаж|полк|перенос|перестав|бумаг.{0,30}кабинет|кабинет.{0,30}бумаг/i]
];
const districts=['Центральный','Ленинский','Октябрьский','Кировский','Заельцовский','Калининский','Дзержинский','Железнодорожный','Первомайский','Советский'];
const normalize=input=>String(input||'').replace(/\u00a0/g,' ').replace(/[\u200b-\u200d]/g,'').replace(/\s+/g,' ').trim();
export function fingerprint(text){return createHash('sha256').update(normalize(text).toLowerCase().replace(/[^а-яёa-z0-9]/gi,'')).digest('hex')}
export function getForwardSource(message){
 const f=message.forward_origin;
 if(f?.type==='channel'&&f.chat){const username=f.chat.username||null;return {name:f.chat.title||username||'Telegram-канал',channel_username:username,source_key:`channel:${f.chat.id}:${f.message_id}`,source_url:username?`https://t.me/${username}/${f.message_id}`:null}}
 if(message.forward_from_chat?.type==='channel'){const c=message.forward_from_chat,username=c.username||null;return {name:c.title||username||'Telegram-канал',channel_username:username,source_key:`channel:${c.id}:${message.forward_from_message_id||message.message_id}`,source_url:username&&message.forward_from_message_id?`https://t.me/${username}/${message.forward_from_message_id}`:null}}
 if(f)return {name:'Источник скрыт',channel_username:null,source_key:`forward:${message.chat.id}:${message.message_id}`,source_url:null};
 return {name:'Добавлено администратором',channel_username:null,source_key:`manual:${message.chat.id}:${message.message_id}`,source_url:null};
}
export function splitVacancyBatch(input){
 const raw=String(input||'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').replace(/[\u200b-\u200d]/g,'').trim();
 if(!raw)return [];
 const lines=raw.split('\n');const starts=[];
 for(let i=0;i<lines.length;i++)if(/^\s*\d{1,2}[.)]\s+/.test(lines[i]))starts.push(i);
 if(starts.length<2)return [raw];
 const prefix=lines.slice(0,starts[0]).join('\n').trim();const parts=[];
 const stopLine=/^\s*(?:кто готов|кто заинтересован|для записи|запись по|пишите|пиши|напишите|контакт(?:ы)?\s*:|просьба\b|не звонить\b|звонить не\b|отправьте|чтобы записаться)\b/i;
 for(let n=0;n<starts.length;n++){const end=n+1<starts.length?starts[n+1]:lines.length;let body=lines.slice(starts[n],end);const stop=body.findIndex(line=>stopLine.test(line));if(stop>=0)body=body.slice(0,stop);const section=body.join('\n').trim();if(!section)continue;const combined=[prefix,section].filter(Boolean).join('\n\n');if(combined.length>=15&&combined.length<=4000)parts.push(combined)}
 return parts.length>=2?parts:[raw];
}
export function parseMessage(text,sentAt=new Date()){
 const raw=String(text||'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').replace(/[\u200b-\u200d]/g,'').trim().slice(0,4000),s=normalize(raw);
 const type=/(?:^|[\s,.:])(?:ищу|ищем себе|рассмотрю)\s+(?:работу|подработку|смены)|готов\s+(?:выйти|работать)|предлагаю\s+свои\s+услуги/i.test(s)?'candidate':'vacancy';
 const lines=raw.split('\n').map(x=>x.trim().replace(/^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}•▪▶✅‼!#—–-]+/gu,'')).filter(Boolean);
 const ancillary=/^(?:отправим|довез[её]м|доставим|развоз|проезд|такси|компенсац|корпоративн.{0,15}транспорт|бесплатн.{0,10}(?:такси|доставк))/i;
 const relevant=lines.filter(x=>!ancillary.test(x));
 const titleLine=relevant.find(x=>x.length>=8&&/^(?:выгруж|фасов|разгруз|разгруж|перелож|перестав|перенос|перенести|перемест|погруз|упаков|комплектов|работать|убрать|собир|достав|помогать|переносить)/i.test(x))||relevant.find(x=>x.length>=8&&categories.some(([,re])=>re.test(x))&&!/^(?:оплата|график|обязанности|условия|адрес|район|контакт)/i.test(x))||relevant.find(x=>x.length>=8)||s;
 const heading=titleLine.split(/[!?]|\.(?!\d)/)[0].trim();
 const category=categories.find(([,re])=>re.test(heading))?.[0]||categories.find(([,re])=>re.test(relevant.join(' ')))?.[0]||'Другое';
 const district=districts.find(d=>new RegExp(d.replace(/(?:ий|ый)$/,''),'i').test(s))||null;
 const number='(\\d{1,3}(?:[ \\u00a0.,]\\d{3})+|\\d{2,8})(?:[,.]\\d{1,2})?';
 const currency=new RegExp(number+'\\s*(?:₽|руб(?:лей|ля|ль|\\.)?|р(?=\\s|[.,;!?/]|$))','gi');
 const contextual=new RegExp('(?:оплата|ставка|зарплата|зп|платим)\\s*[:—-]?\\s*(?:от\\s*)?'+number,'i');
 const match=[...s.matchAll(currency)][0]||s.match(contextual)||s.match(new RegExp(number+'\\s*(?:на руки|за смену|за день)','i'));
 let payAmount=match?Number(match[1].replace(/\D/g,'')):null;
 if(payAmount!==null&&(payAmount<1||payAmount>20000000))payAmount=null;
 const nearPay=match?s.slice(Math.max(0,match.index-20),match.index+match[0].length+35):s;
 const payUnit=/(?:за|в|\/)\s*(?:час|ч(?=\s|$|[.,]))|почас/i.test(nearPay)?'час':/(?:за|в|\/)\s*(?:месяц|мес\b)|оклад/i.test(nearPay)?'месяц':/(?:за|в|\/)\s*(?:день|дн\b)/i.test(nearPay)?'день':'смена';
 const time=s.match(/(?:с\s*)?([01]?\d|2[0-3])(?:[:.]([0-5]\d))?\s*(?:до|[-–—])\s*([01]?\d|2[0-3])(?:[:.]([0-5]\d))?/i);
 // Require at least one time delimiter or explicit "с ... до ...", so salary ranges are not hours.
 const validTime=time&&(time[2]||time[4]||/^с\s/i.test(time[0]));
 const explicitDate=s.match(/\b(0?[1-9]|[12]\d|3[01])\.(0?[1-9]|1[0-2])(?:\.(\d{2,4}))?\b/);
 const datePart=/послезавтра/i.test(s)?'Послезавтра':/завтра/i.test(s)?'Завтра':/сегодня/i.test(s)?'Сегодня':explicitDate?String(explicitDate[1]).padStart(2,'0')+'.'+String(explicitDate[2]).padStart(2,'0'):/выходн/i.test(s)?'Выходные':'График уточняется';
 const until=s.match(/до\s*([01]?\d|2[0-3])[:.]([0-5]\d)/i);
 const startOnly=s.match(/(?:\bк|\bна|начало\s*[:—-]?|\bс)\s*([01]?\d|2[0-3])[:.]([0-5]\d)\b/i);
 const schedule=validTime?`${datePart} · ${time[1].padStart(2,'0')}:${time[2]||'00'}–${time[3].padStart(2,'0')}:${time[4]||'00'}`:startOnly?`${datePart} · к ${startOnly[1].padStart(2,'0')}:${startOnly[2]}`:until?`${datePart} · до ${until[1].padStart(2,'0')}:${until[2]}`:datePart;
 let work_date=null;
 const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Novosibirsk',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(sentAt),get=t=>p.find(x=>x.type===t).value;
 if(explicitDate){let year=explicitDate[3]?Number(explicitDate[3].length===2?'20'+explicitDate[3]:explicitDate[3]):Number(get('year'));const month=Number(explicitDate[2]),day=Number(explicitDate[1]);const target=new Date(Date.UTC(year,month-1,day,12));if(target.getUTCMonth()===month-1&&target.getUTCDate()===day){if(!explicitDate[3]&&target.toISOString().slice(0,10)<`${get('year')}-${get('month')}-${get('day')}`)year++;const d=new Date(Date.UTC(year,month-1,day,12));work_date=d.toISOString().slice(0,10)}}
 else if(['Сегодня','Завтра','Послезавтра'].includes(datePart)){const d=new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+['Сегодня','Завтра','Послезавтра'].indexOf(datePart));work_date=d.toISOString().slice(0,10)}
 const countPattern='(?:\d{1,2}|один|одна|одно|одного|одну|два|две|двух|три|тр[её]х|четыре|четыр[её]х|пять|пят[ьи]|шесть|шест[ьи]|семь|сем[ьи]|восемь|восьм[ьи]|девять|девят[ьи]|десять|десят[ьи])';
 const countWords={один:1,одна:1,одно:1,одного:1,одну:1,два:2,две:2,двух:2,три:3,'трёх':3,трех:3,четыре:4,'четырёх':4,четырех:4,пять:5,пяти:5,шесть:6,шести:6,семь:7,семи:7,восемь:8,восьми:8,девять:9,девяти:9,десять:10,десяти:10};
 const need=s.match(new RegExp('(?:нужн[ыоа]?|требу(?:ется|ются)|ищем)\\s*(?:ещ[её]\\s*)?('+countPattern+')\\s*(?:человек|чел\\b|грузчик|разнорабоч|курьер|упаковщик)','i'))||s.match(new RegExp('('+countPattern+')\\s*(?:человек|чел\\b)','i'));
 const needCount=need?(Number.isFinite(Number(need[1]))?Number(need[1]):countWords[need[1].toLowerCase()]??countWords[need[1].toLowerCase().replace('ё','е')]):null;
 const paymentTerms=/после\s+смен/i.test(s)?'После смены':/ежедневн/i.test(s)?'Ежедневная':/еженедел/i.test(s)?'Еженедельно':null;
 const inferred={'Склад':'Работник склада','Доставка':'Курьер / водитель','Стройка':'Работа на стройке','Уборка':'Уборка помещения','Общепит':'Работа в общепите','Мероприятия':'Работа на мероприятии','Торговля':'Работа в торговле'};
 const title=heading.length<=90?heading:inferred[category]||heading.slice(0,87).trimEnd()+'…';
 const flags=[];if(/(?:предоплат|взнос|оплат(?:ить|а)\s+доступ|переведите\s+денег|купите\s+доступ)/i.test(s))flags.push('Похоже на требование предоплаты');if(category==='Другое')flags.push('Категория требует уточнения');
 return {type,category,title,summary:raw,raw_text:raw,district,city:'Новосибирск',pay_amount:payAmount,pay_unit:payUnit,schedule,work_date,workers_needed:type==='candidate'?0:needCount?Math.min(99,needCount):1,payment_terms:paymentTerms,flags,sent_at:sentAt.toISOString()};
}
