import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "İçerik Bildirimi ve Kaldırma Süreci",
  description: "Yanlış bilgi, kişisel veri, telif, marka veya hukuka aykırı içerik bildirim süreci.",
  alternates: { canonical: "/icerik-kaldirma" }
};

const toc = [
  { id: "kapsam", label: "Bildirilebilecek içerikler" },
  { id: "basvuru", label: "Başvuru içeriği" },
  { id: "inceleme", label: "İnceleme süreci" },
  { id: "acil", label: "Acil durumlar" },
  { id: "itiraz", label: "İtiraz ve kayıt" },
  { id: "kotu", label: "Kötüye kullanım" }
];

export default function TakedownPage() {
  return <LegalPage eyebrow="İçerik bildirimi" title="Düzeltme ve içerik kaldırma süreci" intro="Yanlış, kişisel veri içeren, telif veya marka hakkını ihlal eden içeriklerin nasıl bildirileceğini açıklar." version="1.0" toc={toc}>
    <section id="kapsam"><h2>1. Bildirilebilecek içerikler</h2><ul><li>Resmî belgeyle çelişen halka arz tarihi, fiyat, lot veya şirket bilgisi.</li><li>İzinsiz paylaşılan kişisel veri, iletişim bilgisi veya özel nitelikli veri.</li><li>Telif hakkı, ticari marka veya lisans koşullarını ihlal ettiği düşünülen görsel, metin veya veri.</li><li>Hakaret, tehdit, iftira, sahte kaynak, manipülasyon veya organize işlem çağrısı.</li><li>Güvenlik açığı, erişim anahtarı veya kullanıcı hesabını tehlikeye atan içerik.</li></ul></section>

    <section id="basvuru"><h2>2. Geçerli bildirimde bulunması gerekenler</h2><p>Başvuruda aşağıdaki bilgiler bulunmalıdır:</p><ol><li>Bildirimi yapan kişinin adı/unvanı ve geçerli iletişim kanalı.</li><li>İlgili sayfanın tam adresi ve mümkünse ekran görüntüsü.</li><li>Hangi ifadenin veya içeriğin sorunlu olduğu.</li><li>Düzeltmeyi destekleyen resmî belge, hak sahipliği kaydı veya açıklama.</li><li>Talebin düzeltme, erişim kısıtlama, anonimleştirme veya kaldırma seçeneklerinden hangisi olduğu.</li></ol><div className="legalContactCard"><strong>Bildirim adresi eksik</strong><p>Geçerli hukuk/iletişim e-postası henüz sağlanmadı. <code>NEXT_PUBLIC_LEGAL_CONTACT_EMAIL</code> tanımlanmalı ve bu sayfada görünür hâle getirilmelidir.</p></div></section>

    <section id="inceleme"><h2>3. İnceleme süreci</h2><ol><li>Başvurunun alındığı kaydedilir ve tekrar eden talepler tek dosyada birleştirilir.</li><li>İçerik resmî kaynak, veri tabanı kaydı ve değişiklik geçmişiyle karşılaştırılır.</li><li>Açık kişisel veri veya güvenlik riski varsa içerik geçici olarak gizlenebilir.</li><li>Gerekirse içeriği paylaşan kullanıcıdan veya hak sahibinden ek açıklama istenir.</li><li>Karar ve yapılan değişiklik denetim kaydına yazılır.</li></ol><p>Her talep otomatik kaldırma doğurmaz; eleştiri, kamuya açık bilgi ve hukuka uygun alıntı ile hak ihlali birbirinden ayrılarak değerlendirilmelidir.</p></section>

    <section id="acil"><h2>4. Acil güvenlik ve kişisel veri durumları</h2><p>Aktif erişim anahtarı, şifre, oturum tokenı, açık adres, telefon, kimlik bilgisi veya doğrudan güvenlik riski içeren bildirimler öncelikli ele alınmalıdır. Gerekirse ilgili anahtar iptal edilir, oturumlar sonlandırılır ve içerik inceleme sonuçlanana kadar erişime kapatılır.</p><p>Güvenlik açığının ayrıntıları herkese açık yorum alanına yazılmamalıdır.</p></section>

    <section id="itiraz"><h2>5. Karara itiraz ve kayıt</h2><p>İçeriği kaldırılan kullanıcı, kararın dayanağını öğrenmek ve ek belge sunmak için itiraz edebilir. Yasal zorunluluk bulunmadıkça silinen kişisel veri gereksiz biçimde yedeklerde tutulmamalı; moderasyon kararının kim tarafından ve ne zaman verildiği kaydedilmelidir.</p></section>

    <section id="kotu"><h2>6. Bildirim mekanizmasının kötüye kullanılması</h2><p>Rakip görüşü susturmak, kamuya açık doğru bilgiyi kaldırmak veya sahte hak sahipliği iddiasında bulunmak amacıyla tekrarlanan kötü niyetli talepler sınırlandırılabilir. Bununla birlikte kişisel veri ve güvenlik bildirimleri yalnız başvuru sahibinin önceki davranışı gerekçe gösterilerek göz ardı edilmemelidir.</p></section>
  </LegalPage>;
}
