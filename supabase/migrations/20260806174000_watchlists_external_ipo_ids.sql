-- HalkaArzım halka arz kayıtları SPK veri hattından deterministik UUID ile gelir.
-- Tüm kayıtlar public.ipos tablosuna senkronlanmadan önce de kullanıcıların
-- takip listesine ekleme yapabilmesi gerekir. UUID tipi ve birleşik PK korunur;
-- yalnız public.ipos tablosuna zorunlu FK bağı kaldırılır.

alter table public.watchlists
  drop constraint if exists watchlists_ipo_id_fkey;

comment on column public.watchlists.ipo_id is
  'SPK veri hattındaki halka arzın deterministik UUID kimliği; kayıt public.ipos içinde bulunmayabilir.';
