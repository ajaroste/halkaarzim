# HalkaArzım v1.0 — Hukuki ve Editoryal Risk Kaydı

> Bu belge avukat görüşü değildir. Teknik ekip için risk azaltma kaydıdır; gerçek veri sorumlusu ve ticari model belirlendikten sonra Türkiye’de yetkili bir hukukçu tarafından incelenmelidir.

## Risk ölçeği

- 🔴 **Yüksek:** Yayın veya büyüme öncesinde işlem gerekir.
- 🟡 **Orta:** Kontroller çalışmalı ve düzenli izlenmelidir.
- 🟢 **Düşük:** Mevcut önlem yeterli görünür; değişiklikte yeniden değerlendirilir.

## Risk tablosu

| Konu | Risk | Olası sonuç | Uygulanan kontrol | Kalan işlem |
|---|:---:|---|---|---|
| Yatırım danışmanlığı algısı | 🔴 | SPK düzenlemeleri, kullanıcı uyuşmazlığı, itibar kaybı | Ayrı uyarı sayfası, detay bağlantısı, yasak ifade filtresi, “ön analiz” dili | Tüm eski içerikleri editoryal taramadan geçir; hukukçu görüşü al |
| AI skorunun “alınır” puanı sanılması | 🔴 | Yanıltıcı beklenti ve zarar iddiası | Puanın veri kapsamı olduğu açıklanıyor, getiri tahmini olmadığı yazıyor | Arayüzde “AI puanı” yerine “veri kapsamı/ön analiz” terminolojisini tüm sayfalarda doğrula |
| Gerçek veri sorumlusu bilgilerinin eksikliği | 🔴 | KVKK aydınlatmasının eksik kalması | Metinlerde uydurma bilgi kullanılmadı ve eksik açıklandı | Ad/unvan, açık adres, başvuru e-postası, varsa MERSİS/vergi bilgisi ekle |
| Yurt dışı veri aktarımı | 🔴 | KVKK aktarım şartlarının karşılanmaması | Supabase/Vercel/AI sağlayıcıları açıklandı; kullanıcı verisi AI’a gönderilmiyor | Sağlayıcı bölgeleri ve sözleşmeleri hukukçu ile değerlendir; gerekli mekanizmayı kur |
| Açık rıza ve çerezler | 🔴 | Analitik/reklam çerezlerinin izinsiz çalışması | Reklam anahtarları yoksa sistem kapalı; temel banner mevcut | Reklam/analytics öncesi kategori bazlı consent yönetimi ve kayıt sistemi kur |
| Kullanıcı yorumlarında manipülasyon | 🔴 | Piyasa manipülasyonu iddiası, kullanıcı zararı | Moderasyon, raporlama, yasak içerik kuralları | Otomatik spam/koordineli davranış sinyalleri ve hızlı müdahale prosedürü |
| Kullanıcı yorumunda kişisel veri | 🔴 | KVKK ihlali | Bildir/şikâyet akışı ve kaldırma prosedürü | PII algılama, moderatör SLA’sı ve veri ihlali prosedürü |
| Resmî kurumla bağlantı izlenimi | 🟡 | Marka/itibar ve yanıltıcılık iddiası | “Bağımsız platform”, resmî kurum değildir açıklaması | SPK/KAP logosu veya resmî görsel kullanılmadığını periyodik kontrol et |
| Şirket logoları ve markalar | 🟡 | Ticari marka/telif talebi | Metin/ticker tabanlı özgün ikon yaklaşımı | İleride logo kullanılırsa lisans/izin kaydı tut |
| İzahname ve raporların kopyalanması | 🟡 | Telif/veri tabanı hakkı iddiası | Kısa kaynaklı özet ve belge bağlantısı | Uzun alıntı, tam sayfa görseli ve toplu yeniden yayınlamayı engelle |
| KAP/veri kullanım koşulları | 🔴 | Erişim engeli, sözleşme/lisans ihtilafı | Resmî belge bağlantısı ve kaynak etiketi | Otomatik kullanımın güncel koşullarını doğrula; gerekli lisans/izin olmadan API’yi çoğaltma |
| TradingView kullanımı | 🟡 | Embed/lisans ihlali | Resmî widget yaklaşımı | Marka gösterimi ve kullanım koşullarını koru; ham veriyi yeniden satma |
| Haber başlığı ve özetleri | 🟡 | Yayıncı telif talebi | Resmî/özgün kaynak önceliği | Haber metnini kopyalama; kısa özgün özet + kaynak bağlantısı kullan |
| AI sağlayıcısına kişisel veri gönderimi | 🔴 | Gizlilik/aktarım ihlali | AI API yalnız kaynaklı şirket JSON’u kabul ediyor | Loglarda ve gelecekteki promptlarda kullanıcı verisi bulunmadığını test et |
| AI hallüsinasyonu | 🔴 | Şirket hakkında yanlış iddia/itibar zararı | Kaynak zorunluluğu, JSON şema, düşük sıcaklık, fallback, insan kontrolü | Yayın öncesi onay kuyruğunu operasyonel olarak zorunlu hâle getir |
| Şirket hakkında risk/dava iddiası | 🔴 | Haksız fiil, itibar ve düzeltme talebi | Kaynak/sayfa zorunluluğu ve kaldırma prosedürü | Her olumsuz iddia için birincil belge ve tarih tut; eski iddiayı güncelle |
| Kullanıcı hesabı ve e-posta | 🟡 | Yetkisiz erişim, kimlik avı | Supabase Auth, doğrulama, parola reset, güvenlik başlıkları | E-posta şablonlarında gerçek domain ve sahtecilik uyarısı; SPF/DKIM/DMARC |
| Sosyal giriş hukuki kabul | 🟡 | Koşul kabul kaydının eksikliği | İlk girişte sürümlü zorunlu kabul kapısı | Migration ile ayrı kabul kaydını canlıda doğrula |
| Çocuk kullanıcılar | 🟡 | Yaş ve rıza uyuşmazlığı | Finansal işlem hizmeti sunulmuyor | Hedef yaş/kullanıcı politikasını hukukçu ile belirle; gerekiyorsa yaş sınırı ekle |
| Reklam ve sponsorlu içerik | 🔴 | Örtülü reklam, analiz bağımsızlığının bozulması | Sponsorun puana müdahale edemeyeceği koşullarda yazılı | Reklam/sponsor etiketi, ticari iletişim ve tüketici mevzuatı incelemesi |
| E-posta/Telegram/push pazarlaması | 🔴 | İzinsiz ticari ileti, şikâyet | Push kullanıcı izniyle, Telegram kullanıcı katılımıyla | E-posta için açık izin ve gerektiğinde İYS süreci; kolay çıkış mekanizması |
| Veri saklama süresi | 🟡 | Gereğinden uzun veri saklama | Politika taslağında minimizasyon | Gerçek saklama çizelgesi, silme işi ve yedek yaşam döngüsü oluştur |
| Hesap silme | 🔴 | KVKK hakkının uygulanamaması | Genel silme hakkı metinde var | Uygulamada self-service hesap silme ve yorum anonimleştirme akışı ekle |
| Veri ihlali müdahalesi | 🔴 | Bildirim gecikmesi ve zarar | SECURITY.md, audit log, token döndürme önerisi | Yazılı olay müdahale planı, sorumlular ve iletişim zinciri |
| Alan adı/marka | 🟡 | İsim ihtilafı veya sahte site | Özgün marka kullanımı | Marka araştırması ve uygun görülürse tescil; benzer domainleri koruma |
| Yanlış veya güncel olmayan tarih | 🟡 | Kullanıcı zararı/şikâyet | Kaynak zamanı, veri notları, otomasyon | Kritik tarihlerde manuel ikinci kontrol ve düzeltme SLA’sı |
| Kesinti veya veri kaybı | 🟡 | Hizmet kaybı ve yorum/veri kaybı | GitHub veri snapshot’ı | Supabase yedekleme, geri yükleme testi ve olay iletişimi |
| Hesap/yorum moderasyon kararı | 🟡 | Haksız kaldırma iddiası | İtiraz prosedürü ve audit log | Moderasyon gerekçeleri, süreler ve rol ayrımı |
| Güvenlik araştırmacısı bildirimi | 🟢 | Açığın kamuya erken yayılması | SECURITY.md ve security.txt | Geçerli iletişim e-postası ekle; GitHub private advisories’i etkin tut |

## Yayın öncesi hukuki kapılar

Aşağıdaki koşullar sağlanmadan “tam hukuki uyum” ifadesi kullanılmamalıdır:

1. Veri sorumlusunun gerçek kimliği ve iletişim bilgileri eklenmiş olmalı.
2. Veri akış haritası ve kullanılan sağlayıcı sözleşmeleri hukukçu tarafından incelenmiş olmalı.
3. Yurt dışı aktarım şartları yazılı olarak değerlendirilmiş olmalı.
4. Reklam/analytics devreye girecekse kategori bazlı consent sistemi hazırlanmış olmalı.
5. E-posta pazarlaması başlayacaksa izin/çıkış ve gerektiğinde İYS yükümlülüğü değerlendirilmiş olmalı.
6. KAP, piyasa verisi, haber ve TradingView kullanım koşulları doğrulanmış olmalı.
7. Hesap silme, veri başvurusu ve içerik kaldırma süreçlerinin sorumluları belirlenmiş olmalı.
8. “AI puanı” ve yatırım yönlendirmesi algısı oluşturan tüm metinler son editoryal kontrolden geçmiş olmalı.

## Editoryal yasak kelime listesi

Bağlamdan bağımsız otomatik filtre tek başına yeterli değildir; yine de aşağıdaki ifadeler yayın öncesi inceleme tetiklemelidir:

- alınır / kesin alın
- sat / elden çıkar
- kaçırma / son fırsat
- kesin kazanç / garanti getiri
- kesin tavan / şu kadar tavan
- risksiz / güvenli yatırım
- fiyat hedefi / şu fiyata gider
- içeriden bilgi / kesin duyum

Bunun yerine somut ve kaynaklı ifade kullanılmalıdır:

- “Temel arzın %X’i sermaye artırımıdır.”
- “Belgede şu risk başlığı yer almaktadır.”
- “Talep tarihi henüz açıklanmamıştır.”
- “Bu gösterge yatırım getirisi tahmini değildir.”
