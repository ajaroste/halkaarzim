create table if not exists public.ipo_ai_analyses (
  slug text primary key,
  provider text not null check (provider = 'google-gemini'),
  model text not null,
  summary text not null check (length(btrim(summary)) > 0),
  strengths jsonb not null default '[]'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  data_gaps jsonb not null default '[]'::jsonb,
  confidence integer not null check (confidence between 0 and 100),
  generated_at timestamptz not null default now()
);

alter table public.ipo_ai_analyses enable row level security;

-- AI analyses are public site content, but only trusted server-side code may write them.
drop policy if exists "Public can read IPO AI analyses" on public.ipo_ai_analyses;
create policy "Public can read IPO AI analyses"
on public.ipo_ai_analyses
for select
to anon, authenticated
using (true);

revoke insert, update, delete on public.ipo_ai_analyses from anon, authenticated;
grant select on public.ipo_ai_analyses to anon, authenticated;
