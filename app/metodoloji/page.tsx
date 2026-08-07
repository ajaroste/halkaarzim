import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Metodoloji ve Kaynak Şeffaflığı",
  description: "HalkaArzım verilerinin kaynak önceliği, ön analiz sınırları, eksik veri yaklaşımı ve düzeltme süreci.",
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
    <section className="legalHero"><div className="container narrow"><span className="eyebrow">Şeffaflık</span><h1>Veriyi nasıl topluyor ve yorumluyoruz?</h1><p>HalkaArzım açıklanmış bilgiyi sadeleştirir, eksik olanı açıkça işaretler ve hiçbir özeti resmî belgenin yerine koymaz.</p><div className="legalMeta"><span>Metodoloji v1.0</span><span>Kaynak zorunlu</span><span>Yatırım tavsiyesi yok</span></div></div></section>

    <div className="container legalLayout">
      <article className="legalDocument">
        <section id="amac"><h2>1. Amacımız</h2><p>SPK bülteni, izahname, fiyat tespit raporu, bağımsız denetim raporu ve şirket açıklamalarında dağınık hâlde bulunan bilgileri tek bir halka arz sayfasında anlaşılır biçimde sunmak.</p><p>Platform “hangi hisse alınır?” sorusuna cevap vermez. “Hangi bilgi açıklandı, hangi kaynakta yer alıyor ve hangi alan hâlâ eksik?” sorularını cevaplamayı hedefler.</p></section>

        <section id="kaynak"><h2>2. Kaynak önceliği</h2><ol><li><strong>Birincil resmî kaynaklar:</strong> SPK bülteni, onaylı izahname, KAP açıklaması ve resmî arz sonucu.</li><li><strong>Şirket kaynakları:</strong> yatırımcı ilişkileri sayfası ve şirket tarafından yayımlanan raporlar.</li><li><strong>Lisanslı piyasa verileri:</strong> kullanım koşullarına uygun grafik veya fiyat sağlayıcısı.</li><li><strong>İkincil kaynaklar:</strong> haber ve diğer yayınlar; resmî gerçek yerine geçmez ve ayrı etiketlenir.</li></ol><p>Her somut iddia için kaynak başlığı, bağlantı, tarih ve mümkün olduğunda belge sayfası tutulur. Kaynağı olmayan olumsuz veya olumlu iddia yayımlanmamalıdır.</p></section>

        <section id="veri"><h2>3. Yapılandırılmış veri</h2><p>Belgelerden çıkarılan alanlar önce yapılandırılmış kayda dönüştürülür:</p><div className="methodGrid"><div><strong>Arz fiyatı</strong><span>Açıklandıysa</span></div><div><strong>Toplam lot</strong><span>Temel ve azami</span></div><div><strong>Sermaye artırımı</strong><span>Şirket kasasına giden pay</span></div><div><strong>Ortak satışı</strong><span>Mevcut ortak payı</span></div><div><strong>Talep tarihleri</strong><span>Resmî duyuruya göre</span></div><div><strong>Fon kullanımı</strong><span>Belgedeki oranlarla</span></div></div><p>Bir alan belgede yoksa sıfır, tahmin veya genel sektör ortalamasıyla doldurulmaz; “henüz açıklanmadı” olarak belirtilir.</p></section>

        <section id="on-analiz"><h2>4. Arz puanının anlamı</h2><p>Arz puanı finansal kalite, beklenen getiri veya fiyat artışı olasılığı değildir. Açıklanan arz yapısını ve mevcut veri kapsamını tutarlı biçimde özetleyen yardımcı bir göstergedir.</p><p>Sermaye artırımı ile ortak satışı, ek satış seçeneği, kaynak kapsamı ve doğrulanmış risk başlıkları birlikte değerlendirilir. Finansal tablo veya fon kullanım bilgisi bulunmuyorsa bu eksik açıkça belirtilir.</p><div className="legalNotice"><span aria-hidden="true">!</span><div><strong>Skor ne söylemez?</strong><p>“Alınır”, “kazandırır”, “düşük riskli”, “kaç tavan yapar” veya kişiye uygun yatırım olduğu sonucunu söylemez.</p></div></div></section>

        <section id="kalite"><h2>5. Analiz ve kalite kontrolü</h2><ol><li>Yalnız kaynağı doğrulanabilen veriler değerlendirmeye alınır.</li><li>Aynı veri tekrar tekrar farklı sonuç üretmesin diye kaynak değişiklikleri sürümlenir.</li><li>Yatırım yönlendirmesi, kesinlik veya garanti anlamı taşıyan ifadeler yayımlanmaz.</li><li>Eksik bilgi tahmin edilmez; veri kapsamı açıkça belirtilir.</li><li>Yeni değerlendirmeler kaynak ve ifade kontrolünden geçirilir.</li></ol><p>Otomatik metin işleme kullanılan bölümlerin hukuki ve teknik sınırları <Link href="/ai-politikasi">AI Kullanım Politikası</Link> içinde ayrıca açıklanır.</p></section>

        <section id="guncelleme"><h2>6. Güncelleme ve sürümleme</h2><p>Yeni bülten, talep tarihi, sonuç veya işlem tarihi geldiğinde kaynak kaydı güncellenir. Kaynak girdisi değiştiğinde değerlendirme de yeniden oluşturulur.</p><p>Her kayıtta kaynak güncelleme zamanı ve rapor sürümü tutulması hedeflenir. Tarihi geçmiş bir bilgi, yalnız sayfanın yayın tarihini değiştirerek güncel gösterilmez.</p></section>

        <section id="duzeltme"><h2>7. Hata ve düzeltme süreci</h2><p>Bir şirket, kullanıcı veya hak sahibi hatalı veri bildirdiğinde ilgili ifade birincil kaynakla karşılaştırılır. Hata doğrulanırsa kayıt ve rapor sürümü güncellenir; kişisel veri, güvenlik anahtarı veya açık hak ihlali içeren içerik inceleme tamamlanana kadar gizlenebilir.</p><p>Düzeltme veya kaldırma talebi için <Link href="/icerik-kaldirma">İçerik Bildirimi ve Kaldırma Süreci</Link> kullanılmalıdır.</p></section>

        <section id="sinirlar"><h2>8. Bilinen sınırlar</h2><ul><li>Resmî kaynakların yayımlanma veya erişim gecikmesi olabilir.</li><li>PDF ayrıştırma ve otomatik sınıflandırma hata yapabilir.</li><li>Haber, piyasa grafiği ve üçüncü taraf hizmeti kesilebilir veya gecikmeli olabilir.</li><li>Bir şirketin geçmiş performansı gelecekteki halka arz performansını garanti etmez.</li><li>Teknik kontroller riski azaltır ancak yanlış bilgi veya güvenlik olayını tamamen imkânsız hâle getirmez.</li></ul><p>Bu nedenle kullanıcı yatırım kararı öncesinde resmî belgeyi ve yetkili kuruluş bilgilerini kontrol etmelidir.</p></section>
      </article>

      <nav className="legalToc" aria-label="Metodoloji içeriği"><strong>Bu sayfada</strong><a href="#amac">Amaç</a><a href="#kaynak">Kaynak önceliği</a><a href="#veri">Yapılandırılmış veri</a><a href="#on-analiz">Arz puanı</a><a href="#kalite">Kalite kontrolü</a><a href="#guncelleme">Güncelleme</a><a href="#duzeltme">Düzeltme</a><a href="#sinirlar">Sınırlar</a></nav>
    </div>
  </main><Footer /></>;
}
