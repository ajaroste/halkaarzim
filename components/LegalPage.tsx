import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

type TocItem = { id: string; label: string };

type LegalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  version: string;
  toc: TocItem[];
  children: ReactNode;
  showDraftNotice?: boolean;
};

export function LegalPage({ eyebrow, title, intro, version, toc, children, showDraftNotice = true }: LegalPageProps) {
  return <><Header /><main className="legalShell">
    <section className="legalHero"><div className="container narrow"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p><div className="legalMeta"><span>Sürüm {version}</span><span>Son güncelleme: 6 Ağustos 2026</span><span>Türkiye</span></div></div></section>
    <div className="container legalLayout">
      <article className="legalDocument">
        {showDraftNotice && <div className="legalNotice" role="note"><span aria-hidden="true">!</span><div><strong>Yayın öncesi tamamlanması gereken alan</strong><p>Veri sorumlusunun gerçek adı/unvanı, açık adresi ve geçerli başvuru e-postası bilinmediği için uydurulmamıştır. Bu bilgiler eklenmeden metin tam bir hukuki uyum belgesi sayılmaz ve bağımsız hukukçu incelemesi gerekir.</p></div></div>}
        {children}
        <section id="baglantilar"><h2>İlgili politikalar</h2><p><Link href="/gizlilik">Gizlilik ve KVKK</Link> · <Link href="/cerez-politikasi">Çerez Politikası</Link> · <Link href="/ai-politikasi">AI Kullanım Politikası</Link> · <Link href="/yatirim-tavsiyesi-degildir">Yatırım Tavsiyesi Değildir</Link> · <Link href="/icerik-kaldirma">İçerik Kaldırma</Link></p></section>
      </article>
      <nav className="legalToc" aria-label="Sayfa içeriği"><strong>Bu sayfada</strong>{toc.map((item) => <a href={`#${item.id}`} key={item.id}>{item.label}</a>)}</nav>
    </div>
  </main><Footer /></>;
}
