import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return <><Header /><main className="section"><div className="narrow emptyState"><strong>404 · Sayfa bulunamadı</strong><p>Bağlantı değişmiş veya kayıt henüz yayımlanmamış olabilir.</p><Link className="primaryButton" href="/halka-arzlar">Halka arzları aç</Link></div></main><Footer /></>;
}
