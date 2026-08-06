-- HalkaArzım MVP - Supabase/PostgreSQL başlangıç şeması
-- Üretimde migration aracıyla sürümlenmelidir.

create extension if not exists pgcrypto;

create type public.app_role as enum ('user', 'moderator', 'admin');
create type public.ipo_status as enum ('draft', 'spk_pending', 'approved', 'collecting', 'listing_pending', 'listed', 'cancelled');
create type public.report_status as enum ('queued', 'extracting', 'drafted', 'needs_review', 'approved', 'published', 'rejected');
create type public.source_kind as enum ('spk', 'kap', 'company', 'news', 'licensed_market_data', 'other');
create type public.event_impact as enum ('potential_positive', 'neutral', 'risk');
create type public.comment_status as enum ('pending', 'published', 'hidden', 'deleted');
create type public.moderation_reason as enum ('manipulation', 'guaranteed_return', 'group_advertising', 'abuse', 'personal_data', 'spam', 'other');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (char_length(username) between 3 and 30),
  display_name text,
  avatar_url text,
  role public.app_role not null default 'user',
  is_suspended boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  short_name text not null,
  slug text not null unique,
  ticker text unique,
  sector text,
  website_url text,
  logo_url text,
  kap_member_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.ipos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  status public.ipo_status not null default 'draft',
  offer_price numeric(18,4),
  total_lots bigint,
  distribution_method text,
  collection_start date,
  collection_end date,
  first_trade_date date,
  market_name text,
  intermediary text,
  capital_increase_lots bigint not null default 0,
  shareholder_sale_lots bigint not null default 0,
  currency char(3) not null default 'TRY',
  source_checked_at timestamptz,
  published_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (offer_price is null or offer_price > 0),
  check (total_lots is null or total_lots > 0),
  check (collection_end is null or collection_start is null or collection_end >= collection_start)
);

create table public.ipo_documents (
  id uuid primary key default gen_random_uuid(),
  ipo_id uuid not null references public.ipos(id) on delete cascade,
  title text not null,
  document_type text not null,
  source_kind public.source_kind not null,
  source_url text not null,
  storage_path text,
  sha256 text,
  version_no integer not null default 1 check (version_no > 0),
  published_on date,
  page_count integer,
  is_official boolean not null default false,
  ingestion_status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (ipo_id, document_type, version_no)
);

create table public.ipo_facts (
  id uuid primary key default gen_random_uuid(),
  ipo_id uuid not null references public.ipos(id) on delete cascade,
  document_id uuid references public.ipo_documents(id) on delete set null,
  fact_key text not null,
  fact_value jsonb not null,
  source_page integer,
  source_excerpt text,
  confidence numeric(5,4) check (confidence between 0 and 1),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.ai_reports (
  id uuid primary key default gen_random_uuid(),
  ipo_id uuid not null references public.ipos(id) on delete cascade,
  version_no integer not null check (version_no > 0),
  status public.report_status not null default 'queued',
  model_provider text,
  model_name text,
  prompt_version text,
  score integer check (score between 0 and 100),
  risk_level text check (risk_level in ('low', 'medium', 'high')),
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  scoring_breakdown jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  published_at timestamptz,
  supersedes_report_id uuid references public.ai_reports(id),
  created_at timestamptz not null default now(),
  unique (ipo_id, version_no),
  check ((status not in ('approved','published')) or reviewed_by is not null)
);

create table public.ai_report_evidence (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.ai_reports(id) on delete cascade,
  document_id uuid not null references public.ipo_documents(id) on delete restrict,
  claim_key text not null,
  claim_text text not null,
  source_page_start integer,
  source_page_end integer,
  source_excerpt text,
  created_at timestamptz not null default now(),
  check (source_page_end is null or source_page_start is null or source_page_end >= source_page_start)
);

create table public.fund_use_items (
  id uuid primary key default gen_random_uuid(),
  ipo_id uuid not null references public.ipos(id) on delete cascade,
  label text not null,
  percentage numeric(5,2) not null check (percentage >= 0 and percentage <= 100),
  amount numeric(20,2),
  document_id uuid references public.ipo_documents(id),
  source_page integer,
  sort_order integer not null default 0
);

create table public.company_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  ipo_id uuid references public.ipos(id) on delete set null,
  title text not null,
  summary text not null,
  category text not null,
  impact public.event_impact not null default 'neutral',
  source_kind public.source_kind not null,
  source_url text not null,
  source_label text not null,
  occurred_at timestamptz not null,
  is_verified boolean not null default false,
  ai_generated boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ipo_promises (
  id uuid primary key default gen_random_uuid(),
  ipo_id uuid not null references public.ipos(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed','delayed','not_measurable')),
  source_document_id uuid references public.ipo_documents(id),
  source_page integer,
  evidence_event_id uuid references public.company_events(id),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  ipo_id uuid not null references public.ipos(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 2 and 500),
  status public.comment_status not null default 'pending',
  helpful_count integer not null default 0 check (helpful_count >= 0),
  moderation_labels text[] not null default '{}',
  published_at timestamptz,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comment_votes (
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason public.moderation_reason not null,
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create table public.watchlists (
  user_id uuid not null references public.profiles(id) on delete cascade,
  ipo_id uuid not null references public.ipos(id) on delete cascade,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, ipo_id)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_ipos_status_dates on public.ipos(status, collection_start, collection_end);
create index idx_documents_ipo on public.ipo_documents(ipo_id, document_type);
create index idx_events_company_date on public.company_events(company_id, occurred_at desc);
create index idx_comments_ipo_status_date on public.comments(ipo_id, status, created_at desc);
create index idx_reports_ipo_status on public.ai_reports(ipo_id, status, version_no desc);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role in ('moderator','admin')
      and not p.is_suspended
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and not p.is_suspended
  );
$$;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.ipos enable row level security;
alter table public.ipo_documents enable row level security;
alter table public.ipo_facts enable row level security;
alter table public.ai_reports enable row level security;
alter table public.ai_report_evidence enable row level security;
alter table public.fund_use_items enable row level security;
alter table public.company_events enable row level security;
alter table public.ipo_promises enable row level security;
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;
alter table public.comment_reports enable row level security;
alter table public.watchlists enable row level security;
alter table public.audit_logs enable row level security;

create policy "user reads own profile" on public.profiles for select using (id = auth.uid() or public.is_staff());
create policy "user updates own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "published companies readable" on public.companies for select using (true);
create policy "staff manages companies" on public.companies for all using (public.is_staff()) with check (public.is_staff());

create policy "published ipos readable" on public.ipos for select using (published_at is not null or public.is_staff());
create policy "staff manages ipos" on public.ipos for all using (public.is_staff()) with check (public.is_staff());

create policy "official documents readable" on public.ipo_documents for select using (is_official or public.is_staff());
create policy "staff manages documents" on public.ipo_documents for all using (public.is_staff()) with check (public.is_staff());

create policy "staff reads facts" on public.ipo_facts for select using (public.is_staff());
create policy "staff manages facts" on public.ipo_facts for all using (public.is_staff()) with check (public.is_staff());

create policy "published reports readable" on public.ai_reports for select using (status = 'published' or public.is_staff());
create policy "staff manages reports" on public.ai_reports for all using (public.is_staff()) with check (public.is_staff());

create policy "published evidence readable" on public.ai_report_evidence for select using (
  exists (select 1 from public.ai_reports r where r.id = report_id and (r.status = 'published' or public.is_staff()))
);
create policy "staff manages evidence" on public.ai_report_evidence for all using (public.is_staff()) with check (public.is_staff());

create policy "fund use readable" on public.fund_use_items for select using (true);
create policy "staff manages fund use" on public.fund_use_items for all using (public.is_staff()) with check (public.is_staff());

create policy "verified events readable" on public.company_events for select using (is_verified or public.is_staff());
create policy "staff manages events" on public.company_events for all using (public.is_staff()) with check (public.is_staff());

create policy "promises readable" on public.ipo_promises for select using (true);
create policy "staff manages promises" on public.ipo_promises for all using (public.is_staff()) with check (public.is_staff());

create policy "published comments readable" on public.comments for select using (status = 'published' or user_id = auth.uid() or public.is_staff());
create policy "verified user creates pending comment" on public.comments for insert with check (
  user_id = auth.uid()
  and status = 'pending'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and not p.is_suspended)
);
create policy "user edits own pending comment" on public.comments for update using (
  user_id = auth.uid() and status in ('pending','published')
) with check (user_id = auth.uid());
create policy "staff moderates comments" on public.comments for update using (public.is_staff()) with check (public.is_staff());

create policy "votes readable" on public.comment_votes for select using (true);
create policy "user manages own votes" on public.comment_votes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "user creates report" on public.comment_reports for insert with check (reporter_id = auth.uid());
create policy "user reads own reports" on public.comment_reports for select using (reporter_id = auth.uid() or public.is_staff());
create policy "staff handles reports" on public.comment_reports for update using (public.is_staff()) with check (public.is_staff());

create policy "user reads own watchlist" on public.watchlists for select using (user_id = auth.uid());
create policy "user manages own watchlist" on public.watchlists for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "admin reads audit" on public.audit_logs for select using (public.is_admin());
create policy "staff writes audit" on public.audit_logs for insert with check (public.is_staff());

-- Yetkiler: hassas değişiklikler yalnız güvenli RPC fonksiyonları üzerinden yapılır.
revoke insert, update, delete on public.comments from authenticated;
revoke insert, update, delete on public.comment_votes from authenticated;
revoke insert, update, delete on public.comment_reports from authenticated;
revoke insert, update, delete on public.watchlists from authenticated;
revoke update on public.profiles from authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

-- Auth kullanıcısı oluştuğunda profil üret.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'user') || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.submit_comment(p_ipo_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_body text := btrim(coalesce(p_body, ''));
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if not exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null) then
    raise exception 'E-posta doğrulaması gerekli';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and not is_suspended) then
    raise exception 'Hesap yorum yapmaya uygun değil';
  end if;
  if not exists (select 1 from public.ipos where id = p_ipo_id and published_at is not null) then
    raise exception 'Halka arz bulunamadı';
  end if;
  if char_length(v_body) not between 2 and 500 then raise exception 'Yorum 2-500 karakter olmalı'; end if;
  if v_body ~* '(kesin[[:space:]]+(tavan|kazanç|kazandırır)|içeriden[[:space:]]+bilgi|telegram|whatsapp|hepimiz[[:space:]]+(alalım|toplayalım)|garanti[[:space:]]+(kazanç|tavan)|https?://|[0-9]{10,})' then
    raise exception 'Yorum moderasyon kurallarına aykırı';
  end if;
  if (select count(*) from public.comments where user_id = auth.uid() and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Çok hızlı yorum gönderildi; daha sonra tekrar deneyin';
  end if;
  insert into public.comments (ipo_id, user_id, body, status) values (p_ipo_id, auth.uid(), v_body, 'pending') returning id into v_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id) values (auth.uid(), 'comment_submitted', 'comment', v_id::text);
  return v_id;
end;
$$;

create or replace function public.toggle_comment_vote(p_comment_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if not exists (select 1 from public.comments where id = p_comment_id and status = 'published') then raise exception 'Yorum bulunamadı'; end if;
  if exists (select 1 from public.comment_votes where comment_id = p_comment_id and user_id = auth.uid()) then
    delete from public.comment_votes where comment_id = p_comment_id and user_id = auth.uid(); return false;
  end if;
  insert into public.comment_votes(comment_id, user_id) values (p_comment_id, auth.uid()); return true;
end;
$$;

create or replace function public.report_comment(p_comment_id uuid, p_reason text, p_details text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_reason public.moderation_reason;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  begin v_reason := p_reason::public.moderation_reason; exception when others then v_reason := 'other'; end;
  insert into public.comment_reports(comment_id, reporter_id, reason, details)
  values (p_comment_id, auth.uid(), v_reason, left(coalesce(p_details,''),500))
  on conflict (comment_id, reporter_id) do update set reason=excluded.reason, details=excluded.details, status='open', created_at=now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.set_watchlist(p_ipo_id uuid, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if p_enabled then
    insert into public.watchlists(user_id, ipo_id) values(auth.uid(), p_ipo_id) on conflict (user_id, ipo_id) do nothing;
  else
    delete from public.watchlists where user_id=auth.uid() and ipo_id=p_ipo_id;
  end if;
  return p_enabled;
end;
$$;

create or replace function public.moderate_comment(p_comment_id uuid, p_action text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then raise exception 'Yetki yok'; end if;
  if p_action = 'publish' then
    update public.comments set status='published', published_at=now(), updated_at=now() where id=p_comment_id;
  elsif p_action = 'hide' then
    update public.comments set status='hidden', updated_at=now() where id=p_comment_id;
  else raise exception 'Geçersiz işlem'; end if;
  if not found then raise exception 'Yorum bulunamadı'; end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values(auth.uid(), 'comment_' || p_action, 'comment', p_comment_id::text, jsonb_build_object('action',p_action));
  return true;
end;
$$;

grant execute on function public.submit_comment(uuid,text) to authenticated;
grant execute on function public.toggle_comment_vote(uuid) to authenticated;
grant execute on function public.report_comment(uuid,text,text) to authenticated;
grant execute on function public.set_watchlist(uuid,boolean) to authenticated;
grant execute on function public.moderate_comment(uuid,text) to authenticated;

-- Yalnız yayımlanmış yorumların güvenli, sınırlı alanlarını göster.
drop view if exists public.published_comments;
create view public.published_comments
with (security_invoker = false)
as
select c.id, c.ipo_id, p.display_name, c.body, c.created_at, count(v.user_id)::integer as helpful_count
from public.comments c
join public.profiles p on p.id = c.user_id
left join public.comment_votes v on v.comment_id = c.id
where c.status = 'published'
group by c.id, p.display_name;

grant select on public.published_comments to anon, authenticated;

-- Uzak bildirim abonelikleri ve gönderim kuyruğu.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth_key text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create table if not exists public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  ipo_id uuid references public.ipos(id) on delete cascade,
  event_key text not null,
  title text not null,
  body text not null,
  target_url text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','sending','sent','failed')),
  attempt_count integer not null default 0,
  available_at timestamptz not null default now(),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (ipo_id, event_key)
);

alter table public.push_subscriptions enable row level security;
alter table public.notification_outbox enable row level security;
create policy "user reads own push subscriptions" on public.push_subscriptions for select using (user_id = auth.uid());
create policy "admin reads notification outbox" on public.notification_outbox for select using (public.is_admin());

revoke all on public.push_subscriptions from anon, authenticated;
revoke all on public.notification_outbox from anon, authenticated;

create or replace function public.upsert_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default '')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if length(p_endpoint) not between 20 and 2048 or length(p_p256dh) < 20 or length(p_auth) < 8 then
    raise exception 'Geçersiz bildirim aboneliği';
  end if;
  insert into public.push_subscriptions(user_id, endpoint, p256dh, auth_key, user_agent)
  values(auth.uid(), p_endpoint, p_p256dh, p_auth, left(coalesce(p_user_agent,''),500))
  on conflict (user_id, endpoint) do update set p256dh=excluded.p256dh, auth_key=excluded.auth_key, user_agent=excluded.user_agent, updated_at=now()
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.delete_push_subscription(p_endpoint text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  delete from public.push_subscriptions where user_id=auth.uid() and endpoint=p_endpoint;
  return true;
end;
$$;

-- Admin paneli için sınırlı ve denetlenebilir veri düzeltme işlemi.
create or replace function public.admin_patch_ipo(
  p_ipo_id uuid,
  p_status text default null,
  p_ticker text default null,
  p_collection_start date default null,
  p_collection_end date default null,
  p_first_trade_date date default null,
  p_intermediary text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_company_id uuid; v_old jsonb; v_new jsonb;
begin
  if not public.is_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
  select company_id, to_jsonb(i) into v_company_id, v_old from public.ipos i where id=p_ipo_id;
  if v_company_id is null then raise exception 'Halka arz bulunamadı'; end if;
  if p_status is not null and p_status not in ('draft','spk_pending','approved','collecting','listing_pending','listed','cancelled') then raise exception 'Geçersiz durum'; end if;
  update public.ipos set
    status=coalesce(p_status::public.ipo_status,status),
    collection_start=coalesce(p_collection_start,collection_start),
    collection_end=coalesce(p_collection_end,collection_end),
    first_trade_date=coalesce(p_first_trade_date,first_trade_date),
    intermediary=coalesce(nullif(btrim(p_intermediary),''),intermediary),
    updated_at=now()
  where id=p_ipo_id;
  if nullif(btrim(p_ticker),'') is not null then update public.companies set ticker=upper(btrim(p_ticker)), updated_at=now() where id=v_company_id; end if;
  select to_jsonb(i) into v_new from public.ipos i where id=p_ipo_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'ipo_patched','ipo',p_ipo_id::text,jsonb_build_object('before',v_old,'after',v_new,'ticker',p_ticker));
  return true;
end;
$$;

create or replace function public.admin_add_document(p_ipo_id uuid, p_title text, p_document_type text, p_source_kind text, p_source_url text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid; v_kind public.source_kind;
begin
  if not public.is_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
  if p_source_url !~ '^https://' then raise exception 'Yalnız HTTPS kaynak kabul edilir'; end if;
  begin v_kind := p_source_kind::public.source_kind; exception when others then v_kind := 'other'; end;
  insert into public.ipo_documents(ipo_id,title,document_type,source_kind,source_url,is_official,ingestion_status)
  values(p_ipo_id,left(btrim(p_title),200),left(btrim(p_document_type),80),v_kind,p_source_url,v_kind in ('spk','kap','company'),'pending')
  returning id into v_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id) values(auth.uid(),'document_added','ipo_document',v_id::text);
  return v_id;
end;
$$;

create or replace function public.admin_review_ai_report(p_report_id uuid, p_publish boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Yönetici yetkisi gerekli'; end if;
  update public.ai_reports set status=case when p_publish then 'published'::public.report_status else 'rejected'::public.report_status end,
    reviewed_by=auth.uid(), reviewed_at=now(), published_at=case when p_publish then now() else null end
  where id=p_report_id and status in ('drafted','needs_review','approved');
  if not found then raise exception 'İncelenebilir rapor bulunamadı'; end if;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),case when p_publish then 'ai_report_published' else 'ai_report_rejected' end,'ai_report',p_report_id::text,'{}');
  return true;
end;
$$;

grant execute on function public.upsert_push_subscription(text,text,text,text) to authenticated;
grant execute on function public.delete_push_subscription(text) to authenticated;
grant execute on function public.admin_patch_ipo(uuid,text,text,date,date,date,text) to authenticated;
grant execute on function public.admin_add_document(uuid,text,text,text,text) to authenticated;
grant execute on function public.admin_review_ai_report(uuid,boolean) to authenticated;
