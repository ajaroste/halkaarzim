"use client";

import { useState } from "react";
import type { Ipo } from "@/data/ipos";

const companyDomains: Record<string, string> = {
  VEYAS: "turkerveyas.com.tr",
  KPEKS: "kapeks.com.tr",
  TKNKA: "teknikaplast.com.tr",
  CITAS: "citlekci.com.tr"
};

function initials(ipo: Pick<Ipo, "company" | "ticker">) {
  if (ipo.ticker) return ipo.ticker.slice(0, 2).toLocaleUpperCase("tr-TR");
  return ipo.company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("tr-TR");
}

export function CompanyLogo({ ipo, size = "normal" }: { ipo: Pick<Ipo, "company" | "ticker">; size?: "normal" | "large" }) {
  const [failed, setFailed] = useState(false);
  const domain = ipo.ticker ? companyDomains[ipo.ticker] : undefined;
  const className = `companyLogo companyLogoReal${size === "large" ? " xlarge" : ""}`;

  if (!domain || failed) return <div className={className} aria-label={`${ipo.company} logosu`}>{initials(ipo)}</div>;

  const src = `https://www.google.com/s2/favicons?domain_url=https://${domain}&sz=128`;
  return <div className={className} aria-label={`${ipo.company} logosu`}>
    <img src={src} alt="" width={size === "large" ? 72 : 48} height={size === "large" ? 72 : 48} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
  </div>;
}
