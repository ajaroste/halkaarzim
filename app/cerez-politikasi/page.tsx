import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Çerez Politikası",
  description: "HalkaArzım çerez, localStorage, oturum, bildirim ve reklam tercihleri.",
  alternates: { canonical: "/cerez-politikasi" }
};

const toc = [
  { id: "nedir", label: "Çerez ve yerel depolama" },
  { id: "zorunlu", label: "Zorunlu teknolojiler" },
  { id: "islevsel", label: "İşlevsel tercihler" },
  { id: "analitik", label: "Analitik ve reklam" },
  { id: "bildirim", label: "Tarayıcı bildirimleri" },
  { id: "yonetim", label: "Tercih yönetimi" },
  { id: "sure", label: "Saklama süreleri" }
];

export default function CookiePolicyPage() {
  return <LegalPage eyebrow="Çerezler" title="Çerez ve yerel depolama politikası" intro="Oturum, tema, bildirim ve isteğe bağlı reklam teknolojilerinin cihazında nasıl kullanıldığını açıklar." version="1.0" toc={toc}>
    <section id="nedir"><h2>1. Çerez ve yerel depolama nedir?</h2><p>Çerezler tarayıcı tarafından saklanan küçük kayıtlardır. localStorage ve benzeri tarayıcı depoları da tema, takip listesi veya oturum gibi bilgilerin cihazda tutulmasını sağlar. Bu teknolojiler aynı amaçla kullanılabilse de teknik olarak birbirinden farklıdır.</p></section>

    <section id="zorunlu"><h2>2. Zorunlu teknolojiler</h2><p>Hizmetin güvenli biçimde çalışması için aşağıdaki kayıtlar kullanıcıdan ayrıca reklam izni alınmadan kullanılabilir:</p><ul><li>Supabase kimlik doğrulama oturumu ve e-posta doğrulama akışı.</li><li>Güvenlik, kötüye kullanım önleme ve hata yönetimi için kısa süreli sunucu kayıtları.</li><li>Kullanıcının çerez/izin tercihinin hatırlanması.</li><li>Oturum açılmadığında yalnız cihazda tutulan geçici takip listesi.</li></ul><p>Zorunlu teknolojiler kapatıldığında giriş, takip listesi ve yorum gibi özellikler çalışmayabilir.</p></section>

    <section id="islevsel"><h2>3. İşlevsel tercihler</h2><ul><li><strong>Tema tercihi:</strong> açık veya koyu görünüm seçimini hatırlar.</li><li><strong>Bildirim tercihi:</strong> tarayıcının bildirim iznini ve kayıtlı push aboneliğini yönetir.</li><li><strong>Arayüz tercihleri:</strong> kapanan uyarılar veya kullanıcı deneyimini kolaylaştıran yerel ayarlar.</li></ul><p>Bu tercihler reklam profili oluşturmak amacıyla kullanılmamalıdır.</p></section>

    <section id="analitik"><h2>4. Analitik ve reklam teknolojileri</h2><p>Google AdSense, analitik veya benzeri üçüncü taraf teknolojiler ancak gerekli hukuki değerlendirme, açık bilgilendirme ve uygun tercih mekanizması tamamlandıktan sonra etkinleştirilmelidir. Kullanıcı “reddet” seçeneğini kabul seçeneği kadar kolay kullanabilmelidir.</p><p>Mevcut kodda reklam alanı bulunması, reklam çerezlerinin otomatik olarak etkin olduğu anlamına gelmez. Reklam sağlayıcısı anahtarları boşsa reklam sistemi kapalı kalır.</p></section>

    <section id="bildirim"><h2>5. Tarayıcı bildirimleri</h2><p>Bildirim izni doğrudan tarayıcı tarafından sorulur. İzin verilmeden push aboneliği oluşturulmaz. Kullanıcı tarayıcı veya işletim sistemi ayarlarından izni dilediği zaman kaldırabilir.</p><p>Push aboneliği uç noktası teknik bir tanımlayıcıdır ve hesapla eşleştirildiğinde kişisel veri niteliği taşıyabilir. Yalnız bildirim göndermek ve geçersiz abonelikleri temizlemek amacıyla kullanılmalıdır.</p></section>

    <section id="yonetim"><h2>6. Tercihlerin yönetilmesi</h2><p>Kullanıcı site içindeki çerez panelinden isteğe bağlı teknolojileri kabul veya reddedebilmelidir. Ayrıca tarayıcı ayarlarından çerezleri silebilir, localStorage kayıtlarını temizleyebilir ve bildirim iznini kapatabilir.</p><p>Zorunlu olmayan izin reddedildiğinde site ana içeriklerine erişim engellenmemelidir.</p></section>

    <section id="sure"><h2>7. Saklama süreleri</h2><ul><li>Oturum kayıtları oturum süresi ve yenileme kuralları boyunca saklanır.</li><li>Tema ve çerez tercihi kullanıcı temizleyene veya uygulama tarafından yenilenene kadar cihazda kalabilir.</li><li>Geçersiz push abonelikleri düzenli olarak kaldırılmalıdır.</li><li>Analitik ve reklam saklama süreleri etkinleştirilen sağlayıcının ayarlarında en kısa makul süreye çekilmelidir.</li></ul></section>
  </LegalPage>;
}
