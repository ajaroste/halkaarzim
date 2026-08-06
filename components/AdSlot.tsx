"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
  interface Window { adsbygoogle?: Array<Record<string, unknown>> }
}

const COOKIE_KEY = "halkaarzim-cookie-choice";

export function AdSlot({ slot, label = "Reklam" }: { slot?: string; label?: string }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    const refresh = () => setConsent(localStorage.getItem(COOKIE_KEY) === "all");
    refresh();
    window.addEventListener("halkaarzim-consent-changed", refresh);
    return () => window.removeEventListener("halkaarzim-consent-changed", refresh);
  }, []);

  useEffect(() => {
    if (consent && client && slot) {
      try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* Reklam engelleyici veya henüz hazır olmayan script */ }
    }
  }, [consent, client, slot]);

  if (!client || !slot) {
    return <aside className="adPlaceholder" aria-label="Reklam alanı"><span>{label}</span><small>AdSense onayı ve slot kodu sonrası otomatik dolar.</small></aside>;
  }

  if (!consent) {
    return <aside className="adPlaceholder" aria-label="Reklam izni bekleniyor"><span>{label}</span><small>Reklam, yalnız çerez tercihinde izin verildikten sonra yüklenir.</small></aside>;
  }

  return (
    <>
      <Script async strategy="afterInteractive" src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`} crossOrigin="anonymous" />
      <aside className="adLive" aria-label="Reklam">
        <span className="adLabel">Reklam</span>
        <ins className="adsbygoogle" style={{ display: "block" }} data-ad-client={client} data-ad-slot={slot} data-ad-format="auto" data-full-width-responsive="true" />
      </aside>
    </>
  );
}
