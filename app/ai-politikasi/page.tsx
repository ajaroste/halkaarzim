import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "AI Kullanım Politikası",
  description: "HalkaArzım AI analizlerinin kaynak, model, insan kontrolü ve yatırım tavsiyesi sınırları.",
  alternates: { canonical: "/ai-politikasi" }
};

const toc = [
  { id: "amac", label: "AI'nin amacı" },
  { id: "kaynak", label: "Kullanılan veriler" },
  { id: "akıs", label: "Üretim akışı" },
  { id: "yasak", label: "Yasak ifadeler" },
  { id: "puan", label: "Puanın anlamı" },
  { id: "kisisel", label: "Kişisel veriler" },
  { id: "duzeltme", label: "Düzeltme ve itiraz" },
  { id: "sinir", label: "Teknik sınırlar" }
];

export default function AiPolicyPage() {
  return <LegalPage eyebrow="Yapay zekâ" title="AI kullanım ve yayın politikası" intro="Otomatik analizlerin hangi verilerle üretildiğini, hangi sınırların uygulandığını ve neden insan kontrolü gerektiğini açıklar." version="1.0" toc={toc}>
    <section id="amac"><h2>1. AI'nin amacı</h2><p>AI sistemi uzun ve teknik halka arz belgelerini sadeleştirmek, doğrulanmış verileri sınıflandırmak ve kullanıcıya hızlı bir ön okuma sunmak için kullanılır. AI; yatırım kararı vermek, portföy oluşturmak, fiyat hedefi belirlemek veya kullanıcı adına işlem yapmak için kullanılmaz.</p></section>

    <section id="kaynak"><h2>2. Kullanılan veri kaynakları</h2><p>Analiz girdileri yalnız kamuya açık ve kaynak etiketi bulunan bilgilerden oluşturulmalıdır:</p><ul><li>SPK bültenleri ve onaylı izahname bağlantıları.</li><li>KAP açıklamaları ve şirketin resmî yatırımcı ilişkileri duyuruları.</li><li>Fiyat tespit raporu, bağımsız denetim raporu ve resmî arz sonuçları.</li><li>Lisansı veya kullanım izni bulunan piyasa verileri.</li></ul><p>Haber, forum veya kullanıcı yorumu resmî gerçek gibi modele verilmemeli; kullanılırsa açıkça ikincil kaynak olarak ayrılmalıdır.</p></section>

    <section id="akıs"><h2>3. Üretim ve yayın akışı</h2><ol><li>Belge kaynağı, tarihi, sürümü ve mümkünse sayfa numarası kaydedilir.</li><li>Sayısal alanlar kurallı ayrıştırıcıyla yapılandırılmış JSON'a çevrilir.</li><li>Gemini 2.5 Flash veya yapılandırılmış ikincil sağlayıcı, yalnız bu JSON üzerinden özet üretir.</li><li>Çıktı şema doğrulamasından, yasak ifade filtresinden ve uzunluk kontrolünden geçer.</li><li>Model kullanılamazsa kaynaklı deterministik taslak gösterilir.</li><li>Yayımlanacak rapor insan kontrolü gerektirir; model adı ve rapor sürümü kaydedilir.</li></ol></section>

    <section id="yasak"><h2>4. Yasak ifadeler ve görevler</h2><p>AI çıktısında aşağıdaki türde ifadeler bulunmamalıdır:</p><ul><li>“Al”, “sat”, “kaçırma”, “kesin katıl”, “güvenli yatırım” veya kişiye özel yönlendirme.</li><li>“Kesin tavan”, “garanti kazanç”, “şu fiyata çıkar” veya fiyat/getiri tahmini.</li><li>Kaynakta bulunmayan finansal sonuç, dava, müşteri, borç, tarih veya yönetici iddiası.</li><li>Bir riskin kesin zarar, olumlu göstergenin kesin getiri doğuracağını söyleyen nedensellik iddiası.</li><li>Kullanıcı profiline, gelirine veya risk iştahına göre öneri üretme.</li></ul></section>

    <section id="puan"><h2>5. Skor ve güven göstergesinin anlamı</h2><p>Sitedeki skor yatırım kalitesi, fiyat artışı olasılığı veya beklenen getiri puanı değildir. Kullanılan veri kapsamını ve kurallı göstergeleri özetleyen bir ön analiz göstergesidir.</p><p>Skor yanında hangi verilerin eksik olduğu ve kaç resmî kaynağın kullanıldığı gösterilmelidir. “Düşük risk” gibi mutlak algı oluşturan etiketler yerine “veri kapsamı”, “belge eksikleri” ve somut risk başlıkları tercih edilmelidir.</p></section>

    <section id="kisisel"><h2>6. Kişisel veriler ve model sağlayıcısı</h2><p>AI sağlayıcısına kullanıcı e-postası, kullanıcı adı, yorum, takip listesi, IP adresi, push aboneliği, oturum tokenı veya başka kişisel veri gönderilmemelidir. Model girdisi yalnız kamuya açık şirket ve halka arz verileriyle sınırlandırılmalıdır.</p><p>API anahtarı yalnız Vercel sunucu ortamında saklanır; tarayıcı koduna veya <code>NEXT_PUBLIC_</code> değişkenine eklenmez.</p></section>

    <section id="duzeltme"><h2>7. Düzeltme, itiraz ve sürümleme</h2><p>Şirket, kullanıcı veya hak sahibi kaynaklı bir hata bildirdiğinde ilgili iddia resmî belgeyle karşılaştırılır. Hatalı içerik düzeltilir veya görünürlükten kaldırılır; rapor sürümü ve güncelleme zamanı değiştirilir.</p><p>Eski raporlar yeni kaynak geldiğinde otomatik olarak doğru kabul edilmemeli; yeniden analiz ve insan inceleme kuyruğuna alınmalıdır.</p></section>

    <section id="sinir"><h2>8. Teknik sınırlamalar</h2><p>Dil modelleri tutarlı görünen fakat yanlış metin üretebilir. JSON şeması, düşük sıcaklık, kaynak zorunluluğu, istek boyutu sınırı, zaman aşımı ve insan kontrolü riski azaltır ancak tamamen ortadan kaldırmaz.</p><p>AI çıktısı, resmî belgeyi okumak veya lisanslı profesyonelden hizmet almak yerine geçmez.</p></section>
  </LegalPage>;
}
