import Link from "next/link";
import type { Ipo } from "@/data/ipos";
import { formatTry } from "@/lib/domain";

function capitalStructureLabel(ipo: Ipo): string | null {
  if (!ipo.lotCount) return null;
  const capitalRatio = Math.round((ipo.capitalIncreaseShares / ipo.lotCount) * 100);
  if (capitalRatio >= 95) return `%${capitalRatio} yeni sermaye`;
  if (capitalRatio <= 5 && ipo.shareholderSaleShares > 0) return "Ağırlıklı ortak satışı";
  if (ipo.capitalIncreaseShares > 0 && ipo.shareholderSaleShares > 0) return `%${capitalRatio} yeni sermaye`;
  return null;
}

function timingFact(ipo: Ipo): { label: string; value: string } {
  if (ipo.status === "listed" && ipo.firstTradeDate) {
    return { label: "İlk işlem", value: new Date(`${ipo.firstTradeDate}T12:00:00+03:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) };
  }
  if (ipo.status === "delayed") return { label: "Takvim", value: "Ertelendi" };
  if (ipo.status === "completed") return { label: "Talep dönemi", value: ipo.dates };
  return { label: ipo.status === "active" ? "Talep toplama" : "Talep", value: ipo.dates };
}

export function IpoCard({ ipo }: { ipo: Ipo }) {
  const code = ipo.ticker || "KOD BEKLENİYOR";
  const structure = capitalStructureLabel(ipo);
  const timing = timingFact(ipo);

  return <article className={`ipoCard ipoCard-${ipo.status}`}>
    <div className="cardTopline"><span className={`statusBadge ${ipo.status}`}>{ipo.statusLabel}</span><span className="ticker">{code}</span></div>
    <div className="ipoCardIdentity"><div><h3>{ipo.company}</h3><p>{ipo.sector}</p></div><strong className="ipoCardPrice">{formatTry(ipo.price)}</strong></div>
    <div className="ipoCardCompactFacts">
      <div><span>{timing.label}</span><strong>{timing.value}</strong></div>
      <div><span>Temel arz</span><strong>{ipo.lotCount.toLocaleString("tr-TR")} lot</strong></div>
    </div>
    <div className="ipoCardSignals">
      {structure && <span>{structure}</span>}
      <span>%{ipo.dataCompleteness || 0} veri kapsamı</span>
      <span>{ipo.sources.length} kaynak</span>
    </div>
    <div className="cardFooter"><span>{ipo.bulletinNo}</span><Link href={`/arz/${ipo.slug}`} aria-label={`${ipo.company} detayını incele`}>Detay <b aria-hidden="true">→</b></Link></div>
  </article>;
}
