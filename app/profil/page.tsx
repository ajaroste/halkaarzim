"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/components/AuthProvider";
import { ipos } from "@/data/ipos";
import { listWatchlist, updateProfile } from "@/lib/supabase-rest";
import { requestAccountDeletion } from "@/lib/account-deletion";

export default function ProfilePage() {
  const { session, profile, loading, configured, reload } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setUsername(profile?.username || "");
    setDisplayName(profile?.display_name || "");
  }, [profile]);

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
  const profileDirty = Boolean(session && profile && (username.trim().toLowerCase() !== (profile.username || "") || displayName.trim() !== (profile.display_name || "")));

  function enableNotifications() {
    setMessage("Tarayıcı izin penceresi açılıyor…");
    window.dispatchEvent(new Event("halkaarzim-enable-notifications"));
  }

  async function testNotification() {
    if (!("Notification" in window)) {
      setMessage("Bu tarayıcı bildirimleri desteklemiyor.");
      return;
    }
    let permission = Notification.permission;
    if (permission !== "granted") permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("Bildirim izni verilmedi.");
      return;
    }
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration) {
        await registration.showNotification("HalkaArzım bildirim testi", {
          body: "Bildirimler çalışıyor. Yeni halka arzlar geldiğinde burada göreceksin.",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: "halkaarzim-test"
        });
      } else {
        new Notification("HalkaArzım bildirim testi", { body: "Bildirimler çalışıyor." });
      }
      setNotifications(true);
      setMessage("Test bildirimi gönderildi.");
    } catch {
      setMessage("Test bildirimi gönderilemedi.");
    }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
      setMessage("Kullanıcı adı 3-30 karakter olmalı; yalnız küçük harf, rakam ve alt çizgi kullanılabilir.");
      return;
    }
    if (cleanDisplayName.length < 2 || cleanDisplayName.length > 40) {
      setMessage("Görünen ad 2-40 karakter olmalıdır.");
      return;
    }
    if (!profileDirty) {
      setMessage("Kaydedilecek bir değişiklik yok.");
      return;
    }
    setSavingProfile(true);
    setMessage("");
    try {
      await updateProfile({ username: cleanUsername, displayName: cleanDisplayName }, session.access_token);
      await reload();
      setMessage("Profil bilgilerin güncellendi.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Profil güncellenemedi.";
      const normalized = text.toLowerCase();
      if (normalized.includes("duplicate") || normalized.includes("unique")) setMessage("Bu kullanıcı adı daha önce alınmış.");
      else if (normalized.includes("permission denied") || normalized.includes("function") || normalized.includes("schema cache")) setMessage("Profil güncelleme servisi şu anda kullanılamıyor.");
      else setMessage(text);
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitDeletionRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const confirmed = window.confirm("Hesap silme talebi oluşturulsun mu? Talep işlenene kadar hesabın açık kalır.");
    if (!confirmed) return;
    setRequestingDeletion(true);
    setMessage("");
    try {
      await requestAccountDeletion(session.access_token, deletionReason);
      setDeletionReason("");
      setMessage("Hesap silme talebin alındı. İnceleme ve kimlik doğrulama sonrasında hesabın ve ilişkili verilerin silme/anonimleştirme işlemi yapılacak.");
    } catch (error) {
      const text = error instanceof Error ? error.message : "Hesap silme talebi oluşturulamadı.";
      setMessage(text.toLowerCase().includes("function") || text.toLowerCase().includes("schema cache") ? "Hesap silme servisi şu anda kullanılamıyor." : text);
    } finally {
      setRequestingDeletion(false);
    }
  }

  return <><Header /><main className="pageShell"><section className="pageHero"><div className="container"><span className="eyebrow">Kişisel alan</span><h1>Takip listen. Profilin. Bildirimlerin.</h1><p>{session ? `${profile?.display_name || session.user.email || "Hesabın"} ile eşitlenen kişisel alan.` : "Giriş yapılmadığı için seçimler yalnız bu tarayıcıda saklanır."}</p></div></section><section className="section"><div className="container narrow">
    {!loading && configured && !session && <article className="panel profileSettings signedOutAccountCard"><div><span className="eyebrow">Hesabın</span><h2>Takiplerini cihazlar arasında eşitle</h2><p>Giriş yaptığında kullanıcı adını, görünen adını, takip listesini ve bildirim tercihlerini hesabınla yönetebilirsin.</p></div><button className="primaryButton" type="button" onClick={() => setAuthOpen(true)}>Giriş yap veya hesap oluştur</button></article>}
    {session && <article className="panel profileSettings"><div style={{ width: "100%" }}><span className="eyebrow">Hesap ayarları</span><h2>Profil bilgileri</h2><p>Kullanıcı adın yorumlarda ve topluluk alanlarında görünür. Kullanıcı adını 3-30 karakter arasında, küçük harf/rakam/alt çizgi ile değiştirebilirsin.</p><form className="authForm" onSubmit={saveProfile}><label>Kullanıcı adı<input value={username} onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)} minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}" autoCapitalize="none" spellCheck={false} autoComplete="username" placeholder="ornek_kullanici" required /></label><label>Görünen ad<input value={displayName} onChange={(event: ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)} minLength={2} maxLength={40} autoComplete="name" required /></label><label>E-posta<input value={session.user.email || ""} disabled /></label><button className="primaryButton" disabled={savingProfile || !profileDirty}>{savingProfile ? "Kaydediliyor…" : profileDirty ? "Değişiklikleri kaydet" : "Değişiklik yok"}</button></form></div></article>}
    <article className="panel profileSettings"><div><span className="eyebrow">Anlık haber</span><h2>Yeni halka arz bildirimleri</h2><p>Yeni bir firma listeye eklendiğinde tarayıcı bildirimi al. Test butonuyla cihazındaki görünümü hemen doğrula.</p></div><div className="buttonRow"><button className={notifications ? "secondaryButton" : "primaryButton"} onClick={enableNotifications}>{notifications ? "Bildirimler açık" : "Bildirimleri aç"}</button><button className="secondaryButton" onClick={() => void testNotification()}>Test bildirimi gönder</button></div></article>
    {session && <article className="panel accountDangerZone"><div><span className="eyebrow">Gizlilik hakkı</span><h2>Hesap silme talebi</h2><p>Talep oluşturduğunda hesap, yorum, takip ve bildirim verileri incelemeye alınır. Hukuken saklanması gerekmeyen kayıtlar silinir veya anonimleştirilir.</p></div><form className="authForm" onSubmit={submitDeletionRequest}><label>İsteğe bağlı açıklama<textarea value={deletionReason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDeletionReason(event.target.value)} maxLength={500} rows={3} placeholder="Silme talebinle ilgili eklemek istediğin bilgi" /></label><button className="dangerButton" disabled={requestingDeletion}>{requestingDeletion ? "Talep oluşturuluyor…" : "Hesap silme talebi oluştur"}</button></form></article>}
    {message && <p className="formMessage" role="status">{message}</p>}
    {watched.length ? <div className="watchList">{watched.map((ipo) => <article className="panel" key={ipo.id}><div className="companyRow"><div className="companyLogo">{(ipo.ticker || ipo.company).slice(0, 2)}</div><div><h2>{ipo.company}</h2><p>{ipo.ticker || "Kod bekleniyor"} · {ipo.statusLabel}</p></div></div><Link className="textLink" href={`/arz/${ipo.slug}`}>Detaya git →</Link></article>)}</div> : <div className="emptyState"><strong>Takip listen boş</strong><p>Şirket detayındaki “Takip et” düğmesini kullan.</p><Link className="primaryButton" href="/halka-arzlar">Halka arzları aç</Link></div>}
  </div></section></main><Footer /><AuthModal open={authOpen} onClose={() => setAuthOpen(false)} /></>;
}
