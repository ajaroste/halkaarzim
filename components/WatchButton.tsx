"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { listWatchlist, toggleWatchlist } from "@/lib/supabase-rest";

function localList(): string[] {
  try { return JSON.parse(localStorage.getItem("halkaarzim-watchlist") || "[]") as string[]; } catch { return []; }
}
export function WatchButton({ ipoId, slug }: { ipoId: string; slug: string }) {
  const [watched, setWatched] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  const { session } = useAuth();
  useEffect(() => {
    let alive = true;
    if (session) listWatchlist(session.access_token).then((ids) => alive && setWatched(ids.includes(ipoId))).catch(() => alive && setMessage("Takip listesi alınamadı."));
    else setWatched(localList().includes(slug));
    return () => { alive = false; };
  }, [ipoId, slug, session]);
  async function toggle() {
    const next = !watched; setBusy(true); setMessage("");
    try {
      if (session) await toggleWatchlist(ipoId, next, session.access_token);
      else {
        const list = new Set(localList()); if (next) list.add(slug); else list.delete(slug); localStorage.setItem("halkaarzim-watchlist", JSON.stringify([...list]));
        setMessage("Giriş yapmadığın için takip seçimi yalnız bu cihazda saklandı.");
      }
      setWatched(next); window.dispatchEvent(new Event("halkaarzim-watchlist-changed"));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Takip işlemi tamamlanamadı."); }
    finally { setBusy(false); }
  }
  return <div className="watchControl"><button className={watched ? "primaryButton" : "secondaryButton"} onClick={() => void toggle()} disabled={busy}>{busy ? "İşleniyor…" : watched ? "★ Takip ediliyor" : "☆ Takip et"}</button>{message && <small>{message}</small>}</div>;
}
