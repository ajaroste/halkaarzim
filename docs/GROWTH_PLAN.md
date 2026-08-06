# HalkaArzım v1.0 — Trafik ve Kullanıcı Kazanım Planı

**Amaç:** Premium satmadan önce güvenilir organik trafik, tekrar ziyaret ve marka araması oluşturmak.  
**Ana vaat:** “Halka arzı sadece görme; resmî kaynağından anla.”

## 1. Başarı ölçümleri

İlk aşamada gelir yerine aşağıdaki metrikler izlenir:

| Dönem | Ana hedef | Yardımcı göstergeler |
|---|---:|---|
| İlk 30 gün | 100 doğrulanmış kullanıcı | 25 bildirim izni, 20 takip listesi, 10 nitelikli yorum |
| 60–90 gün | 1.000 kullanıcı | %25 geri dönen kullanıcı, 250 bildirim aboneliği, 100 marka araması |
| 6–12 ay | 10.000 kullanıcı | Organik aramanın toplam trafiğin çoğunluğunu oluşturması, düzenli direkt trafik |

Takip edilecek teknik KPI’lar:

- İndekslenen halka arz sayfası oranı
- Tıklama oranı (CTR) ve ortalama arama konumu
- Yeni halka arz yayınlama gecikmesi
- Detay sayfasından takip/bildirim dönüşümü
- 7 ve 30 günlük geri dönüş oranı
- Yorum raporlama ve spam oranı
- Kaynak düzeltme taleplerinin çözülme süresi

## 2. SEO anahtar kelime kümeleri

### A. Şirket adı ve ticker

Her halka arz için birincil sayfa:

- `[Şirket] halka arz`
- `[Ticker] halka arz`
- `[Şirket] halka arz fiyatı`
- `[Şirket] halka arz tarihleri`
- `[Şirket] halka arz kaç lot`
- `[Şirket] halka arz yorum`
- `[Şirket] izahname özeti`
- `[Şirket] ortak satışı`
- `[Şirket] fon kullanımı`

Tek URL kullanılmalı; aynı şirket için birbirini kopyalayan çok sayıda ince içerik sayfası açılmamalıdır.

### B. Takvim ve güncel niyet

- bugün halka arz var mı
- bu hafta halka arzlar
- yeni halka arzlar 2026
- SPK onaylı halka arzlar
- talep toplayan halka arzlar
- yaklaşan halka arzlar
- işlem görmeye başlayacak halka arzlar

### C. Öğretici sorgular

- sermaye artırımı ve ortak satışı farkı
- halka arzda eşit dağıtım nedir
- oransal dağıtım nedir
- halka açıklık oranı ne demek
- fiyat tespit raporu nasıl okunur
- izahname riskleri nerede yazar
- halka arz kaç lot verir nasıl hesaplanır

Bu içerikler “alınır mı?” gibi yatırım yönlendirmesi yerine kavram öğretmelidir.

## 3. Sayfa şablonu

Her detay sayfası şu arama niyetlerini tek URL’de cevaplar:

1. Şirket ve durum
2. Fiyat, lot, talep tarihleri, dağıtım
3. Sermaye artırımı ve ortak satışı
4. Fon kullanım planı
5. Finansal görünüm
6. Resmî kaynaklar
7. Eksik veriler
8. Lot senaryosu
9. Piyasa grafiği (işlem başladıysa)
10. Gündem ve kullanıcı yorumları
11. Yatırım tavsiyesi uyarısı
12. Benzer halka arz iç bağlantıları

Başlık ve metinler kaynak değiştiğinde güncellenmeli; yalnız tarih değiştirerek “taze” gösterilmemelidir.

## 4. İndeksleme planı

- Sitemap her halka arz ve güven sayfasını içerir.
- RSS yeni/güncellenmiş halka arzların keşfini kolaylaştırır.
- Profil, admin, auth ve API yolları noindex/robots dışındadır.
- Search Console’da sitemap gönderilir.
- Bing Webmaster Tools’a aynı sitemap eklenir.
- Yeni halka arz yayımlandığında ilgili detay URL’si sosyal kanallardan gerçek kullanıcı trafiği alır.
- Boş, kaynaksız veya yalnız başlıktan oluşan sayfalar indekslenmez.
- Alan adı geçişinde Vercel adresinden özel domaine 308 yönlendirme ve canonical birlikte uygulanır.

## 5. İç bağlantı sistemi

- Ana sayfa → güncel 4 halka arz
- Liste sayfası → filtrelenmiş detaylar
- Detay → aynı sektör/yakın dönem 4 arz
- Gündem → ilgili şirket detayı
- Öğretici içerik → kavramın görüldüğü gerçek halka arz örnekleri
- Yasal/AI politika → detay sayfalarındaki uyarı bağlantıları

Bağlantı metni “buraya tıkla” yerine şirket ve konu adı taşımalıdır.

## 6. İlk 100 kullanıcı

### Hedef kitle

- Halka arzları zaten takip eden arkadaş/iş çevresi
- Finans topluluklarında düzenli kaynak paylaşan kişiler
- Küçük yatırımcı eğitimi yapan içerik üreticileri
- Finans öğrencileri ve yeni yatırımcılar

### Uygulama

1. 20 kişilik kapalı test grubu oluştur.
2. Her kişiye tek görev ver: bir halka arzı bul, kaynağı aç, takip et, bildirim test et.
3. Hataları ve anlaşılmayan terimleri kaydet.
4. “Yeni halka arz açıklandı” bildirimine izin veren ilk kullanıcıları edin.
5. Her yeni arz için tek, kaynaklı sosyal paylaşım yap.
6. Paylaşımlarda “alınır mı” değil “hangi veri açıklandı?” sorusunu cevapla.
7. İçerik üreticilerine reklam teklifi yerine ücretsiz embed/RSS ve kaynak bağlantısı sun.

## 7. İlk 1.000 kullanıcı

- Telegram kanalını aç; günde en fazla birkaç önemli güncelleme gönder.
- X hesabında her kayıt için aynı formatta veri kartı kullan.
- Haftalık “Bu hafta ne değişti?” bülteni yayımla.
- Her detay sayfasına paylaşım ve takip CTA’sı koy.
- Kullanıcı yorumlarını ilk dönemde ön moderasyondan geçir.
- Düzeltme taleplerini görünür ve hızlı çözerek güven oluştur.
- Finans içerik üreticilerine kaynaklı veri sayfası bağlantısı sun; ücretli övgü veya puan müdahalesi kabul etme.

## 8. İlk 10.000 kullanıcı

- Markalı aramaları ve direkt trafiği büyüt.
- Tarihsel halka arz performansını lisans ve yatırım tavsiyesi sınırları içinde ekle.
- Halka arz takvim widget’ı/RSS’i üçüncü taraf sitelere sun.
- Kaynak güncelleme API’si veya herkese açık sınırlı JSON feed değerlendir.
- Kullanıcı kaynak düzeltme programı oluştur.
- Search Console verisine göre düşük kaliteli/tekrarlı sayfaları birleştir.
- Yüksek trafik günlerinde Vercel/Supabase maliyet ve rate limitlerini izle.

## 9. Sosyal medya yayın ilkeleri

### X

- Başlık: şirket + durum
- Dört veri: fiyat, tarih, sermaye artırımı, ortak satışı
- Kaynak sayısı ve detay bağlantısı
- “Yatırım tavsiyesi değildir”
- Kesin getiri, tavan sayısı veya “kaçırma” yok

### Telegram

- Yalnız yeni onay, tarih, sonuç, işlem başlangıcı gibi önemli değişiklikler
- Aynı kaydı tekrar göndermemek için fingerprint
- Mesaj başına tek ana konu
- Kaynağa ve site detayına bağlantı

### Instagram

- 5 slayt: şirket, temel bilgi, arz yapısı, eksik veri, kaynak bağlantısı
- Görselde çok küçük hukuki metin yerine okunabilir kısa uyarı
- Açıklamada kaynak ve tarih

### Kısa video

- 20–35 saniye
- İlk üç saniye: “Ne açıklandı?”
- Tek arz ve en fazla dört veri
- Son: “Açıklanmayan alanları tahmin etmiyoruz.”

### Reddit/Ekşi/forumlar

- Gizli reklam veya sahte kullanıcı hesabı kullanılmaz.
- Topluluk kuralları izin veriyorsa, soruya cevap veren kaynaklı sayfa paylaşılır.
- Aynı bağlantı tekrar tekrar bırakılmaz.
- Eleştiri ve hata bildirimine açık davranılır.

## 10. İçerik takvimi

| Gün | İçerik |
|---|---|
| SPK bülteni günü | Yeni onaylar ve kaynaklı detaylar |
| Talep tarihleri açıklanınca | Tarih/fiyat/dağıtım güncellemesi |
| Talep başlangıcı | Bildirim ve kısa hatırlatma |
| Talep bitişi | Son gün bilgisi; acele/kaçırma dili olmadan |
| Sonuç açıklanınca | Katılımcı ve dağıtım sonucu |
| İlk işlem günü | Kod, tarih ve TradingView bağlantısı |
| Haftalık | “Bu hafta ne değişti?” bülteni |
| Aylık | Veri doğruluğu, düzeltmeler ve ürün changelog’u |

## 11. Teknik otomasyon

Hazır altyapı:

- `/feed.xml` RSS
- Günlük `data-sync.yml`
- `generate_growth_content.py`
- X metni, Telegram HTML, Instagram carousel, kısa video senaryosu
- `send_telegram_updates.py`
- Tekrar gönderme koruması
- Detay paylaşım butonları

Gerekli dış ayarlar:

- GitHub variable `SITE_URL`
- GitHub secret `TELEGRAM_BOT_TOKEN`
- GitHub variable `TELEGRAM_CHANNEL_ID`
- Search Console ve Bing hesap doğrulaması
- Gelecekte e-posta sağlayıcısı için açık izinli liste ve API anahtarı

## 12. Etik ve hukuki büyüme sınırları

- Sponsor analiz puanını değiştiremez.
- Kullanıcıya yapay aciliyet oluşturulmaz.
- “Kesin kazanç”, “garanti tavan”, “güvenli yatırım” kullanılmaz.
- Kullanıcı yorumları reklam kampanyası için izinsiz kullanılmaz.
- E-posta ve push yalnız izinli kullanıcıya gönderilir.
- Başka sitenin tam metni veya görseli izinsiz kopyalanmaz.
- Resmî kurumla bağlantı/ortaklık izlenimi oluşturulmaz.

## İlk 30 günlük çalışma sırası

### Hafta 1

- Domain ve canonical
- Search Console/Bing
- Supabase migration ve canlı auth testi
- Telegram kanalının açılması
- İlk 20 test kullanıcısı

### Hafta 2

- Güncel şirket sorgularının Search Console takibi
- Detay sayfalarında eksik veri ve kaynak düzeltmeleri
- İlk haftalık bülten
- Bildirim dönüşüm ölçümü

### Hafta 3

- İlk eğitim içerikleri
- 3–5 içerik üreticisiyle kaynak/widget görüşmesi
- Yorum moderasyon süresi ve spam analizi

### Hafta 4

- İndekslenmeyen sayfaları inceleme
- CTR düşük başlıkları kaynak doğruluğunu bozmadan iyileştirme
- 100 kullanıcı hedefi değerlendirmesi
- Teknik ve hukuki risk kayıtlarını güncelleme
