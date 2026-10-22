import test from 'node:test';import assert from 'node:assert/strict';
import {parseMessage,getForwardSource,fingerprint} from '../_lib/parser.js';
test('парсер вакансии',()=>{const r=parseMessage('Завтра нужны 3 грузчика. Ленинский район, 9:00-18:00. Оплата 3500 на руки после смены.');assert.equal(r.category,'Склад');assert.equal(r.pay_amount,3500);assert.equal(r.workers_needed,3);assert.equal(r.district,'Ленинский');assert.equal(r.payment_terms,'После смены');});
test('резюме отличаем от вакансии',()=>{const r=parseMessage('Ищу подработку курьером в Центральном районе. Оплата 4000 ₽.');assert.equal(r.type,'candidate');assert.equal(r.workers_needed,0);assert.equal(r.category,'Доставка');});
test('повтор игнорируется при отличиях пробелов и регистра',()=>assert.equal(fingerprint('ГРУЗЧИК 3500 ₽'),fingerprint('грузчик  3500₽')));
test('Telegram forward provenance',()=>{const f=getForwardSource({chat:{id:123},message_id:55,forward_origin:{type:'channel',chat:{id:-100123,username:'jobs_nsk',title:'Работа НСК'},message_id:87}});assert.equal(f.source_url,'https://t.me/jobs_nsk/87');});
test('признак предоплаты помечается',()=>assert.equal(parseMessage('Вакансия курьер. Для начала переведите денег на обучение').flags.length,1));
