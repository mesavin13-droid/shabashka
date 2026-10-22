create table public.advertisements (
 id smallint primary key check(id=1),
 enabled boolean not null default true,
 title text not null check(char_length(title) between 1 and 100),
 body text not null check(char_length(body) between 1 and 500),
 button_text text not null check(char_length(button_text) between 1 and 40),
 target_url text not null,
 image_url text not null default '',
 advertiser text not null check(char_length(advertiser) between 1 and 120),
 erid text not null default '',
 starts_at timestamptz,
 ends_at timestamptz,
 updated_at timestamptz not null default now(),
 check(ends_at is null or starts_at is null or ends_at>starts_at)
);
alter table public.advertisements enable row level security;
revoke all on public.advertisements from public,anon,authenticated;
grant all on public.advertisements to service_role;
insert into public.advertisements(id,title,body,button_text,target_url,advertiser)
values(1,'Люди на вашу следующую смену','Ищете грузчика, курьера или помощника? Пришлите вакансию боту ШАБАШКИ. После проверки она появится в каталоге Новосибирска.','Разместить вакансию','https://t.me/shabashkanskbot','ШАБАШКА');
