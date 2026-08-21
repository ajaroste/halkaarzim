-- Official SPK IPO sync foundation. Safe to apply repeatedly during staged rollout.
create extension if not exists pgcrypto;
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

alter table public.ipos add column if not exists source_key text;
alter table public.ipos add column if not exists spk_bulletin_no text;
alter table public.ipos add column if not exists spk_source_url text;
alter table public.ipos add column if not exists source_hash text;
alter table public.ipos add column if not exists source_payload jsonb not null default '{}'::jsonb;
create unique index if not exists ipos_source_key_uidx on public.ipos(source_key) where source_key is not null;

create table if not exists public.ipo_sync_runs (
  id bigint generated always as identity primary key,
  source text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running','success','partial','failed')),
  bulletins_checked integer not null default 0,
  records_found integer not null default 0,
  records_added integer not null default 0,
  records_updated integer not null default 0,
  error text,
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.ipo_sync_control (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  secret_hash text not null,
  secret_value text,
  last_success_at timestamptz,
  updated_at timestamptz not null default now()
);

insert into public.ipo_sync_control(id, enabled, secret_hash, secret_value)
select true, false, encode(digest(secret_value, 'sha256'), 'hex'), secret_value
from (select encode(gen_random_bytes(32), 'hex') as secret_value) generated
where not exists (select 1 from public.ipo_sync_control where id = true);

update public.ipo_sync_control
set secret_value = coalesce(secret_value, encode(gen_random_bytes(32), 'hex'))
where id = true;

update public.ipo_sync_control
set secret_hash = encode(digest(secret_value, 'sha256'), 'hex')
where id = true and secret_value is not null;

alter table public.ipo_sync_runs enable row level security;
alter table public.ipo_sync_control enable row level security;
revoke all on public.ipo_sync_runs from anon, authenticated;
revoke all on public.ipo_sync_control from anon, authenticated;

create or replace function public.trigger_official_spk_sync(p_dry_run boolean default true, p_max_bulletins integer default 8)
returns bigint
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_secret text;
  v_request_id bigint;
begin
  select secret_value into v_secret from public.ipo_sync_control where id = true;
  if v_secret is null then raise exception 'sync secret unavailable'; end if;

  select net.http_post(
    url := 'https://yjffzuzldlchswaohwyk.supabase.co/functions/v1/spk-ipo-sync',
    headers := jsonb_build_object('Content-Type','application/json','x-sync-secret',v_secret),
    body := jsonb_build_object('dryRun',p_dry_run,'maxBulletins',greatest(1,least(16,p_max_bulletins)))
  ) into v_request_id;
  return v_request_id;
end;
$$;

revoke all on function public.trigger_official_spk_sync(boolean, integer) from public, anon, authenticated;
