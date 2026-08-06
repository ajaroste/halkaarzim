# HalkaArzım v1.0

HalkaArzım; Türkiye’deki halka arzları resmî ve açık kaynaklarla eşleştiren, açıklanmayan alanları tahmin etmeyen ve bilgiyi sade bir arayüzde sunan bağımsız Next.js uygulamasıdır.

> Bir aracı kurum veya resmî kurum değildir. İçerikler yatırım danışmanlığı veya getiri tahmini değildir.

## Canlı ortam

- Site: `https://halkaarzim.vercel.app`
- Production: Vercel
- Auth/veritabanı: Supabase
- Günlük veri ve bildirim hattı: GitHub Actions
- AI sağlayıcısı: Gemini 2.5 Flash (server-only anahtar yapılandırıldığında)

## Özellikler

- SPK kaynaklı halka arz kayıtları
- Durum, tarih ve şirket filtreleri
- Mobil ve masaüstü için yeniden tasarlanmış detay sayfaları
- Sermaye artırımı / ortak satışı karşılaştırması
- Fon kullanımı, finansal görünüm ve eksik veri durumları
- TradingView grafik entegrasyonu
- Lot senaryo aracı
- E-posta doğrulamalı Supabase Auth
- GitHub OAuth
- Profil, takip listesi ve yorum altyapısı
- Tarayıcı/Web Push bildirimleri ve test butonu
- Hesap silme talebi
- Kaynak bağlı Gemini analizi ve deterministik fallback
- RSS, sitemap, JSON-LD, paylaşım ve iç bağlantılar
- Telegram/X/Instagram içerik üretim otomasyonu
- Dark tema ve iPhone 13 dâhil responsive tasarım
- KVKK/gizlilik, koşullar, çerez, AI ve içerik kaldırma sayfaları
- CSP, HSTS, CodeQL, Dependabot ve CI güvenlik kontrolleri

## Yerel kurulum

```bash
npm ci
npm run dev
```

Ortam değişkenleri için:

```bash
cp .env.example .env.local
```

Gerçek secret değerleri commit edilmez.

## Test

```bash
npm run test:all
npm run build
```

Tam CI sırası:

- Production dependency audit
- Python parser/enrichment testleri
- Domain testleri
- Supabase sözleşme testleri
- Güvenlik contract ve secret taraması
- TypeScript typecheck
- Veri/kaynak doğrulama
- Next.js production build
- Chromium browser QA

## Production kurulumu

- [Production ayarları](docs/PRODUCTION_SETUP.md)
- [120 maddelik v1 kontrol listesi](docs/V1_RELEASE_CHECKLIST.md)
- [Trafik ve kullanıcı kazanım planı](docs/GROWTH_PLAN.md)
- [Hukuki risk kaydı](docs/LEGAL_RISK_REGISTER.md)
- [Supabase kurulumu](docs/SUPABASE_SETUP.md)
- [Güvenlik politikası](SECURITY.md)

## Kritik yayın öncesi işler

1. Yeni Supabase migration’larını canlı projeye uygula.
2. Sohbette ifşa olmuş eski VAPID anahtar çiftini döndür.
3. Gemini ve AI yönetici secret’larını Vercel/GitHub’a ekle.
4. Veri sorumlusu gerçek adı/unvanı, adresi ve iletişim e-postasını ekle.
5. Hukuki metinleri Türkiye’de yetkili bir hukukçuya incelet.
6. Son CI, Vercel, auth, profil, hesap silme, iPhone 13 ve masaüstü testlerini kapat.

## Sorumlu güvenlik bildirimi

Güvenlik ayrıntılarını herkese açık issue veya yorumda paylaşma. GitHub **Security → Report a vulnerability** alanını kullan. Ayrıntılar `SECURITY.md` dosyasındadır.
