"use client";

import { useMemo, useState } from "react";
import type { Ipo } from "@/data/ipos";

type LogoRule = {
  ticker?: string;
  companyIncludes: string[];
  domain: string;
};

const logoRules: LogoRule[] = [
  { ticker: "VEYAS", companyIncludes: ["türker vangölü", "veyas"], domain: "turkerveyas.com.tr" },
  { ticker: "KPEKS", companyIncludes: ["kapeks kimya", "kapeks"], domain: "kapeks.com.tr" },
  { ticker: "TKNKA", companyIncludes: ["teknika plast", "teknika"], domain: "teknikaplast.com.tr" },
  { ticker: "CITAS", companyIncludes: ["çitlekçi", "citlekci"], domain: "citlekci.com.tr" }
];

function normalize(value: string) {
  return value.toLocaleLowerCase("tr-TR").replace(/ı/g, "i");
}

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

function resolveDomain(ipo: Pick<Ipo, "company" | "ticker">) {
  const ticker = ipo.ticker?.toLocaleUpperCase("tr-TR");
  const company = normalize(ipo.company);
  return logoRules.find((item) =>
    (ticker && item.ticker === ticker) ||
    item.companyIncludes.some((part) => company.includes(normalize(part)))
  )?.domain;
}

export function CompanyLogo({ ipo, size = "normal" }: { ipo: Pick<Ipo, "company" | "ticker">; size?: "normal" | "large" }) {
  const domain = useMemo(() => resolveDomain(ipo), [ipo.company, ipo.ticker]);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const className = `companyLogo companyLogoReal${size === "large" ? " xlarge" : ""}`;
  const pixelSize = size === "large" ? 72 : 48;
  const fallback = initials(ipo);
  const src = domain && !failed ? `/api/company-logo?domain=${encodeURIComponent(domain)}` : null;

  return <div
    className={className}
    aria-label={`${ipo.company} logosu`}
    style={{
      position: "relative",
      overflow: "hidden",
      display: "grid",
      placeItems: "center",
      width: pixelSize,
      height: pixelSize,
      minWidth: pixelSize,
      flex: `0 0 ${pixelSize}px`,
      borderRadius: size === "large" ? 16 : 12,
      background: "#f7f8f8",
      color: "#0f6f55",
      fontWeight: 900,
      fontSize: size === "large" ? 20 : 14,
      border: "1px solid rgba(128,145,137,.24)"
    }}
  >
    <span aria-hidden="true" style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>{fallback}</span>
    {src && <img
      src={src}
      alt={`${ipo.company} logosu`}
      width={pixelSize}
      height={pixelSize}
      loading="lazy"
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => { setLoaded(false); setFailed(true); }}
      style={{
        position: "relative",
        zIndex: 1,
        width: "84%",
        height: "84%",
        objectFit: "contain",
        display: "block",
        opacity: loaded ? 1 : 0,
        background: "#f7f8f8"
      }}
    />}
  </div>;
}
