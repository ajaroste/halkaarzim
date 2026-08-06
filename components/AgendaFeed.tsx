"use client";

import { useMemo, useState } from "react";
import type { Ipo } from "@/data/ipos";

export type AgendaItem = Ipo["agenda"][number] & { ticker: string; company: string; slug: string };
export function AgendaFeed({ items }: { items: AgendaItem[] }) {
  const [impact, setImpact] = useState<"all" | AgendaItem["impact"]>("all");
  const visible = useMemo(() => items.filter((item) => impact === "all" || item.impact === impact), [items, impact]);
  return <div><div className="tabs agendaFilters"><button className={impact === "all" ? "tab active" : "tab"} onClick={() => setImpact("all")}>Tümü</button><button className={impact === "potential-positive" ? "tab active" : "tab"} onClick={() => setImpact("potential-positive")}>Potansiyel olumlu</button><button className={impact === "risk" ? "tab active" : "tab"} onClick={() => setImpact("risk")}>Risk</button><button className={impact === "neutral" ? "tab active" : "tab"} onClick={() => setImpact("neutral")}>Nötr</button></div><div className="agendaPageList">{visible.map((item) => <article key={`${item.slug}-${item.date}-${item.title}`}><span className={`timelineDot ${item.impact}`} /><div><div className="timelineMeta"><span>{item.date}</span><span>{item.source}</span><span>{item.ticker}</span></div><h2>{item.title}</h2><p>{item.summary}</p><a href={`/arz/${item.slug}`}>{item.company} detayına git →</a></div></article>)}</div></div>;
}
