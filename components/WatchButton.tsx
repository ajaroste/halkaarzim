"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { listWatchlist, toggleWatchlist } from "@/lib/supabase-rest";
import { showToast } from "@/lib/toast";

function localList(): string[] {
  try { return JSON.parse(localStorage.getItem("halkaarzim-watchlist") || "[]") as string[]; } catch { return []; }
}
export function WatchButton({ ipoId, slug }: { ipoId: string; slug: string }) {
  const [watched, setWatched] = useState(false);
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();

  useEffect(() => {
    let alive = true;
    if (session) {
      listWatchlist(session.access_token)
        .then((ids) => alive && setWatched(ids.includes(ipoId)))
        .catch(() => alive && showToast({ title: "Takip listesi alınamadı", message: "Lütfen kısa süre sonra tekrar dene.", kind: "error" }));
    } else setWatched(localList().includes(slug));
    return () => { alive = false; };
  }, [ipoId, slug, session]);

  async function toggle() {
    const next = !watched;
    setBusy(true);
    try {
      if (session) await toggleWatchlist(ipoId, next, session.access_token);
      else {
        const list = new Set(localList());
        if (next) list.add(slug); else list.delete(slug);
        localStorage.setItem("halkaarzim-watchlist", JSON.stringify([...list]));
      }
      setWatched(next);
      window.dispatchEvent(new Event("halkaarzim-watchlist-changed"));
      showToast({
        title: next ? "Halka arz takip edildi" : "Takipten çıkarıldı",
        message: session ? (next ? "Takip listene eklendi." : "Takip listenden kaldırıldı.") : "Giriş yapmadığın için değişiklik yalnız bu cihazda saklandı.",
        kind: next ? "success" : "info"
      });
    } catch (error) {
      showToast({ title: "Takip işlemi tamamlanamadı", message: error instanceof Error ? error.message : "Lütfen tekrar dene.", kind: "error" });
    } finally { setBusy(false); }
  }

  return <div className="watchControl"><button className={watched ? "primaryButton" : "secondaryButton"} onClick={() => void toggle()} disabled={busy}>{busy ? "İşleniyor…" : watched ? "★ Takipte" : "☆ Takip et"}</button></div>;
}
