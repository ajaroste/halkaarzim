import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/CookieBanner";
import { AuthProvider } from "@/components/AuthProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://halkaarzim.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "HalkaArzım — Halka arzı gerçekten anla", template: "%s | HalkaArzım" },
  description: "Kaynaklı AI halka arz raporları, sadeleştirilmiş izahname, şirket gündemi, lot tahmini ve kontrollü yatırımcı topluluğu.",
  applicationName: "HalkaArzım",
  manifest: "/manifest.webmanifest",
  keywords: ["halka arz", "izahname", "KAP", "halka arz takvimi", "AI arz raporu"],
  openGraph: { title: "HalkaArzım", description: "Halka arzı sadece görme. Gerçekten anla.", type: "website", locale: "tr_TR", url: siteUrl },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0e8f67" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="tr" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("halkaarzim-theme");if(t!=="dark"&&t!=="light")t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();` }} /></head><body><AuthProvider>{children}<CookieBanner /></AuthProvider></body></html>;
}
