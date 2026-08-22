"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";

function analyticsAllowed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("halkaarzim-cookie-choice") === "all";
}

export function ConsentAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const syncConsent = () => setEnabled(analyticsAllowed());
    syncConsent();
    window.addEventListener("halkaarzim-consent-changed", syncConsent);
    return () => window.removeEventListener("halkaarzim-consent-changed", syncConsent);
  }, []);

  if (!measurementId || !enabled) return null;

  return <>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`} strategy="afterInteractive" />
    <Script id="halkaarzim-ga4" strategy="afterInteractive">{`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${measurementId}', { anonymize_ip: true });
    `}</Script>
  </>;
}
