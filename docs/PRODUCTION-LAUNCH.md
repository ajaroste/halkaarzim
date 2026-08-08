# HalkaArzım v1.0 Production Launch Gate

Hedef alan adı: `halkaarzim.net`

## Teknik durum

- [x] V1 production release gate başarılı
- [x] Build, security and browser tests başarılı
- [x] CodeQL security analysis başarılı
- [x] Vercel production deploy başarılı
- [x] Supabase tabanlı auth / profil / yorum / takip altyapısı mevcut
- [x] HalkaArz AI server-side Gemini entegrasyonu mevcut
- [x] Sitemap, robots ve canonical URL altyapısı `NEXT_PUBLIC_SITE_URL` üzerinden yönetiliyor

## Domain geçişi

Domain satın alınıp Vercel'e bağlandıktan sonra:

- [ ] `halkaarzim.net` Vercel Production domain olarak eklenecek
- [ ] `www.halkaarzim.net` ana domaine yönlendirilecek
- [ ] `NEXT_PUBLIC_SITE_URL=https://halkaarzim.net` yapılacak
- [ ] yeni env ile production redeploy yapılacak
- [ ] `/robots.txt`, `/sitemap.xml`, canonical ve OpenGraph URL'leri kontrol edilecek
- [ ] Supabase Auth Site URL / Redirect URL listesine yeni domain eklenecek
- [ ] e-posta doğrulama ve şifre sıfırlama dönüş URL'leri yeni domainle smoke test edilecek
- [ ] Web Push kullanılıyorsa yeni origin üzerinde yeniden test edilecek

## Yayını engelleyen hukuki eksik

Aşağıdaki bilgi tahmin edilmemeli veya uydurulmamalıdır:

- [ ] Veri sorumlusunun gerçek/yasal adı veya işletme kimliği
- [ ] KVKK başvuruları için kullanılacak resmî iletişim e-postası/kanalı

Bu bilgiler sağlanmadan Gizlilik ve KVKK Aydınlatma Metni'ndeki veri sorumlusu / başvuru bölümü tamamlanmış kabul edilmez.

## Go-live smoke test

- [ ] Ana sayfa 200
- [ ] Halka arz listesi ve filtreler
- [ ] IPO detay sayfası
- [ ] HalkaArz AI sonucu
- [ ] Giriş / kayıt / e-posta doğrulama
- [ ] Hesap / çıkış
- [ ] Takip et / takipten çıkar
- [ ] Yorum gönderme
- [ ] Yorum beğeni / beğenmeme
- [ ] Mobil 390x844 taşma kontrolü
- [ ] Desktop smoke test
- [ ] Hukuk sayfaları ve footer bağlantıları
- [ ] robots / sitemap / canonical

## İlk 1 yıl takip edilecek metrikler

Premium kapsam dışıdır. İlk yılın amacı ürün-pazar sinyalini ölçmektir:

- organik ziyaret ve indekslenen sayfa sayısı
- IPO detay sayfası görüntülenmeleri
- geri dönen kullanıcı oranı
- kayıt dönüşümü
- takip özelliği kullanımı
- yorum üretimi
- HalkaArz AI kullanım / hata oranı
- Vercel, Supabase ve Gemini kota/maliyet eğilimi

Son güncelleme: 2026-08-08
