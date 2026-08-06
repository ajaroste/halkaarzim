import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AdminConsole } from "@/components/AdminConsole";
import { dataGeneratedAt, dataSource, ipos } from "@/data/ipos";

export default function AdminPage() {
  const preliminary = ipos.filter((item) => item.analysisStatus === "preliminary").length;
  const complete = ipos.filter((item) => (item.dataCompleteness || 0) >= 80).length;
  return <><Header /><main className="pageShell"><section className="pageHero"><div className="container"><span className="eyebrow">Operasyon merkezi</span><h1>Veri hattı, kalite ve moderasyon</h1><p>Veri kapsamını denetle; yetkili hesapla bekleyen yorumları yayımla veya gizle.</p></div></section><section className="section"><div className="container adminGrid">
    <article className="panel"><h2>Veri kaynağı</h2><p>{dataSource}</p><dl className="facts"><div><dt>Son üretim</dt><dd>{dataGeneratedAt}</dd></div><div><dt>Kayıt</dt><dd>{ipos.length}</dd></div><div><dt>%80+ veri kapsamı</dt><dd>{complete}</dd></div></dl></article>
    <article className="panel"><h2>Analiz kuyruğu</h2><div className="adminStats"><div><strong>{preliminary}</strong><span>Ön analiz</span></div><div><strong>{ipos.length - preliminary}</strong><span>Tam analiz</span></div><div><strong>{ipos.filter((i) => i.humanReviewed).length}</strong><span>İnsan onaylı</span></div></div></article>
    <article className="panel"><h2>Güncelleme komutu</h2><pre><code>npm run data:update</code></pre><p>Komut geçerli yılı otomatik bulur, SPK verisini çeker, ücretsiz takvim zenginleştirmesini uygular ve doğrular.</p></article>
    <article className="panel"><h2>Yayın sağlık kontrolü</h2><ul className="checkList"><li><code>/api/health</code> servis durumu</li><li>SPK birincil kaynak zorunluluğu</li><li>İkincil veri kaynak etiketi</li><li>Sunucu tarafı yorum rate-limit ve filtre</li><li>RLS ve rol tabanlı moderasyon</li></ul></article>
    <div className="adminWide"><AdminConsole /></div>
  </div></section></main><Footer /></>;
}
