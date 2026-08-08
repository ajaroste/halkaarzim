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
import { showToast } from "@/lib/toast";

function SettingsIcon({ name }: { name: "profile" | "bell" | "shield" | "bookmark" | "logout" }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "profile") return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
  if (name === "bell") return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
  if (name === "shield") return <svg {...common}><path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>;
  if (name === "logout") return <svg {...common}><path d="M10 4H5v16h5"/><path d="m14 8 4 4-4 4M18 12H9"/></svg>;
  return <svg {...common}><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg>;
}

export default function ProfilePage() {
  const { session, profile, loading, configured, reload, logout } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
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
        catch { showToast({ title: "Takip listesi yüklenemedi", message: "Lütfen tekrar dene.", kind: "error" }); }
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
      showToast({ title: detail === "granted" ? "Bildirimler açıldı" : "Bildirim izni verilmedi", message: detail === "granted" ? "Yeni halka arz gelişmelerini sana bildireceğiz." : "Tarayıcı ayarlarından daha sonra açabilirsin.", kind: detail === "granted" ? "success" : "warning" });
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
  const initials = (profile?.display_name || session?.user.email || "H").trim().slice(0, 2).toLocaleUpperCase("tr-TR");

  function enableNotifications() {
    window.dispatchEvent(new Event("halkaarzim-enable-notifications"));
  }

  async function testNotification() {
    if (!("Notification" in window)) { showToast({ title: "Bildirim desteklenmiyor", message: "Bu tarayıcı web bildirimlerini desteklemiyor.", kind: "warning" }); return; }
    let permission = Notification.permission;
    if (permission !== "granted") permission = await Notification.requestPermission();
    if (permission !== "granted") { showToast({ title: "Bildirim izni verilmedi", kind: "warning" }); return; }
    try {
      const registration = await navigator.serviceWorker?.ready;
      if (registration) await registration.showNotification("HalkaArzım bildirim testi", { body: "Bildirimler çalışıyor. Yeni halka arzlar geldiğinde burada göreceksin.", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", tag: "halkaarzim-test" });
      else new Notification("HalkaArzım bildirim testi", { body: "Bildirimler çalışıyor." });
      setNotifications(true);
      showToast({ title: "Test bildirimi gönderildi", message: "Bildirim sistemi çalışıyor.", kind: "success" });
    } catch { showToast({ title: "Test bildirimi gönderilemedi", message: "Lütfen tarayıcı izinlerini kontrol et.", kind: "error" }); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const cleanUsername = username.trim().toLowerCase();
    const cleanDisplayName = displayName.trim();
    if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) { showToast({ title: "Kullanıcı adı geçersiz", message: "3-30 karakter; yalnız küçük harf, rakam ve alt çizgi kullan.", kind: "warning" }); return; }
    if (cleanDisplayName.length < 2 || cleanDisplayName.length > 40) { showToast({ title: "Görünen ad geçersiz", message: "2-40 karakter arasında olmalıdır.", kind: "warning" }); return; }
    if (!profileDirty) { showToast({ title: "Değişiklik yok", message: "Profilin zaten güncel.", kind: "info" }); return; }
    setSavingProfile(true);
    try {
      await updateProfile({ username: cleanUsername, displayName: cleanDisplayName }, session.access_token);
      await reload();
      showToast({ title: "Ayarlar kaydedildi", message: "Profil bilgilerin güncellendi.", kind: "success" });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Profil güncellenemedi.";
      const normalized = text.toLowerCase();
      if (normalized.includes("duplicate") || normalized.includes("unique")) showToast({ title: "Kullanıcı adı alınmış", message: "Başka bir kullanıcı adı dene.", kind: "warning" });
      else if (normalized.includes("permission denied") || normalized.includes("function") || normalized.includes("schema cache")) showToast({ title: "Profil servisi kullanılamıyor", message: "Lütfen daha sonra tekrar dene.", kind: "error" });
      else showToast({ title: "Profil güncellenemedi", message: text, kind: "error" });
    } finally { setSavingProfile(false); }
  }

  async function handleLogout() {
    await logout();
    showToast({ title: "Çıkış yapıldı", message: "Oturumun güvenli şekilde kapatıldı.", kind: "info" });
  }

  async function submitDeletionRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session) return;
    const confirmed = window.confirm("Hesap silme talebi oluşturulsun mu? Talep işlenene kadar hesabın açık kalır.");
    if (!confirmed) return;
    setRequestingDeletion(true);
    try {
      await requestAccountDeletion(session.access_token, deletionReason);
      setDeletionReason("");
      showToast({ title: "Silme talebi alındı", message: "İnceleme sonrasında uygun veriler silinecek veya anonimleştirilecek.", kind: "success", duration: 5000 });
    } catch (error) {
      const text = error instanceof Error ? error.message : "Hesap silme talebi oluşturulamadı.";
      showToast({ title: "Talep oluşturulamadı", message: text.toLowerCase().includes("function") || text.toLowerCase().includes("schema cache") ? "Hesap silme servisi şu anda kullanılamıyor." : text, kind: "error" });
    } finally { setRequestingDeletion(false); }
  }

  return <><Header /><main className="pageShell accountPageModern">
    <section className="accountHeroModern"><div className="container accountHeroInner">
      <div><span className="eyebrow">Kişisel alan</span><h1>Hesabın ve takiplerin.</h1><p>{session ? `${profile?.display_name || session.user.email || "Hesabın"} için kişisel kontrol merkezi.` : "Giriş yapmadan takiplerin yalnız bu cihazda saklanır."}</p></div>
      {session && <div className="accountIdentityCard"><div className="accountAvatar">{initials}</div><div><strong>{profile?.display_name || "HalkaArzım kullanıcısı"}</strong><span>@{profile?.username || "kullanici"}</span><small>{session.user.email || ""}</small></div><button type="button" className="accountQuickLogout" onClick={() => void handleLogout()}><SettingsIcon name="logout" /><span>Çıkış yap</span></button></div>}
    </div></section>

    <section className="section accountSettingsSection"><div className="container accountSettingsShell">
      {!loading && configured && !session && <article className="accountSignedOutModern"><div className="accountSignedOutIcon"><SettingsIcon name="profile" /></div><div><span className="eyebrow">Hesap senkronizasyonu</span><h2>Takiplerini her cihazda yanında tut.</h2><p>Kullanıcı adını, takip listesini ve bildirim tercihlerini tek hesap altında yönet.</p></div><button className="primaryButton" type="button" onClick={() => setAuthOpen(true)}>Giriş yap veya hesap oluştur</button></article>}

      {session && <div className="accountGridModern">
        <article className="accountCardModern accountProfileCard"><div className="accountCardHeader"><div className="accountCardIcon"><SettingsIcon name="profile" /></div><div><span>Profil</span><h2>Kimlik bilgileri</h2></div>{profileDirty && <span className="accountUnsavedBadge">Kaydedilmemiş</span>}</div><p className="accountCardDescription">Kullanıcı adın yorumlarda, görünen adın kişisel alanlarda kullanılır.</p><form className="authForm accountFormModern" onSubmit={saveProfile}><label><span>Kullanıcı adı</span><div className="accountInputShell"><b>@</b><input value={username} onChange={(event: ChangeEvent<HTMLInputElement>) => setUsername(event.target.value)} minLength={3} maxLength={30} pattern="[a-z0-9_]{3,30}" autoCapitalize="none" spellCheck={false} autoComplete="username" placeholder="ornek_kullanici" required /></div><small>3-30 karakter · küçük harf, rakam ve alt çizgi</small></label><label><span>Görünen ad</span><input value={displayName} onChange={(event: ChangeEvent<HTMLInputElement>) => setDisplayName(event.target.value)} minLength={2} maxLength={40} autoComplete="name" required /></label><label><span>E-posta</span><input value={session.user.email || ""} disabled /></label><div className="accountFormActions"><button className="primaryButton" disabled={savingProfile || !profileDirty}>{savingProfile ? <><span className="authSpinner"/> Kaydediliyor…</> : profileDirty ? "Değişiklikleri kaydet" : "Tüm değişiklikler kayıtlı"}</button></div></form></article>

        <aside className="accountSideStack">
          <article className="accountCardModern"><div className="accountCardHeader"><div className="accountCardIcon"><SettingsIcon name="bell" /></div><div><span>Bildirimler</span><h2>Anlık haberler</h2></div><span className={`accountStatusDot ${notifications ? "on" : "off"}`}>{notifications ? "Açık" : "Kapalı"}</span></div><p className="accountCardDescription">Yeni halka arz ve takip ettiğin şirket gelişmelerini tarayıcı bildirimiyle al.</p><div className="accountActionStack"><button className={notifications ? "secondaryButton" : "primaryButton"} onClick={enableNotifications}>{notifications ? "Bildirimleri yönet" : "Bildirimleri aç"}</button><button className="secondaryButton" onClick={() => void testNotification()}>Test bildirimi gönder</button></div></article>

          <article className="accountCardModern accountSecurityCard"><div className="accountCardHeader"><div className="accountCardIcon"><SettingsIcon name="shield" /></div><div><span>Güvenlik</span><h2>Hesap durumu</h2></div></div><div className="accountSecurityRows"><div><span>E-posta</span><strong>Doğrulanmış</strong></div><div><span>Oturum</span><strong>Aktif</strong></div><div><span>Takip listesi</span><strong>{watched.length} şirket</strong></div></div><button type="button" className="accountLogoutButton" onClick={() => void handleLogout()}><SettingsIcon name="logout" /> Çıkış yap</button></article>
        </aside>
      </div>}

      <section className="accountWatchSection"><div className="accountSectionHeading"><div><span className="eyebrow">Takip listesi</span><h2>İzlediğin şirketler</h2></div><span className="accountCountBadge"><SettingsIcon name="bookmark" /> {watched.length}</span></div>{watched.length ? <div className="watchList accountWatchGrid">{watched.map((ipo) => <article className="panel accountWatchCard" key={ipo.id}><div className="companyRow"><div className="companyLogo">{(ipo.ticker || ipo.company).slice(0, 2)}</div><div><h3>{ipo.company}</h3><p>{ipo.ticker || "Kod bekleniyor"} · {ipo.statusLabel}</p></div></div><Link className="textLink" href={`/arz/${ipo.slug}`}>Detaya git →</Link></article>)}</div> : <div className="emptyState accountEmptyState"><strong>Takip listen boş</strong><p>Şirket detayındaki “Takip et” düğmesini kullanarak burayı kişiselleştir.</p><Link className="primaryButton" href="/halka-arzlar">Halka arzları keşfet</Link></div>}</section>

      {session && <article className="accountDangerZone accountDangerModern"><div><span className="eyebrow">Gizlilik ve hesap yönetimi</span><h2>Hesap silme talebi</h2><p>Bu işlem hesabını hemen kapatmaz. Talep incelenir ve uygun veriler silinir veya anonimleştirilir.</p></div><form className="authForm" onSubmit={submitDeletionRequest}><label><span>İsteğe bağlı açıklama</span><textarea value={deletionReason} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDeletionReason(event.target.value)} maxLength={500} rows={3} placeholder="Silme talebinle ilgili eklemek istediğin bilgi" /></label><button className="dangerButton" disabled={requestingDeletion}>{requestingDeletion ? "Talep oluşturuluyor…" : "Hesap silme talebi oluştur"}</button></form></article>}
    </div></section>
  </main><Footer /><AuthModal open={authOpen} onClose={() => setAuthOpen(false)} /></>;
}
