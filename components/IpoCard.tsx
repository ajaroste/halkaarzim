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

export function IpoCard({ ipo }: { ipo: Ipo }) {
  const code = ipo.ticker || "KOD BEKLENİYOR";
  const structure = capitalStructureLabel(ipo);

  return <article className={`ipoCard ipoCard-${ipo.status}`}>
    <div className="cardTopline"><span className={`statusBadge ${ipo.status}`}>{ipo.statusLabel}</span><span className="ticker">{code}</span></div>
    <div className="ipoCardIdentity"><div><h3>{ipo.company}</h3><p>{ipo.sector}</p></div><strong className="ipoCardPrice">{formatTry(ipo.price)}</strong></div>
    <div className="ipoCardCompactFacts">
      <div><span>Talep</span><strong>{ipo.dates}</strong></div>
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
