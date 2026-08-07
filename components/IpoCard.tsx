import Link from "next/link";
import type { Ipo } from "@/data/ipos";
import { AiScore } from "./AiScore";
import { formatTry } from "@/lib/domain";
import { publicAnalysisText } from "@/lib/public-analysis";

export function IpoCard({ ipo }: { ipo: Ipo }) {
  const code = ipo.ticker || "KOD BEKLENİYOR";
  const completeness = ipo.dataCompleteness || 0;
  const summary = publicAnalysisText(ipo.aiSummary);

  return <article className="ipoCard">
    <div className="cardTopline"><span className={`statusBadge ${ipo.status}`}>{ipo.statusLabel}</span><span className="ticker">{code}</span></div>
    <div className="companyRow"><div className="companyLogo" aria-hidden="true">{ipo.company.slice(0, 2).toLocaleUpperCase("tr-TR")}</div><div><h3>{ipo.company}</h3><p>{ipo.sector}</p></div></div>
    <div className="metricGrid"><div><span>Arz fiyatı</span><strong>{formatTry(ipo.price)}</strong></div><div><span>Talep tarihleri</span><strong>{ipo.dates}</strong></div><div><span>Temel arz</span><strong>{ipo.lotCount.toLocaleString("tr-TR")} lot</strong></div><div><span>Veri kapsamı</span><strong>%{completeness}</strong></div></div>
    {(ipo.participantCount || ipo.offerSize) ? <div className="secondaryMetrics">{Boolean(ipo.participantCount) && <span><b>{ipo.participantCount!.toLocaleString("tr-TR")}</b> katılımcı</span>}{Boolean(ipo.offerSize) && <span><b>{formatTry(ipo.offerSize!)}</b> büyüklük</span>}</div> : null}
    {summary ? <div className="aiSnippet"><AiScore score={ipo.aiScore} compact /><p>{summary}</p></div> : null}
    <div className="cardFooter"><span>{ipo.sources.length} kaynak · {ipo.bulletinNo}</span><Link href={`/arz/${ipo.slug}`}>Detayı incele →</Link></div>
  </article>;
}
