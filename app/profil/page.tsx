"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { ipos } from "@/data/ipos";
import { listWatchlist } from "@/lib/supabase-rest";

export default function ProfilePage() {
  const { session, profile, loading, configured } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    async function load() {
      if (session) {
        try { setIds(await listWatchlist(session.access_token)); }
        catch { setMessage("Takip listesi yüklenemedi."); }
      } else {
        try {
          const slugs = JSON.parse(localStorage.getItem("halkaarzim-watchlist") || "[]") as string[];
          setIds(ipos.filter((ipo) => slugs.includes(ipo.slug)).map((ipo) => ipo.id));
        } catch { setIds([]); }
      }
      setNotifications("Notification" in window && Notification.permission === "granted");
    }
    const notificationHandler = (event: Event) => {
      const detail = (event as CustomEvent<NotificationPermission>).detail;
      setNotifications(detail === "granted");
      setMessage(detail === "granted" ? "Yeni halka arz bildirimleri açıldı." : "Bildirim izni verilmedi.");
    };
    void load();
    const watchlistHandler = () => void load();
    window.addEventListener("halkaarzim-watchlist-changed", watchlistHandler);
    window.addEventListener("halkaarzim-notification-state", notificationHandler);
    return () => {
      window.removeEventListener("halkaarzim-watchlist-changed", watchlistHandler);
      window.removeEventListener("halkaarzim-notification-state", notificationHandler);
    };
  }, [session]);

  const watched = useMemo(() => ipos.filter((ipo) => ids.includes(ipo.id)), [ids]);

  function enableNotifications() {
    setMessage("Tarayıcı izin penceresi açılıyor…");
    window.dispatchEvent(new Event("halkaarzim-enable-notifications"));
  }

  return <><Header /><main className="pageShell"><section className="pageHero"><div className="container"><span className="eyebrow">Kişisel alan</span><h1>Takip listem</h1><p>{session ? `${profile?.display_name || session.user.email || "Hesabın"} ile eşitlenen şirketler.` : "Giriş yapılmadığı için seçimler yalnız bu tarayıcıda saklanır."}</p></div></section><section className="section"><div className="container narrow">
    <article className="panel profileSettings"><div><span className="eyebrow">Anlık haber</span><h2>Yeni halka arz bildirimleri</h2><p>Yeni bir firma halka arz listesine eklendiğinde tarayıcıda anında bildirim gösterilir. Google ile giriş yapıldığında tercihlerin hesabınla da eşitlenir.</p></div><button className={notifications ? "secondaryButton" : "primaryButton"} onClick={enableNotifications}>{notifications ? "Bildirimler açık" : "Bildirimleri aç"}</button></article>
    {!loading && configured && !session && <p className="formMessage">Takip listesini cihazlar arasında eşitlemek için Google ile giriş yap.</p>}{message && <p className="formMessage">{message}</p>}
    {watched.length ? <div className="watchList">{watched.map((ipo) => <article className="panel" key={ipo.id}><div className="companyRow"><div className="companyLogo">{(ipo.ticker || ipo.company).slice(0, 2)}</div><div><h2>{ipo.company}</h2><p>{ipo.ticker || "Kod bekleniyor"} · {ipo.statusLabel}</p></div></div><Link className="textLink" href={`/arz/${ipo.slug}`}>Detaya git →</Link></article>)}</div> : <div className="emptyState"><strong>Takip listen boş</strong><p>Şirket detayındaki “Takip et” düğmesini kullan.</p><Link className="primaryButton" href="/halka-arzlar">Halka arzları aç</Link></div>}
  </div></section></main><Footer /></>;
}
