const PATHS={
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  refresh:'<path d="M21 12a9 9 0 1 1-2.64-6.36L21 8"/><path d="M21 3v5h-5"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bookmark:'<path d="M5 3.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v18l-7-5-7 5z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-8v.3"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  send:'<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>',
  briefcase:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>',
  'arrow-right':'<path d="M4 12h16m-7-7 7 7-7 7"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  sliders:'<path d="M4 7h16M4 17h16M9 4v6m6 4v6"/>',
  'map-pin':'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  heart:'<path d="M20.8 8.6a5.5 5.5 0 0 0-9-4 5.5 5.5 0 0 0-8.6 7.1L12 21l8.8-9.3a5.5 5.5 0 0 0 0-3.1z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  users:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 2a5 5 0 0 1 3 5v2"/>',
  wallet:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="M3 9h18m-5 6h2"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v5m10-5v5M3 10h18"/>',
  'external-link':'<path d="M13 5h6v6m0-6-9 9M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M5 21a7 7 0 0 1 14 0"/>'
};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${PATHS[name]||PATHS.info}</svg>`;
function paintIcons(root=document){root.querySelectorAll('[data-icon]').forEach(el=>{if(el.querySelector('svg'))return;if(el.tagName==='BUTTON')el.insertAdjacentHTML('afterbegin',icon(el.dataset.icon));else el.innerHTML=icon(el.dataset.icon);});}
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>n==null?'По договорённости':`${Number(n).toLocaleString('ru-RU')} ₽`;
const goodLink=u=>{try{let x=new URL(u);return x.protocol==='https:'&&['t.me','telegram.me'].includes(x.hostname)?x.href:null}catch{return null}};
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const fallbackJobs=[
 {id:'demo-01',title:'Грузчики на склад',type:'vacancy',category:'Склад',pay_amount:3500,pay_unit:'смена',district:'Ленинский',city:'Новосибирск',schedule:'Завтра · 09:00–18:00',workers_needed:3,payment_terms:'После смены',source_name:'Telegram-канал',summary:'Разгрузка и перенос коробок на склад.',created_at:'2026-10-18T08:00:00Z',demo:true},
 {id:'demo-02',title:'Упаковщики интернет-заказов',type:'vacancy',category:'Склад',pay_amount:2800,pay_unit:'смена',district:'Октябрьский',city:'Новосибирск',schedule:'Сегодня · 12:00–20:00',workers_needed:2,payment_terms:'Ежедневная',source_name:'Telegram-канал',summary:'Упаковка заказов на складе.',created_at:'2026-10-18T07:00:00Z',demo:true},
 {id:'demo-03',title:'Курьер с велосипедом',type:'vacancy',category:'Доставка',pay_amount:4200,pay_unit:'день',district:'Центральный',city:'Новосибирск',schedule:'Гибкий график',workers_needed:4,payment_terms:'Раз в неделю',source_name:'Прямая заявка',summary:'Доставка небольших посылок.',created_at:'2026-10-18T06:00:00Z',demo:true},
 {id:'demo-04',title:'Помощник на мероприятие',type:'vacancy',category:'Мероприятия',pay_amount:3200,pay_unit:'смена',district:'Заельцовский',city:'Новосибирск',schedule:'Выходные',workers_needed:5,payment_terms:'После смены',source_name:'Telegram-канал',summary:'Помощь в проведении мероприятия.',created_at:'2026-10-18T05:00:00Z',demo:true},
 {id:'demo-05',title:'Уборка офиса вечером',type:'vacancy',category:'Уборка',pay_amount:2200,pay_unit:'смена',district:'Кировский',city:'Новосибирск',schedule:'Пн–Пт · 18:00–22:00',workers_needed:1,payment_terms:'Еженедельно',source_name:'Telegram-канал',summary:'Поддерживающая уборка.',created_at:'2026-10-18T04:00:00Z',demo:true},
 {id:'demo-06',title:'Помощник на отделку',type:'vacancy',category:'Стройка',pay_amount:4500,pay_unit:'день',district:'Первомайский',city:'Новосибирск',schedule:'Завтра · 08:00–17:00',workers_needed:2,payment_terms:'По завершении',source_name:'Telegram-канал',summary:'Подготовка материалов.',created_at:'2026-10-18T03:00:00Z',demo:true},
 {id:'demo-07',title:'Ищу подработку грузчиком',type:'candidate',category:'Склад',pay_amount:3000,pay_unit:'день',district:'Ленинский',city:'Новосибирск',schedule:'Сегодня и завтра',workers_needed:0,source_name:'Telegram-канал',summary:'Есть опыт работы на складе.',created_at:'2026-10-18T02:00:00Z',demo:true}
];
const fallbackPending=[
{id:'demo-p1',title:'Нужны 2 разнорабочих',type:'vacancy',category:'Стройка',pay_amount:3000,district:'Ленинский',schedule:'Завтра · 9:00',workers_needed:2,source_name:'Подработка НСК',source_allowed:false,raw_text:'Завтра нужны 2 разнорабочих в Ленинском районе. 3000 рублей за смену. Писать в личку.',demo:true},
{id:'demo-p2',title:'Курьер на завтра',type:'vacancy',category:'Доставка',pay_amount:3500,district:'Центральный',schedule:'Завтра',workers_needed:1,source_name:'Канал с разрешением',source_allowed:true,raw_text:'Курьер на завтра центр Новосибирска оплата 3500 после смены',demo:true}
];
const state={mode:'demo',config:{botUsername:'shabashkanskbot'},jobs:[],profiles:[],myResume:null,myApplications:[],receivedApplications:[],receivedJobs:[],role:null,resumeWantCreate:false,pending:[],adminUsers:[],adminSection:'jobs',ad:null,adminFilter:'pending',date:'',minPay:'',sort:'new',drafts:readLocal('shabashka:drafts',[]).filter(x=>x&&typeof x==='object'&&typeof x.id==='string'),pendingLoaded:false,view:'jobs',type:'vacancy',category:'Все',query:'',district:'',favorites:new Set(readLocal('shabashka:favorites',[]).filter(x=>typeof x==='string')),token:readSessionToken(),initData:window.Telegram?.WebApp?.initData||'',user:null};
let toastTimer;
function toast(message){const el=$('#toast');el.textContent=message;el.classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.add('hidden'),3300)}
function getViewerKey(){try{let key=localStorage.getItem('shabashka:viewer-key');if(!key||!/^[A-Za-z0-9_-]{16,80}$/.test(key)){key=window.crypto?.randomUUID?.()||('v'+Date.now().toString(36)+Math.random().toString(36).slice(2));localStorage.setItem('shabashka:viewer-key',key)}return key}catch{return null}}
async function api(url,options={}){const headers={...options.headers};if(state.token)headers.Authorization=`Bearer ${state.token}`;if(state.initData)headers['x-telegram-init-data']=state.initData;if(url.startsWith('/api/jobs?id=')&&url.includes('track=1')){const key=getViewerKey();if(key)headers['x-viewer-key']=key;}const backend=document.querySelector('meta[name="api-base"]')?.content||'';const endpoint=backend&&url.startsWith('/api/')?backend+url.slice(4):url;const res=await fetch(endpoint,{...options,headers});let body=await res.json().catch(()=>({}));if(!res.ok)throw new Error(body.error||'Сервис временно недоступен');return body;}
function switchView(v){if(!['jobs','favorites','employer','profile','about','admin'].includes(v))v='jobs';if(v==='admin'&&state.mode==='live'&&!state.user?.admin){toast('Панель доступна только администратору');return;}if(v==='employer'&&state.role==='job_seeker'){toast('Размещение вакансий доступно работодателям');v='jobs';}state.view=v;$$('.view').forEach(n=>n.classList.toggle('hidden',n.id!==`view-${v}`));$$('[data-view]').forEach(n=>{const active=n.dataset.view===v;n.classList.toggle('active',active);if(n.closest('nav')){if(active)n.setAttribute('aria-current','page');else n.removeAttribute('aria-current')}});history.replaceState(null,'',`#${v}`);window.scrollTo({top:0,behavior:'instant'});if(v==='favorites')renderFavorites();if(v==='admin')loadAdmin();if(v==='employer'){renderDrafts();loadApplications('received')}if(v==='profile'){renderProfile();loadApplications('mine')}if(v==='jobs')renderJobs();}
function urgency(j){const text=`${j.title||''} ${j.summary||''} ${j.schedule||''} ${j.raw_text||''}`;return j.is_urgent===true||/срочн|сейчас|ближайш/i.test(text)?'urgent':''}
function urgencyBadge(j){if(!urgency(j))return '';if(/^\s*(срочно|ближайшее)(?:\s*[!！:—-]*)\s*$/i.test(String(j.title||'')))return '';return '<span class="priority-badge urgent">⚡ СРОЧНО</span>'}
function shownJobs(){const result=state.jobs.filter(j=>(state.type==='all'||j.type===state.type)&&(state.category==='Все'||j.category===state.category)&&(!state.district||j.district===state.district)&&(!state.minPay||(j.pay_amount!=null&&Number(j.pay_amount)>=Number(state.minPay)))&&matchesDate(j,state.date)&&(!state.query||`${j.title} ${j.category} ${j.district||''} ${j.summary||''}`.toLowerCase().includes(state.query.toLowerCase())));return result.sort((a,b)=>{const closedPriority=(a.status==='closed'?1:0)-(b.status==='closed'?1:0);if(closedPriority)return closedPriority;const priority=(urgency(a)?0:1)-(urgency(b)?0:1);if(priority)return priority;return state.sort==='pay'?(b.pay_amount??-1)-(a.pay_amount??-1):new Date(b.created_at||0)-new Date(a.created_at||0)});}
const catNames=['Все','Склад','Доставка','Стройка','Уборка','Мероприятия','Общепит','Торговля','Другое'];
function renderCategories(){let el=$('#category-strip');el.innerHTML=catNames.map(c=>`<button class="category-chip ${state.category===c?'active':''}" data-cat="${safe(c)}">${safe(c)}</button>`).join('');}
function sourceTag(j){return `<span class="source-tag ${j.type==='candidate'?'user-tag':''}">${icon(j.type==='candidate'?'user':'send')} ${safe(j.type==='candidate'?'Соискатель':j.source_name||'Telegram')}</span>`;}
function jobLocationLabel(j){
 const district=String(j?.district||'').trim();
 const raw=String(j?.summary||j?.raw_text||'').replace(/\r\n?/g,'\n').replace(/\u00a0/g,' ');
 const lines=raw.split('\n').map(x=>x.trim()).filter(Boolean);
 let line=lines.find(x=>/^\d{1,2}[.)]\s+/.test(x));
 if(line)line=line.replace(/^\d{1,2}[.)]\s+/,'');
 else line=lines.find(x=>/(?:\bул\.|\bулица\b|\bпроспект\b|\bпр-т\b|\bшоссе\b|\bплощадь\b|\bпл\.|\bнабережная\b|\bпереулок\b|\bпроезд\b|\bпос\.|\bп\.)/i.test(x)&&/\d/.test(x))||'';
 if(line){
  line=line.replace(/^(?:адрес|место|локация)\s*[:—-]\s*/i,'');
  const timeCut=line.search(/[,;]\s*(?:к|на)\s*\d{1,2}[:.]\d{2}\b/i);
  if(timeCut>=0)line=line.slice(0,timeCut);
  else line=line.split(/\b(?:требуется|требуются|нужен|нужна|нужно|нужны|ищем|выгружать|выгрузить|разгружать|разгрузить|переложить|переставить|переносить|перенести|оплата)\b/i)[0];
  line=line.replace(/[,;\s—–-]+$/,'').replace(/^[,;\s—–-]+/,'').trim();
  if(line.length>=3)return line;
 }
 if(j?.type==='candidate'&&district)return district;
 return 'Адрес не указан';
}
function jobCard(j){const favorite=state.favorites.has(String(j.id));const isCandidate=j.type==='candidate';const closed=j.status==='closed';const priority=closed?'':urgency(j);return `<article class="job-card ${closed?'is-closed':''} ${priority?'priority-'+priority:''}" data-job="${safe(j.id)}"><div class="job-top">${sourceTag(j)}<div class="job-top-actions">${closed?'<span class="closed-badge">✕ ЗАКРЫТА</span>':urgencyBadge(j)}<button class="bookmark-btn ${favorite?'active':''}" data-fav="${safe(j.id)}" aria-pressed="${favorite}" title="${favorite?'Убрать из избранного':'В избранное'}" aria-label="${favorite?'Убрать из избранного':'В избранное'}">${icon('bookmark')}</button></div></div><h3><button class="job-title-button" data-open="${safe(j.id)}">${safe(j.title)}</button></h3><div class="job-meta">${icon('map-pin')} Новосибирск · ${safe(jobLocationLabel(j))}</div><div class="price-row"><div class="price">${money(j.pay_amount)} ${j.pay_amount!=null?`<small> / ${safe(j.pay_unit||'смена')}</small>`:''}</div><span class="verified-dot">${closed?`${icon('x')} Закрыта`:j.demo?'Демо':`${icon('check')} Опубликовано`}</span></div><div class="line"></div><div class="job-details"><span>${icon('clock')} ${safe(j.schedule||'Время уточняется')}</span><span>${icon(isCandidate?'briefcase':'users')} ${isCandidate?'Ищу предложения':`Нужно ${Number(j.workers_needed)||1} чел.`}</span></div><div class="job-foot"><span class="job-date">${j.demo?'Демонстрационное объявление':`Размещено ${dateLabel(j.created_at)}`}</span><button class="job-open" data-open="${safe(j.id)}">Подробнее ${icon('arrow-right')}</button></div></article>`;}
function dateLabel(iso){if(!iso)return 'недавно';try{return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',timeZone:'Asia/Novosibirsk'}).format(new Date(iso))}catch{return 'недавно'}}
function emptyState(title,text){return `<div class="empty-state"><div class="empty-symbol">${icon('search')}</div><h3>${safe(title)}</h3><p>${safe(text)}</p></div>`}
function renderJobs(){
 const candidateMode=state.type==='candidate';
 const pageTitle=$('.page-heading h1'),pageCopy=$('.page-heading p'),pageEyebrow=$('.page-heading .eyebrow');
 if(pageTitle)pageTitle.innerHTML=candidateMode?'Исполнители рядом<span class="heading-dot">.</span>':'Работа под твой ритм<span class="heading-dot">.</span>';
 if(pageCopy)pageCopy.textContent=candidateMode?'Создай резюме и получай подходящие вакансии в Telegram.':'Разовая подработка, постоянная работа и люди для твоих задач.';
 if(pageEyebrow)pageEyebrow.textContent=candidateMode?'НОВОСИБИРСК / ИСПОЛНИТЕЛИ':'НОВОСИБИРСК / РАБОТА';
 $('#candidate-actions').classList.toggle('hidden',!candidateMode);
 $('#resume-edit').textContent=state.myResume?'Редактировать моё резюме':'Создать резюме';
 if(candidateMode){renderCandidates();renderCategories();renderFilterState();return;}
 let all=shownJobs();$('#cards-grid').innerHTML=all.length?all.map(jobCard).join(''):(state.feedUnavailable?emptyState('Не удалось загрузить объявления','Сервер временно недоступен. Нажми кнопку обновления рядом со счётчиком.'):state.jobs.length?emptyState('Ничего не найдено','Попробуй другой запрос, категорию или район.'):emptyState('Объявлений пока нет','Перешли вакансию Telegram-боту — после публикации она появится здесь.'));
 $('#results-label').textContent=`${all.length} ${plural(all.length,['объявление','объявления','объявлений'])}`;$('#jobs-counter').textContent=state.jobs.length;renderCategories();renderFilterState();
}
async function loadAccountRole(){if(!state.user||state.mode!=='live'){state.role=null;return null}if(state.user.admin){state.role='employer';updateRoleVisibility();return state.role}try{const r=await api('/api/role');state.role=r.role||null;updateRoleVisibility();return state.role}catch{return state.role}}
function updateRoleVisibility(){
 const admin=!!state.user?.admin;
 const seeker=!admin&&state.role==='job_seeker';
 $$('.tab[data-type="candidate"]').forEach(el=>{el.classList.toggle('hidden',state.role!=='employer');el.setAttribute('aria-hidden',String(state.role!=='employer'))});
 $$('[data-view="employer"]').forEach(el=>el.classList.toggle('hidden',state.role!=='employer'));
 $$('[data-create]').forEach(el=>{if(el.id!=='mobile-create-button')el.classList.toggle('hidden',seeker)});
 const mobile=$('#mobile-create-button');
 if(mobile){
  mobile.classList.toggle('resume-nav',seeker);
  if(seeker){mobile.removeAttribute('data-create');mobile.setAttribute('data-resume-action','');mobile.setAttribute('aria-label','Открыть своё резюме');mobile.innerHTML='<span data-icon="user"></span><small>Резюме</small>'}
  else{mobile.removeAttribute('data-resume-action');mobile.setAttribute('data-create','');mobile.setAttribute('aria-label','Создать объявление');mobile.innerHTML='<span data-icon="plus"></span><small>Создать</small>'}
  paintIcons(mobile);
 }
 if(state.role!=='employer'&&state.type==='candidate')state.type='vacancy';
}
function openRoleChooser(){$('#modal-content').innerHTML=`<span class="modal-tag">ШАБАШКА · ТВОЙ АККАУНТ</span><h2 id="modal-title">Что ты ищешь?</h2><p class="modal-description">Выбери роль. От неё зависит, какие разделы будут доступны. Позже роль можно изменить в профиле.</p><div class="role-choices"><button type="button" class="role-choice" data-role-choice="job_seeker"><span class="role-choice-icon">${icon('search')}</span><strong>Ищу работу</strong><small>Создать резюме, выбрать категории и получать вакансии в Telegram.</small></button><button type="button" class="role-choice" data-role-choice="employer"><span class="role-choice-icon">${icon('briefcase-business')}</span><strong>Я работодатель</strong><small>Размещать вакансии и просматривать резюме исполнителей.</small></button></div>`;$ ('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal()}
async function saveAccountRole(role){try{const r=await api('/api/role',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role})});state.role=r.role;updateRoleVisibility();await loadCandidates(true);closeModal();if(role==='job_seeker'){state.resumeWantCreate=true;state.type='vacancy';switchView('jobs');openResumeForm()}else{state.type='candidate';switchView('jobs');renderJobs();toast('Открыт доступ к резюме исполнителей')}}catch(e){toast(e.message||'Не удалось сохранить роль')}}
async function loadCandidates(silent=true){
 if(state.mode!=='live')return;
 try{const r=await api('/api/candidates');state.profiles=Array.isArray(r.profiles)?r.profiles:[];state.myResume=r.mine||null;if(state.type==='candidate')renderJobs();}
 catch(e){if(!silent)toast('Не удалось загрузить резюме. Попробуй обновить список.');}
}

const applicationStatusNames={new:'Новый',viewed:'Просмотрен',suitable:'Подходит',rejected:'Отклонён',hired:'Нанят',withdrawn:'Отозван'};
function applicationStatusBadge(status){return `<span class="application-status status-${safe(status)}">${safe(applicationStatusNames[status]||status||'Неизвестно')}</span>`;}
function renderMyApplications(){
 const el=$('#my-applications');if(!el)return;
 const items=state.myApplications||[];
 el.innerHTML=items.length?items.map(a=>{const j=a.job||{},original=goodLink(j.source_url);return `<article class="draft-card"><div class="draft-status"><span class="draft-label">Мой отклик</span>${applicationStatusBadge(a.status)}</div><h3>${safe(j.title||'Вакансия')}</h3><p>${safe(jobLocationLabel(j))} · ${money(j.pay_amount)}${j.pay_unit?` / ${safe(j.pay_unit)}`:''}</p><div class="admin-actions">${original?`<a href="${safe(original)}" target="_blank" rel="noopener noreferrer">Открыть оригинал ↗</a>`:''}</div></article>`}).join(''):emptyState('Пока нет откликов','Открой вакансию и нажми «Откликнуться», чтобы отправить заявку работодателю.');
}

function renderEmployerStats(){
 const el=$('#employer-stats');if(!el)return;
 const items=state.receivedJobs||[];
 el.innerHTML=items.length?items.map(j=>`<article class="draft-card"><div class="draft-status"><span class="draft-label">${safe(j.status==='published'?'Опубликовано':j.status==='closed'?'Закрыта':j.status==='archived'?'Снято с сайта':'Статус объявления')}</span><span class="job-date">${safe(jobLocationLabel(j))}</span></div><h3>${safe(j.title||'Вакансия')}</h3><div class="job-stat-grid"><div class="job-stat"><strong>${Number(j.views)||0}</strong><span>Всего просмотров</span></div><div class="job-stat"><strong>${Number(j.unique_views)||0}</strong><span>Уникальных</span></div><div class="job-stat"><strong>${Number(j.applications_count)||0}</strong><span>Откликов</span></div></div></article>`).join(''):emptyState('Пока нет статистики','Она появится для вакансий, которые ты отправил боту со своего аккаунта работодателя.');
}

function renderReceivedApplications(){
 const el=$('#received-applications');if(!el)return;
 const items=state.receivedApplications||[];
 el.innerHTML=items.length?items.map(a=>{const j=a.job||{};return `<article class="draft-card"><div class="draft-status"><span class="draft-label">${safe(applicationStatusNames[a.status]||a.status)}</span><span class="job-date">${dateLabel(a.created_at)}</span></div><h3>${safe(j.title||'Вакансия')}</h3><p>Соискатель: <strong>${safe(a.applicant_name||'Соискатель')}</strong></p><p class="form-note">Telegram ID: ${safe(a.applicant_telegram_id)}</p><div class="admin-actions">${a.status==='new'?`<button data-application-status="viewed" data-application-id="${safe(a.id)}">Отметить просмотренным</button>`:''}<button data-application-status="suitable" data-application-id="${safe(a.id)}">Подходит</button><button data-application-status="rejected" data-application-id="${safe(a.id)}">Отказать</button><button data-application-status="hired" data-application-id="${safe(a.id)}">Нанят</button></div></article>`}).join(''):emptyState('Пока нет откликов','Когда соискатель откликнется на твою вакансию, заявка появится здесь.');
}
async function loadApplications(view='mine',silent=true){
 if(state.mode!=='live')return;
 const target=view==='received'?'#received-applications':'#my-applications',el=$(target);
 if(!state.user){if(el)el.innerHTML=emptyState('Войди через Telegram','После входа здесь появятся твои отклики.');return}
 try{
  const r=await api('/api/applications?view='+encodeURIComponent(view));
  if(view==='received'){state.receivedApplications=Array.isArray(r.applications)?r.applications:[];state.receivedJobs=Array.isArray(r.jobs)?r.jobs:[];renderReceivedApplications();renderEmployerStats()}
  else{state.myApplications=Array.isArray(r.applications)?r.applications:[];renderMyApplications()}
 }catch(e){
  if(el)el.innerHTML=emptyState('Не удалось загрузить отклики','Нажми «Обновить», чтобы попробовать ещё раз.');
  if(!silent)toast(e.message||'Не удалось загрузить отклики');
 }
}
async function changeApplicationStatus(applicationId,status,button){
 button.disabled=true;
 try{
  await api('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'status',application_id:applicationId,status})});
  await loadApplications('received',true);toast('Статус отклика обновлён');
 }catch(e){button.disabled=false;toast(e.message||'Не удалось изменить статус')}
}

function resumeCard(p,mine=false){
 const cats=(p.categories||[]).map(x=>`<span class="resume-tag">${safe(x)}</span>`).join('');
 const areas=(p.districts||[]).length?(p.districts||[]).join(', '):'Все районы';
 const pay=p.desired_pay==null?'Оплата по договорённости':`От ${money(p.desired_pay)} / ${safe(p.pay_unit||'смена')}`;
 return `<article class="job-card resume-card"><div class="job-top"><span class="source-tag user-tag">${icon('user')} Исполнитель</span><span class="resume-contact-note">${mine?(p.is_public?'Твоё резюме · опубликовано':'Твоё резюме · скрыто'):'Резюме'}</span></div><h3>${safe(p.title)}</h3><div class="job-meta">${icon('map-pin')} Новосибирск · ${safe(areas)}</div><div class="resume-categories">${cats}</div><div class="price-row"><div class="price">${safe(pay)}</div><span class="verified-dot">${icon('check')} ${mine?'Мой профиль':'Резюме'}</span></div>${p.experience?`<p class="resume-bio">${safe(p.experience)}</p>`:''}${p.about?`<p class="resume-bio">${safe(p.about.length>170?p.about.slice(0,170)+'…':p.about)}</p>`:''}<div class="job-foot"><span class="job-date">Обновлено ${dateLabel(p.updated_at||p.created_at)}</span><button class="job-open" data-resume-open="${safe(p.id)}">${mine?'Просмотреть и изменить':'Подробнее'} ${icon('arrow-right')}</button></div></article>`;
}
function renderCandidates(){
 const all=[...state.profiles];
 if(state.myResume&&!all.some(p=>p.id===state.myResume.id))all.unshift(state.myResume);
 const profiles=all.filter(p=>(p.is_public||p.id===state.myResume?.id)&&
 (state.category==='Все'||(p.categories||[]).includes('Все')||(p.categories||[]).includes(state.category))&&
 (!state.district||!(p.districts||[]).length||(p.districts||[]).includes(state.district))&&
 (!state.minPay||p.desired_pay==null||Number(p.desired_pay)>=Number(state.minPay))&&
 (!state.query||`${p.display_name} ${p.title} ${(p.categories||[]).join(' ')} ${(p.districts||[]).join(' ')} ${p.experience||''} ${p.about||''}`.toLowerCase().includes(state.query.toLowerCase())));
 const legacy=state.jobs.filter(j=>j.type==='candidate'&&(!state.query||`${j.title} ${j.category} ${j.district||''} ${j.summary||''}`.toLowerCase().includes(state.query.toLowerCase()))&&(!state.district||j.district===state.district)&&(!state.minPay||j.pay_amount==null||Number(j.pay_amount)>=Number(state.minPay))&&(state.category==='Все'||j.category===state.category));
 profiles.sort((a,b)=>state.sort==='pay'?(b.desired_pay??-1)-(a.desired_pay??-1):new Date(b.updated_at||b.created_at||0)-new Date(a.updated_at||a.created_at||0));
 const cards=[...profiles.map(p=>resumeCard(p,p.id===state.myResume?.id)),...legacy.map(jobCard)];
 $('#cards-grid').innerHTML=cards.length?cards.join(''):emptyState('Пока нет резюме','Создай своё резюме и выбери категории работы. Когда появится подходящая вакансия, бот пришлёт уведомление в Telegram.');
 $('#results-label').textContent=`${cards.length} ${plural(cards.length,['исполнитель','исполнителя','исполнителей'])}`;
 $('#jobs-counter').textContent=state.jobs.length;
}
function openResumeForm(){
 if(state.mode!=='live'){toast('Создание резюме доступно на рабочем сайте');return}
 if(!state.user){state.resumeWantCreate=true;startLogin();toast('Войди через Telegram — после входа вернёшься к резюме.');return}
 const p=state.myResume||{},cats=['Все',...catNames.slice(1)],areas=[...$('#district-filter').options].map(o=>o.value).filter(Boolean);
 const opts=(list,v)=>list.map(x=>`<option value="${safe(x)}" ${x===v?'selected':''}>${safe(x)}</option>`).join('');
 const catChecks=cats.map((x,i)=>`<label class="resume-option"><input type="checkbox" name="categories" value="${safe(x)}" ${(p.categories||[]).includes(x)?'checked':''}><span>${safe(x==='Все'?'Все категории':x)}</span></label>`).join('');
 const districtChecks=areas.map(x=>`<label class="resume-option"><input type="checkbox" name="districts" value="${safe(x)}" ${(p.districts||[]).includes(x)?'checked':''}><span>${safe(x)}</span></label>`).join('');
 $('#modal-content').innerHTML=`<span class="modal-tag">ИСПОЛНИТЕЛИ / РЕЗЮМЕ</span><h2 id="modal-title">${p.id?'Моё резюме':'Создать резюме'}</h2><p class="modal-description">Укажи, какую работу ищешь. Когда появится подходящая вакансия выбранной категории, ШАБАШКА пришлёт сообщение в Telegram.</p>${p.is_public===false?`<p class="resume-private-note">Резюме скрыто из общего списка. Его видишь только ты, но уведомления могут приходить по выбранным категориям.</p>`:''}<form id="resume-form" class="resume-fields"><label>Имя<input name="display_name" required minlength="2" maxlength="80" value="${safe(p.display_name||state.user.name||'')}" placeholder="Как к тебе обращаться"></label><label>Кем хочешь работать<input name="title" required minlength="3" maxlength="100" value="${safe(p.title||'')}" placeholder="Например, грузчик, разнорабочий, курьер"></label><fieldset class="resume-group"><legend>Категории вакансий для уведомлений</legend><div class="resume-options">${catChecks}</div><p class="form-note">Можно выбрать несколько категорий. «Все категории» включает уведомления по любым вакансиям.</p></fieldset><fieldset class="resume-group"><legend>Где готов работать</legend><div class="resume-options">${districtChecks}</div><p class="form-note">Можно не выбирать район — тогда подходит весь Новосибирск.</p></fieldset><div class="form-row"><label>Желаемая оплата, ₽<input type="number" name="desired_pay" min="0" max="10000000" step="100" value="${safe(p.desired_pay??'')}" placeholder="Необязательно"></label><label>За период<select name="pay_unit">${opts(['час','смена','день','месяц','договорная'],p.pay_unit||'смена')}</select></label></div><label>График<input name="schedule" maxlength="120" value="${safe(p.schedule||'')}" placeholder="Например, день, ночь, любые смены"></label><label>Опыт работы<input name="experience" maxlength="120" value="${safe(p.experience||'')}" placeholder="Например, 2 года на складе"></label><label>О себе<textarea name="about" maxlength="1200" placeholder="Навыки, права, документы, что умеешь делать">${safe(p.about||'')}</textarea></label><label>Контакт для работодателей<input name="contact" maxlength="120" value="${safe(p.contact||'')}" placeholder="@username в Telegram или телефон"></label><label class="resume-switch"><input type="checkbox" name="is_public" ${p.is_public!==false?'checked':''}><span><strong>Показывать резюме в разделе «Исполнители»</strong><small>Контакт будет виден всем, кто откроет твоё резюме. Выключи, если хочешь получать только уведомления.</small></span></label><label class="resume-switch"><input type="checkbox" name="notify_telegram" ${p.notify_telegram!==false?'checked':''}><span><strong>Получать новые вакансии в Telegram</strong><small>Чтобы уведомления доходили, нужно открыть бота @${safe(state.config.botUsername||'shabashkanskbot')} и нажать «Запустить».</small></span></label><div class="resume-form-actions"><button type="submit" class="primary">${p.id?'Сохранить изменения':'Опубликовать резюме'}</button>${p.id?'<button type="button" class="text-button" data-resume-delete>Удалить резюме</button>':''}</div></form>`;
 $('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal();
}
function openResumeProfile(id){
 const p=[...state.profiles,...(state.myResume?[state.myResume]:[])].find(x=>String(x.id)===String(id));if(!p)return;
 const mine=state.myResume?.id===p.id;
 const areas=(p.districts||[]).length?p.districts.join(', '):'Все районы Новосибирска';
 const link=goodLink(p.contact)||(/^@[a-zA-Z0-9_]{5,32}$/.test(p.contact||'')?`https://t.me/${p.contact.slice(1)}`:null);
 const phone=String(p.contact||'').replace(/[^+\d]/g,'');
 const contactHtml=p.contact?(link?`<a href="${safe(link)}" target="_blank" rel="noopener noreferrer">Написать в Telegram ↗</a>`:(/^\+?\d{7,15}$/.test(phone)?`<a href="tel:${safe(phone)}">Позвонить: ${safe(p.contact)}</a>`:`<span>${safe(p.contact)}</span>`)):'Контакт не указан';
 $('#modal-content').innerHTML=`<span class="modal-tag">ИСПОЛНИТЕЛЬ · ${safe((p.categories||[]).join(' / '))}</span><h2 id="modal-title">${safe(p.title)}</h2><p class="modal-description">${safe(p.display_name)} · ${safe(areas)}</p><div class="resume-categories">${(p.categories||[]).map(x=>`<span class="resume-tag">${safe(x)}</span>`).join('')}</div><div class="modal-grid"><div class="modal-tile"><small>ЖЕЛАЕМАЯ ОПЛАТА</small>${p.desired_pay==null?'По договорённости':safe(money(p.desired_pay)+' / '+(p.pay_unit||'смена'))}</div><div class="modal-tile"><small>ГРАФИК</small>${safe(p.schedule||'Обсуждается')}</div><div class="modal-tile"><small>ОПЫТ</small>${safe(p.experience||'Не указан')}</div><div class="modal-tile"><small>КОНТАКТ</small>${contactHtml}</div></div><div class="modal-description">${safe(p.about||'Дополнительная информация не указана.')}</div><div class="modal-actions">${mine?'<button class="primary" data-resume-action>Редактировать резюме</button>':''}<button class="secondary" data-close="modal">Закрыть</button></div>`;
 $('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal();
}
function plural(n,variants){n=Math.abs(n)%100;let m=n%10;return n>10&&n<20?variants[2]:m>1&&m<5?variants[1]:m===1?variants[0]:variants[2]}
function renderFavorites(){const jobs=state.jobs.filter(j=>state.favorites.has(String(j.id)));$('#favorites-grid').innerHTML=jobs.length?jobs.map(jobCard).join(''):emptyState('Пока ничего не сохранено','Нажимай значок закладки на интересных объявлениях, чтобы вернуться к ним позже.');}
// Candidate resume UI is rendered beside vacancy listings.
function findJob(id){return [...state.jobs,...state.pending].find(j=>String(j.id)===String(id));}
function openJob(id){let j=findJob(id);if(!j)return;let link=goodLink(j.source_url);$('#modal-content').innerHTML=`<span class="modal-tag">${safe(j.type==='candidate'?'Соискатель':'Предложение работы')} · ${safe(j.category)}</span><h2 id="modal-title">${safe(j.title)}</h2><div class="modal-pay">${money(j.pay_amount)} ${j.pay_amount!=null?`<small>/ ${safe(j.pay_unit||'смена')}</small>`:''}</div><div class="modal-grid"><div class="modal-tile"><small>АДРЕС</small>${safe(jobLocationLabel(j))}</div><div class="modal-tile"><small>ВРЕМЯ</small>${safe(j.schedule||'Уточняется')}</div><div class="modal-tile"><small>НУЖНО ЛЮДЕЙ</small>${j.type==='candidate'?'—':safe(j.workers_needed||1)}</div><div class="modal-tile"><small>КОГДА ВЫПЛАТА</small>${safe(j.payment_terms||'В объявлении не указано')}</div></div><div class="modal-description">${safe(j.summary||'Описание пока не указано')}</div>${j.status==='closed'?`<div class="closed-vacancy-notice">Эта вакансия закрыта. Новые отклики не принимаются. Объявление удалится автоматически через 3 часа после закрытия.</div>`:''}<div class="modal-actions">${state.user?.admin?`<button data-admin-action="edit" data-id="${safe(j.id)}">Редактировать</button>`:''}${j.status!=='closed'&&j.type==='vacancy'&&j.can_close?`<button class="secondary" type="button" data-close-vacancy="${safe(j.id)}">✕ Закрыть вакансию</button>`:''}${j.type==='vacancy'&&j.status!=='closed'&&!j.demo&&state.mode==='live'&&j.source_name==='Добавлено администратором'&&state.role!=='employer'&&!state.user?.admin?`<button class='primary application-button' type='button' data-apply-job='${safe(j.id)}'>${state.user?'Откликнуться':'Войти и откликнуться'}</button>`:''}${link?`<a href="${safe(link)}" target="_blank" rel="noopener noreferrer">Открыть оригинал ${icon('external-link')}</a>`:`<button disabled style="opacity:.5;cursor:default">Нет ссылки на источник</button>`}<button class="secondary" aria-pressed="${state.favorites.has(String(j.id))}" data-fav="${safe(j.id)}">${icon('bookmark')} ${state.favorites.has(String(j.id))?'Сохранено':'В избранное'}</button></div><p class="modal-disclaimer">${j.demo?'Это демонстрационная вакансия — не реальное предложение работы.':'Проверьте актуальность объявления и условия оплаты напрямую у источника. Площадка не подтверждает личность работодателя.'}</p>`;$('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal();if(state.mode==='live'&&j.type==='vacancy'&&j.status==='published'&&!j.demo)trackJobView(j.id);}
async function closeVacancy(jobId,button){
 if(state.mode!=='live'){toast('Закрытие вакансий доступно на рабочем сайте');return}
 if(!confirm('Закрыть вакансию? Она будет помечена как закрытая и удалится автоматически через 3 часа.'))return;
 const original=button.textContent;button.disabled=true;button.textContent='Закрываем…';
 try{
  const r=await api('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'close',job_id:jobId})});
  await reloadJobs(true);
  if(findJob(jobId))openJob(jobId);
  if(state.role==='employer')await loadApplications('received',true);
  toast(r.alreadyClosed?'Вакансия уже закрыта':'Вакансия закрыта. Через 3 часа она удалится');
 }catch(e){button.disabled=false;button.textContent=original;toast(e.message||'Не удалось закрыть вакансию')}
}

async function trackJobView(id){if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(String(id)))return;try{await api('/api/jobs?id='+encodeURIComponent(id)+'&track=1')}catch{/* View tracking must never block opening a vacancy. */}}

function closeModal(){loginAttempt++;if(location.hash.startsWith('#job='))history.replaceState(null,'','#jobs');$('#job-modal').classList.add('hidden');document.body.style.overflow='';if(lastFocus?.isConnected)lastFocus.focus();}

async function submitApplication(jobId,button){
 if(state.mode!=='live'){toast('Отклики доступны на рабочем сайте');return}
 if(!state.user){toast('Сначала войди через Telegram');await startLogin();return}
 if(!state.role){openRoleChooser();return}
 if(state.role!=='job_seeker'){toast('Откликаться могут только соискатели');return}
 const original=button.textContent;button.disabled=true;button.textContent='Отправляем…';
 try{
  const r=await api('/api/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'apply',job_id:jobId})});
  if(r.alreadyApplied){button.textContent='Уже откликался';toast('Ты уже откликался на эту вакансию')}
  else{button.textContent='Отклик отправлен';toast('Отклик сохранён. Можешь также открыть оригинал объявления.')}
  await loadApplications('mine',true);
 }catch(e){button.disabled=false;button.textContent=original;toast(e.message||'Не удалось отправить отклик')}
}

function toggleFav(id){if(state.favorites.has(id)){state.favorites.delete(id);toast('Убрано из избранного')}else{state.favorites.add(id);toast('Сохранено в избранное')}saveLocal('shabashka:favorites',[...state.favorites]);renderJobs();if(state.view==='favorites')renderFavorites();}
const statusNames={pending:'На проверке',published:'Опубликовано',closed:'Закрыта · удалится через 3 ч',archived:'Снято с сайта',rejected:'Отклонено'};
function renderAdmin(){
 $('#admin-alert').textContent=state.mode==='demo'?'Демонстрационный режим: изменения остаются в этой вкладке.':'Твои пересылки публикуются сразу. Объявления работодателей ждут твоего решения.';
 $('#pending-count').textContent=state.pending.filter(j=>j.status==='pending').length;
 $('#published-count').textContent=state.pending.filter(j=>j.status==='published').length;
 $('#sources-count').textContent=new Set(state.pending.map(j=>j.source_name)).size;
 $('#admin-filters').innerHTML=Object.entries(statusNames).map(([k,v])=>`<button class="category-chip ${state.adminFilter===k?'active':''}" data-admin-filter="${k}">${v} · ${state.pending.filter(j=>j.status===k).length}</button>`).join('');
 const jobs=state.pending.filter(j=>j.status===state.adminFilter);
 $('#admin-list').innerHTML=jobs.length?jobs.map(j=>`<article class="admin-card ${j.status==='closed'?'is-closed ':''}${urgency(j)?'priority-'+urgency(j):''}"><div class="admin-card-head"><span class="source-tag">${icon('send')} ${safe(j.source_name||'Telegram')}</span><div class="admin-card-flags">${urgencyBadge(j)}<span class="flag ${j.status==='published'?'ok':''}">${statusNames[j.status]}</span></div></div><h3>${safe(j.title)}</h3><p>${safe(j.summary||j.raw_text||'')}</p><div class="job-details"><span>${icon('wallet')} ${money(j.pay_amount)} / ${safe(j.pay_unit||'смена')}</span><span>${icon('map-pin')} ${safe(jobLocationLabel(j))}</span></div><div class="admin-actions priority-admin-actions"><button class="priority-toggle" data-admin-action="toggle-urgent" data-id="${safe(j.id)}">⚡ Срочность: ${j.is_urgent===true?"ВКЛ":"ВЫКЛ"}</button>${j.status==='pending'?`<button class="primary" data-admin-action="approve" data-id="${safe(j.id)}">Опубликовать</button>`:''}<button data-admin-action="edit" data-id="${safe(j.id)}">Редактировать</button>${j.status==='pending'?`<button data-admin-action="reject" data-id="${safe(j.id)}">Отклонить</button>`:j.status==='published'?`<button data-admin-action="archive" data-id="${safe(j.id)}">Снять с сайта</button>${j.type==='vacancy'?`<button data-admin-action="close" data-id="${safe(j.id)}">Закрыть вакансию</button>`:''}`:j.status==='archived'?`<button class="primary" data-admin-action="restore" data-id="${safe(j.id)}">Вернуть на сайт</button>`:''}</div></article>`).join(''):emptyState('Здесь пока пусто','Выбери другой статус или обнови список.');
}
function setAdminSection(section){
 state.adminSection=section==='users'?'users':'jobs';
 $$('[data-admin-section]').forEach(el=>{const active=el.dataset.adminSection===state.adminSection;el.classList.toggle('active',active);el.setAttribute('aria-pressed',String(active))});
 ['#admin-filters','#admin-list','[data-refresh-admin]','.ad-settings'].forEach(sel=>$(sel)?.classList.toggle('hidden',state.adminSection!=='jobs'));
 $('#admin-users-panel')?.classList.toggle('hidden',state.adminSection!=='users');
 if(state.adminSection==='users')renderAdminUsers();
}
function renderAdminUsers(){
 const root=$('#admin-users-list');if(!root)return;
 const users=state.adminUsers||[];
 const usersTab=$('[data-admin-section="users"]');if(usersTab)usersTab.textContent=`Пользователи и резюме (${users.length})`;
 root.innerHTML=users.length?users.map(u=>{
  const roleName=u.role==='employer'?'Работодатель':u.role==='job_seeker'?'Ищет работу':'Роль не выбрана';
  const resume=u.resume;
  return `<article class="admin-card admin-user-card">
   <div class="admin-card-head"><span class="source-tag">${icon('user')} ${safe(u.name||'Пользователь Telegram')}</span><span class="flag ${u.is_blocked?'':'ok'}">${u.is_blocked?'Заблокирован':roleName}</span></div>
   <p class="admin-user-id">Telegram ID: <strong>${safe(u.telegram_id)}</strong> · ${safe(roleName)}</p>
   ${resume?`<h3>${safe(resume.title||'Резюме')}</h3><p>Категории: ${safe((resume.categories||[]).join(', ')||'Не выбраны')}<br>Районы: ${safe((resume.districts||[]).join(', ')||'Весь город')}<br>Оплата: ${resume.desired_pay==null?'Не указана':money(resume.desired_pay)+' / '+safe(resume.pay_unit||'смена')}<br>Контакт: ${safe(resume.contact||'Не указан')}</p>`:'<p>Резюме не создано.</p>'}
   ${u.is_blocked?`<p class="admin-user-reason">Причина блокировки: ${safe(u.block_reason||'Не указана')}</p>`:''}
   <div class="admin-actions">
    <button data-user-action="delete_resume" data-user-id="${safe(u.telegram_id)}" ${resume?'':'disabled'}>Удалить резюме</button>
    ${u.is_blocked?`<button class="primary" data-user-action="unblock_user" data-user-id="${safe(u.telegram_id)}">Разблокировать</button>`:`<button data-user-action="block_user" data-user-id="${safe(u.telegram_id)}">Заблокировать</button>`}
   </div>
  </article>`
 }).join(''):emptyState(state.mode==='demo'?'Данные доступны на рабочем сайте':'Пользователей пока нет',state.mode==='demo'?'В демоверсии управление пользователями отключено.':'Здесь появятся пользователи, выбравшие роль или создавшие резюме.');
}
async function performAdminUser(action,telegramId){
 if(state.mode==='demo'){toast('Управление пользователями доступно на рабочем сайте');return}
 const isDelete=action==='delete_resume';
 const isBlock=action==='block_user';
 const question=isDelete?'Удалить резюме этого пользователя? Его настройки уведомлений тоже будут удалены.':isBlock?'Заблокировать пользователя? Он не сможет пользоваться ботом и редактировать резюме.':'Разблокировать пользователя?';
 if(!confirm(question))return;
 try{
  await api('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,telegram_id:String(telegramId),reason:isBlock?'Нарушение правил сервиса':''})});
  toast(isDelete?'Резюме удалено':isBlock?'Пользователь заблокирован':'Пользователь разблокирован');
  await loadAdmin();
  if(state.adminSection==='users')setAdminSection('users');
 }catch(e){toast(e.message||'Не удалось выполнить действие')}
}
async function loadAdmin(){if(state.mode==='demo'){if(!state.pendingLoaded){state.pending=[...structuredClone(fallbackPending).map(j=>({...j,status:'pending'})),...state.jobs];state.pendingLoaded=true;}state.adminUsers=[];renderAdmin();renderAdminUsers();setAdminSection(state.adminSection);return;}loadAdSettings();try{const r=await api('/api/admin');state.pending=r.jobs||[];state.adminUsers=r.users||[];renderAdmin();renderAdminUsers();setAdminSection(state.adminSection);}catch(e){$('#admin-list').innerHTML=emptyState('Не удалось открыть объявления',e.message);$('#admin-users-list').innerHTML=emptyState('Не удалось открыть пользователей',e.message);}}
async function editPending(id){
 if(state.mode==='live'){try{const r=await api('/api/admin');state.pending=r.jobs}catch(e){toast(e.message);return}}
 const j=state.pending.find(j=>j.id===id)||findJob(id);if(!j)return;
 $('#modal-content').innerHTML=`<span class="modal-tag">РЕДАКТИРОВАНИЕ</span><h2 id="modal-title">Изменить объявление</h2><form id="edit-form" data-id="${safe(id)}" data-updated="${safe(j.updated_at||'')}" class="editor-fields"><label>Название<input name="title" maxlength="90" required value="${safe(j.title)}"></label><label>Категория<select name="category">${catNames.slice(1).map(c=>`<option ${j.category===c?'selected':''}>${safe(c)}</option>`).join('')}</select></label><label>Сумма оплаты (₽)<input type="number" min="0" max="99999999" step="1" name="pay_amount" value="${j.pay_amount??''}"></label><label>Оплата за<select name="pay_unit">${['час','смена','день','месяц','задача'].map(c=>`<option ${j.pay_unit===c?'selected':''}>${c}</option>`).join('')}</select></label><label>Район<input name="district" maxlength="60" value="${safe(j.district||'')}"></label><label>График<input name="schedule" maxlength="120" value="${safe(j.schedule||'')}"></label><label>Дата работы<input type="date" name="work_date" value="${safe(j.work_date||'')}"></label><label>Сколько людей нужно<input name="workers_needed" type="number" min="0" max="99" step="1" value="${Number(j.workers_needed)||1}"></label><label>Когда и как выплата<input name="payment_terms" maxlength="200" value="${safe(j.payment_terms||'')}"></label><label>Описание и контакты<textarea name="summary" maxlength="4000" rows="9">${safe(j.summary||j.raw_text||'')}</textarea></label><label class="urgent-toggle"><input type="checkbox" name="is_urgent" value="true" ${j.is_urgent===true?'checked':''}><span><strong>⚡ Срочно</strong><small>Выделить объявление в каталоге и поднять выше обычных</small></span></label><button class="editor-save" type="submit">Сохранить изменения</button></form>`;
 $('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal();
}
async function performAdmin(action,id,fields,updated_at){
  if(action==='toggle-urgent'){
   const current=state.pending.find(j=>String(j.id)===String(id));if(!current)return false;const next=!current.is_urgent;
   if(state.mode==='demo'){current.is_urgent=next;state.jobs=state.pending.filter(j=>j.status==='published');renderJobs();renderAdmin();toast(next?'Объявление отмечено как срочное':'Метка срочности снята');return true}
   try{await api('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'edit',id,fields:{is_urgent:next},updated_at:current.updated_at})});toast(next?'Объявление отмечено как срочное':'Метка срочности снята');await loadAdmin();await reloadJobs(true);return true}catch(e){toast(e.message);return false}
  }
 if(action==='close'&&!confirm('Закрыть вакансию? Она удалится автоматически через 3 часа.'))return false;
 if(state.mode==='demo'){
  const j=state.pending.find(j=>j.id===id);if(!j)return false;
  if(action==='edit')Object.assign(j,fields);else{j.status={approve:'published',reject:'rejected',archive:'archived',restore:'published',close:'closed'}[action];if(action==='close')j.closed_at=new Date().toISOString();if(action==='restore')j.closed_at=null}
  state.jobs=state.pending.filter(j=>j.status==='published'||(j.status==='closed'&&j.closed_at&&Date.now()-Date.parse(j.closed_at)<10800000));renderJobs();renderAdmin();toast(action==='close'?'Вакансия закрыта':'Изменения сохранены в демо');return true;
 }
 try{await api('/api/admin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id,fields,updated_at})});toast(action==='close'?'Вакансия закрыта':'Изменения сохранены');await loadAdmin();await reloadJobs(true);return true}catch(e){toast(e.message);return false}
}
function setRefreshState(busy,visible=true){const button=$('#refresh-jobs');button.disabled=busy;button.classList.toggle('is-loading',busy&&visible);button.setAttribute('aria-busy',String(busy));button.setAttribute('aria-label',busy&&visible?'Обновляем объявления':'Обновить объявления');button.querySelector('.refresh-label').textContent=busy&&visible?'Обновляем…':'Обновить'}
let refreshing=false;
async function reloadJobs(silent=false){if(refreshing)return;refreshing=true;setRefreshState(true,!silent);try{if(state.mode==='demo'){renderJobs();if(!silent)toast('Это демокаталог. Реальный импорт появится после подключения бота.');return}const r=await api('/api/jobs');if(r.mode!=='live')throw new Error('База пока не подключена. Показаны последние загруженные объявления.');state.jobs=r.jobs;state.feedUnavailable=false;$('#mode-tag').textContent='Каталог активен';if(state.type==='candidate')await loadCandidates(true);else renderJobs();if(state.view==='favorites')renderFavorites();$('#feed-status').textContent='Обновлено';if(!silent)toast('Каталог обновлён')}catch(e){$('#feed-status').textContent='Нет связи';if(!silent)toast(e.message)}finally{refreshing=false;setRefreshState(false)}}
async function routeFromHash(){const hash=location.hash.slice(1);if(hash.startsWith('job=')){const id=hash.slice(4);if(!/^[a-zA-Z0-9-]{1,64}$/.test(id))return;switchView('jobs');if(!findJob(id)&&state.mode==='live'){try{const r=await api('/api/jobs?id='+encodeURIComponent(id));if(r.jobs?.[0])state.jobs.push(r.jobs[0])}catch{toast('Не удалось загрузить вакансию');return}}if(findJob(id)){openJob(id);history.replaceState(null,'','#job='+id)}else toast('Вакансия снята с публикации или больше недоступна');return}const v=hash||'jobs';if(['jobs','favorites','employer','profile','about','admin'].includes(v))switchView(v)}

async function session(){try{let result=await api('/api/session');if(result.token){state.token=result.token;try{localStorage.setItem('shabashka:session',result.token);sessionStorage.removeItem('shabashka:session')}catch{}}else if(state.token&&!result.user){state.token=null;try{localStorage.removeItem('shabashka:session');sessionStorage.removeItem('shabashka:session')}catch{}}state.user=result.user;updateUserUI()}catch{state.user=null;updateUserUI()}}
function updateUserUI(){let u=state.user;$('#profile-logout').classList.toggle('hidden',!u);$$('.admin-link').forEach(el=>el.classList.toggle('show',state.mode==='demo'||!!u?.admin));$('#login-button').classList.toggle('hidden',!!u);$('#avatar-button').classList.toggle('hidden',!u);if(u){$('#avatar-button').textContent=(u.name||'Т').charAt(0).toUpperCase();$('#avatar-button').title=u.admin?'Администратор':'Вошли через Telegram'}else if(state.mode==='live'&&state.view==='admin')switchView('jobs');}
function readSessionToken(){try{const token=localStorage.getItem('shabashka:session')||sessionStorage.getItem('shabashka:session');if(token)localStorage.setItem('shabashka:session',token);sessionStorage.removeItem('shabashka:session');return token}catch{return null}}
let loginAttempt=0;
async function startLogin(){
 if(state.initData){await session();if(state.user){await loadAccountRole();if(!state.role){openRoleChooser();return}if(state.resumeWantCreate&&state.role==='job_seeker'){state.resumeWantCreate=false;await loadCandidates(true);state.type='vacancy';switchView('jobs');openResumeForm()}else switchView(state.user.admin?'admin':'profile');return}}
 if(state.mode==='demo'){toast('Вход доступен на рабочем сайте');return}
 const attempt=++loginAttempt;
 try{
  const c=await api('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start'})});
  $('#modal-content').innerHTML=`<span class="modal-tag">ВХОД ЧЕРЕЗ TELEGRAM</span><h2 id="modal-title">Подтверди свой аккаунт</h2><p class="modal-description">Открой бота, нажми «Запустить» и подтверди вход. Код в боте должен совпадать:</p><div class="login-code">${safe(c.code)}</div><div class="modal-actions"><a href="${safe(c.botUrl)}" target="_blank" rel="noopener noreferrer">Открыть Telegram ↗</a></div><p id="login-progress" class="modal-disclaimer" role="status">Ждём подтверждение. Вернись сюда после входа.</p>`;
  $('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal();
  const end=Date.now()+c.expiresIn*1000;
  const poll=async()=>{
   if(attempt!==loginAttempt||$('#job-modal').classList.contains('hidden'))return;
   if(Date.now()>end){$('#login-progress').textContent='Время истекло. Закрой окно и нажми «Войти» ещё раз.';return}
   try{const r=await api('/api/auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'poll',id:c.id,secret:c.secret})});
    if(r.token){state.token=r.token;try{localStorage.setItem('shabashka:session',r.token);sessionStorage.removeItem('shabashka:session')}catch{}await session();if(state.user){await loadAccountRole();if(!state.role){closeModal();toast('Выбери тип аккаунта');openRoleChooser();return}await loadCandidates(true);closeModal();toast('Вход подтверждён');if(state.resumeWantCreate&&state.role==='job_seeker'){state.resumeWantCreate=false;state.type='vacancy';renderJobs();openResumeForm()}else switchView(state.user.admin?'admin':'profile');return}}
   }catch{if($('#login-progress'))$('#login-progress').textContent='Проверяем подтверждение. Соединение временно недоступно.'}
   setTimeout(poll,2500);
  };setTimeout(poll,1500);
 }catch(e){toast(e.message)}
}

function readLocal(key,fallback){try{const v=JSON.parse(localStorage.getItem(key));return Array.isArray(v)?v:fallback}catch{return fallback}}
function saveLocal(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{toast('Браузер не разрешил сохранение. Изменения останутся до закрытия страницы.');return false}}
function matchesDate(j,filter){if(!filter)return true;if(j.work_date){const current=new Date();const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Novosibirsk',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(current);const part=t=>parts.find(p=>p.type===t).value;const day=new Date(`${part('year')}-${part('month')}-${part('day')}T12:00:00Z`);if(filter==='tomorrow')day.setUTCDate(day.getUTCDate()+1);return j.work_date.slice(0,10)===day.toISOString().slice(0,10)}return filter==='today'?/сегодня/i.test(j.schedule||''):/завтра/i.test(j.schedule||'')}
function renderFilterState(){const filters=[['district',state.district],['category',state.category!=='Все'?state.category:''],['date',state.date==='today'?'Сегодня':state.date==='tomorrow'?'Завтра':''],['minPay',state.minPay?`От ${money(state.minPay)}`:'']].filter(x=>x[1]);$('#filter-count').textContent=filters.length||'';$('#active-filters').innerHTML=filters.map(([key,value])=>`<button class="filter-pill" data-remove-filter="${key}" aria-label="Убрать фильтр ${safe(value)}">${safe(value)} ${icon('close')}</button>`).join('');$$('.tab').forEach(t=>{const active=state.type===t.dataset.type;t.classList.toggle('active',active);t.setAttribute('aria-pressed',String(active))})}
function resetFilters(){state.category='Все';state.district='';state.date='';state.minPay='';$('#district-filter').value='';$('#date-filter').value='';$('#pay-filter').value='';renderJobs()}
let filterReturnFocus;
function showFilters(open){$('#filter-panel').classList.toggle('open',open);$('#filter-backdrop').classList.toggle('hidden',!open);if(open){filterReturnFocus=document.activeElement;document.body.style.overflow='hidden';$('#filter-title').focus({preventScroll:true})}else{document.body.style.overflow='';filterReturnFocus?.focus()}}
let lastFocus;
function activateModal(){if(!$('#job-modal').contains(document.activeElement))lastFocus=document.activeElement;requestAnimationFrame(()=>{const card=$('#job-modal .modal-card');card.scrollTop=0;card.focus({preventScroll:true})})}
function renderProfile(){$('#profile-name').textContent=state.user?.name||'Войди через Telegram';$('#profile-note').textContent=state.user?.admin?'Администратор сервиса. Все разделы доступны без выбора роли.':state.user?'Аккаунт Telegram подтверждён.':'Для публикаций и откликов понадобится подтверждённый вход.';$('#profile-login').classList.toggle('hidden',!!state.user);$('#profile-role-label').textContent=state.user?.admin?'Тип аккаунта: Администратор':state.role==='employer'?'Тип аккаунта: Работодатель':state.role==='job_seeker'?'Тип аккаунта: Ищу работу':'Тип аккаунта не выбран';$('#profile-change-role').classList.toggle('hidden',!state.user||!!state.user.admin);$('#saved-count').textContent=state.jobs.filter(j=>state.favorites.has(String(j.id))).length;$('#draft-count').textContent=state.drafts.length}
function draftMessage(d){return ['ЗАЯВКА НА ВАКАНСИЮ','',`Название: ${d.title||''}`,`Формат: ${d.employment||d.type_label||'Разовая смена'}`,`Категория: ${d.category||'Склад'}`,`Район: ${d.district||'Не указан'}`,`Оплата: ${d.pay_amount??'По договорённости'} ₽ / ${d.pay_unit||'смена'}`,`Дата: ${d.work_date||'Не указана'}`,`График: ${d.schedule||'Уточняется'}`,`Количество людей: ${d.workers_needed??1}`,'',`Условия и задачи: ${d.summary||''}`,'','Отправлено с сайта ШАБАШКА'].join(String.fromCharCode(10))}
function sendDraftToBot(id){const d=state.drafts.find(x=>x.id===id);if(!d){toast('Черновик не найден');return}const text=draftMessage(d);const site=location.origin+location.pathname;const shareUrl='https://t.me/share/url?url='+encodeURIComponent(site)+'&text='+encodeURIComponent(text);window.location.href=shareUrl}
function renderDrafts(){$('#draft-list').innerHTML=state.drafts.length?state.drafts.map(d=>`<article class="draft-card"><div class="draft-status"><span class="draft-label">Черновик · только у тебя</span><span class="job-date">${dateLabel(d.updated_at)}</span></div><h3>${safe(d.title)}</h3><p>${safe(d.district||'Район не указан')} · ${money(d.pay_amount)} / ${safe(d.pay_unit||'смена')}</p><div class="admin-actions"><button class="primary" data-send-draft="${safe(d.id)}">Отправить в бота ↗</button><button data-preview-draft="${safe(d.id)}">Предпросмотр</button><button data-edit-draft="${safe(d.id)}">Продолжить редактирование</button><button data-delete-draft="${safe(d.id)}">Удалить</button></div></article>`).join(''):emptyState('Здесь будут твои объявления','Создай первый черновик. Он сохранится на этом устройстве, и ты сможешь вернуться к нему позже.')}
function openDraft(id){if(state.role==='job_seeker'){toast('Соискатель может управлять своим резюме, но не создавать вакансии');openResumeForm();return}const d=state.drafts.find(x=>x.id===id)||{};const opts=(list,v)=>list.map(x=>`<option value="${safe(x)}" ${x===v?'selected':''}>${safe(x)}</option>`).join('');$('#modal-content').innerHTML=`<span class="modal-tag">НОВОЕ ОБЪЯВЛЕНИЕ / ЧЕРНОВИК</span><h2 id="modal-title">Кого ищешь?</h2><form id="draft-form" data-id="${safe(d.id||'')}" class="editor-fields"><label>Заголовок<input name="title" required minlength="5" maxlength="90" placeholder="Например, грузчик на дневную смену" value="${safe(d.title||'')}"></label><div class="form-row"><label>Формат<select name="employment">${opts(['Разовая смена','Постоянная работа'],d.employment||'Разовая смена')}</select></label><label>Категория<select name="category">${opts(catNames.slice(1),d.category||'Склад')}</select></label></div><label>Район<select name="district" required><option value="">Выбери район</option>${opts([...$('#district-filter').options].map(x=>x.value).filter(Boolean),d.district)}</select></label><div class="form-row"><label>Оплата, ₽<input type="number" name="pay_amount" min="1" max="10000000" step="1" required placeholder="3 500" value="${safe(d.pay_amount??'')}"></label><label>За период<select name="pay_unit">${opts(['смена','час','день','месяц'],d.pay_unit||'смена')}</select></label></div><div class="form-row"><label>Дата<input type="date" name="work_date" value="${safe(d.work_date||'')}"></label><label>Количество людей<input type="number" min="1" max="10000" name="workers_needed" required value="${safe(d.workers_needed||1)}"></label></div><label>График<input name="schedule" maxlength="120" placeholder="09:00–18:00, перерыв на обед" value="${safe(d.schedule||'')}"></label><label>Условия и задачи<textarea name="summary" required minlength="20" maxlength="2000" placeholder="Что нужно делать, когда будет оплата, что взять с собой">${safe(d.summary||'')}</textarea></label><p class="form-note">Черновик сохраняется на этом устройстве. Для публикации отправь текст в @shabashkanskbot. После модерации он появится на сайте.</p><button type="submit" class="editor-save">Сохранить черновик</button></form>`;$('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal()}
function previewDraft(id){const d=state.drafts.find(x=>x.id===id);if(!d)return;$('#modal-content').innerHTML=`<span class="modal-tag">ПРЕДПРОСМОТР / ${safe(d.category||'Работа')}</span><h2 id="modal-title">${safe(d.title)}</h2><p class="draft-preview-label">Это личный черновик. Объявление ещё не опубликовано.</p><div class="modal-pay">${money(d.pay_amount)} <small>/ ${safe(d.pay_unit||'смена')}</small></div><div class="modal-grid"><div class="modal-tile"><small>РАЙОН</small>${safe(d.district||'Не указан')}</div><div class="modal-tile"><small>ФОРМАТ</small>${safe(d.employment||'Разовая смена')}</div><div class="modal-tile"><small>ДАТА И ВРЕМЯ</small>${safe(d.work_date?dateLabel(d.work_date+'T12:00:00+07:00'):'Дата уточняется')}${d.schedule?` · ${safe(d.schedule)}`:''}</div><div class="modal-tile"><small>НУЖНО ЛЮДЕЙ</small>${safe(d.workers_needed||1)}</div></div><div class="modal-description">${safe(d.summary||'Описание не заполнено')}</div><div class="modal-actions"><button class="primary" data-send-draft="${safe(d.id)}">Отправить в бота ↗</button><button data-edit-draft="${safe(d.id)}">Продолжить редактирование</button><button class="secondary" data-close="modal">Закрыть</button></div>`;$('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal()}
function openDeleteDraft(id){const d=state.drafts.find(x=>x.id===id);if(!d)return;$('#modal-content').innerHTML=`<span class="modal-tag">УДАЛЕНИЕ ЧЕРНОВИКА</span><h2 id="modal-title">Удалить объявление?</h2><p class="modal-description">«${safe(d.title)}» будет удалено с этого устройства.</p><div class="modal-actions"><button data-confirm-delete="${safe(id)}">Удалить черновик</button><button class="secondary" data-close="modal">Отмена</button></div>`;$('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal()}
function adUrl(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null}catch{return null}}
function adFormData(form){const data=Object.fromEntries(new FormData(form));data.enabled=form.elements.enabled.checked;for(const key of ['starts_at','ends_at'])data[key]=data[key]?new Date(data[key]).toISOString():null;return data}
function adDateInput(value){if(!value)return '';const d=new Date(value);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}
function adScheduleNotice(a){
 const fmt=value=>{try{return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(value))}catch{return value}};
 if(!a.enabled)return 'Реклама выключена — включи переключатель «Показывать баннер».';
 if(a.starts_at&&Date.parse(a.starts_at)>Date.now())return 'Реклама запланирована. Начало показа: '+fmt(a.starts_at)+'.';
 if(a.ends_at&&Date.parse(a.ends_at)<=Date.now())return 'Срок показа истёк: '+fmt(a.ends_at)+'. Измени дату окончания или оставь поле пустым для показа без срока.';
 return 'Реклама активна по расписанию. Администратор не увидит её при обычном входе — проверь «Предпросмотр» или открой сайт в приватном окне.';
}
async function loadAdSettings(){
 if(state.mode==='demo')return;
 try{const r=await api('/api/ads?manage=1');state.ad=r.ad;state.adStats=r.stats||{};renderAdSettings()}catch(err){$('#ad-settings-body').innerHTML=`<p>${safe(err.message)}</p>`}
}
function renderAdStats(){
 const root=$('#ad-stats');if(!root)return;
 const s=state.adStats||{},recent=s.last30Days||{},fmt=n=>Number(n||0).toLocaleString('ru-RU');
 const rate=(clicks,impressions)=>impressions?((Number(clicks||0)/Number(impressions))*100).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})+'%':'0%';
 root.innerHTML=`<div class="applications-head"><h3>Статистика рекламы</h3><button type="button" class="text-button" data-refresh-ad-stats>Обновить</button></div><div class="admin-overview ad-stats-overview"><div><span>Показы всего</span><strong>${fmt(s.impressions)}</strong></div><div><span>Клики всего</span><strong>${fmt(s.clicks)}</strong></div><div><span>CTR</span><strong>${rate(s.clicks,s.impressions)}</strong></div></div><p class="form-note">За 30 дней: ${fmt(recent.impressions)} показов · ${fmt(recent.clicks)} кликов · CTR ${rate(recent.clicks,recent.impressions)}.</p>`;
}
async function refreshAdStats(){
 try{const r=await api('/api/ads?manage=1');state.adStats=r.stats||{};renderAdStats();toast('Статистика рекламы обновлена')}catch(err){toast(err.message||'Не удалось обновить статистику')}
}
function renderAdSettings(){const a=state.ad;if(!a)return;
 $('#ad-settings-body').innerHTML=`<p class="form-note">Баннер показывается один раз за посещение. Здесь можно настроить размещение рекламодателя. Оплату и стоимость размещения вы согласуете отдельно.</p><p class="form-note" role="status">${adScheduleNotice(a)}</p><div id="ad-stats" class="ad-stats"></div><form id="ad-form" data-updated="${safe(a.updated_at)}" class="editor-fields"><label class="ad-enabled"><input type="checkbox" name="enabled" ${a.enabled?'checked':''}> Показывать баннер</label><label>Заголовок<input name="title" maxlength="100" required value="${safe(a.title)}"></label><label>Текст<textarea name="body" maxlength="500" required rows="3">${safe(a.body)}</textarea></label><label>Текст кнопки<input name="button_text" maxlength="40" required value="${safe(a.button_text)}"></label><label>Ссылка кнопки (https://)<input type="url" pattern="https://.*" name="target_url" maxlength="2000" required value="${safe(a.target_url)}"></label><div class="ad-image-field"><div><strong class="ad-image-heading">Фото рекламного баннера · 16:9</strong><p class="form-note">Выбери фото из галереи или сделай новое. Оно будет обрезано до 16:9.</p></div><label class="ad-file-picker"><input type="file" id="ad-image-file" accept="image/*"><span>Выбрать фото с телефона</span></label><p class="ad-image-status" id="ad-image-status" role="status">${a.image_url?"Фото уже загружено. Можно заменить его.":"Фото не выбрано."}</p><div id="ad-image-preview-wrap" class="ad-image-preview-wrap ${a.image_url?"":"hidden"}"><img id="ad-image-preview" class="ad-image-preview" src="${safe(a.image_url||"")}" alt="Предпросмотр рекламного фото"><button type="button" data-remove-ad-image class="text-button">Убрать фото</button></div><input type="hidden" name="image_url" value="${safe(a.image_url||"")}"></div><label>Рекламодатель<input name="advertiser" maxlength="120" required value="${safe(a.advertiser)}"></label><label>Идентификатор рекламы erid (если присвоен)<input name="erid" maxlength="150" value="${safe(a.erid)}"></label><div class="form-row"><label>Начало показа<input type="datetime-local" name="starts_at" value="${adDateInput(a.starts_at)}"></label><label>Окончание показа<input type="datetime-local" name="ends_at" value="${adDateInput(a.ends_at)}"></label></div><p class="form-note">Время указано для часового пояса этого устройства. Пустые даты — показ без ограничения срока.</p><div class="admin-actions"><button type="submit" class="primary">Сохранить баннер</button><button type="button" data-preview-ad>Предпросмотр</button></div></form>`;
 renderAdStats();
}
async function uploadAdPhoto(file){
 if(!file.type.startsWith("image/"))throw new Error("Выбери файл изображения.");
 if(file.size>15*1024*1024)throw new Error("Фото должно быть не больше 15 МБ.");
 const objectUrl=URL.createObjectURL(file);
 try{
  const img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error("Не удалось открыть это фото. Выбери JPG, PNG или другое обычное изображение."));image.src=objectUrl});
  const width=img.naturalWidth,height=img.naturalHeight;if(!width||!height)throw new Error("Не получилось прочитать размеры фото.");
  const ratio=16/9;let sx=0,sy=0,sw=width,sh=height;
  if(width/height>ratio){sw=height*ratio;sx=(width-sw)/2}else{sh=width/ratio;sy=(height-sh)/2}
  const canvas=document.createElement("canvas");canvas.width=1280;canvas.height=720;
  const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Не удалось подготовить фото на этом устройстве.");
  ctx.drawImage(img,sx,sy,sw,sh,0,0,1280,720);
  const toBlob=quality=>new Promise(resolve=>canvas.toBlob(resolve,"image/jpeg",quality));
  let blob=await toBlob(0.82);if(blob&&blob.size>1800000)blob=await toBlob(0.68);
  if(!blob||blob.size>1800000)throw new Error("Фото не удалось сжать до допустимого размера. Выбери другое изображение.");
  const dataUrl=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error("Не удалось прочитать фото."));reader.readAsDataURL(blob)});
  const base64=String(dataUrl).split(",")[1];
  const result=await api("/api/ads?upload=1",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({upload:{contentType:"image/jpeg",data:base64}})});
  if(!result.image_url)throw new Error("Сервер не вернул адрес загруженного фото.");return result.image_url;
 }finally{URL.revokeObjectURL(objectUrl)}
}
function adTrackingSession(){
 const valid=v=>typeof v==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(v);
 const create=()=>globalThis.crypto?.randomUUID?.()||'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)});
 try{const key='shabashka:ad-session',old=sessionStorage.getItem(key);if(valid(old))return old;const id=create();sessionStorage.setItem(key,id);return id}catch{return create()}
}
function trackAdEvent(event_type){
 const session_id=adTrackingSession();
 api('/api/ads?event=track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event_type,session_id})}).catch(()=>{});
}
function openEntryAd(a){
 const link=adUrl(a.target_url),image=adUrl(a.image_url);if(!link){toast('Проверь ссылку баннера: нужен адрес https://');return false}
 $('#modal-content').innerHTML=`<div class="entry-ad"><div class="entry-ad-label"><span>Реклама</span><span>ШАБАШКА / ПАРТНЁРЫ</span></div>${image?`<img class="entry-ad-image" src="${safe(image)}" alt="${safe(a.title)}" referrerpolicy="no-referrer">`:`<div class="entry-ad-art" aria-hidden="true"><span class="entry-ad-icon">${icon('briefcase')}</span><span class="entry-ad-orbit"></span><span class="entry-ad-mini">${icon('users')}</span><span class="entry-ad-location">Новосибирск</span></div>`}<h2 id="modal-title">${safe(a.title)}</h2><p class="entry-ad-body">${safe(a.body)}</p><a class="entry-ad-cta" href="${safe(link)}" target="_blank" rel="sponsored noopener noreferrer">${safe(a.button_text)} ${icon('arrow-right')}</a><button class="entry-ad-skip" data-close="modal">Продолжить к объявлениям</button><p class="entry-ad-legal">Рекламодатель: ${safe(a.advertiser)}${a.erid?` · erid: ${safe(a.erid)}`:''}</p></div>`;
 const img=$('.entry-ad-image');if(img)img.addEventListener('error',()=>img.remove(),{once:true});
 $('#job-modal').classList.remove('hidden');document.body.style.overflow='hidden';activateModal();if(!state.user?.admin)trackAdEvent('impression');return true;
}
async function showEntryAd(){
 if(state.mode!=='live'||!$('#job-modal').classList.contains('hidden'))return;
 try{
  const r=await api('/api/ads');if(!r.ad||!$('#job-modal').classList.contains('hidden'))return;
  openEntryAd(r.ad);
 }catch{/* Advertising availability must not prevent access to jobs. */}
}
async function init(){
 paintIcons();
 window.addEventListener('hashchange',routeFromHash);
 $$('[data-view]').forEach(el=>el.addEventListener('click',()=>switchView(el.dataset.view)));
 $$('.tab').forEach(el=>el.addEventListener('click',()=>{if(el.dataset.type==='candidate'&&state.role!=='employer'){toast('Раздел исполнителей доступен работодателям');return}state.type=el.dataset.type;renderJobs();if(state.type==='candidate')loadCandidates(true)}));
 $('#search-input').addEventListener('input',e=>{state.query=e.target.value;$('#search-clear').classList.toggle('hidden',!state.query);renderJobs()});
 $('#search-clear').addEventListener('click',()=>{$('#search-input').value='';state.query='';renderJobs();$('#search-input').focus();$('#search-clear').classList.add('hidden')});
 for(const [id,key] of [['district-filter','district'],['date-filter','date'],['pay-filter','minPay'],['sort-filter','sort']])$('#'+id).addEventListener(id==='pay-filter'?'input':'change',e=>{state[key]=e.target.value;renderJobs()});
 $('#reset-filters').addEventListener('click',resetFilters);$('#refresh-jobs').addEventListener('click',()=>reloadJobs());
 $('#hero-search').addEventListener('click',()=>{$('#search-input').focus();renderJobs()});
 $('#login-button').addEventListener('click',startLogin);$('#profile-login').addEventListener('click',startLogin);$('#avatar-button').addEventListener('click',()=>switchView('profile'));
 $('#tip-bot').addEventListener('click',()=>window.open(`https://t.me/${state.config.botUsername||'shabashkanskbot'}`,'_blank','noopener,noreferrer'));
 $('#refresh-received-applications').addEventListener('click',()=>loadApplications('received',false));
 $('#refresh-employer-stats').addEventListener('click',()=>loadApplications('received',false));
 $('#refresh-my-applications').addEventListener('click',()=>loadApplications('mine',false));
 window.matchMedia('(min-width:801px)').addEventListener('change',e=>{if(e.matches&&$('#filter-panel').classList.contains('open'))showFilters(false)});
 $('#open-filters').addEventListener('click',()=>showFilters(true));$('#close-filters').addEventListener('click',()=>showFilters(false));$('#apply-filters').addEventListener('click',()=>showFilters(false));$('#filter-backdrop').addEventListener('click',()=>showFilters(false));
 document.addEventListener("change",async e=>{
 const categoryChoice=e.target.closest('input[name="categories"]');if(categoryChoice){const form=categoryChoice.closest("#resume-form");if(form){const all=form.querySelector('input[name="categories"][value="Все"]');if(categoryChoice.value==="Все"&&categoryChoice.checked)form.querySelectorAll('input[name="categories"]:not([value="Все"])').forEach(x=>x.checked=false);else if(categoryChoice.checked&&all)all.checked=false;}return;}
 const input=e.target.closest("#ad-image-file");if(!input)return;
 const file=input.files?.[0];if(!file)return;
 const form=$("#ad-form");if(!form)return;
 const status=$("#ad-image-status"),picker=form.querySelector(".ad-file-picker"),save=form.querySelector("[type=submit]");
 input.disabled=true;if(picker)picker.classList.add("is-uploading");if(save)save.disabled=true;
 if(status)status.textContent="Подготавливаю и загружаю фото 16:9…";
 try{const url=await uploadAdPhoto(file);form.elements.image_url.value=url;const preview=$("#ad-image-preview"),wrap=$("#ad-image-preview-wrap");preview.src=url;wrap.classList.remove("hidden");if(status)status.textContent="Фото загружено. Нажми «Сохранить баннер», чтобы сохранить изменения.";}
 catch(err){if(status)status.textContent=err.message||"Не удалось загрузить фото.";toast(err.message||"Не удалось загрузить фото.");}
 finally{input.disabled=false;input.value="";if(picker)picker.classList.remove("is-uploading");if(save)save.disabled=false}
});
document.addEventListener('click',async e=>{
 if(e.target.closest('.entry-ad-cta')){if(!state.user?.admin)trackAdEvent('click');return}
 if(e.target.closest('[data-refresh-ad-stats]')){await refreshAdStats();return}
 if(e.target.closest('[data-copy-vacancy]')){const input=$('#vacancy-template');try{await navigator.clipboard.writeText(input.value);toast('Шаблон скопирован — заполни и отправь боту')}catch{input.focus();input.select();toast('Шаблон выделен. Скопируй его через меню браузера.')}return}
 const cat=e.target.closest('[data-cat]');if(cat){state.category=cat.dataset.cat;renderJobs();return}
 const remove=e.target.closest('[data-remove-filter]');if(remove){const key=remove.dataset.removeFilter;state[key]=key==='category'?'Все':'';if(key==='district')$('#district-filter').value='';if(key==='date')$('#date-filter').value='';if(key==='minPay')$('#pay-filter').value='';renderJobs();return}
 const fav=e.target.closest('[data-fav]');if(fav){toggleFav(fav.dataset.fav);if(!$('#job-modal').classList.contains('hidden')&&$('#job-modal [data-fav]')){const b=$('#job-modal [data-fav]');b.innerHTML=icon('bookmark')+(state.favorites.has(fav.dataset.fav)?' Сохранено':' В избранное');b.setAttribute('aria-pressed',String(state.favorites.has(fav.dataset.fav)))}return}
 const closeVacancyButton=e.target.closest('[data-close-vacancy]');if(closeVacancyButton){await closeVacancy(closeVacancyButton.dataset.closeVacancy,closeVacancyButton);return}
 const apply=e.target.closest('[data-apply-job]');if(apply){await submitApplication(apply.dataset.applyJob,apply);return}
 const open=e.target.closest('[data-open]');if(open){openJob(open.dataset.open);return}
 if(e.target.closest('[data-close]')){closeModal();return}
 const applicationStatus=e.target.closest('[data-application-status]');if(applicationStatus){await changeApplicationStatus(applicationStatus.dataset.applicationId,applicationStatus.dataset.applicationStatus,applicationStatus);return}
 const roleChoice=e.target.closest('[data-role-choice]');if(roleChoice){await saveAccountRole(roleChoice.dataset.roleChoice);return}
 if(e.target.closest('#profile-change-role')){openRoleChooser();return}
 if(e.target.closest('[data-resume-action]')){openResumeForm();return}
 const resumeOpen=e.target.closest('[data-resume-open]');if(resumeOpen){openResumeProfile(resumeOpen.dataset.resumeOpen);return}
 if(e.target.closest('[data-resume-delete]')){if(!confirm('Удалить резюме и отключить уведомления по нему?'))return;try{await api('/api/candidates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete'})});state.myResume=null;closeModal();await loadCandidates();renderJobs();toast('Резюме удалено')}catch(err){toast(err.message||'Не удалось удалить резюме')}return}
 if(e.target.closest('[data-create]')){openDraft();return}
 const sendDraft=e.target.closest('[data-send-draft]');if(sendDraft){sendDraftToBot(sendDraft.dataset.sendDraft);return}
  const preview=e.target.closest('[data-preview-draft]');if(preview){previewDraft(preview.dataset.previewDraft);return}
 const edit=e.target.closest('[data-edit-draft]');if(edit){openDraft(edit.dataset.editDraft);return}
 const del=e.target.closest('[data-delete-draft]');if(del){openDeleteDraft(del.dataset.deleteDraft);return}
 const confirm=e.target.closest('[data-confirm-delete]');if(confirm){state.drafts=state.drafts.filter(d=>d.id!==confirm.dataset.confirmDelete);saveLocal('shabashka:drafts',state.drafts);closeModal();renderDrafts();toast('Черновик удалён');return}
 if(e.target.closest('[data-preview-ad]')){const form=$('#ad-form');if(form?.reportValidity())openEntryAd(adFormData(form));return}
 if(e.target.closest('[data-remove-ad-image]')){const form=$('#ad-form');if(form){form.elements.image_url.value='';$('#ad-image-preview-wrap').classList.add('hidden');$('#ad-image-status').textContent='Фото убрано. Нажми «Сохранить баннер», чтобы применить изменение.'}return}
 const adminSection=e.target.closest('[data-admin-section]');if(adminSection){setAdminSection(adminSection.dataset.adminSection);if(adminSection.dataset.adminSection==='users'&&state.mode==='live')await loadAdmin();return}
 if(e.target.closest('[data-refresh-admin-users]')){await loadAdmin();toast('Список пользователей обновлён');return}
 const userAction=e.target.closest('[data-user-action]');if(userAction){await performAdminUser(userAction.dataset.userAction,userAction.dataset.userId);return}
 const filter=e.target.closest('[data-admin-filter]');if(filter){state.adminFilter=filter.dataset.adminFilter;renderAdmin();return}
 if(e.target.closest('[data-refresh-admin]')){await loadAdmin();return}
 if(e.target.closest('[data-logout]')){state.token=null;state.user=null;try{localStorage.removeItem('shabashka:session');sessionStorage.removeItem('shabashka:session')}catch{}updateUserUI();renderProfile();toast('Вы вышли');return}
 const act=e.target.closest('[data-admin-action]');if(act){if(act.dataset.adminAction==='edit')editPending(act.dataset.id);else await performAdmin(act.dataset.adminAction,act.dataset.id)}
 });
 document.addEventListener('submit',async e=>{
 if(e.target.id==='resume-form'){
  e.preventDefault();const form=e.target;form.elements.contact.required=form.elements.is_public.checked;if(!form.reportValidity())return;
  const values=Object.fromEntries(new FormData(form));values.categories=[...form.querySelectorAll('input[name="categories"]:checked')].map(x=>x.value);values.districts=[...form.querySelectorAll('input[name="districts"]:checked')].map(x=>x.value);values.is_public=form.elements.is_public.checked;values.notify_telegram=form.elements.notify_telegram.checked;values.desired_pay=values.desired_pay===''?null:Number(values.desired_pay);
  const button=form.querySelector('[type="submit"]');button.disabled=true;
  try{const r=await api('/api/candidates',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});state.myResume=r.mine;await loadCandidates(true);closeModal();state.type='vacancy';renderJobs();toast(values.notify_telegram?'Резюме сохранено. Будем присылать подходящие вакансии в Telegram.':'Резюме сохранено. Уведомления отключены.')}catch(err){toast(err.message||'Не удалось сохранить резюме')}finally{button.disabled=false}return;
 }
 if(e.target.id==='ad-form'){e.preventDefault();const form=e.target,button=form.querySelector('[type=submit]');if(!form.reportValidity())return;button.disabled=true;try{const r=await api('/api/ads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fields:adFormData(form),updated_at:form.dataset.updated})});state.ad=r.ad;toast('Рекламный баннер сохранён');renderAdSettings()}catch(err){toast(err.message)}finally{button.disabled=false}return}
 if(e.target.id==='edit-form'){e.preventDefault();const values=Object.fromEntries(new FormData(e.target));values.is_urgent=e.target.elements.is_urgent.checked;values.pay_amount=values.pay_amount===''?null:Number(values.pay_amount);const form=e.target;const button=form.querySelector('[type=submit]');button.disabled=true;try{if(await performAdmin('edit',form.dataset.id,values,form.dataset.updated))closeModal()}finally{button.disabled=false}}
 if(e.target.id==='draft-form'){e.preventDefault();const form=e.target;if(!form.reportValidity())return;const values=Object.fromEntries(new FormData(form));values.title=values.title.trim();values.summary=values.summary.trim();if(values.title.length<5||values.summary.length<20){toast('Заполни заголовок и описание без лишних пробелов');return}values.pay_amount=Number(values.pay_amount);values.workers_needed=Number(values.workers_needed);values.id=form.dataset.id||`draft-${(globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2,10)}`)}`;values.updated_at=new Date().toISOString();const idx=state.drafts.findIndex(x=>x.id===values.id);if(idx<0)state.drafts.unshift(values);else state.drafts[idx]=values;const saved=saveLocal('shabashka:drafts',state.drafts);closeModal();switchView('employer');if(saved)toast('Черновик сохранён на этом устройстве')}
 });
 document.addEventListener('keydown',e=>{const modalOpen=!$('#job-modal').classList.contains('hidden');const filterOpen=$('#filter-panel').classList.contains('open');if(e.key==='Escape'){if(modalOpen)closeModal();if(filterOpen)showFilters(false)}if(e.key==='Tab'&&(modalOpen||filterOpen)){const root=modalOpen?$('#job-modal .modal-card'):$('#filter-panel');const items=[...root.querySelectorAll('button:not(:disabled),input,select,textarea,a[href]')].filter(x=>x.getClientRects().length);const first=items[0],last=items.at(-1);if(!items.includes(document.activeElement)){e.preventDefault();(e.shiftKey?last:first)?.focus();return}if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
 if(document.querySelector('meta[name="app-mode"]')?.content==='demo'){state.jobs=structuredClone(fallbackJobs);state.mode='demo'}else{try{const [config,jobs]=await Promise.all([api('/api/config'),api('/api/jobs')]);state.config=config;state.mode=jobs.mode;state.jobs=jobs.jobs}catch{state.config={botUsername:'shabashkanskbot'};if(document.querySelector('meta[name="api-base"]')){state.mode='live';state.feedUnavailable=true;state.jobs=[];toast('Сервер временно недоступен. Попробуй обновить каталог.')}else{state.mode='demo';state.jobs=structuredClone(fallbackJobs);toast('Открыта демонстрационная версия: сервер недоступен')}}}
 $('#mode-tag').textContent=state.feedUnavailable?'Нет связи':state.mode==='demo'?'Демо':'Каталог активен';$('#mode-tag').classList.toggle('live',state.mode==='live');$('#demo-notice').classList.toggle('hidden',state.mode==='live');
 renderJobs();updateUserUI();if(state.initData||state.token)await session();if(state.mode==='live'&&state.user){await loadAccountRole();if(!state.role&&!state.user.admin)openRoleChooser();renderProfile()}if(state.mode==='live')await loadCandidates(true);updateRoleVisibility();renderJobs();await routeFromHash();showEntryAd();if(state.mode==='live'){const refresh=async()=>{if(document.visibilityState==='visible')await reloadJobs(true);setTimeout(refresh,45000)};setTimeout(refresh,45000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reloadJobs(true)})}
}
init();
