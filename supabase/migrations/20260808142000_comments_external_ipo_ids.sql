-- Comments must remain usable as soon as an IPO appears in the deterministic
-- SPK snapshot, even if the separate Supabase IPO mirror has not synced yet.
-- Keep the UUID identifier, but remove the hard FK to public.ipos just like
-- watchlists already do.

alter table public.comments
  drop constraint if exists comments_ipo_id_fkey;

comment on column public.comments.ipo_id is
  'SPK veri hattındaki halka arzın deterministik UUID kimliği; kayıt public.ipos içinde bulunmayabilir.';

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
  if p_ipo_id is null then raise exception 'Halka arz kimliği gerekli'; end if;
  if char_length(v_body) not between 2 and 500 then raise exception 'Yorum 2-500 karakter olmalı'; end if;
  if v_body ~* '(kesin[[:space:]]+(tavan|kazanç|kazandırır)|içeriden[[:space:]]+bilgi|telegram|whatsapp|hepimiz[[:space:]]+(alalım|toplayalım)|garanti[[:space:]]+(kazanç|tavan)|https?://|[0-9]{10,})' then
    raise exception 'Yorum moderasyon kurallarına aykırı';
  end if;
  if (select count(*) from public.comments where user_id = auth.uid() and created_at > now() - interval '10 minutes') >= 5 then
    raise exception 'Çok hızlı yorum gönderildi; daha sonra tekrar deneyin';
  end if;

  insert into public.comments (ipo_id, user_id, body, status)
  values (p_ipo_id, auth.uid(), v_body, 'pending')
  returning id into v_id;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'comment_submitted', 'comment', v_id::text, jsonb_build_object('ipo_id', p_ipo_id));

  return v_id;
end;
$$;

grant execute on function public.submit_comment(uuid,text) to authenticated;
