import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IpoExplorer } from "@/components/IpoExplorer";
import { AdSlot } from "@/components/AdSlot";
import { getMergedIpos } from "@/lib/official-ipos";

export const metadata: Metadata = {
  title: "Halka arzlar",
  description: "SPK bültenlerinden otomatik alınan güncel halka arz kayıtları.",
  alternates: { canonical: "/halka-arzlar" }
};
export const revalidate = 300;
export default async function IposPage() { const ipos = await getMergedIpos(); return <><Header /><main className="pageShell"><section className="pageHero"><div className="container"><span className="eyebrow">Halka arz merkezi</span><h1>Resmî kaynaktan güncel halka arzlar</h1><p>{ipos.length} halka arz kaydı. Kaynaklar düzenli olarak kontrol edilip güncellenir.</p></div></section><section className="section"><div className="container"><IpoExplorer items={ipos} /><AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} /></div></section></main><Footer /></>; }
