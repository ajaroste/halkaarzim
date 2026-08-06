# HalkaArzım v1.0 — Yayına Hazır Kontrol Listesi

**Tarih:** 6 Ağustos 2026  
**Kapsam:** Ücretsiz halka arz bilgi platformu; Premium kapsam dışıdır.  
**Durum işaretleri:** ✅ Tamamlandı · 🟡 Yapılandırma/test bekliyor · 🔴 Yayın öncesi kritik · ⚪ Sonraki iyileştirme

> Bu liste teknik ve operasyonel bir teslimat kaydıdır. Hukuki uygunluk veya “hacklenemezlik” garantisi değildir.

## 1. Ürün ve bilgi mimarisi — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 1 | Ana sayfa değer önerisi açık | ✅ | Resmî kaynak ve sade ön analiz odağı |
| 2 | Halka arz liste sayfası mevcut | ✅ | 33 kayıtlık veri setiyle çalışıyor |
| 3 | Halka arz detay rotaları statik üretiliyor | ✅ | `/arz/[slug]` |
| 4 | Detay sayfasında hızlı özet alanı | ✅ | Fiyat, lot, tarih, dağıtım |
| 5 | Detay sayfasında bölüm navigasyonu | ✅ | Özet, yapı, belge, piyasa, gündem, yorum |
| 6 | Eksik veri büyük boş kart yerine kısa durumla gösteriliyor | ✅ | `EmptyState` yapısı |
| 7 | Masaüstü bilgi rayı | ✅ | Hızlı bilgiler ve hukuki uyarı |
| 8 | Mobil tek kolon düzeni | ✅ | iPhone 13 genişliği için CSS kırılımı |
| 9 | İlgili halka arz iç bağlantıları | ✅ | Sektör/yakın kayıtlar |
| 10 | Kullanıcı için açık yatırım tavsiyesi uyarısı | ✅ | Sayfa ve detay bağlantısı |

## 2. Veri kalitesi ve kaynaklar — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 11 | Her kayıt benzersiz UUID ve slug taşıyor | ✅ | Domain testleri var |
| 12 | En az bir HTTPS kaynak zorunluluğu | ✅ | Veri doğrulama scriptinde |
| 13 | SPK bülteni kaynak etiketi | ✅ | Kayıtlarda belge/sayfa bilgisi |
| 14 | İkincil kaynak açıkça etiketleniyor | ✅ | Resmî veriyle karıştırılmıyor |
| 15 | Açıklanmayan alanlar tahmin edilmiyor | ✅ | “Henüz açıklanmadı” yaklaşımı |
| 16 | Veri güncelleme zamanı saklanıyor | ✅ | `sourceUpdatedAt` / `generatedAt` |
| 17 | Finansal tablolar yoksa boş değer uydurulmuyor | ✅ | Kompakt eksik veri durumu |
| 18 | Fon kullanım planı yoksa yüzdeler üretilmiyor | ✅ | Kaynak geldikten sonra işleniyor |
| 19 | Günlük veri workflow’u mevcut | ✅ | GitHub Actions |
| 20 | Canlı ağ senkronunun tüm kaynak koşulları doğrulandı | 🟡 | Sağlayıcı şartları ve stabilite düzenli izlenmeli |

## 3. Gemini ve AI güvenilirliği — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 21 | Gemini Vercel sunucu API’sine eklendi | ✅ | `gemini-2.5-flash` varsayılan |
| 22 | Gemini anahtarı tarayıcıya gönderilmiyor | ✅ | `GEMINI_API_KEY`, `NEXT_PUBLIC_` yok |
| 23 | AI uç noktası yönetici tokenı istiyor | ✅ | Sabit zamanlı hash karşılaştırması |
| 24 | İstek gövdesi sınırı | ✅ | 128 KB |
| 25 | API hız sınırlaması | ✅ | 10 istek/dakika best-effort |
| 26 | Model yanıtı yapılandırılmış JSON | ✅ | Şema: özet, güçlü yön, risk, eksik, güven |
| 27 | Kaynaksız AI çağrısı reddediliyor | ✅ | Kurallı fallback döner |
| 28 | Model kesilirse deterministik fallback | ✅ | Site boş kalmaz |
| 29 | Kaynak hash’i değişmedikçe yeniden üretmeme | ✅ | Günlük pipeline’da cache |
| 30 | Gerçek Gemini üretimi aktif | 🔴 | Vercel `GEMINI_API_KEY`, Vercel+GitHub aynı `AI_ADMIN_TOKEN`, GitHub `AI_ENDPOINT` gerekir |

## 4. Kimlik doğrulama ve kullanıcı hesabı — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 31 | E-posta/parola kayıt | ✅ | Supabase Auth |
| 32 | E-posta doğrulama akışı | ✅ | Redirect kodu hazır |
| 33 | Parola sıfırlama | ✅ | E-posta akışı mevcut |
| 34 | GitHub OAuth butonu | ✅ | Sağlayıcı yapılandırmasına bağlı |
| 35 | Spotify/LinkedIn girişleri kaldırıldı | ✅ | Kapsam dışı |
| 36 | Kayıtta koşul/gizlilik onayı görünür | ✅ | Zorunlu checkbox |
| 37 | Hukuki kabul sürümü metadata’ya yazılıyor | ✅ | v1.0 ve zaman damgası |
| 38 | Kabul kaydı ayrı Supabase tablosuna taşınıyor | 🟡 | Migration uygulanınca aktif |
| 39 | Profil güncelleme doğrudan tablo PATCH’i yapmıyor | ✅ | Güvenli RPC’ye geçirildi |
| 40 | Canlı profil güncelleme yetki hatası çözüldü | 🔴 | Yeni migration canlı Supabase’e uygulanmalı |

## 5. Supabase, RLS ve veritabanı — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 41 | Temel tablolar ve RLS migration’ları | ✅ | Depoda mevcut |
| 42 | Kullanıcı yalnız kendi profilini okuyor | ✅ | RLS politikası |
| 43 | Profil doğrudan UPDATE yetkisi kaldırılıyor | 🟡 | v1 migration uygulanınca |
| 44 | Profil RPC girdi doğrulaması | ✅ | Kullanıcı adı/görünen ad kuralları |
| 45 | Profil güncelleme hız sınırı | 🟡 | Migration uygulanınca 10 saniye |
| 46 | Profil güncelleme audit logu | 🟡 | Migration uygulanınca |
| 47 | Hukuki kabul tablosu RLS | 🟡 | Migration uygulanınca |
| 48 | Bildirim tercihi güvenli RPC | 🟡 | Migration uygulanınca |
| 49 | Watchlist dış IPO kimliği FK sorunu için migration | ✅ | Depoda mevcut |
| 50 | Otomatik migration workflow’u | ✅ | Secret varsa dry-run + apply; yoksa güvenli skip |

## 6. Tarayıcı ve API güvenliği — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 51 | Content-Security-Policy | ✅ | Kaynak allowlist’i |
| 52 | HSTS | ✅ | 1 yıl + subdomain |
| 53 | Clickjacking koruması | ✅ | DENY + frame-ancestors none |
| 54 | MIME sniffing koruması | ✅ | nosniff |
| 55 | Referrer Policy | ✅ | strict-origin-when-cross-origin |
| 56 | Permissions Policy | ✅ | Kamera/mikrofon/konum vb. kapalı |
| 57 | Next.js powered-by başlığı kapalı | ✅ | `poweredByHeader: false` |
| 58 | API cevapları no-store | ✅ | Global API ve AI özel başlıkları |
| 59 | Sunucuda upstream hata ayrıntısı sızdırmama | ✅ | Gemini/Cloudflare hata detayı kullanıcıya verilmez |
| 60 | Mutlak saldırı güvenliği garantisi | ⚪ | Hiçbir internet sistemi için verilemez; sürekli test gerekir |

## 7. Güvenlik testleri ve bakım — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 61 | Güvenlik contract testleri | ✅ | Başlık, AI auth, robots, legal, env |
| 62 | Kaynak kod secret taraması | ✅ | API key/JWT/private key kalıpları |
| 63 | İstemci bileşeninde private env kontrolü | ✅ | CI statik tarayıcı |
| 64 | `eval` / `new Function` kontrolü | ✅ | CI’da engelleniyor |
| 65 | `dangerouslySetInnerHTML` allowlist | ✅ | Tema boot script ve JSON-LD |
| 66 | Production dependency audit | ✅ | CI’da high/critical engeli |
| 67 | CodeQL | ✅ | Push/PR/haftalık |
| 68 | Dependabot | ✅ | npm ve Actions güncellemeleri |
| 69 | Güvenlik bildirim politikası | ✅ | `SECURITY.md` |
| 70 | Canlı penetrasyon testi | 🟡 | Yetkili, kontrollü staging/canlı test turu gerekir |

## 8. SEO teknik altyapısı — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 71 | Canonical URL merkezi | ✅ | `NEXT_PUBLIC_SITE_URL` |
| 72 | Sayfa başlık şablonu | ✅ | Next metadata |
| 73 | Detay bazlı meta title/description | ✅ | Şirket, fiyat, lot, tarih hedefi |
| 74 | Open Graph | ✅ | Ana ve detay sayfaları |
| 75 | Twitter/X card | ✅ | Summary card |
| 76 | Sitemap | ✅ | Ana, liste, detay, yasal ve güven sayfaları |
| 77 | Robots.txt | ✅ | Admin, profil, auth ve API kapalı |
| 78 | Özel sayfalarda route noindex | ✅ | Admin/profil/auth layoutları |
| 79 | BreadcrumbList JSON-LD | ✅ | Detay sayfalarında |
| 80 | Article JSON-LD | ✅ | Kaynaklı ön analiz için |

## 9. Organik büyüme ve paylaşım — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 81 | RSS feed | ✅ | `/feed.xml` |
| 82 | Native paylaş butonu | ✅ | Mobil paylaşım menüsü |
| 83 | Bağlantı kopyalama | ✅ | Detay sayfası |
| 84 | X paylaşım bağlantısı | ✅ | Kaynaklı başlıkla |
| 85 | WhatsApp paylaşımı | ✅ | Detay sayfası |
| 86 | İç bağlantı/ilgili arzlar | ✅ | Detay altında 4 kayıt |
| 87 | Otomatik X metin paketi | ✅ | Günlük JSON içerik paketi |
| 88 | Instagram carousel metin paketi | ✅ | 5 slaytlık taslak |
| 89 | Kısa video senaryosu | ✅ | Her güncel arz için |
| 90 | Search Console/Bing doğrulaması | 🔴 | Alan adı ve kullanıcı hesap erişimi gerekir |

## 10. Bildirim ve dağıtım kanalları — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 91 | Tarayıcı bildirim izni | ✅ | Kullanıcı eylemiyle |
| 92 | Push aboneliğini Supabase’e kaydetme | ✅ | RPC altyapısı |
| 93 | Bildirim test butonu | ✅ | Profil sayfası |
| 94 | Yeni arz bildirim kuyruğu | ✅ | Data sync/Supabase altyapısı |
| 95 | VAPID secret sunucu tarafında | ✅ | GitHub secret üzerinden |
| 96 | VAPID anahtarının üretim güvenliği | 🔴 | Sohbette paylaşılan eski çift döndürülmeli |
| 97 | Telegram içerik üretimi | ✅ | HTML mesaj paketi |
| 98 | Telegram tekrar gönderme koruması | ✅ | IPO + kaynak zamanı fingerprint |
| 99 | Telegram canlı kanal gönderimi | 🟡 | Bot token ve kanal ID gerekir |
| 100 | E-posta bülteni canlı teslimi | 🟡 | Brevo/başka sağlayıcı anahtarı ve izinli liste gerekir |

## 11. Hukuki ve editoryal koruma — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 101 | Gizlilik/KVKK metni | ✅ | Teknik gerçeklerle uyumlu taslak |
| 102 | Kullanım koşulları | ✅ | Hesap, yorum, veri, sorumluluk |
| 103 | Çerez politikası | ✅ | Çerez/localStorage/push/reklam |
| 104 | AI kullanım politikası | ✅ | Kaynak, model, yasak ifade, insan kontrolü |
| 105 | Yatırım tavsiyesi değildir sayfası | ✅ | Skor/lot/grafik/yorum ayrımı |
| 106 | İçerik kaldırma prosedürü | ✅ | Yanlış bilgi, veri, telif, güvenlik |
| 107 | Yasal sayfalar footer ve sitemap’te | ✅ | Görünür bağlantılar |
| 108 | Veri sorumlusu adı/unvanı/adresi | 🔴 | Gerçek bilgi sağlanmadı; uydurulmadı |
| 109 | Geçerli hukuk/başvuru e-postası | 🔴 | `NEXT_PUBLIC_LEGAL_CONTACT_EMAIL` gerekir |
| 110 | Bağımsız hukukçu incelemesi | 🔴 | Yayın ve reklam öncesi önerilir |

## 12. Yayın, gözlemleme ve operasyon — 10 madde

| # | Kontrol | Durum | Not |
|---:|---|:---:|---|
| 111 | Package sürümü 1.0.0 | ✅ | `package.json` |
| 112 | Vercel otomatik deploy | ✅ | `main` bağlantısı mevcut |
| 113 | Production build CI | ✅ | Workflow’da zorunlu |
| 114 | TypeScript typecheck | ✅ | Workflow’da zorunlu |
| 115 | Python parser ve AI/growth testleri | ✅ | Workflow’a bağlı |
| 116 | Browser QA | ✅ | Chromium QA adımı mevcut |
| 117 | Son v1 commit CI sonucu | 🟡 | Son commit workflow sonucu doğrulanmalı |
| 118 | Son v1 Vercel deployment sonucu | 🟡 | Production success ve canlı smoke test doğrulanmalı |
| 119 | `halkaarzim.site` DNS/canonical geçişi | 🟡 | Domain satın alınıp Vercel’e bağlanınca |
| 120 | Yedekleme/geri dönüş provası | 🔴 | Supabase backup/restore ve release rollback tatbikatı yapılmalı |

## Yayın kararı

### Kod açısından yayınlanabilir çekirdek

- Kaynaklı halka arz sayfaları
- E-posta/GitHub giriş arayüzü
- Yorum/takip/bildirim kodu
- Yeni detay tasarımı
- SEO/RSS/paylaşım
- Güvenlik başlıkları ve CI kontrolleri
- Gemini için güvenli sunucu altyapısı
- Hukuki metinlerin teknik taslakları

### Canlı üretim için kritik olarak kalanlar

1. Yeni Supabase migration’ını uygulamak ve profil güncellemesini canlı test etmek.
2. Eski/sohbette paylaşılan VAPID anahtar çiftini döndürmek.
3. Gemini ve AI yönetici secret’larını Vercel/GitHub’a eklemek.
4. Veri sorumlusu gerçek adı/unvanı, adresi ve başvuru e-postasını eklemek.
5. Hukukçu incelemesi yapmak.
6. Son CI, Vercel deploy, iPhone 13 ve masaüstü smoke testlerini başarıyla kapatmak.
7. Supabase yedekleme/geri dönüş prosedürünü test etmek.
