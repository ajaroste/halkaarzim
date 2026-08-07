-- Yeni hesaplarda güvenli, UI kurallarıyla uyumlu kullanıcı adı üretir.
-- E-posta local-part içindeki nokta/+ gibi karakterleri temizler ve 30 karakter sınırını garanti eder.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_base text;
  v_username text;
  v_display_name text;
begin
  v_base := lower(regexp_replace(
    coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'user'),
    '[^a-z0-9_]+', '_', 'g'
  ));
  v_base := trim(both '_' from v_base);
  if char_length(v_base) < 3 then
    v_base := 'user';
  end if;

  -- 23 + '_' + 6 UUID karakteri = en fazla 30 karakter.
  v_username := left(v_base, 23) || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  v_display_name := btrim(coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Kullanıcı'));
  if char_length(v_display_name) < 2 then
    v_display_name := 'Kullanıcı';
  end if;
  v_display_name := left(v_display_name, 40);

  insert into public.profiles (id, username, display_name)
  values (new.id, v_username, v_display_name);

  return new;
end;
$$;
