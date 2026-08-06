import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AgendaFeed } from "@/components/AgendaFeed";
import { getAllEvents } from "@/data/ipos";

export const metadata: Metadata = { title: "Şirket gündemi", description: "Halka arz şirketlerinin KAP, finansal ve yatırım gelişmelerini takip edin." };
export default function AgendaPage() { const events = getAllEvents(); return <><Header /><main className="pageShell"><section className="pageHero"><div className="container"><span className="eyebrow">Şirket nabzı</span><h1>Gelişmeler tek zaman akışında</h1><p>Resmî bildirim, şirket açıklaması ve finansal gelişmeler etki sınıfıyla gösterilir.</p></div></section><section className="section"><div className="container narrow"><AgendaFeed items={events} /></div></section></main><Footer /></>; }
