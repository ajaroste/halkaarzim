import Link from "next/link";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div><Brand /><p>Kaynaklı AI halka arz raporları, şirket gündemi ve kontrollü yatırımcı topluluğu.</p></div>
        <div><strong>Ürün</strong><Link href="/halka-arzlar">Halka arzlar</Link><Link href="/gundem">Şirket gündemi</Link><Link href="/metodoloji">Metodoloji</Link></div>
        <div><strong>Yasal</strong><Link href="/gizlilik">Gizlilik ve KVKK</Link><Link href="/kullanim-kosullari">Kullanım koşulları</Link><Link href="/hakkimizda">Hakkımızda</Link></div>
      </div>
      <div className="container footerBottom"><span>© 2026 HalkaArzım</span><p>İçerikler bilgilendirme amaçlıdır; yatırım danışmanlığı değildir.</p></div>
    </footer>
  );
}
