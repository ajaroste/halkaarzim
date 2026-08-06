# Supabase canlı kurulum

## Proje

- Project ref: `yjffzuzldlchswaohwyk`
- Project URL: `https://yjffzuzldlchswaohwyk.supabase.co`

## 1. Veritabanı migration

Repo içindeki `supabase/migrations/20260806154500_initial_schema.sql` dosyası şu alanları kurar:

- profiles
- companies
- ipos
- ipo_documents / ipo_facts
- ai_reports / evidence
- comments / votes / reports
- watchlists
- push_subscriptions
- notification_outbox
- audit_logs
- RLS politikaları ve güvenli RPC fonksiyonları

GitHub repository secrets bölümüne şunları ekle:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

Ardından **Actions → Supabase migrate → Run workflow** çalıştır.

Yerel CLI alternatifi:

```bash
supabase login
supabase link --project-ref yjffzuzldlchswaohwyk
supabase db push --include-all
```

## 2. Vercel environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=https://yjffzuzldlchswaohwyk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase Connect ekranındaki publishable/anon key>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<repo .env.example içindeki public key>
```

## 3. Google OAuth

Google Cloud Console'da bir Web OAuth istemcisi oluştur.

Authorized JavaScript origins:

```text
https://halkaarzim.vercel.app
http://localhost:3000
```

Authorized redirect URI:

```text
https://yjffzuzldlchswaohwyk.supabase.co/auth/v1/callback
```

Supabase Dashboard → Authentication → Providers → Google bölümünde Google Client ID ve Client Secret değerlerini ekleyip sağlayıcıyı etkinleştir.

Supabase Dashboard → Authentication → URL Configuration:

```text
Site URL: https://halkaarzim.vercel.app
Redirect URL: https://halkaarzim.vercel.app/auth/callback
Redirect URL: http://localhost:3000/auth/callback
```

Gerçek Vercel alan adı farklıysa yukarıdaki adreslerde onu kullan.

## 4. Uzak Web Push

GitHub repository secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VAPID_PRIVATE_KEY`

GitHub repository variable:

- `VAPID_SUBJECT=mailto:admin@halkaarzim.com`

İlk veri aktarımı mevcut kayıtları yeni halka arz olarak bildirmez. Sonraki veri senkronlarında yeni şirketler `notification_outbox` tablosuna eklenir ve Web Push ile abonelere gönderilir.
