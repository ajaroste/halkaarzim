"use client";

import { useEffect, useState } from "react";
import type { IpoEvent } from "@/data/ipos";

type NewsItem = { title: string; link: string; source: string; publishedAt: string };

export function LiveAgenda({ company, officialEvents }: { company: string; officialEvents: IpoEvent[] }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/news?company=${encodeURIComponent(company)}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Haber alınamadı")))
      .then((data) => { setNews(Array.isArray(data.items) ? data.items : []); setState("ready"); })
      .catch((error) => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, [company]);

  return <div className="agendaLive">
    <div className="agendaSummary"><strong>Resmî gelişmeler</strong><p>SPK kayıtları resmî kaynak etiketiyle, internet haberleri ise ayrı bir gündem akışı olarak gösterilir.</p></div>
    <div className="timeline">{officialEvents.map((event) => <article className="timelineItem" key={`${event.date}-${event.title}`}><span className={`timelineDot ${event.impact}`} /><div><div className="timelineMeta"><span>{event.date}</span><span>{event.source}</span></div><h3>{event.title}</h3><p>{event.summary}</p>{event.sourceUrl && <a href={event.sourceUrl} target="_blank" rel="noreferrer">Resmî kaynağı aç ↗</a>}</div></article>)}</div>
    <div className="agendaSummary"><strong>İnternet gündemi</strong><p>Başlıklar Google News RSS üzerinden gelir; haberlerin doğruluğu yayıncı kaynağından kontrol edilmelidir.</p></div>
    {state === "loading" && <p>Gündem yükleniyor…</p>}
    {state === "error" && <p>Haber akışı şu anda alınamadı.</p>}
    {state === "ready" && !news.length && <p>Son dönemde eşleşen haber bulunamadı.</p>}
    <div className="newsList">{news.map((item) => <article key={item.link}><small>{item.source} · {new Date(item.publishedAt).toLocaleDateString("tr-TR")}</small><h3><a href={item.link} target="_blank" rel="noreferrer">{item.title}</a></h3></article>)}</div>
  </div>;
}
