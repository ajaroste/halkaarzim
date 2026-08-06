import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Metodoloji ve Kaynak Şeffaflığı",
  description: "HalkaArzım verileri, kaynak önceliği, AI ön analizinin sınırları, eksik veri yaklaşımı ve düzeltme süreci.",
  alternates: { canonical: "/metodoloji" }
};

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halkaarzim.vercel.app").replace(/\/+$/, "");

export default function MethodPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "HalkaArzım Metodolojisi ve Kaynak Şeffaflığı",
    description: "Halka arz verilerinin nasıl toplandığı, doğrulandığı, özetlendiği ve güncellendiği.",
    url: `${siteUrl}/metodoloji`,
    inLanguage: "tr-TR",
    author: { "@type": "Organization", name: "HalkaArzım", url: siteUrl },
    publisher: { "@type": "Organization", name: "HalkaArzım", url: siteUrl }
  };

  return <><JsonLd data={jsonLd} /><Header /><main className="legalShell">
    <section className="legalHero"><div className="container narrow"><span className="eyebrow">Şeffaflık</span><h1>Veriyi nasıl topluyor ve yorumluyoruz?</h1><p>HalkaArzım açıklanmış bilgiyi sadeleştirir, eksik olanı açıkça işaretler ve otomatik çıktıyı resmî belgenin yerine koymaz.</p><div className="legalMeta"><span>Metodoloji v1.0</span><span>Kaynak zorunlu</span><span>Yatırım tavsiyesi yok</span></div></div></section>

    <div className="container legalLayout">
      <article className="legalDocument">
        <section id="amac"><h2>1. Amacımız</h2><p>SPK bülteni, izahname, fiyat tespit raporu, bağımsız denetim raporu ve şirket açıklamalarında dağınık hâlde bulunan bilgileri tek bir halka arz sayfasında anlaşılır biçimde sunmak.</p><p>Platform “hangi hisse alınır?” sorusuna cevap vermez. “Hangi bilgi açıklandı, hangi kaynakta yer alıyor ve hangi alan hâlâ eksik?” sorularını cevaplamayı hedefler.</p></section>

        <section id="kaynak"><h2>2. Kaynak önceliği</h2><ol><li><strong>Birincil resmî kaynaklar:</strong> SPK bülteni, onaylı izahname, KAP açıklaması ve resmî arz sonucu.</li><li><strong>Şirket kaynakları:</strong> yatırımcı ilişkileri sayfası ve şirket tarafından yayımlanan raporlar.</li><li><strong>Lisanslı piyasa verileri:</strong> kullanım koşullarına uygun grafik veya fiyat sağlayıcısı.</li><li><strong>İkincil kaynaklar:</strong> haber ve diğer yayınlar; resmî gerçek yerine geçmez ve ayrı etiketlenir.</li></ol><p>Her somut iddia için kaynak başlığı, bağlantı, tarih ve mümkün olduğunda belge sayfası tutulur. Kaynağı olmayan olumsuz veya olumlu iddia yayımlanmamalıdır.</p></section>

        <section id="veri"><h2>3. Yapılandırılmış veri</h2><p>Belgelerden çıkarılan alanlar önce yapılandırılmış kayda dönüştürülür:</p><div className="methodGrid"><div><strong>Arz fiyatı</strong><span>Açıklandıysa</span></div><div><strong>Toplam lot</strong><span>Temel ve azami</span></div><div><strong>Sermaye artırımı</strong><span>Şirket kasasına giden pay</span></div><div><strong>Ortak satışı</strong><span>Mevcut ortak payı</span></div><div><strong>Talep tarihleri</strong><span>Resmî duyuruya göre</span></div><div><strong>Fon kullanımı</strong><span>Belgedeki oranlarla</span></div></div><p>Bir alan belgede yoksa sıfır, tahmin veya genel sektör ortalamasıyla doldurulmaz. Kullanıcıya “henüz açıklanmadı” veya “belge işlenmedi” şeklinde gösterilir.</p></section>

        <section id="on-analiz"><h2>4. Ön analiz göstergesinin anlamı</h2><p>Mevcut v1 göstergesi finansal kalite, beklenen getiri veya fiyat artışı olasılığı değildir. Açıklanan arz yapısını ve veri kapsamını tutarlı biçimde özetleyen bir ön analiz aracıdır.</p><p>Kurallı taslak; sermaye artırımı ile ortak satışı karşılaştırır, ek satış seçeneğini belirtir, kaynak sayısını ve veri eksiklerini dikkate alır. Finansal tablolar veya fon kullanım belgesi işlenmemişse bu eksik açıkça raporlanır.</p><div className="legalNotice"><span aria-hidden="true">!</span><div><strong>Skor ne söylemez?</strong><p>“Alınır”, “kazandırır”, “düşük riskli”, “kaç tavan yapar” veya kişiye uygun yatırım olduğu sonucunu söylemez.</p></div></div></section>

        <section id="ai"><h2>5. Gemini ve AI üretim akışı</h2><ol><li>Yalnız kaynak etiketi bulunan şirket/arz verisi JSON’a dönüştürülür.</li><li>Kaynak girdisinin SHA-256 özeti hesaplanır; veri değişmediyse model tekrar çağrılmaz.</li><li>Gemini 2.5 Flash düşük sıcaklık ve zorunlu JSON şemasıyla özet, güçlü sinyal, risk, eksik veri ve güven göstergesi üretir.</li><li>“Al”, “kesin kazanç”, “garanti tavan” gibi yönlendirme ifadeleri otomatik kontrolde reddedilir.</li><li>Model çalışmazsa yalnız kaynaklı gerçeklerden deterministik taslak oluşturulur.</li><li>Yeni model çıktısı <code>needs_review</code> olarak işaretlenir; üretim politikası insan kaynak kontrolünden sonra yayımlanmasını gerektirir.</li></ol><p>Kullanıcı e-postası, profili, yorumu, takip listesi veya bildirim aboneliği AI sağlayıcısına gönderilmez. Ayrıntılar <Link href="/ai-politikasi">AI Kullanım Politikası</Link> sayfasındadır.</p></section>

        <section id="guncelleme"><h2>6. Güncelleme ve sürümleme</h2><p>Yeni bülten, talep tarihi, sonuç veya işlem tarihi geldiğinde kaynak kaydı güncellenir. AI girdisi değişirse yeni rapor sürümü üretilir; aynı girdinin her ziyaretçide yeniden modele gönderilmesi engellenir.</p><p>Her kayıtta kaynak güncelleme zamanı ve rapor sürümü tutulması hedeflenir. Tarihi geçmiş bir bilgi, yalnız sayfanın yayın tarihini değiştirerek güncel gösterilmez.</p></section>

        <section id="duzeltme"><h2>7. Hata ve düzeltme süreci</h2><p>Bir şirket, kullanıcı veya hak sahibi hatalı veri bildirdiğinde ilgili ifade birincil kaynakla karşılaştırılır. Hata doğrulanırsa kayıt ve rapor sürümü güncellenir; kişisel veri, güvenlik anahtarı veya açık hak ihlali içeren içerik inceleme tamamlanana kadar gizlenebilir.</p><p>Düzeltme veya kaldırma talebi için <Link href="/icerik-kaldirma">İçerik Bildirimi ve Kaldırma Süreci</Link> kullanılmalıdır.</p></section>

        <section id="sinirlar"><h2>8. Bilinen sınırlar</h2><ul><li>Resmî kaynakların yayımlanma veya erişim gecikmesi olabilir.</li><li>PDF ayrıştırma ve otomatik sınıflandırma hata yapabilir.</li><li>Haber, piyasa grafiği ve üçüncü taraf hizmeti kesilebilir veya gecikmeli olabilir.</li><li>Bir şirketin geçmiş performansı gelecekteki halka arz performansını garanti etmez.</li><li>Teknik kontroller riski azaltır ancak yanlış bilgi veya güvenlik olayını tamamen imkânsız hâle getirmez.</li></ul><p>Bu nedenle kullanıcı yatırım kararı öncesinde resmî belgeyi ve yetkili kuruluş bilgilerini kontrol etmelidir.</p></section>
      </article>

      <nav className="legalToc" aria-label="Metodoloji içeriği"><strong>Bu sayfada</strong><a href="#amac">Amaç</a><a href="#kaynak">Kaynak önceliği</a><a href="#veri">Yapılandırılmış veri</a><a href="#on-analiz">Ön analiz</a><a href="#ai">Gemini ve AI</a><a href="#guncelleme">Güncelleme</a><a href="#duzeltme">Düzeltme</a><a href="#sinirlar">Sınırlar</a></nav>
    </div>
  </main><Footer /></>;
}
