import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./polish.css";
import "./account-notifications.css";
import "./premium.css";
import "./home-v2.css";
import "./detail-refresh.css";
import "./detail-v3.css";
import "./legal-v1.css";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthProvider } from "@/components/AuthProvider";
import { LegalConsentGate } from "@/components/LegalConsentGate";
import { NotificationManager } from "@/components/NotificationManager";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halkaarzim.vercel.app").replace(/\/+$/, "");
const description = "Kaynaklı halka arz ön analizleri, sadeleştirilmiş resmî belgeler, önemli tarihler, lot senaryoları ve şirket gündemi.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "HalkaArzım — Halka arzı kaynağından anla", template: "%s | HalkaArzım" },
  description,
  applicationName: "HalkaArzım",
  manifest: "/manifest.webmanifest",
  keywords: ["halka arz", "halka arz takvimi", "SPK bülteni", "izahname özeti", "kaç lot verir", "halka arz yorum"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "HalkaArzım — Halka arzı kaynağından anla",
    description,
    type: "website",
    locale: "tr_TR",
    siteName: "HalkaArzım",
    url: siteUrl
  },
  twitter: { card: "summary", title: "HalkaArzım", description },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  referrer: "strict-origin-when-cross-origin",
  category: "finance"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ]
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("halkaarzim-theme");if(t!=="dark"&&t!=="light")t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();` }} /></head><body><AuthProvider>{children}<NotificationManager /><CookieBanner /><LegalConsentGate /></AuthProvider></body></html>;
}
