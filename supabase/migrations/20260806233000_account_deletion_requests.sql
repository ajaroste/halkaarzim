begin;

create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  reason text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id),
  admin_note text
);

create unique index if not exists account_deletion_one_open_request
  on public.account_deletion_requests(user_id)
  where status in ('pending', 'processing');

alter table public.account_deletion_requests enable row level security;
drop policy if exists "user reads own deletion requests" on public.account_deletion_requests;
create policy "user reads own deletion requests"
  on public.account_deletion_requests for select
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.account_deletion_requests from anon, authenticated;
grant select on public.account_deletion_requests to authenticated;

create or replace function public.request_account_deletion(p_reason text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
  if v_reason is not null and char_length(v_reason) > 500 then raise exception 'Açıklama çok uzun'; end if;

  select id into v_id
  from public.account_deletion_requests
  where user_id = auth.uid() and status in ('pending', 'processing')
  order by requested_at desc
  limit 1;

  if v_id is null then
    insert into public.account_deletion_requests(user_id, reason)
    values(auth.uid(), v_reason)
    returning id into v_id;

    insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values(auth.uid(), 'account_deletion_requested', 'account_deletion_request', v_id::text,
      jsonb_build_object('has_reason', v_reason is not null));
  end if;

  return v_id;
end;
$$;

create or replace function public.cancel_account_deletion_request()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_updated integer;
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;

  update public.account_deletion_requests
     set status = 'cancelled', processed_at = now()
   where user_id = auth.uid() and status = 'pending';
  get diagnostics v_updated = row_count;

  if v_updated > 0 then
    insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
    values(auth.uid(), 'account_deletion_cancelled', 'account_deletion_request', auth.uid()::text, '{}'::jsonb);
  end if;
  return v_updated > 0;
end;
$$;

revoke all on function public.request_account_deletion(text) from public;
revoke all on function public.cancel_account_deletion_request() from public;
grant execute on function public.request_account_deletion(text) to authenticated;
grant execute on function public.cancel_account_deletion_request() to authenticated;

commit;
