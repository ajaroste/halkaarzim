import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Yatırım Tavsiyesi Değildir",
  description: "HalkaArzım içeriklerinin yatırım danışmanlığı, fiyat tahmini veya kişisel öneri olmadığına ilişkin açıklama.",
  alternates: { canonical: "/yatirim-tavsiyesi-degildir" }
};

const toc = [
  { id: "uyari", label: "Temel uyarı" },
  { id: "skor", label: "Skorlar" },
  { id: "lot", label: "Lot tahmini" },
  { id: "grafik", label: "Grafik ve piyasa verisi" },
  { id: "yorum", label: "Kullanıcı yorumları" },
  { id: "karar", label: "Karar sorumluluğu" }
];

export default function DisclaimerPage() {
  return <LegalPage eyebrow="Önemli uyarı" title="Yatırım tavsiyesi değildir" intro="HalkaArzım bilgiye erişimi kolaylaştırır; herhangi bir menkul kıymet için alım, satım veya katılım önerisi sunmaz." version="1.0" toc={toc} showDraftNotice={false}>
    <section id="uyari"><h2>1. Temel uyarı</h2><p>HalkaArzım'da yer alan içerikler genel bilgilendirme amacıyla hazırlanır. İçerikler yatırım danışmanlığı, portföy yönetimi, aracılık, yatırım araştırması raporu, kişisel mali tavsiye veya kesin getiri vaadi değildir.</p><p>“Olumlu sinyal”, “risk”, “ön analiz” ve benzeri ifadeler yalnız açıklanan verilerin sınıflandırılmasıdır; halka arzın fiyat performansını veya yatırımcıya kazandıracağını göstermez.</p></section>

    <section id="skor"><h2>2. AI skoru ve veri kapsamı</h2><p>Gösterilen skor, finansal kalite veya beklenen getiri puanı değildir. Sermaye artırımı/ortak satışı oranı, belge varlığı ve açıklanan verinin kapsamı gibi kurallı alanlardan türetilen bir ön analiz göstergesidir.</p><p>Eksik izahname, finansal tablo veya tahsisat bilgisi olduğunda skorun kapsamı sınırlıdır. Model çıktısı insan kontrolünden geçmeden kesin bilgi olarak kabul edilmemelidir.</p></section>

    <section id="lot"><h2>3. Lot tahmin aracı</h2><p>Lot hesaplamaları varsayımsal katılımcı sayısı, bireysel tahsisat ve dağıtım yöntemi üzerinden matematiksel senaryo üretir. Gerçek dağıtım sonucu; talep, yatırımcı grupları, kurum uygulaması ve resmî sonuçlarla farklı olabilir.</p><p>Hesaplama sonucu “alınabilecek kesin lot” değildir.</p></section>

    <section id="grafik"><h2>4. Grafik ve piyasa verileri</h2><p>TradingView veya başka sağlayıcılardan gelen fiyat verileri gecikmeli, kesintili veya farklı lisans koşullarına tabi olabilir. Grafik geçmiş performansı gösterir; gelecekteki fiyatı garanti etmez.</p><p>İşlem yapmadan önce kullanıcının hesabının bulunduğu yetkili kuruluşun güncel fiyat ve emir bilgileri kontrol edilmelidir.</p></section>

    <section id="yorum"><h2>5. Kullanıcı yorumları</h2><p>Yorumlar kullanıcıların kişisel görüşleridir ve HalkaArzım'ın görüşü sayılmaz. Moderasyon; doğruluğu veya yatırım uygunluğunu garanti etmez. Kesin kazanç, organize işlem çağrısı ve doğrulanmamış içerik bildirilmelidir.</p></section>

    <section id="karar"><h2>6. Kullanıcının karar sorumluluğu</h2><p>Her yatırım kararı risk içerir ve anapara kaybına yol açabilir. Kullanıcı, kendi mali durumu ve risk toleransı doğrultusunda resmî belgeleri incelemeli; ihtiyaç duyduğunda yetkili ve lisanslı bir uzmandan destek almalıdır.</p><p>HalkaArzım tek başına yatırım kararı vermek için kullanılmamalıdır.</p></section>
  </LegalPage>;
}
