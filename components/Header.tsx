"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Brand } from "./Brand";
import { AuthModal } from "./AuthModal";
import { useAuth } from "./AuthProvider";

type Theme = "light" | "dark";

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

  return <>
    <header className="siteHeader"><div className="container headerInner"><Brand />
      <nav className={menuOpen ? "desktopNav open" : "desktopNav"} aria-label="Ana menü">
        <Link href="/halka-arzlar" onClick={() => setMenuOpen(false)}>Halka arzlar</Link><Link href="/gundem" onClick={() => setMenuOpen(false)}>Şirket gündemi</Link><Link href="/metodoloji" onClick={() => setMenuOpen(false)}>Metodoloji</Link><Link href="/hakkimizda" onClick={() => setMenuOpen(false)}>Hakkımızda</Link>
      </nav>
      <div className="headerActions"><button type="button" className="iconButton" onClick={toggleTheme} aria-label={theme === "light" ? "Koyu temayı aç" : "Açık temayı aç"} title={theme === "light" ? "Koyu tema" : "Açık tema"}>{theme === "light" ? "☾" : "☀"}</button>
        <Link className="secondaryButton desktopOnly" href="/profil">{session ? (profile?.display_name || "Hesabım") : "Takip listem"}</Link>
        {!loading && (session ? <button type="button" className="primaryButton desktopOnly" onClick={() => void logout()}>Çıkış</button> : <button type="button" className="primaryButton desktopOnly" onClick={() => setAuthOpen(true)}>Giriş yap</button>)}
        <button type="button" className="iconButton mobileOnly" onClick={() => setMenuOpen((value) => !value)} aria-label="Menüyü aç" aria-expanded={menuOpen}>☰</button>
      </div>
    </div></header><AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
  </>;
}
