import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IpoCard } from "@/components/IpoCard";
import { AdSlot } from "@/components/AdSlot";
import { ipos, type IpoStatus } from "@/data/ipos";

const statusPriority: Record<IpoStatus, number> = {
  active: 0,
  upcoming: 1,
  approved: 2,
  completed: 3,
  listed: 4,
  delayed: 5,
  draft: 6
};

function formatCompactLots(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Milyar`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} Milyon`;
  return value.toLocaleString("tr-TR");
}

export default function HomePage() {
  const featured = [...ipos]
    .sort((a, b) => statusPriority[a.status] - statusPriority[b.status] || b.approvalDate.localeCompare(a.approvalDate))
    .slice(0, 4);
  const lead = featured[0];
  const totalLots = ipos.reduce((sum, ipo) => sum + ipo.lotCount, 0);
  const bulletinCount = new Set(ipos.map((ipo) => ipo.bulletinNo)).size;
  const listedCount = ipos.filter((ipo) => ipo.status === "listed").length;

  return <><Header /><main>
    <section className="homeHeroV2">
      <div className="container homeHeroV2Inner">
        <div className="homeHeroV2Copy">
          <span className="heroBadge">Resmî kaynaklardan güncel veri</span>
          <h1>Halka arzı gör.<br /><span>Veriyi doğrudan incele.</span></h1>
          <p>SPK bültenleri, talep tarihleri, arz yapısı ve şirket gündemi tek bir ekranda.</p>
          <div className="heroActions">
            <Link className="primaryButton large" href="/halka-arzlar">Halka arzları incele</Link>
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
              <div><span>Talep tarihleri</span><strong>{lead.dates}</strong></div>
              <div><span>Toplam lot</span><strong>{lead.lotCount.toLocaleString("tr-TR")}</strong></div>
              <div><span>Veri kapsamı</span><strong>%{lead.dataCompleteness || 0}</strong></div>
            </div>
            <Link className="secondaryButton" href={`/arz/${lead.slug}`}>Detayı aç</Link>
          </article>
        </div>}
      </div>
    </section>

    <section className="homeMetricsV2"><div className="container homeMetricsV2Grid">
      <article><span>01</span><strong>{ipos.length}</strong><p>Takip edilen halka arz</p></article>
      <article className="homeMetricLots"><span>02</span><strong>{formatCompactLots(totalLots)}</strong><p>Toplam temel arz lotu</p><small>{totalLots.toLocaleString("tr-TR")} lot</small></article>
      <article><span>03</span><strong>{bulletinCount}</strong><p>Resmî SPK bülteni</p></article>
      <article><span>04</span><strong>{listedCount}</strong><p>İşlem görmeye başlayan</p></article>
    </div></section>

    <section className="section homeFeaturedV2"><div className="container">
      <div className="homeSectionIntroV2"><span className="eyebrow">Güncel halka arzlar</span><h2>Önce önemli olanı gör.</h2><p>Her kartta durum, fiyat, talep tarihi, lot ve kaynak kapsamı öne çıkar.</p></div>
      <div className="cardGrid homeCardGridV2">{featured.map((ipo) => <IpoCard ipo={ipo} key={ipo.id} />)}</div>
      <div className="homeCenterAction"><Link className="secondaryButton large" href="/halka-arzlar">Tüm halka arzları görüntüle</Link></div>
    </div></section>

    <div className="container"><AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} label="Ana sayfa reklam alanı" /></div>

    <section className="homeMethodV2"><div className="container homeMethodV2Grid">
      <div className="homeMethodV2Lead"><span className="eyebrow">Veri yaklaşımı</span><h2>Kaynak açık.<br />Eksik alan açık.</h2><p>Platform, resmî kaynaklardaki bilgileri tek formatta toplar; açıklanmayan alanları tahmin ederek doldurmaz.</p></div>
      <div className="homeMethodStepsV2">
        <article><span>01</span><div><h3>Kaynak eşleştirilir</h3><p>SPK, KAP ve şirket belgeleri kayda bağlanır.</p></div></article>
        <article><span>02</span><div><h3>Temel veriler ayrıştırılır</h3><p>Arz fiyatı, lot, tarihler ve satış yapısı düzenlenir.</p></div></article>
        <article><span>03</span><div><h3>Eksik alan gizlenmez</h3><p>Kaynakta bulunmayan bilgiler boş veya açıklamalı kalır.</p></div></article>
        <article><span>04</span><div><h3>Gelişmeler zaman çizgisine eklenir</h3><p>Yeni tarihler ve şirket gündemi ilgili halka arza bağlanır.</p></div></article>
      </div>
    </div></section>

    <section className="homeFinalV2"><div className="container homeFinalV2Inner"><div><span className="eyebrow">Takip</span><h2>Yeni halka arzları tek yerde izle.</h2><p>Bildirimleri aç, şirketleri takip listene ekle ve resmî gelişmeleri kaçırma.</p></div><Link className="primaryButton large" href="/profil">Takip listemi oluştur</Link></div></section>
  </main><Footer /></>;
}
