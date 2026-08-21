import Link from "next/link";
import { getMergedIpos } from "@/lib/official-ipos";

export async function RelatedIpos({ currentSlug, sector }: { currentSlug: string; sector: string }) {
  const ipos = await getMergedIpos();
  const related = ipos
    .filter((ipo) => ipo.slug !== currentSlug)
    .sort((a, b) => Number(b.sector === sector) - Number(a.sector === sector))
    .slice(0, 4);

  if (!related.length) return null;

  return <section className="relatedIpos" aria-labelledby="related-ipos-title">
    <div className="detailSectionHeading"><span className="eyebrow">Benzer kayıtlar</span><h2 id="related-ipos-title">Diğer halka arzları karşılaştır</h2><p>Aynı sektör veya yakın dönemdeki halka arz sayfalarına geç.</p></div>
    <div className="relatedIpoGrid">{related.map((ipo) => <Link href={`/arz/${ipo.slug}`} className="relatedIpoCard" key={ipo.id}><div><span className={`statusBadge ${ipo.status}`}>{ipo.statusLabel}</span><small>{ipo.ticker || "Kod bekleniyor"}</small></div><strong>{ipo.company}</strong><p>{ipo.price > 0 ? `₺${ipo.price.toLocaleString("tr-TR")}` : "Fiyat açıklanmadı"} · {ipo.distribution}</p><b>Detayı aç →</b></Link>)}</div>
  </section>;
}
