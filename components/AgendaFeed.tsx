"use client";

import { useMemo, useState } from "react";
import type { Ipo } from "@/data/ipos";

export type AgendaItem = Ipo["agenda"][number] & { ticker: string; company: string; slug: string };

function dateGroupLabel(date: string): string {
  const value = new Date(date);
  if (Number.isNaN(value.getTime())) return date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Dün";
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: value.getFullYear() === now.getFullYear() ? undefined : "numeric" }).format(value);
}

export function AgendaFeed({ items }: { items: AgendaItem[] }) {
  const [impact, setImpact] = useState<"all" | AgendaItem["impact"]>("all");
  const visible = useMemo(() => items.filter((item) => impact === "all" || item.impact === impact), [items, impact]);
  const groups = useMemo(() => {
    const result: Array<{ label: string; items: AgendaItem[] }> = [];
    for (const item of visible) {
      const label = dateGroupLabel(item.date);
      const last = result[result.length - 1];
      if (last?.label === label) last.items.push(item);
      else result.push({ label, items: [item] });
    }
    return result;
  }, [visible]);

  return <div>
    <div className="tabs agendaFilters" role="tablist" aria-label="Gündem etki filtresi">
      <button type="button" role="tab" aria-selected={impact === "all"} className={impact === "all" ? "tab active" : "tab"} onClick={() => setImpact("all")}>Tümü</button>
      <button type="button" role="tab" aria-selected={impact === "potential-positive"} className={impact === "potential-positive" ? "tab active" : "tab"} onClick={() => setImpact("potential-positive")}>Potansiyel olumlu</button>
      <button type="button" role="tab" aria-selected={impact === "risk"} className={impact === "risk" ? "tab active" : "tab"} onClick={() => setImpact("risk")}>Risk</button>
      <button type="button" role="tab" aria-selected={impact === "neutral"} className={impact === "neutral" ? "tab active" : "tab"} onClick={() => setImpact("neutral")}>Nötr</button>
    </div>
    <div className="agendaGroupedList">
      {groups.map((group) => <section className="agendaDateGroup" key={group.label}>
        <h2 className="agendaDateHeading">{group.label}</h2>
        <div className="agendaPageList">{group.items.map((item) => <article key={`${item.slug}-${item.date}-${item.title}`}><span className={`timelineDot ${item.impact}`} /><div><div className="timelineMeta"><span>{item.date}</span><span>{item.source}</span><span>{item.ticker}</span></div><h3>{item.title}</h3><p>{item.summary}</p><a href={`/arz/${item.slug}`}>{item.company} detayına git →</a></div></article>)}</div>
      </section>)}
      {!groups.length && <div className="emptyState"><strong>Bu filtrede gelişme yok</strong><p>Başka bir etki filtresi seçebilirsin.</p></div>}
    </div>
  </div>;
}
