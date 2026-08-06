# HalkaArzım v1.0 — Production Kurulum Rehberi

Bu rehber kodda hazır olup dış hesap, secret veya gerçek kurum bilgisi gerektiren son adımları açıklar.

## 1. Vercel ortam değişkenleri

Vercel → Project → Settings → Environment Variables.

### Zorunlu genel değişkenler

```env
NEXT_PUBLIC_SITE_URL=https://halkaarzim.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://yjffzuzldlchswaohwyk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<YENI_PUBLIC_VAPID_KEY>
NEXT_PUBLIC_LEGAL_CONTACT_EMAIL=<GERCEK_BASVURU_EPOSTASI>
```

Özel domain bağlandıktan sonra:

```env
NEXT_PUBLIC_SITE_URL=https://halkaarzim.site
```

ve Vercel’de eski adres özel domaine yönlendirilmelidir.

### Gemini ve güvenli AI endpoint

```env
AI_ADMIN_TOKEN=<UZUN_RASTGELE_SECRET>
GEMINI_API_KEY=<GOOGLE_AI_STUDIO_API_KEY>
GEMINI_MODEL=gemini-2.5-flash
```

Kurallar:

- Bu değişkenlere `NEXT_PUBLIC_` eklenmez.
- `AI_ADMIN_TOKEN` Vercel ve GitHub’da aynı değer olmalıdır.
- Secret değerleri commit, ekran görüntüsü, URL veya sohbet mesajına yazılmaz.

### Web Push

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<YENI_PUBLIC_KEY>
VAPID_PRIVATE_KEY=<YENI_PRIVATE_KEY>
VAPID_SUBJECT=mailto:<GERCEK_ILETISIM_EPOSTASI>
```

Sohbette daha önce özel anahtar paylaşıldığı için eski VAPID çifti üretimde kullanılmamalı; yeni çift oluşturulmalıdır.

## 2. GitHub Actions secret ve variable’ları

Repo → Settings → Secrets and variables → Actions.

### Secrets

```text
AI_ADMIN_TOKEN
SUPABASE_ACCESS_TOKEN
SUPABASE_DB_PASSWORD
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
VAPID_PRIVATE_KEY
TELEGRAM_BOT_TOKEN        # isteğe bağlı
```

### Variables

```text
AI_ENDPOINT=https://halkaarzim.vercel.app/api/ai
SITE_URL=https://halkaarzim.vercel.app
VAPID_SUBJECT=mailto:<GERCEK_ILETISIM_EPOSTASI>
TELEGRAM_CHANNEL_ID       # isteğe bağlı
```

Özel domain sonrası `AI_ENDPOINT` ve `SITE_URL` güncellenebilir. AI endpoint aynı Vercel projesinde kaldığı sürece iki domain de çalışabilir; canonical olarak tek domain kullanılmalıdır.

## 3. Supabase migration

Gerekli v1 migration’ları:

```text
supabase/migrations/20260806223000_v1_security_and_legal_consents.sql
supabase/migrations/20260806233000_account_deletion_requests.sql
```

GitHub secret’ları doğruysa `Supabase migration validation and apply` workflow’u migration değiştiğinde çalışır:

1. Supabase CLI ile projeyi bağlar.
2. `db push --dry-run --include-all` yapar.
3. Dry-run başarılıysa migration’ları uygular.

Secrets yoksa workflow uyarı vererek veritabanına dokunmaz.

Migration sonrası canlı testler:

1. E-posta ile doğrulanmış kullanıcıyla giriş yap.
2. Kullanıcı adı ve görünen adı değiştir.
3. Aynı kullanıcı adını ikinci hesapta dene; benzersizlik hatası görünmeli.
4. 10 saniye içinde art arda profil güncelle; hız sınırı çalışmalı.
5. GitHub ile giriş yap; sürüm 1.0 koşul kabul kapısı görünmeli.
6. Kabul sonrası sayfa yenilendiğinde kapı tekrar görünmemeli.
7. Hesap silme talebi oluştur; `account_deletion_requests` tablosunda yalnız kendi kaydı oluşmalı.

## 4. Supabase Auth URL ayarları

Supabase → Authentication → URL Configuration.

```text
Site URL:
https://halkaarzim.vercel.app

Redirect URLs:
https://halkaarzim.vercel.app/auth/callback
https://halkaarzim.vercel.app/auth/confirm
https://halkaarzim.vercel.app/auth/confirm?mode=recovery
```

Özel domain alındıktan sonra aynı rotaları yeni domainle ekle ve Site URL’yi yeni canonical domaine geçir.

`http://localhost:3000` production Site URL olarak bırakılmamalıdır.

## 5. GitHub OAuth

GitHub OAuth App callback:

```text
https://yjffzuzldlchswaohwyk.supabase.co/auth/v1/callback
```

Homepage:

```text
https://halkaarzim.vercel.app
```

GitHub Client ID ve Secret yalnız Supabase GitHub provider alanına girilir.

## 6. Gemini günlük üretim hattı

Gerekli ayarlar tamamlandığında `.github/workflows/data-sync.yml` her gün:

1. Resmî veri snapshot’ını günceller.
2. Kaynak hash’i değişen en fazla 5 kaydı AI endpoint’e gönderir.
3. Gemini yapılandırılmış JSON üretir.
4. Yasak yatırım yönlendirmesi kontrol edilir.
5. Model kullanılamazsa deterministik kaynak özeti korunur.
6. Güncel veri ve sosyal içerik paketi commit edilir.

İlk testte `workflow_dispatch` ile manuel çalıştır ve loglarda şunları ara:

```text
AI report updated
AI generation finished
```

Gerçek API anahtarı yoksa:

```text
AI generation disabled
```

mesajı normaldir; workflow başarısız olmamalıdır.

## 7. Telegram kanalı

1. BotFather ile bot oluştur.
2. Botu kanala yönetici ekle ve mesaj gönderme yetkisi ver.
3. `TELEGRAM_BOT_TOKEN` secret’ını ekle.
4. `TELEGRAM_CHANNEL_ID` variable’ını `@kanaladi` veya sayısal chat ID olarak ekle.
5. Data sync workflow’unu manuel çalıştır.

Gönderim tekrar koruması `data/generated/telegram-state.json` dosyasında tutulur. Aynı halka arz ve aynı kaynak güncellemesi tekrar gönderilmez.

## 8. Search Console ve Bing

Özel domain bağlandıktan sonra:

- Google Search Console domain property ekle.
- DNS TXT kaydıyla doğrula.
- `https://halkaarzim.site/sitemap.xml` gönder.
- Bing Webmaster Tools’a siteyi ekle ve sitemap’i gönder.
- `robots.txt`, canonical ve yönlendirmeleri URL Inspection ile kontrol et.

Vercel önizleme domainleri Search Console’a eklenmez.

## 9. Hukuki iletişim bilgileri

Yayından önce aşağıdaki gerçek bilgiler belirlenmelidir:

- Veri sorumlusu gerçek kişi adı veya şirket unvanı
- Tebligata/başvuruya uygun açık adres
- KVKK ve içerik başvuru e-postası
- Güvenlik bildirimi e-postası
- Varsa ticaret sicili/MERSİS/vergi ve iletişim bilgileri

Bilgiler belirlendiğinde:

```env
NEXT_PUBLIC_LEGAL_CONTACT_EMAIL=...
```

ayarlanmalı ve yasal metinlerdeki “eksik alan” uyarıları gerçek bilgilerle güncellenmelidir.

## 10. Yayın kontrolü

Son release commit’inde:

- GitHub CI: success
- CodeQL: success veya incelenmiş uyarı
- Vercel: production success
- Supabase migration: success
- E-posta login: pass
- GitHub login: pass
- Profil update: pass
- Hesap silme talebi: pass
- iPhone 13 Safari: pass
- Masaüstü Chrome/Edge: pass
- Dark/light mode: pass
- `/feed.xml`, `/sitemap.xml`, `/robots.txt`, `/.well-known/security.txt`: HTTP 200
- Security headers: response üzerinde mevcut

olmadan kontrol listesinde “tam yayınlandı” durumu verilmemelidir.
