"use client";

import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import type { Ipo, IpoStatus } from "@/data/ipos";
import { IpoCard } from "./IpoCard";

type SortMode = "newest" | "oldest" | "price-asc" | "price-desc" | "company";
type FilterValue = "all" | IpoStatus;

const filters: Array<{ value: FilterValue; label: string; emptyText: string }> = [
  { value: "all", label: "Tümü", emptyText: "Kayıt bulunamadı." },
  { value: "approved", label: "SPK onaylı", emptyText: "Şu anda yalnız SPK onayı bulunan kayıt yok." },
  { value: "active", label: "Talep topluyor", emptyText: "Bugün talep toplama aşamasında halka arz bulunmuyor." },
  { value: "upcoming", label: "Yaklaşan", emptyText: "Talep tarihleri açıklanmış yaklaşan halka arz bulunmuyor." },
  { value: "completed", label: "Arzı tamamlanan", emptyText: "Arzı tamamlanmış kayıt bulunmuyor." },
  { value: "listed", label: "İşlem gören", emptyText: "İşlem görmeye başlayan kayıt bulunmuyor." },
  { value: "delayed", label: "Ertelenen", emptyText: "Ertelenen halka arz bulunmuyor." }
];

export function IpoExplorer({ items }: { items: Ipo[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<FilterValue>("all");
  const [sort, setSort] = useState<SortMode>("newest");

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: items.length };
    for (const item of items) result[item.status] = (result[item.status] || 0) + 1;
    return result;
  }, [items]);

  const visible = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("tr-TR");
    const filtered = items.filter((ipo) => {
      const matchesStatus = status === "all" || ipo.status === status;
      const matchesQuery = !term || `${ipo.company} ${ipo.ticker || ""} ${ipo.sector} ${ipo.bulletinNo}`
        .toLocaleLowerCase("tr-TR").includes(term);
      return matchesStatus && matchesQuery;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "oldest") return a.approvalDate.localeCompare(b.approvalDate);
      if (sort === "price-asc") return a.price - b.price;
      if (sort === "price-desc") return b.price - a.price;
      if (sort === "company") return a.company.localeCompare(b.company, "tr-TR");
      return b.approvalDate.localeCompare(a.approvalDate);
    });
  }, [items, query, status, sort]);

  const selectedFilter = filters.find((filter) => filter.value === status) || filters[0];
  const motionKey = `${status}-${sort}-${query.trim().toLocaleLowerCase("tr-TR")}`;

  return (
    <>
      <div className="explorerTools">
        <label className="searchBox">
          <span className="searchIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" /></svg>
          </span>
          <input aria-label="Halka arz ara" value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Şirket, kod, bülten veya sektör ara" />
          {query && <button className="searchClear" type="button" aria-label="Aramayı temizle" onClick={() => setQuery("")}>×</button>}
        </label>
        <label className="sortBox"><span>Sırala</span><select aria-label="Halka arzları sırala" value={sort} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSort(e.target.value as SortMode)}><option value="newest">En yeni onay</option><option value="oldest">En eski onay</option><option value="price-asc">Fiyat: düşükten yükseğe</option><option value="price-desc">Fiyat: yüksekten düşüğe</option><option value="company">Şirket adına göre</option></select></label>
      </div>
      <div className="tabs" role="tablist" aria-label="Halka arz durum filtresi">
        {filters.map((filter) => <button
          type="button"
          role="tab"
          aria-controls="ipo-results"
          aria-selected={status === filter.value}
          key={filter.value}
          className={status === filter.value ? "tab active" : "tab"}
          onClick={() => setStatus(filter.value)}
        >{filter.label}<span className="tabCount">{counts[filter.value] || 0}</span></button>)}
      </div>
      <p className="filterNotice" aria-live="polite">{selectedFilter.label}: {visible.length} kayıt</p>
      <div id="ipo-results">
        <div className="cardGrid" key={motionKey}>{visible.map((ipo) => <IpoCard key={ipo.id} ipo={ipo} />)}</div>
        {!visible.length && <div className="emptyState"><strong>Bu durumda kayıt bulunamadı</strong><p>{query.trim() ? "Arama kelimesini temizle veya başka bir filtre seç." : selectedFilter.emptyText}</p></div>}
      </div>
    </>
  );
}
