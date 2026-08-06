import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AiScore } from "@/components/AiScore";
import { Comments } from "@/components/Comments";
import { PromiseTracker } from "@/components/PromiseTracker";
import { FinancialTable } from "@/components/FinancialTable";
import { TradingViewChart } from "@/components/TradingViewChart";
import { LiveAgenda } from "@/components/LiveAgenda";
import { LotCalculator } from "@/components/LotCalculator";
import { WatchButton } from "@/components/WatchButton";
import { AdSlot } from "@/components/AdSlot";
import { formatTry } from "@/lib/domain";
import { getIpoBySlug, ipos } from "@/data/ipos";

export function generateStaticParams() { return ipos.map((ipo) => ({ slug: ipo.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const ipo = getIpoBySlug(slug);
  return ipo ? { title: `${ipo.ticker || "Halka arz"} ${ipo.company}`, description: ipo.aiSummary } : {};
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="detailEmpty"><span aria-hidden="true">i</span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

export default async function IpoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ipo = getIpoBySlug(slug);
  if (!ipo) notFound();
  const code = ipo.ticker || "Kod bekleniyor";
  const capitalRatio = ipo.lotCount ? Math.round(ipo.capitalIncreaseShares / ipo.lotCount * 100) : 0;
  const saleRatio = ipo.lotCount ? Math.round(ipo.shareholderSaleShares / ipo.lotCount * 100) : 0;

  return <><Header /><main className="detailPage detailV3"><div className="container">
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

    <nav className="detailSectionNav" aria-label="Detay bölümleri">
      <a href="#ozet">Özet</a><a href="#arz-yapisi">Arz yapısı</a><a href="#belgeler">Belgeler</a><a href="#piyasa">Piyasa</a><a href="#gundem">Gündem</a><a href="#yorumlar">Yorumlar</a>
    </nav>

    <div className="detailContentGrid">
      <div className="detailContentMain">
        <section id="ozet" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Özet</span><h2>Bu halka arzda öne çıkanlar</h2><p>Önce kritik bilgileri gör, ayrıntılara sonra geç.</p></div>
          <article className="panel aiReportPanel compactReport">
            <div className="reportLead"><AiScore score={ipo.aiScore} /><div><strong className="reportLabel">Kaynak bazlı ön analiz</strong><p>{ipo.aiSummary}</p></div></div>
            <div className="summarySplit">
              <div className="summaryList positiveSummary"><h3>Olumlu sinyaller</h3><ul>{ipo.highlights.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div className="summaryList riskSummary"><h3>Eksikler ve riskler</h3><ul>{ipo.risks.slice(0, 3).map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <details className="detailDisclosure"><summary>Tüm analiz ve kaynakları göster</summary><div className="disclosureBody"><div className="sourceList"><div className="sourceListTitle"><strong>Kullanılan kaynaklar</strong><span>{ipo.sources.length} belge</span></div>{ipo.sources.map((source) => source.url ? <a className="sourceEntry" key={`${source.title}-${source.url}`} href={source.url} target="_blank" rel="noreferrer"><div><strong>{source.title}</strong><small>{source.kind}</small></div><span>{source.page}</span><b>↗</b></a> : <div className="sourceEntry" key={`${source.title}-${source.page}`}><div><strong>{source.title}</strong><small>{source.kind}</small></div><span>{source.page}</span></div>)}</div><p className="reportStamp">Kapsam: {ipo.analysisScope}. Bu değerlendirme yatırım tavsiyesi veya getiri tahmini değildir.</p></div></details>
          </article>
        </section>

        <section id="arz-yapisi" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Arz yapısı</span><h2>Para şirkete mi, ortağa mı gidiyor?</h2><p>Sermaye artırımı ve mevcut ortak satışını tek bakışta karşılaştır.</p></div>
          <div className="structureCards">
            <article className="structureCard"><div><span>Sermaye artırımı</span><strong>{ipo.capitalIncreaseShares.toLocaleString("tr-TR")} lot</strong></div><b>%{capitalRatio}</b><div className="progress"><span style={{ width: `${capitalRatio}%` }} /></div><p>Şirket kasasına giden yeni sermaye payı.</p></article>
            <article className="structureCard"><div><span>Mevcut ortak satışı</span><strong>{ipo.shareholderSaleShares.toLocaleString("tr-TR")} lot</strong></div><b>%{saleRatio}</b><div className="progress"><span style={{ width: `${saleRatio}%` }} /></div><p>Mevcut ortakların sattığı pay.</p></article>
          </div>
        </section>

        <section id="belgeler" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Belgeler</span><h2>Fon kullanımı ve finansal görünüm</h2><p>Veri varsa gösterilir; yoksa sayfa gereksiz büyük kutularla doldurulmaz.</p></div>
          <div className="documentGrid">
            <article className="panel documentCard"><h3>Fon kullanım planı</h3>{ipo.fundUse.length ? <div className="fundUseList">{ipo.fundUse.map((item) => <div className="fundUseRow" key={item.label}><div><span>{item.label}</span><strong>{item.min != null && item.max != null ? `%${item.min}–${item.max}` : `%${item.value}`}</strong></div><div className="progress"><span style={{ width: `${Math.min(100, item.value)}%` }} /></div></div>)}</div> : <EmptyState title="Henüz işlenmedi" text="İzahname doğrulandığında fon kullanım kalemleri burada gösterilecek." />}</article>
            <article className="panel documentCard"><h3>Finansal görünüm</h3>{ipo.financials.length ? <FinancialTable rows={ipo.financials} /> : <EmptyState title="Finansal tablo yok" text="Bağımsız denetim raporu işlendiğinde bu alan güncellenecek." />}</article>
          </div>
        </section>

        <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_DETAIL_SLOT} label="Şirket detayı reklam alanı" />

        <section id="piyasa" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Piyasa</span><h2>Fiyat grafiği ve lot tahmini</h2><p>İşlem görmeye başladıysa grafik; tahsisat belliyse lot tahmini gösterilir.</p></div>
          <div className="marketGrid"><article className="panel"><TradingViewChart ticker={ipo.ticker} /></article><article className="panel lotPanel">{ipo.retailLots > 0 ? <><h3>Lot tahmin aracı</h3><LotCalculator price={ipo.price} retailLots={ipo.retailLots} /></> : <EmptyState title="Lot tahmini kapalı" text="Bireysel tahsisat açıklanmadığı için tahmin yapılamıyor." />}</article></div>
        </section>

        <section id="gundem" className="detailSectionBlock">
          <div className="detailSectionHeading"><span className="eyebrow">Gündem</span><h2>Şirket gelişmeleri ve verilen sözler</h2><p>Resmî gelişmeler ve halka arz vaatleri aynı akışta takip edilir.</p></div>
          <div className="agendaPromiseGrid"><article className="panel"><LiveAgenda company={ipo.company} officialEvents={ipo.agenda} /></article><article className="panel">{ipo.promises.length ? <PromiseTracker promises={ipo.promises} /> : <EmptyState title="Vaat takibi başlamadı" text="Fon kullanım planı yayımlandığında hedefler kayıt altına alınacak." />}</article></div>
        </section>

        <section id="yorumlar" className="detailSectionBlock"><Comments ipoId={ipo.id} slug={ipo.slug} /></section>
      </div>

      <aside className="detailInfoRail"><article className="panel infoRailCard"><span className="eyebrow">Hızlı bilgiler</span><h2>Halka arz bilgileri</h2><dl className="facts"><div><dt>{ipo.approvalLabel || "SPK onay tarihi"}</dt><dd>{ipo.approvalDate}</dd></div><div><dt>Temel arz</dt><dd>{ipo.lotCount.toLocaleString("tr-TR")}</dd></div><div><dt>Azami arz</dt><dd>{(ipo.maxLotCount || ipo.lotCount).toLocaleString("tr-TR")}</dd></div>{ipo.firstTradeDate && <div><dt>İlk işlem tarihi</dt><dd>{new Date(ipo.firstTradeDate).toLocaleDateString("tr-TR")}</dd></div>}{ipo.intermediary && <div><dt>Aracı kurum</dt><dd>{ipo.intermediary}</dd></div>}<div><dt>Veri kapsamı</dt><dd>%{ipo.dataCompleteness || 0}</dd></div></dl></article></aside>
    </div>
  </div></main><Footer /></>;
}
