import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Gizlilik ve KVKK Aydınlatma Metni",
  description: "HalkaArzım tarafından işlenebilecek kişisel veriler, amaçlar, saklama yaklaşımı ve kullanıcı hakları.",
  alternates: { canonical: "/gizlilik" }
};

const toc = [
  { id: "kapsam", label: "Kapsam" },
  { id: "veriler", label: "İşlenen veriler" },
  { id: "amaclar", label: "Amaçlar" },
  { id: "paylasim", label: "Hizmet sağlayıcılar" },
  { id: "ai", label: "AI işlemleri" },
  { id: "saklama", label: "Saklama ve silme" },
  { id: "haklar", label: "Haklar ve başvuru" },
  { id: "guvenlik", label: "Güvenlik" }
];

export default function PrivacyPage() {
  return <LegalPage eyebrow="Gizlilik" title="Gizlilik ve KVKK Aydınlatma Metni" intro="Hangi verinin neden işlendiğini, hangi hizmetlerin kullanıldığını ve hesabın üzerindeki haklarını açık biçimde anlatır." version="1.0" toc={toc}>
    <section id="kapsam"><h2>1. Kapsam ve veri sorumlusu</h2><p>Bu metin HalkaArzım web sitesi, üyelik sistemi, yorumlar, takip listeleri, tarayıcı bildirimleri ve güvenlik kayıtları için hazırlanmıştır. Veri sorumlusunun gerçek adı veya ticari unvanı, adresi ve başvuru iletişim kanalı yayından önce bu bölüme eklenmelidir.</p><p>HalkaArzım bir aracı kurum, banka, portföy yönetim şirketi veya resmî kurum değildir.</p></section>

    <section id="veriler"><h2>2. İşlenebilecek kişisel veriler</h2><ul><li><strong>Hesap verileri:</strong> e-posta adresi, kullanıcı adı, görünen ad, hesap kimliği ve e-posta doğrulama durumu.</li><li><strong>Kullanıcı içeriği:</strong> yorumlar, yorum şikâyetleri, moderasyon kayıtları ve kullanıcı tarafından seçilen takip listesi.</li><li><strong>Bildirim verileri:</strong> tarayıcı push aboneliği uç noktası, bildirim anahtarları ve kullanıcı aracısı bilgisi.</li><li><strong>Teknik ve güvenlik verileri:</strong> istek zamanı, hata kayıtları, oturum ve kötüye kullanım önleme kayıtları; barındırma ve kimlik doğrulama hizmetlerinin standart günlüklerinde IP adresi ve cihaz bilgileri bulunabilir.</li><li><strong>Tercih verileri:</strong> tema, çerez tercihi ve cihaz üzerinde saklanan işlevsel ayarlar.</li></ul><p>Ödeme veya premium üyelik bu sürümün kapsamında değildir. Kullanıcı yorumları üzerinden özel nitelikli kişisel veri gönderilmemelidir.</p></section>

    <section id="amaclar"><h2>3. İşleme amaçları</h2><ul><li>Hesap oluşturmak, oturumu yönetmek ve e-posta doğrulaması yapmak.</li><li>Yorum, takip listesi ve bildirim özelliklerini sunmak.</li><li>Spam, manipülasyon, yetkisiz erişim ve kötüye kullanımı önlemek.</li><li>Hata gidermek, performansı ölçmek ve hizmet sürekliliğini sağlamak.</li><li>Hukuki talepleri, içerik şikâyetlerini ve kullanıcı başvurularını yönetmek.</li><li>Kullanıcının ayrıca izin vermesi hâlinde analitik veya reklam tercihlerini uygulamak.</li></ul><p>Gerekli olmayan reklam ve analitik teknolojileri açık tercih alınmadan etkinleştirilmemelidir.</p></section>

    <section id="paylasim"><h2>4. Hizmet sağlayıcılar ve aktarımlar</h2><p>Hizmetin çalışması için Supabase benzeri kimlik doğrulama/veritabanı sağlayıcıları, Vercel benzeri barındırma sağlayıcıları, e-posta teslim hizmetleri ve tarayıcı bildirim altyapıları kullanılabilir. Bu sağlayıcılar yalnız hizmetin gerektirdiği ölçüde veri işleyen konumunda olabilir.</p><p>Bu hizmetlerin altyapısı Türkiye dışında bulunabilir. Yurt dışı aktarım koşulları, veri sorumlusunun gerçek yapısı ve seçilen sağlayıcı sözleşmeleri üzerinden ayrıca değerlendirilmelidir. Üretim öncesinde veri işleyen sözleşmeleri ve aktarım mekanizmaları hukukçu tarafından kontrol edilmelidir.</p></section>

    <section id="ai"><h2>5. Yapay zekâ işlemleri</h2><p>Gemini veya ikincil AI sağlayıcılarına yalnız kamuya açık halka arz belgelerinden çıkarılan şirket verilerinin gönderilmesi hedeflenir. Kullanıcı e-postası, profil bilgisi, özel mesajı, takip listesi, push aboneliği veya yorum içeriği AI analizine gönderilmemelidir.</p><p>AI çıktıları otomatik olarak yatırım tavsiyesi hâline gelmez; yayın öncesinde kaynak ve ifade kontrolü gerektirir. Ayrıntılar <a href="/ai-politikasi">AI Kullanım Politikası</a> sayfasındadır.</p></section>

    <section id="saklama"><h2>6. Saklama, düzeltme ve silme</h2><ul><li>Hesap verileri hesap açık olduğu sürece; silme talebinden sonra hukuki veya güvenlik gereklilikleri saklı kalmak üzere kaldırılır ya da anonimleştirilir.</li><li>Yorum ve moderasyon kayıtları topluluk güvenliği, uyuşmazlık ve kötüye kullanım incelemesi için makul süreyle saklanabilir.</li><li>Push aboneliği kullanıcı bildirimi kapattığında veya abonelik geçersiz olduğunda silinir.</li><li>Güvenlik günlükları amaç için gerekli olandan uzun tutulmamalı; erişim yalnız yetkili kişilerle sınırlandırılmalıdır.</li></ul><p>Kesin saklama süreleri gerçek operasyon ve hukuki yükümlülükler belirlendikten sonra ayrı veri saklama çizelgesine bağlanmalıdır.</p></section>

    <section id="haklar"><h2>7. Kullanıcı hakları ve başvuru</h2><p>Kullanıcılar kendileriyle ilgili verilerin işlenip işlenmediğini öğrenme, bilgi talep etme, yanlış verileri düzeltme, şartları oluştuğunda silme veya anonimleştirme isteme ve hukuka aykırı işlem nedeniyle zarar doğduğunu düşünüyorsa başvuru yapma haklarına sahip olabilir.</p><div className="legalContactCard"><strong>Başvuru kanalı</strong><p>Gerçek veri sorumlusu unvanı, fiziksel adresi ve başvuru e-postası henüz sağlanmadı. Bu alan doldurulmadan KVKK başvuru süreci tamamlanmış sayılmaz.</p></div></section>

    <section id="guvenlik"><h2>8. Güvenlik önlemleri</h2><p>Yetki kontrolleri, Supabase Row Level Security politikaları, şifreli HTTPS bağlantısı, sunucu tarafı gizli anahtar yönetimi, güvenlik başlıkları, hız sınırlaması, giriş doğrulama ve denetim kayıtları uygulanır. Buna rağmen internete açık hiçbir sistem için mutlak güvenlik garantisi verilemez.</p><p>Şüpheli hesap hareketi veya veri ihlali fark edildiğinde iletişim kanalı üzerinden bildirim yapılmalı ve ilgili oturumlar sonlandırılmalıdır.</p></section>
  </LegalPage>;
}
