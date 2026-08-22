import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AiRuntimeAnalysis } from "@/components/AiRuntimeAnalysis";
import { Comments } from "@/components/Comments";
import { PromiseTracker } from "@/components/PromiseTracker";
import { FinancialTable } from "@/components/FinancialTable";
import { TradingViewChart } from "@/components/TradingViewChart";
import { LiveAgenda } from "@/components/LiveAgenda";
import { LotCalculator } from "@/components/LotCalculator";
import { WatchButton } from "@/components/WatchButton";
import { AdSlot } from "@/components/AdSlot";
import { JsonLd } from "@/components/JsonLd";
import { ShareActions } from "@/components/ShareActions";
import { RelatedIpos } from "@/components/RelatedIpos";
import { formatTry } from "@/lib/domain";
import { publicAnalysisList, publicAnalysisText } from "@/lib/public-analysis";
import { ipos } from "@/data/ipos";
import { getMergedIpoBySlug } from "@/lib/official-ipos";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halkaarzim.vercel.app").replace(/\/+$/, "");

function AiNavIcon() {
  return <svg className="aiNavIcon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.75c.55 3.35 2.24 5.04 5.6 5.6-3.36.55-5.05 2.24-5.6 5.6-.56-3.36-2.25-5.05-5.6-5.6 3.35-.56 5.04-2.25 5.6-5.6ZM18.1 14.2c.3 1.8 1.2 2.7 3 3-1.8.3-2.7 1.2-3 3-.3-1.8-1.2-2.7-3-3 1.8-.3 2.7-1.2 3-3Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/></svg>;
}

export function generateStaticParams() { return ipos.map((ipo) => ({ slug: ipo.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ipo = await getMergedIpoBySlug(slug);
  if (!ipo) return {};
  const summary = publicAnalysisText(ipo.aiSummary);
  const title = ipo.ticker
    ? `${ipo.ticker} Halka Arz: Fiyat, Lot, Tarih ve Ön Analiz`
    : `${ipo.company} Halka Arz: Fiyat, Lot, Tarih ve Ön Analiz`;
  const description = `${ipo.company} halka arz fiyatı, lot bilgisi, talep tarihleri, arz yapısı ve kaynak bazlı ön analiz. ${summary}`.slice(0, 300);
  const url = `${siteUrl}/arz/${ipo.slug}`;
  return {
    title,
    description,
    alternates: { canonical: `/arz/${ipo.slug}` },
    openGraph: { title, description, url, type: "article", siteName: "HalkaArzım", locale: "tr_TR" },
    twitter: { card: "summary", title, description },
    robots: { index: true, follow: true }
  };
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="detailEmpty"><span aria-hidden="true">i</span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

export default async function IpoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ipo = await getMergedIpoBySlug(slug);
  if (!ipo) notFound();
  const code = ipo.ticker || "Kod bekleniyor";
  const capitalRatio = ipo.lotCount ? Math.round(ipo.capitalIncreaseShares / ipo.lotCount * 100) : 0;
  const saleRatio = ipo.lotCount ? Math.round(ipo.shareholderSaleShares / ipo.lotCount * 100) : 0;
  const summary = publicAnalysisText(ipo.aiSummary) || `${ipo.company} halka arzına ilişkin doğrulanmış temel veriler aşağıda özetlenmiştir.`;
  const highlights = publicAnalysisList(ipo.highlights);
  const risks = publicAnalysisList(ipo.risks);
  const pageUrl = `${siteUrl}/arz/${ipo.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Ana sayfa", item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Halka arzlar", item: `${siteUrl}/halka-arzlar` },
        { "@type": "ListItem", position: 3, name: ipo.company, item: pageUrl }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: `${ipo.company} Halka Arz Ön Analizi`,
      description: summary,
      mainEntityOfPage: pageUrl,
      url: pageUrl,
      inLanguage: "tr-TR",
      about: { "@type": "Organization", name: ipo.company },
      author: { "@type": "Organization", name: "HalkaArzım", url: siteUrl },
      publisher: { "@type": "Organization", name: "HalkaArzım", url: siteUrl },
      isAccessibleForFree: true
    }
  ];

  return <><JsonLd data={jsonLd} /><Header /><main className="detailPage detailV3"><div className="container">
    <nav className="breadcrumb"><Link href="/">Ana sayfa</Link><span>/</span><Link href="/halka-arzlar">Halka arzlar</Link><span>/</span><span>{code}</span></nav>

    <section className="detailIntro">
      <div className="detailIntroIdentity">
        <div className="companyLogo xlarge">{ipo.company.slice(0, 2).toLocaleUpperCase("tr-TR")}</div>
        <div><div className="cardTopline left"><span className={`statusBadge ${ipo.status}`}>{ipo.statusLabel}</span><span className="ticker">{code}</span></div><h1>{ipo.company}</h1><p>{ipo.sector}</p></div>
      </div>
      <WatchButton ipoId={ipo.id} slug={ipo.slug} />
    </section>

    <section className="detailQuickFacts" aria-label="Halka arz özeti">
      <article><span>Arz fiyatı</span><strong>{formatTry(ipo.price)}</strong></article>
      <article><span>Toplam lot</span><strong>{ipo.lotCount.toLocaleString("tr-TR")}</strong></article>
      <article><span>Talep tarihleri</span><strong>{ipo.dates}</strong></article>
      <article><span>Dağıtım</span><strong>{ipo.distribution}</strong></article>
    </section>

    <div className="detailUtilityRow"><ShareActions title={`${ipo.company} halka arz`} url={pageUrl} /><Link href="/yatirim-tavsiyesi-degildir" className="detailDisclaimerLink">Bu içerik yatırım tavsiyesi değildir →</Link></div>

    <nav className="detailSectionNav" aria-label="Detay bölümleri">
      <a href="#ozet">Özet</a><a href="#arz-yapisi">Arz yapısı</a><a href="#belgeler">Belgeler</a><a href="#piyasa">Piyasa</a><a href="#gundem">Gündem</a><a href="#yorumlar">Yorumlar</a><a className="aiNavLink" href="#ai-yorumu"><AiNavIcon />AI yorumu</a>
    </nav>

    <div className="detailContentGrid">
      <div className="detailContentMain">
        <section id="ai-yorumu" className="aiTopSection">
          <article className="panel aiReportPanel compactReport">
            <AiRuntimeAnalysis slug={ipo.slug} fallbackScore={ipo.aiScore} fallbackSummary={summary} fallbackHighlights={highlights} fallbackRisks={risks} />
            <details className="detailDisclosure"><summary>Analiz kapsamı ve kaynaklar</summary><div className="disclosureBody"><div className="sourceList"><div className="sourceListTitle"><strong>Kullanılan kaynaklar</strong><span>{ipo.sources.length} belge</span></div>{ipo.sources.map((source) => source.url ? <a className="sourceEntry" key={`${source.title}-${source.url}`} href={source.url} target="_blank" rel="noreferrer"><div><strong>{source.title}</strong><small>{source.kind}</small></div><span>{source.page}</span><b>↗</b></a> : <div className="sourceEntry" key={`${source.title}-${source.page}`}><div><strong>{source.title}</strong><small>{source.kind}</small></div><span>{source.page}</span></div>)}</div><p className="reportStamp">Kapsam: {ipo.analysisScope}. Bu değerlendirme yatırım tavsiyesi veya getiri tahmini değildir.</p></div></details>
          </article>
        </section>

        <section id="ozet" className="detailSectionBlock">
          <div className="detailSectionHeading"></div>
        </section>

        <section id="arz-yapisi" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Arz yapısı</span><h2>Para şirkete mi, ortağa mı gidiyor?</h2><p>Sermaye artırımı ile mevcut ortak satışının temel arz içindeki dağılımı.</p></div>
          <div className="structureCards">
            <article className="structureCard"><div><span>Sermaye artırımı</span><strong>{ipo.capitalIncreaseShares.toLocaleString("tr-TR")} lot</strong></div><b>%{capitalRatio}</b><div className="progress"><span style={{ width: `${capitalRatio}%` }} /></div><p>Şirket kasasına giden yeni sermaye payı.</p></article>
            <article className="structureCard"><div><span>Mevcut ortak satışı</span><strong>{ipo.shareholderSaleShares.toLocaleString("tr-TR")} lot</strong></div><b>%{saleRatio}</b><div className="progress"><span style={{ width: `${saleRatio}%` }} /></div><p>Mevcut ortakların sattığı pay.</p></article>
          </div>
        </section>

        <section id="belgeler" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Belgeler</span><h2>Fon kullanımı ve finansal görünüm</h2><p>Resmî belgelerde açıklanan fon kullanım planı ve finansal veriler.</p></div>
          <div className="documentGrid">
            <article className="panel documentCard"><h3>Fon kullanım planı</h3>{ipo.fundUse.length ? <div className="fundUseList">{ipo.fundUse.map((item) => <div className="fundUseRow" key={item.label}><div><span>{item.label}</span><strong>{item.min != null && item.max != null ? `%${item.min}–${item.max}` : `%${item.value}`}</strong></div><div className="progress"><span style={{ width: `${Math.min(100, item.value)}%` }} /></div></div>)}</div> : <EmptyState title="Henüz açıklanmadı" text="Doğrulanmış fon kullanım detayları açıklandığında bu bölüm güncellenir." />}</article>
            <article className="panel documentCard"><h3>Finansal görünüm</h3>{ipo.financials.length ? <FinancialTable rows={ipo.financials} /> : <EmptyState title="Finansal veri bulunmuyor" text="Doğrulanmış finansal veriler açıklandığında bu bölüm güncellenir." />}</article>
          </div>
        </section>

        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_DETAIL_SLOT} label="Şirket detayı reklam alanı" />

        <section id="piyasa" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Piyasa</span><h2>Fiyat grafiği ve lot tahmini</h2><p>İşlem görmeye başlayan şirketlerde fiyat grafiği; tahsisat açıklanan arzlarda lot senaryosu.</p></div>
          <div className="marketGrid"><article className="panel"><TradingViewChart ticker={ipo.ticker} /></article><article className="panel lotPanel">{ipo.retailLots > 0 ? <><h3>Lot tahmin aracı</h3><LotCalculator price={ipo.price} retailLots={ipo.retailLots} /></> : <EmptyState title="Lot tahmini için veri yok" text="Bireysel tahsisat açıklanmadığı için hesaplama yapılamıyor." />}</article></div>
        </section>

        <section id="gundem" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Gündem</span><h2>Şirket gelişmeleri ve verilen sözler</h2><p>Resmî gelişmeler ve halka arz sürecinde açıklanan taahhütler.</p></div>
          <div className="agendaPromiseGrid"><article className="panel"><LiveAgenda company={ipo.company} officialEvents={ipo.agenda} /></article><article className="panel">{ipo.promises.length ? <PromiseTracker promises={ipo.promises} /> : <EmptyState title="Takip edilecek taahhüt bulunmuyor" text="Doğrulanmış somut taahhütler bulunduğunda burada listelenir." />}</article></div>
        </section>

        <section id="yorumlar" className="detailSectionBlock"><Comments ipoId={ipo.id} slug={ipo.slug} /></section>
        <RelatedIpos currentSlug={ipo.slug} sector={ipo.sector} />
      </div>

      <aside className="detailInfoRail"><article className="panel infoRailCard"><span className="eyebrow">Hızlı bilgiler</span><h2>Halka arz bilgileri</h2><dl className="facts"><div><dt>{ipo.approvalLabel || "SPK onay tarihi"}</dt><dd>{ipo.approvalDate}</dd></div><div><dt>Temel arz</dt><dd>{ipo.lotCount.toLocaleString("tr-TR")}</dd></div><div><dt>Azami arz</dt><dd>{(ipo.maxLotCount || ipo.lotCount).toLocaleString("tr-TR")}</dd></div>{ipo.firstTradeDate && <div><dt>İlk işlem tarihi</dt><dd>{new Date(ipo.firstTradeDate).toLocaleDateString("tr-TR")}</dd></div>}{ipo.intermediary && <div><dt>Aracı kurum</dt><dd>{ipo.intermediary}</dd></div>}<div><dt>Veri kapsamı</dt><dd>%{ipo.dataCompleteness || 0}</dd></div></dl><Link className="infoRailLegal" href="/yatirim-tavsiyesi-degildir">Risk ve sorumluluk açıklaması</Link></article></aside>
    </div>
  </div></main><Footer /></>;
}
