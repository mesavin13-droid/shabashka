import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf-8');
test('название ШАБАШКА на веб-странице',()=>{const x=read('../index.html');assert.match(x,/ШАБАШКА/);assert.doesNotMatch(x,/ВЫХОД/);});
test('ссылка на бота доступна со страницы, включая мобильный экран',()=>{const x=read('../index.html');assert.match(x,/https:\/\/t\.me\/shabashkanskbot/);assert.match(x,/hero-bot-link/);});
test('бот и API конфигурированы на указанный username',()=>{assert.match(read('../api/config.js'),/shabashkanskbot/);assert.match(read('../.env.example'),/TELEGRAM_BOT_USERNAME=shabashkanskbot/);});

test('срочные объявления имеют отдельный флаг и визуальный приоритет',()=>{const app=read('../assets/app.js');const api=read('../api/admin.js');const css=read('../assets/styles.css');assert.match(app,/name="is_urgent"/);assert.match(app,/priority-urgent/);assert.match(app,/БЛИЖАЙШЕЕ/);assert.match(api,/update\.is_urgent=f\.is_urgent/);assert.match(css,/\.job-card\.priority-urgent/);});
