"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { AuthModal } from "./AuthModal";
import { useAuth } from "./AuthProvider";

type Theme = "light" | "dark";
type IconName = "bell" | "moon" | "sun" | "menu" | "close";

function Icon({ name }: { name: IconName }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "bell") return <svg {...common}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>;
  if (name === "moon") return <svg {...common}><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5 8.5 8.5 0 1 0 20.5 14.2Z"/></svg>;
  if (name === "sun") return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/></svg>;
  if (name === "close") return <svg {...common}><path d="M6 6l12 12M18 6 6 18"/></svg>;
  return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function Header() {
  const [theme, setTheme] = useState<Theme>("light");
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { session, profile, loading, logout } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem("halkaarzim-theme");
    const initial: Theme = stored === "dark" || stored === "light"
      ? stored
      : window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function toggleTheme() {
    setTheme((current) => {
      const next: Theme = current === "light" ? "dark" : "light";
      localStorage.setItem("halkaarzim-theme", next);
      applyTheme(next);
      return next;
    });
  }

  function requestNotifications() {
    setMenuOpen(false);
    window.dispatchEvent(new Event("halkaarzim-enable-notifications"));
  }

  return <>
    <header className="siteHeader"><div className="container headerInner"><Brand />
      <nav className={menuOpen ? "desktopNav open" : "desktopNav"} aria-label="Ana menü">
        <Link href="/halka-arzlar" onClick={() => setMenuOpen(false)}>Halka arzlar</Link><Link href="/gundem" onClick={() => setMenuOpen(false)}>Şirket gündemi</Link>
        <button type="button" className="textButton mobileMenuNotification" onClick={requestNotifications}>Bildirimler</button>
        {session && <div className="mobileAuthActions" aria-label="Hesap işlemleri">
          <Link className="mobileMenuAccount" href="/profil" onClick={() => setMenuOpen(false)}>
            <span>Hesabım</span>
            <small>{profile?.display_name || session.user.email || "Profil ve hesap ayarları"}</small>
          </Link>
          <button type="button" className="textButton mobileMenuLogout" onClick={() => { setMenuOpen(false); void logout(); }}>Çıkış yap</button>
        </div>}
      </nav>
      <div className="headerActions">
        <button type="button" className="iconButton notificationButton" onClick={requestNotifications} aria-label="Bildirimleri aç" title="Yeni halka arz bildirimleri"><Icon name="bell" /></button>
        <button type="button" className="iconButton themeButton" onClick={toggleTheme} aria-label={theme === "light" ? "Koyu temayı aç" : "Açık temayı aç"} title={theme === "light" ? "Koyu tema" : "Açık tema"}><Icon name={theme === "light" ? "moon" : "sun"} /></button>
        {session && <Link className="secondaryButton desktopOnly" href="/profil">{profile?.display_name || "Hesabım"}</Link>}
        {!loading && (session
          ? <button type="button" className="primaryButton desktopOnly" onClick={() => void logout()}>Çıkış</button>
          : <button type="button" className="primaryButton headerLoginButton" onClick={() => setAuthOpen(true)}>Giriş yap</button>)}
        <button type="button" className="iconButton mobileOnly mobileMenuButton" onClick={() => setMenuOpen((value) => !value)} aria-label={menuOpen ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={menuOpen}><Icon name={menuOpen ? "close" : "menu"} /></button>
      </div>
    </div></header><AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
  </>;
}
