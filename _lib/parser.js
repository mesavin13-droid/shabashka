import {createHash} from 'node:crypto';
const categories=[
 ['Доставка',/курьер|доставк|водител|такси|экспедитор/i],
 ['Общепит',/повар|официант|бариста|пекарь|кондитер|су[- ]?шеф/i],
 ['Уборка',/уборщи|клинер|клининг|мойщик|посудомой|уборк/i],
 ['Стройка',/строит|стройк|монтаж|отделк|маляр|штукатур|электрик|бетон|сварщик|плиточник|сантехник/i],
 ['Мероприятия',/промоутер|мероприят|аниматор|хостес|регистрац.{0,12}гост/i],
 ['Торговля',/продав|мерчендайзер|торгов|кассир/i],
 ['Склад',/грузчик|разнорабоч|склад|кладовщик|упаков|комплектов|фасов|разгруз|погруз/i]
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
export function parseMessage(text,sentAt=new Date()){
 const raw=String(text||'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ').replace(/[\u200b-\u200d]/g,'').trim().slice(0,4000),s=normalize(raw);
 const type=/(?:^|[\s,.:])(?:ищу|ищем себе|рассмотрю)\s+(?:работу|подработку|смены)|готов\s+(?:выйти|работать)|предлагаю\s+свои\s+услуги/i.test(s)?'candidate':'vacancy';
 const lines=raw.split('\n').map(x=>x.trim().replace(/^[\s\p{Emoji_Presentation}\p{Extended_Pictographic}•▪▶✅‼!#—–-]+/gu,'')).filter(Boolean);
 const ancillary=/^(?:отправим|довез[её]м|доставим|развоз|проезд|такси|компенсац|корпоративн.{0,15}транспорт|бесплатн.{0,10}(?:такси|доставк))/i;
 const relevant=lines.filter(x=>!ancillary.test(x));
 const titleLine=relevant.find(x=>x.length>=8&&categories.some(([,re])=>re.test(x))&&!/^(?:оплата|график|обязанности|условия|адрес|район|контакт)/i.test(x))||relevant.find(x=>x.length>=8)||s;
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
 const datePart=/послезавтра/i.test(s)?'Послезавтра':/завтра/i.test(s)?'Завтра':/сегодня/i.test(s)?'Сегодня':/выходн/i.test(s)?'Выходные':'График уточняется';
 const until=s.match(/до\s*([01]?\d|2[0-3])[:.]([0-5]\d)/i);
 const schedule=validTime?`${datePart} · ${time[1].padStart(2,'0')}:${time[2]||'00'}–${time[3].padStart(2,'0')}:${time[4]||'00'}`:until?`${datePart} · до ${until[1].padStart(2,'0')}:${until[2]}`:datePart;
 let work_date=null;
 if(['Сегодня','Завтра','Послезавтра'].includes(datePart)){
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Novosibirsk',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(sentAt),get=t=>p.find(x=>x.type===t).value;
  const d=new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+['Сегодня','Завтра','Послезавтра'].indexOf(datePart));work_date=d.toISOString().slice(0,10);
 }
 const need=s.match(/(?:нужн[ыоа]?|требу(?:ется|ются)|ищем)\s*(\d{1,2})\s*(?:человек|чел\b|грузчик|разнорабоч|курьер|упаковщик)/i)||s.match(/(\d{1,2})\s*(?:человек|чел\b)/i);
 const paymentTerms=/после\s+смен/i.test(s)?'После смены':/ежедневн/i.test(s)?'Ежедневная':/еженедел/i.test(s)?'Еженедельно':null;
 const inferred={'Склад':'Работник склада','Доставка':'Курьер / водитель','Стройка':'Работа на стройке','Уборка':'Уборка помещения','Общепит':'Работа в общепите','Мероприятия':'Работа на мероприятии','Торговля':'Работа в торговле'};
 const title=heading.length<=90?heading:inferred[category]||heading.slice(0,87).trimEnd()+'…';
 const flags=[];if(/(?:предоплат|взнос|оплат(?:ить|а)\s+доступ|переведите\s+денег|купите\s+доступ)/i.test(s))flags.push('Похоже на требование предоплаты');if(category==='Другое')flags.push('Категория требует уточнения');
 return {type,category,title,summary:raw,raw_text:raw,district,city:'Новосибирск',pay_amount:payAmount,pay_unit:payUnit,schedule,work_date,workers_needed:type==='candidate'?0:need?Math.min(99,Number(need[1])):1,payment_terms:paymentTerms,flags,sent_at:sentAt.toISOString()};
}
