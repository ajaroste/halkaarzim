import Link from "next/link";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footerGrid">
        <div><Brand /><p>Resmî kaynaklarla eşleştirilen halka arz ön analizleri, önemli tarihler ve şirket gündemi.</p></div>
        <div><strong>Keşfet</strong><Link href="/halka-arzlar">Halka arzlar</Link><Link href="/gundem">Şirket gündemi</Link><Link href="/feed.xml">RSS akışı</Link></div>
        <div><strong>Güven</strong><Link href="/metodoloji">Metodoloji</Link><Link href="/ai-politikasi">AI kullanım politikası</Link><Link href="/yatirim-tavsiyesi-degildir">Yatırım tavsiyesi değildir</Link></div>
        <div><strong>Yasal</strong><Link href="/gizlilik">Gizlilik ve KVKK</Link><Link href="/cerez-politikasi">Çerez politikası</Link><Link href="/kullanim-kosullari">Kullanım koşulları</Link><Link href="/icerik-kaldirma">İçerik bildirimi</Link></div>
      </div>
      <div className="container footerBottom"><span>© 2026 HalkaArzım</span><p>Bağımsız bilgilendirme platformudur; aracı kurum veya resmî kurum değildir. İçerikler yatırım danışmanlığı değildir.</p></div>
    </footer>
  );
}
