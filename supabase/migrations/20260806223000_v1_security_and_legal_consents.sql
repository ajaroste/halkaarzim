-- HalkaArzım v1.0: profil yazma güvenliği, sürümlü hukuki kabul kaydı ve güvenli tercih RPC'leri.
begin;

create table if not exists public.legal_acceptances (
  user_id uuid not null references auth.users(id) on delete cascade,
  document_key text not null check (document_key in ('terms', 'privacy')),
  version text not null check (char_length(version) between 1 and 30),
  accepted_at timestamptz not null default now(),
  source text not null default 'web' check (char_length(source) between 1 and 40),
  revoked_at timestamptz,
  primary key (user_id, document_key, version)
);

alter table public.legal_acceptances enable row level security;
drop policy if exists "user reads own legal acceptances" on public.legal_acceptances;
create policy "user reads own legal acceptances"
  on public.legal_acceptances for select
  using (user_id = auth.uid() or public.is_admin());

revoke all on public.legal_acceptances from anon, authenticated;
grant select on public.legal_acceptances to authenticated;

-- Profil tablosuna doğrudan UPDATE yetkisini kapat; yalnız aşağıdaki doğrulanmış RPC kullanılacak.
revoke update on public.profiles from authenticated;

create or replace function public.update_own_profile(
  p_username text,
  p_display_name text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_display_name text := btrim(coalesce(p_display_name, ''));
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;

  if exists (
    select 1 from public.audit_logs
    where actor_id = auth.uid()
      and action = 'profile_updated'
      and created_at > now() - interval '10 seconds'
  ) then
    raise exception 'Profil çok hızlı güncelleniyor; kısa süre sonra tekrar deneyin';
  end if;

  if v_username !~ '^[a-z0-9_]{3,30}$' then raise exception 'Kullanıcı adı geçersiz'; end if;
  if char_length(v_display_name) < 2 or char_length(v_display_name) > 40 then raise exception 'Görünen ad geçersiz'; end if;

  update public.profiles
     set username = v_username,
         display_name = v_display_name,
         updated_at = now()
   where id = auth.uid()
     and not is_suspended
   returning * into v_profile;

  if v_profile.id is null then raise exception 'Profil bulunamadı veya hesap askıda'; end if;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values(auth.uid(), 'profile_updated', 'profile', auth.uid()::text,
    jsonb_build_object('username', v_username, 'display_name_length', char_length(v_display_name)));

  return v_profile;
end;
$$;

create or replace function public.accept_legal_documents(p_version text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_version text := btrim(coalesce(p_version, ''));
begin
  if auth.uid() is null then raise exception 'Oturum gerekli'; end if;
  if char_length(v_version) not between 1 and 30 then raise exception 'Geçersiz belge sürümü'; end if;

  insert into public.legal_acceptances(user_id, document_key, version, source)
  values
    (auth.uid(), 'terms', v_version, 'authenticated_web'),
    (auth.uid(), 'privacy', v_version, 'authenticated_web')
  on conflict (user_id, document_key, version)
  do update set accepted_at = now(), revoked_at = null, source = excluded.source;

  insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
  values(auth.uid(), 'legal_documents_accepted', 'legal_acceptance', auth.uid()::text,
    jsonb_build_object('version', v_version));
  return true;
end;
$$;

create or replace function public.set_watchlist_notifications(p_ipo_id uuid, p_enabled boolean)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Giriş gerekli'; end if;
  update public.watchlists
     set notifications_enabled = p_enabled
   where user_id = auth.uid() and ipo_id = p_ipo_id;
  if not found then raise exception 'Takip kaydı bulunamadı'; end if;
  return p_enabled;
end;
$$;

-- Yeni e-posta kaydında gönderilen hukuki sürümü ayrı tabloda denetlenebilir biçimde sakla.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_version text := nullif(btrim(coalesce(new.raw_user_meta_data->>'legal_version', '')), '');
  v_accepted_at timestamptz := now();
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'user') || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  ) on conflict (id) do nothing;

  begin
    if nullif(new.raw_user_meta_data->>'legal_accepted_at', '') is not null then
      v_accepted_at := (new.raw_user_meta_data->>'legal_accepted_at')::timestamptz;
    end if;
  exception when others then
    v_accepted_at := now();
  end;

  if v_version is not null
     and coalesce(new.raw_user_meta_data->>'terms_accepted', 'false') = 'true'
     and coalesce(new.raw_user_meta_data->>'privacy_acknowledged', 'false') = 'true' then
    insert into public.legal_acceptances(user_id, document_key, version, accepted_at, source)
    values
      (new.id, 'terms', left(v_version, 30), v_accepted_at, 'email_signup'),
      (new.id, 'privacy', left(v_version, 30), v_accepted_at, 'email_signup')
    on conflict (user_id, document_key, version) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.update_own_profile(text, text) from public;
revoke all on function public.accept_legal_documents(text) from public;
revoke all on function public.set_watchlist_notifications(uuid, boolean) from public;
grant execute on function public.update_own_profile(text, text) to authenticated;
grant execute on function public.accept_legal_documents(text) to authenticated;
grant execute on function public.set_watchlist_notifications(uuid, boolean) to authenticated;

commit;
