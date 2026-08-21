import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { IpoExplorer } from "@/components/IpoExplorer";
import { AdSlot } from "@/components/AdSlot";
import { getLiveIpos } from "@/lib/server/live-ipos";

export const metadata: Metadata = { title: "Halka arzlar", description: "Güncel halka arz kayıtları canlı veri hattından düzenli olarak yenilenir." };
export const revalidate = 60;

export default async function IposPage() {
  const items = await getLiveIpos();
  return <><Header /><main className="pageShell"><section className="pageHero"><div className="container"><span className="eyebrow">Halka arz merkezi</span><h1>Güncel halka arzlar</h1><p>{items.length} halka arz kaydı. Canlı kaynaklar Supabase veri hattında düzenli olarak kontrol edilir; veri güncellemesi için yeniden deploy gerekmez.</p></div></section><section className="section"><div className="container"><IpoExplorer items={items} /><AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_HOME_SLOT} /></div></section></main><Footer /></>;
}
