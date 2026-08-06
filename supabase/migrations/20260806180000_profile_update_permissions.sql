-- Kullanıcıların yalnız kendi kullanıcı adı ve görünen adını değiştirebilmesini sağlar.
-- Mevcut RLS politikası satır erişimini sınırlar; bu migration kolon yetkisini geri verir.

grant usage on schema public to authenticated;
grant select on public.profiles to authenticated;
grant update (username, display_name, avatar_url) on public.profiles to authenticated;

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
begin
  if auth.uid() is null then
    raise exception 'Oturum gerekli';
  end if;

  p_username := lower(trim(p_username));
  p_display_name := trim(p_display_name);

  if p_username !~ '^[a-z0-9_]{3,30}$' then
    raise exception 'Kullanıcı adı geçersiz';
  end if;

  if char_length(p_display_name) < 2 or char_length(p_display_name) > 40 then
    raise exception 'Görünen ad geçersiz';
  end if;

  update public.profiles
     set username = p_username,
         display_name = p_display_name,
         updated_at = now()
   where id = auth.uid()
   returning * into v_profile;

  if v_profile.id is null then
    raise exception 'Profil bulunamadı';
  end if;

  return v_profile;
end;
$$;

revoke all on function public.update_own_profile(text, text) from public;
grant execute on function public.update_own_profile(text, text) to authenticated;
