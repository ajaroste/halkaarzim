"use client";

import { useMemo, useState } from "react";
import type { Ipo } from "@/data/ipos";

type LogoRule = {
  ticker?: string;
  companyIncludes: string[];
  sources: string[];
};

const logoRules: LogoRule[] = [
  {
    ticker: "VEYAS",
    companyIncludes: ["türker vangölü", "veyas"],
    sources: ["https://turkerveyas.com.tr/favicon.ico"]
  },
  {
    ticker: "KPEKS",
    companyIncludes: ["kapeks kimya", "kapeks"],
    sources: [
      "https://kapeks.com.tr/wp-content/themes/korenel/assets/image/logo-text.png",
      "https://kapeks.com.tr/favicon.ico"
    ]
  },
  {
    ticker: "TKNKA",
    companyIncludes: ["teknika plast", "teknika"],
    sources: ["https://teknikaplast.com.tr/favicon.ico"]
  },
  {
    ticker: "CITAS",
    companyIncludes: ["çitlekçi", "citlekci"],
    sources: ["https://citlekci.com.tr/favicon.ico"]
  }
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

function resolveSources(ipo: Pick<Ipo, "company" | "ticker">) {
  const ticker = ipo.ticker?.toLocaleUpperCase("tr-TR");
  const company = normalize(ipo.company);
  const rule = logoRules.find((item) =>
    (ticker && item.ticker === ticker) ||
    item.companyIncludes.some((part) => company.includes(normalize(part)))
  );
  return rule?.sources || [];
}

export function CompanyLogo({ ipo, size = "normal" }: { ipo: Pick<Ipo, "company" | "ticker">; size?: "normal" | "large" }) {
  const sources = useMemo(() => resolveSources(ipo), [ipo.company, ipo.ticker]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const className = `companyLogo companyLogoReal${size === "large" ? " xlarge" : ""}`;
  const pixelSize = size === "large" ? 72 : 48;
  const src = sources[sourceIndex];
  const fallback = initials(ipo);

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
      referrerPolicy="no-referrer"
      onLoad={() => setLoaded(true)}
      onError={() => { setLoaded(false); setSourceIndex((current) => current + 1); }}
      style={{
        position: "relative",
        zIndex: 1,
        width: "82%",
        height: "82%",
        objectFit: "contain",
        display: "block",
        opacity: loaded ? 1 : 0,
        background: "#f7f8f8"
      }}
    />}
  </div>;
}
