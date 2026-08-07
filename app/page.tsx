import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IpoCard } from "@/components/IpoCard";
import { AdSlot } from "@/components/AdSlot";
import { ipos } from "@/data/ipos";
import { publicAnalysisText } from "@/lib/public-analysis";

export default function HomePage() {
  const featured = ipos.slice(0, 4);
  const lead = featured[0];
  const leadSummary = lead ? publicAnalysisText(lead.aiSummary) : "";
  const totalLots = ipos.reduce((sum, ipo) => sum + ipo.lotCount, 0);
  const bulletinCount = new Set(ipos.map((ipo) => ipo.bulletinNo)).size;
  const listedCount = ipos.filter((ipo) => ipo.status === "listed").length;

  return <><Header /><main>
    <section className="homeHeroV2">
      <div className="container homeHeroV2Inner">
        <div className="homeHeroV2Copy">
          <span className="heroBadge">Resmî verilerden sade analiz</span>
          <h1>Halka arzı gör.<br /><span>Kararını veriden kur.</span></h1>
          <p>SPK bültenleri, halka arz tarihleri, arz yapısı ve şirket gündemi tek bir sakin deneyimde.</p>
          <div className="heroActions">
            <Link className="primaryButton large" href="/halka-arzlar">Halka arzları keşfet</Link>
            <Link className="textLink heroTextLink" href="/gundem">Şirket gündemine bak →</Link>
          </div>
          <div className="homeHeroProof">
            <span>Resmî kaynak</span><span>Şeffaf veri kapsamı</span><span>Yatırım tavsiyesi değildir</span>
          </div>
        </div>
        {lead && <div className="homeHeroV2Visual">
          <article className="marketCardV2">
            <div className="marketCardV2Top"><span>Güncel halka arz</span><strong>{lead.bulletinNo}</strong></div>
            <div className="marketCardV2Company">
              <div className="companyLogo xlarge">{lead.company.slice(0, 2).toLocaleUpperCase("tr-TR")}</div>
              <div><small>{lead.statusLabel}</small><h2>{lead.company}</h2><p>{lead.sector}</p></div>
            </div>
            <div className="marketCardV2Price"><span>Arz fiyatı</span><strong>₺{lead.price.toLocaleString("tr-TR")}</strong></div>
            <div className="marketCardV2Metrics">
              <div><span>Toplam lot</span><strong>{lead.lotCount.toLocaleString("tr-TR")}</strong></div>
              <div><span>Ortak satışı</span><strong>{lead.shareholderSaleShares.toLocaleString("tr-TR")}</strong></div>
              <div><span>Veri kapsamı</span><strong>%{lead.dataCompleteness || 0}</strong></div>
            </div>
            {leadSummary ? <p className="marketCardV2Summary">{leadSummary}</p> : null}
            <Link className="secondaryButton" href={`/arz/${lead.slug}`}>Detayı aç</Link>
          </article>
          <div className="floatingMetric floatingMetricOne"><span>Takip edilen</span><strong>{ipos.length}</strong></div>
          <div className="floatingMetric floatingMetricTwo"><span>İşlem gören</span><strong>{listedCount}</strong></div>
        </div>}
      </div>
    </section>

    <section className="homeMetricsV2"><div className="container homeMetricsV2Grid">
      <article><span>01</span><strong>{ipos.length}</strong><p>Takip edilen halka arz</p></article>
      <article><span>02</span><strong>{totalLots.toLocaleString("tr-TR")}</strong><p>Toplam temel arz lotu</p></article>
      <article><span>03</span><strong>{bulletinCount}</strong><p>Resmî SPK bülteni</p></article>
      <article><span>04</span><strong>{listedCount}</strong><p>İşlem görmeye başlayan</p></article>
    </div></section>

    <section className="section homeFeaturedV2"><div className="container">
      <div className="homeSectionIntroV2"><span className="eyebrow">Güncel halka arzlar</span><h2>Önce önemli olanı gör.</h2><p>Her kartta arzın temel bilgileri, veri kapsamı ve kaynaklı değerlendirmesi yer alır.</p></div>
      <div className="cardGrid homeCardGridV2">{featured.map((ipo) => <IpoCard ipo={ipo} key={ipo.id} />)}</div>
      <div className="homeCenterAction"><Link className="secondaryButton large" href="/halka-arzlar">Tüm halka arzları görüntüle</Link></div>
    </div></section>

    <div className="container"><AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} label="Ana sayfa reklam alanı" /></div>

    <section className="homeMethodV2"><div className="container homeMethodV2Grid">
      <div className="homeMethodV2Lead"><span className="eyebrow">Nasıl çalışır?</span><h2>Veri gelir.<br />Gürültü gider.</h2><p>Platform, resmî kaynaklardaki karmaşık bilgileri sadeleştirir ve açıklanmayan alanları açıkça belirtir.</p></div>
      <div className="homeMethodStepsV2">
        <article><span>01</span><div><h3>Kaynak doğrulanır</h3><p>SPK ve şirket belgeleri kontrol edilir.</p></div></article>
        <article><span>02</span><div><h3>Bilgi sadeleştirilir</h3><p>Arz fiyatı, lot ve satış yapısı anlaşılır hâle getirilir.</p></div></article>
        <article><span>03</span><div><h3>Eksik alan gizlenmez</h3><p>Açıklanmayan bilgiler tahmin edilmez.</p></div></article>
        <article><span>04</span><div><h3>Gelişmeler eşleştirilir</h3><p>Yeni tarihler ve şirket gündemi kayda eklenir.</p></div></article>
      </div>
    </div></section>

    <section className="homeFinalV2"><div className="container homeFinalV2Inner"><div><span className="eyebrow">Daha net bir başlangıç</span><h2>Yeni halka arzları tek yerde takip et.</h2><p>Bildirimleri aç, şirketleri takip listene ekle ve gelişmeleri kaçırma.</p></div><Link className="primaryButton large" href="/profil">Takip listemi oluştur</Link></div></section>
  </main><Footer /></>;
}
