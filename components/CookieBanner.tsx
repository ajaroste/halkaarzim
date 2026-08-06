"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(!localStorage.getItem("halkaarzim-cookie-choice")), []);
  if (!visible) return null;
  function choose(value: "necessary" | "all") {
    localStorage.setItem("halkaarzim-cookie-choice", value);
    window.dispatchEvent(new Event("halkaarzim-consent-changed"));
    setVisible(false);
  }
  return (
    <aside className="cookieBanner" role="dialog" aria-label="Çerez tercihleri">
      <div><strong>Çerez tercihleri</strong><p>Zorunlu depolamayı oturum ve tema için kullanıyoruz. Analitik/reklam çerezleri yalnız onay sonrası devreye alınmalıdır.</p><Link href="/gizlilik">Detayları gör</Link></div>
      <div><button className="secondaryButton" onClick={() => choose("necessary")}>Sadece zorunlu</button><button className="primaryButton" onClick={() => choose("all")}>Tümüne izin ver</button></div>
    </aside>
  );
}
