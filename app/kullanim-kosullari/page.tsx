import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description: "HalkaArzım içerik sınırları, hesap kuralları, topluluk ilkeleri ve sorumluluk koşulları.",
  alternates: { canonical: "/kullanim-kosullari" }
};

const toc = [
  { id: "hizmet", label: "Hizmetin kapsamı" },
  { id: "yatirim", label: "Yatırım danışmanlığı değildir" },
  { id: "veri", label: "Veri ve AI sınırları" },
  { id: "hesap", label: "Hesap güvenliği" },
  { id: "topluluk", label: "Topluluk kuralları" },
  { id: "fikri", label: "Fikrî haklar" },
  { id: "ucuncu", label: "Üçüncü taraflar" },
  { id: "sorumluluk", label: "Sorumluluk sınırı" },
  { id: "degisiklik", label: "Değişiklikler" }
];

export default function TermsPage() {
  return <LegalPage eyebrow="Kullanım koşulları" title="Bilgilendirme sınırı ve topluluk kuralları" intro="Platformu kullanırken hangi içeriğin sunulduğunu, hangi davranışların yasak olduğunu ve verilerin nasıl değerlendirilmesi gerektiğini açıklar." version="1.0" toc={toc}>
    <section id="hizmet"><h2>1. Hizmetin kapsamı</h2><p>HalkaArzım; kamuya açık halka arz belgelerini, şirket duyurularını, önemli tarihleri, kullanıcı yorumlarını ve otomatik özetleri tek arayüzde sunmayı amaçlayan bağımsız bir bilgi platformudur.</p><p>Platform bir banka, aracı kurum, portföy yönetim şirketi, yatırım danışmanı, SPK veya KAP hizmeti değildir. Resmî belgelerin yerine geçmez.</p></section>

    <section id="yatirim"><h2>2. Yatırım danışmanlığı ve kişisel öneri değildir</h2><p>Site içeriği genel bilgilendirme amacı taşır. Hiçbir puan, sınıflandırma, bildirim, yorum, grafik veya otomatik özet; satın alma, satma, halka arza katılma, fiyat hedefi, kesin getiri ya da kişiye özel portföy önerisi anlamına gelmez.</p><p>Kullanıcı, yatırım kararı vermeden önce resmî izahnameyi, fiyat tespit raporunu, SPK/KAP açıklamalarını ve kendi mali durumunu bağımsız biçimde değerlendirmelidir. Ayrıntılı açıklama <a href="/yatirim-tavsiyesi-degildir">Yatırım Tavsiyesi Değildir</a> sayfasındadır.</p></section>

    <section id="veri"><h2>3. Veri doğruluğu ve AI sınırları</h2><p>Kaynaklı çalışma hedeflenmesine rağmen yayın gecikmesi, veri sağlayıcı kesintisi, şirket açıklamasının sonradan değiştirilmesi, ayrıştırma hatası veya insan hatası olabilir. Site üzerinde gösterilen tarih, fiyat, lot, kod ve finansal bilgi işlem öncesinde resmî kaynaktan doğrulanmalıdır.</p><p>AI çıktıları olasılıksal sistemler tarafından üretilir ve hata yapabilir. Belgede bulunmayan bilgi üretmemesi için teknik sınırlamalar uygulanır; buna rağmen sonuçlar insan incelemesi olmadan kesin gerçek veya yatırım görüşü kabul edilmemelidir.</p></section>

    <section id="hesap"><h2>4. Hesap ve güvenlik</h2><ul><li>Kullanıcı doğru ve erişebildiği bir e-posta adresi kullanmalıdır.</li><li>Hesap erişim bilgileri paylaşılmamalı, şüpheli erişim fark edildiğinde oturum kapatılmalıdır.</li><li>Başka bir kişiyi taklit eden, otomatik kötüye kullanım yapan veya güvenlik kontrollerini aşmaya çalışan hesaplar askıya alınabilir.</li><li>Yayınlanmış erişim anahtarı, token veya özel bilgi derhâl geçersiz kılınmalı ve yenilenmelidir.</li></ul></section>

    <section id="topluluk"><h2>5. Yorum ve topluluk kuralları</h2><p>Aşağıdaki içerikler yasaktır:</p><ul><li>Kesin kazanç, garanti tavan, organize alım/satım çağrısı veya piyasa manipülasyonu izlenimi oluşturan ifadeler.</li><li>İçeriden bilgi iddiası, doğrulanmamış suçlama, yanıltıcı finansal veri veya sahte kaynak.</li><li>Hakaret, tehdit, ayrımcılık, kişisel veri, telefon numarası, e-posta, grup reklamı ve spam.</li><li>Telif hakkını veya ticari markayı ihlal eden içerik.</li><li>Güvenlik açığını sömürmeye, zararlı kod yaymaya veya başka kullanıcıların hesabına erişmeye yönelik içerik.</li></ul><p>Yorumlar yayın öncesinde veya sonrasında denetlenebilir; görünürlüğü sınırlandırılabilir, silinebilir veya ilgili hesap askıya alınabilir. Kullanıcı içeriğinin hukuki sorumluluğu öncelikle içeriği paylaşan kullanıcıya aittir; geçerli bildirimler incelenir.</p></section>

    <section id="fikri"><h2>6. Fikrî mülkiyet ve kaynak kullanımı</h2><p>HalkaArzım'ın özgün arayüzü, metinleri, sınıflandırma yapısı ve yazılımı ilgili hak sahiplerine aittir. SPK, KAP, TradingView, şirketler ve haber yayıncılarına ait marka, belge ve verilerin hakları kendilerine aittir.</p><p>Resmî belgelere bağlantı verilmesi veya kısa, kaynaklı özet hazırlanması ilgili kurumla ortaklık ya da onay ilişkisi oluşturmaz. Üçüncü taraf içeriği topluca kopyalanmamalı; lisans gerektiren piyasa verileri yalnız uygun lisansla kullanılmalıdır.</p></section>

    <section id="ucuncu"><h2>7. Üçüncü taraf hizmetleri ve bağlantılar</h2><p>Supabase, Vercel, GitHub, TradingView, Gemini, e-posta, bildirim ve reklam sağlayıcıları kendi hizmet koşullarına tabi olabilir. Harici bağlantıların içeriği ve sürekliliği HalkaArzım'ın kontrolünde değildir.</p><p>Reklam veya sponsorlu alanlar editoryal analizden açıkça ayrılmalı; reklamveren bir şirketin analiz puanına, risklerine veya kaynak seçimine müdahale edememelidir.</p></section>

    <section id="sorumluluk"><h2>8. Hizmet sürekliliği ve sorumluluk sınırı</h2><p>Bakım, veri kaynağı kesintisi, güvenlik olayı veya mücbir sebepler nedeniyle hizmet geçici olarak kullanılamayabilir. Zorunlu hukuk kuralları saklı kalmak üzere, yalnız site içeriğine güvenilerek verilen yatırım kararından, piyasa hareketinden veya üçüncü taraf hizmet kesintisinden doğan zararlara ilişkin mutlak sonuç garantisi verilmez.</p><p>Bu hüküm, yürürlükteki zorunlu tüketici ve kişisel veri koruma haklarını ortadan kaldıracak şekilde yorumlanamaz.</p></section>

    <section id="degisiklik"><h2>9. Değişiklikler ve uygulanacak kurallar</h2><p>Hizmet veya mevzuat değiştiğinde koşullar güncellenebilir. Önemli değişikliklerde sürüm ve güncelleme tarihi yenilenir. Kullanıcının yeni koşulları kabul etmesinin gerekli olduğu durumlarda ayrıca onay akışı uygulanmalıdır.</p><p>Uygulanacak hukuk, yetki ve uyuşmazlık maddeleri veri sorumlusunun gerçek kimliği ve faaliyet modeli belirlendikten sonra bir hukukçu tarafından kesinleştirilmelidir.</p></section>
  </LegalPage>;
}
