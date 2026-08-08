begin;

-- Comments use deterministic external IPO UUIDs and are published immediately
-- when the existing server-side moderation rules allow them.
alter table public.comments
  drop constraint if exists comments_ipo_id_fkey;

create table if not exists public.comment_submission_audit (
  id bigint generated always as identity primary key,
  comment_id uuid not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '180 days')
);

create index if not exists idx_comment_submission_audit_comment
  on public.comment_submission_audit(comment_id);
create index if not exists idx_comment_submission_audit_expires
  on public.comment_submission_audit(expires_at);

alter table public.comment_submission_audit enable row level security;
revoke all on public.comment_submission_audit from anon, authenticated;
grant select on public.comment_submission_audit to authenticated;

create policy "admin reads comment submission audit"
  on public.comment_submission_audit
  for select
  using (public.is_admin());

create or replace function public.submit_comment(p_ipo_id uuid, p_body text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_body text := btrim(coalesce(p_body, ''));
  v_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  v_ip_text text;
  v_ip inet;
  v_user_agent text;
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  if not exists (select 1 from auth.users where id = auth.uid() and email_confirmed_at is not null) then
    raise exception 'E-posta doğrulaması gerekli';
  end if;
  if not exists (select 1 from public.profiles where id = auth.uid() and not is_suspended) then
    raise exception 'Hesap yorum yapmaya uygun değil';
  end if;
  if p_ipo_id is null then raise exception 'Halka arz kimliği gerekli'; end if;
  if char_length(v_body) not between 2 and 500 then raise exception 'Yorum 2-500 karakter olmalı'; end if;
  if v_body ~* '(kesin[[:space:]]+(tavan|kazanç|kazandırır)|içeriden[[:space:]]+bilgi|telegram|whatsapp|hepimiz[[:space:]]+(alalım|toplayalım)|garanti[[:space:]]+(kazanç|tavan)|https?://|[0-9]{10,})' then
    raise exception 'Yorum moderasyon kurallarına aykırı';
  end if;
  if (select count(*) from public.comments where user_id = auth.uid() and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Çok hızlı yorum gönderildi; daha sonra tekrar deneyin';
  end if;

  v_ip_text := nullif(split_part(coalesce(v_headers->>'cf-connecting-ip', v_headers->>'x-forwarded-for', v_headers->>'x-real-ip', ''), ',', 1), '');
  begin
    if v_ip_text is not null then v_ip := btrim(v_ip_text)::inet; end if;
  exception when others then
    v_ip := null;
  end;
  v_user_agent := left(coalesce(v_headers->>'user-agent', ''), 500);

  insert into public.comments (ipo_id, user_id, body, status, published_at)
  values (p_ipo_id, auth.uid(), v_body, 'published', now())
  returning id into v_id;

  insert into public.comment_submission_audit(comment_id, user_id, ip_address, user_agent)
  values (v_id, auth.uid(), v_ip, nullif(v_user_agent, ''));

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'comment_published', 'comment', v_id::text, jsonb_build_object('auto_published', true));

  return v_id;
end;
$$;

grant execute on function public.submit_comment(uuid,text) to authenticated;

commit;
