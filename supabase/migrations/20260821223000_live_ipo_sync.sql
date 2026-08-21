begin;

alter table public.ipos
  add column if not exists live_source_url text,
  add column if not exists live_date_text text;

alter table public.ipos
  drop constraint if exists ipos_live_source_url_https;
alter table public.ipos
  add constraint ipos_live_source_url_https
  check (live_source_url is null or live_source_url ~ '^https://');

create table if not exists public.ipo_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_url text not null,
  status text not null check (status in ('success','failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  discovered_count integer not null default 0,
  parsed_count integer not null default 0,
  added_count integer not null default 0,
  updated_count integer not null default 0,
  detail_error_count integer not null default 0,
  error_message text
);

create index if not exists idx_ipo_sync_runs_started
  on public.ipo_sync_runs(started_at desc);

create table if not exists public.ipo_source_snapshots (
  id bigint generated always as identity primary key,
  sync_run_id uuid not null references public.ipo_sync_runs(id) on delete cascade,
  source text not null,
  source_url text not null,
  fetched_at timestamptz not null default now(),
  checksum text not null,
  record_count integer not null default 0,
  payload jsonb not null default '[]'::jsonb
);

create index if not exists idx_ipo_source_snapshots_run
  on public.ipo_source_snapshots(sync_run_id, fetched_at desc);

alter table public.ipo_sync_runs enable row level security;
alter table public.ipo_source_snapshots enable row level security;

revoke all on public.ipo_sync_runs from anon, authenticated;
revoke all on public.ipo_source_snapshots from anon, authenticated;

drop policy if exists "admin reads ipo sync runs" on public.ipo_sync_runs;
create policy "admin reads ipo sync runs"
  on public.ipo_sync_runs for select
  using (public.is_admin());

drop policy if exists "admin reads ipo source snapshots" on public.ipo_source_snapshots;
create policy "admin reads ipo source snapshots"
  on public.ipo_source_snapshots for select
  using (public.is_admin());

comment on table public.ipo_sync_runs is
  'Vercel tabanlı halka arz senkronizasyonlarının çalışma geçmişi. Veri akışı GitHub Actions üzerinden ilerlemez.';
comment on table public.ipo_source_snapshots is
  'Canlı halka arz kaynaklarından alınan normalize edilmiş son kaynak anlık görüntüleri.';

commit;
