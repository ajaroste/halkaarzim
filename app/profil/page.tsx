"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/components/AuthProvider";
import { ipos } from "@/data/ipos";
import { listWatchlist, savePushSubscription } from "@/lib/supabase-rest";

export default function ProfilePage() {
  const { session, profile, loading, configured } = useAuth(); const [ids, setIds] = useState<string[]>([]); const [message, setMessage] = useState(""); const [notifications, setNotifications] = useState(false);
  useEffect(() => {
    async function load() {
      if (session) { try { setIds(await listWatchlist(session.access_token)); } catch { setMessage("Takip listesi yüklenemedi."); } }
      else { try { const slugs = JSON.parse(localStorage.getItem("halkaarzim-watchlist") || "[]") as string[]; setIds(ipos.filter((i) => slugs.includes(i.slug)).map((i) => i.id)); } catch { setIds([]); } }
      setNotifications(Notification.permission === "granted");
    }
    void load(); const handler = () => void load(); window.addEventListener("halkaarzim-watchlist-changed", handler); return () => window.removeEventListener("halkaarzim-watchlist-changed", handler);
  }, [session]);
  const watched = useMemo(() => ipos.filter((i) => ids.includes(i.id)), [ids]);
  async function enableNotifications() {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) { setMessage("Bu tarayıcı uzak bildirimleri desteklemiyor."); return; }
    if (!session) { setMessage("Uzak bildirimleri açmak için giriş yapmalısın."); return; }
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) { setMessage("Bildirimler şu anda etkin değil."); return; }
    const permission = await Notification.requestPermission(); setNotifications(permission === "granted");
    if (permission !== "granted") { setMessage("Bildirim izni verilmedi."); return; }
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const padding = "=".repeat((4 - publicKey.length % 4) % 4);
      const bytes = Uint8Array.from(atob((publicKey + padding).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: bytes });
      const json = subscription.toJSON();
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Bildirim aboneliği eksik döndü");
      await savePushSubscription({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }, session.access_token);
      setMessage("Uzak bildirim aboneliği bu hesapla eşitlendi.");
      new Notification("HalkaArzım bildirimleri açık", { body: "Takip ettiğin halka arzların resmî gelişmeleri bu cihaza gönderilebilir." });
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bildirim aboneliği oluşturulamadı."); }
  }
  return <><Header /><main className="pageShell"><section className="pageHero"><div className="container"><span className="eyebrow">Kişisel alan</span><h1>Takip listem</h1><p>{session ? `${profile?.display_name || session.user.email || "Hesabın"} ile eşitlenen şirketler.` : "Giriş yapılmadığı için seçimler yalnız bu tarayıcıda saklanır."}</p></div></section><section className="section"><div className="container narrow">
    <article className="panel profileSettings"><div><h2>Bildirim tercihleri</h2><p>Bildirimler etkinleştirildiğinde takip ettiğin arzların resmî durum değişiklikleri bu cihaza gönderilebilir.</p></div><button className={notifications ? "secondaryButton" : "primaryButton"} onClick={() => void enableNotifications()}>{notifications ? "Bildirimler açık" : "Bildirimleri aç"}</button></article>
    {!loading && configured && !session && <p className="formMessage">Hesaplar arasında eşitleme için üst menüden giriş yap.</p>}{message && <p className="formMessage">{message}</p>}
    {watched.length ? <div className="watchList">{watched.map((ipo) => <article className="panel" key={ipo.id}><div className="companyRow"><div className="companyLogo">{(ipo.ticker || ipo.company).slice(0, 2)}</div><div><h2>{ipo.company}</h2><p>{ipo.ticker || "Kod bekleniyor"} · {ipo.statusLabel}</p></div></div><Link className="textLink" href={`/arz/${ipo.slug}`}>Detaya git →</Link></article>)}</div> : <div className="emptyState"><strong>Takip listen boş</strong><p>Şirket detayındaki “Takip et” düğmesini kullan.</p><Link className="primaryButton" href="/halka-arzlar">Halka arzları aç</Link></div>}
  </div></section></main><Footer /></>;
}
