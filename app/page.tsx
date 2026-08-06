import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IpoCard } from "@/components/IpoCard";
import { AdSlot } from "@/components/AdSlot";
import { ipos } from "@/data/ipos";

export default function HomePage() {
  const featured = ipos.slice(0, 4);
  const lead = featured[0];
  const totalLots = ipos.reduce((sum, ipo) => sum + ipo.lotCount, 0);
  const bulletinCount = new Set(ipos.map((ipo) => ipo.bulletinNo)).size;
  const listedCount = ipos.filter((ipo) => ipo.status === "listed").length;

  return <><Header /><main>
    <section className="hero"><div className="container heroGrid"><div className="heroCopy"><span className="heroBadge">Resmî kaynaklı halka arz rehberi</span><h1>Halka arzı sadece görme.<br /><em>Kaynağından anla.</em></h1><p>Yeni halka arzları tek ekranda incele; arz yapısını, ortak satışını, önemli tarihleri ve resmî belgeleri sade bir anlatımla karşılaştır.</p><div className="heroActions"><Link className="primaryButton large" href="/halka-arzlar">Halka arzları incele</Link><Link className="secondaryButton large" href="/gundem">Şirket gündemini gör</Link></div><div className="trustRow"><span>✓ Resmî SPK kaynakları</span><span>✓ Açıklanmayan bilgi tahmin edilmez</span><span>✓ Yatırım tavsiyesi içermez</span></div></div>
      {lead && <article className="heroPanel"><div className="heroPanelHeader"><div><span className="liveDot" /> Güncel ön analiz</div><span>{lead.bulletinNo}</span></div><div className="heroCompany"><div className="companyLogo big">{lead.company.slice(0,2).toLocaleUpperCase("tr-TR")}</div><div><strong>{lead.company}</strong><span>{lead.ticker || "Borsa kodu bekleniyor"} · {lead.sector}</span></div><div className="heroScore"><strong>{lead.aiScore}</strong><span>/100</span></div></div><div className="signalGrid"><div><span>Sermaye artırımı</span><strong className="positive">{lead.capitalIncreaseShares.toLocaleString("tr-TR")}</strong></div><div><span>Ortak satışı</span><strong>{lead.shareholderSaleShares.toLocaleString("tr-TR")}</strong></div><div><span>Arz fiyatı</span><strong>₺{lead.price.toLocaleString("tr-TR")}</strong></div><div><span>Kapsam</span><strong className="warning">Ön analiz</strong></div></div><div className="heroInsight"><span>Kısa değerlendirme</span><p>{lead.aiSummary}</p></div><div className="sourceChip">↗ {lead.sources.length} resmî kaynak</div></article>}
    </div></section>

    <section className="statsSection"><div className="container statsGrid">
      <article className="statCard"><span className="statIcon">SPK</span><div><strong>{ipos.length}</strong><span>Takip edilen halka arz</span></div></article>
      <article className="statCard"><span className="statIcon">LOT</span><div><strong>{totalLots.toLocaleString("tr-TR")}</strong><span>Toplam temel arz lotu</span></div></article>
      <article className="statCard"><span className="statIcon">BÜL</span><div><strong>{bulletinCount}</strong><span>Resmî SPK bülteni</span></div></article>
      <article className="statCard"><span className="statIcon">BIST</span><div><strong>{listedCount}</strong><span>İşlem görmeye başlayan</span></div></article>
    </div></section>

    <section className="section"><div className="container"><div className="sectionHeading"><div><span className="eyebrow">Güncel görünüm</span><h2>SPK onayı alan son halka arzlar</h2><p>Resmî bilgiler tek yerde toplanır; yeni tarihler ve borsa kodları açıklandıkça kayıtlar güncellenir.</p></div><Link className="secondaryButton" href="/halka-arzlar">Tümünü gör</Link></div><div className="cardGrid">{featured.map((ipo) => <IpoCard ipo={ipo} key={ipo.id} />)}</div></div></section>
    <div className="container"><AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} label="Ana sayfa reklam alanı" /></div>
    <section className="section mutedSection"><div className="container"><div className="sectionHeading centered"><div><span className="eyebrow">Nasıl değerlendiriyoruz?</span><h2>Açıklanan bilgi kadar konuşuyoruz</h2><p>Her şirket aynı adımlarla incelenir; eksik veya henüz açıklanmamış alanlar açıkça belirtilir.</p></div></div><div className="processGrid"><article><span>01</span><h3>Resmî kaynak kontrol edilir</h3><p>SPK ve şirket belgelerindeki doğrulanabilir bilgiler bir araya getirilir.</p></article><article><span>02</span><h3>Arz yapısı sadeleştirilir</h3><p>Sermaye artırımı, ortak satışı, fiyat ve lot bilgileri anlaşılır hâle getirilir.</p></article><article><span>03</span><h3>Eksik alanlar işaretlenir</h3><p>Henüz açıklanmayan tarih, kod veya finansal bilgi için tahmin üretilmez.</p></article><article><span>04</span><h3>Yeni gelişmeler eklenir</h3><p>Talep toplama, işlem tarihi ve resmî şirket gelişmeleri kayıtla eşleştirilir.</p></article></div></div></section>
    <section className="finalCta"><div className="container finalCtaInner"><div><span className="eyebrow">Tek ekranda karşılaştır</span><h2>Halka arzları resmî bilgileriyle incele.</h2><p>Fiyatı, lotu, arz yapısını ve güncel durumunu şirketler arasında kolayca karşılaştır.</p></div><Link className="primaryButton large" href="/halka-arzlar">Kayıtları aç</Link></div></section>
  </main><Footer /></>;
}
