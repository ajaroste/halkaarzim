# HalkaArzım — v1.0.0-rc.3

Gerçek SPK/KAP kaynaklarına dayalı, Vercel ve Cloudflare Workers/OpenNext uyumlu Next.js halka arz platformu. Kurgusal şirket kaydı içermez.

## Mevcut veri kapsamı

- **33 gerçek halka arz kaydı**
- **30 kayıt**, 2026 yılına ait **15 resmî SPK bülteninden** ayrıştırıldı
- **3 kayıt**, önceki yıl onaylanıp 2026'da talep gören resmî KAP kaynaklı devreden kayıttır
- 33 kaydın tamamında en az bir resmî SPK veya KAP bağlantısı bulunur
- Açıklanmayan alanlar tahmin edilmez; arayüzde açıkça belirtilir

Veri özeti `data/generated/ipos.json`, belge hash ve sayfa indeksi `data/generated/document-index.json` içindedir.

## Tamamlanan ürün özellikleri

- Aktif, yaklaşan, onaylı, tamamlanan, işlem gören ve ertelenen halka arz durumları
- Şirket/kod/bülten araması, filtreleme ve sıralama
- Her şirket için ayrı SEO uyumlu detay rotası
- SPK sermaye artışı, ortak satışı, ek satış ve fiyat ayrıştırması
- Takvim, ilk işlem günü, katılımcı, arz büyüklüğü, aracı kurum ve halka açıklık zenginleştirmesi
- Kaynak sınırlı deterministik AI ön analizi; opsiyonel Cloudflare Workers AI
- Belge hash, sayfa sayısı ve kanıt indeksi
- TradingView grafik alanı; yalnız borsa kodu olduğunda açılır
- Fon kullanımı, finansallar ve vaat takibi için kaynak zorunlu belge çıkarımı ve boş durumlar
- Lot tahmin aracı; yalnız bireysel tahsisat biliniyorsa açılır
- Supabase Auth: kayıt, giriş, oturum yenileme, çıkış ve parola sıfırlama
- Hesaba bağlı takip listesi ve ücretsiz Web Push altyapısı
- Yorum, faydalı oy, şikâyet, sunucu tarafı moderasyon ve hız sınırları
- Admin/moderatör rolleri, yorum kuyruğu, halka arz düzeltme ve belge ekleme
- RLS, güvenlik tanımlı RPC'ler ve audit log
- AdSense reklam alanları, dinamik `ads.txt` ve çerez rızası olmadan reklam yüklememe
- KVKK/gizlilik, kullanım koşulları, metodoloji ve hakkımızda sayfaları
- PWA manifesti, servis worker, sitemap, robots, güvenlik başlıkları
- Günlük SPK güncelleme, Supabase eşitleme ve bildirim GitHub Actions akışı
- 404, hata ve yükleme ekranları


## RC3 düzeltmeleri

- TradingView eski iframe adresi kaldırıldı; resmî Advanced Chart embed kullanılıyor.
- Borsa sembolü her şirket için `BIST:<KOD>` biçiminde sabitleniyor; geçersiz durumda Apple grafiğine düşmüyor.
- Quick Sigorta `QUICK` kodu ve 6 Ağustos 2026 ilk işlem tarihiyle **İşlem görüyor** durumuna alındı.
- Tüm durum filtrelerine kayıt sayacı ve açıklayıcı boş durum eklendi.
- Koyu tema kalıcılığı ve detay grafik teması düzeltildi.

## Yerel kurulum

Gerekli sürümler: Node.js 20.9+, Python 3.13 önerilir.

```bash
python -m pip install -r requirements.txt
npm install
cp .env.example .env.local
npm run data:fixture
npm run dev
```

İnternet erişimli ortamda güncel yılı yeniden taramak için:

```bash
npm run data:update
```

## Supabase Free kurulumu

1. Ücretsiz Supabase projesi oluştur.
2. `sql/schema.sql` dosyasını SQL Editor'da çalıştır.
3. `.env.local` içine `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` ekle.
4. İlk yönetici hesabını oluşturduktan sonra SQL Editor'da rolünü güncelle:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'SENIN_EPOSTAN');
```

5. GitHub Secrets'a `SUPABASE_URL` ve `SUPABASE_SERVICE_ROLE_KEY` ekle. Service role anahtarı hiçbir zaman `NEXT_PUBLIC_*` değişkenine yazılmaz.

## Ücretsiz Web Push

VAPID anahtarı bir kez oluşturulur. Örneğin `py-vapid` veya uyumlu bir araç kullanarak public/private anahtar çifti üret, sonra:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

değerlerini ortam değişkenlerine ekle. Bildirim kuyruğu ve abonelik tabloları `sql/schema.sql` içinde hazırdır.

## Ücretsiz AI

- Cloudflare Workers AI hesabı tanımlanırsa yalnız doğrulanmış yapılandırılmış gerçeklerle özet üretir.
- Anahtar yoksa veya ücretsiz kota biterse `rules-v1/rules-v2` deterministik motoruna döner.
- Her model çıktısı `reviewRequired: true` durumundadır; kişisel tavsiye, fiyat hedefi ve “al/sat” üretmez.

## AdSense

Site onayından sonra aşağıdaki değişkenleri ekle:

- `NEXT_PUBLIC_ADSENSE_CLIENT`
- `NEXT_PUBLIC_ADSENSE_HOME_SLOT`
- `NEXT_PUBLIC_ADSENSE_DETAIL_SLOT`

`/ads.txt` rotası yayıncı kimliğinden otomatik üretilir. Reklam scripti yalnız kullanıcı “Tümüne izin ver” seçeneğini verdikten sonra yüklenir.

## Testler

```bash
npm run test
npm run test:parser
npx tsc --noEmit -p tsconfig.check.json
python scripts/validate-release.py
python scripts/check_environment.py  # canlı secret durumunu gösterir
python scripts/build_qa_site.py
python -m http.server 8765 --directory qa-site
python tests/e2e_qa.py
```

Bu teslimde 4 domain testi, 2 Supabase sözleşme testi, 18 Python veri/belge testi, TypeScript kontrolü, kaynak/güvenlik kontrolü ve 43 Chromium kullanıcı akışı geçmiştir.

## Dağıtım

### Vercel

Repo doğrudan Vercel'e aktarılabilir. Ortam değişkenlerini ekleyip standart `next build` kullanır.

### Cloudflare Workers/OpenNext

```bash
npm run preview:cloudflare
npm run deploy:cloudflare
```

Detaylar: `docs/DEPLOYMENT.md`.

## Dış hesap gerektiren son etkinleştirmeler

Kod içinde eksik bırakılmış demo işlem yoktur; ancak aşağıdakiler hesap sahibi tarafından tanımlanmadıkça canlı servis veremez:

- Supabase proje URL/anahtarları
- Cloudflare AI anahtarı (opsiyonel)
- VAPID anahtarları
- AdSense onayı ve reklam slotları
- Alan adı/DNS

Bu değerler pakete gömülmemiştir; güvenlik gereği yalnız deployment secret olarak eklenmelidir.
