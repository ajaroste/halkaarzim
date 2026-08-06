# Güvenlik Politikası

## Desteklenen sürüm

Güvenlik düzeltmeleri yalnız `main` dalındaki güncel üretim sürümüne uygulanır.

## Güvenlik açığı bildirimi

Bir güvenlik açığı tespit ederseniz ayrıntıları herkese açık issue, yorum veya sosyal medya paylaşımı olarak yayınlamayın.

Tercih edilen kanal:

1. GitHub deposundaki **Security → Report a vulnerability** özel bildirim ekranı.
2. Bu özellik kullanılamıyorsa, veri sorumlusu/güvenlik e-posta adresi tanımlandıktan sonra sitedeki İçerik Bildirimi sayfasında belirtilen kanal.

Bildirime şunları ekleyin:

- Etkilenen adres veya bileşen
- Tekrarlanabilir adımlar
- Beklenen ve gerçekleşen sonuç
- Etki değerlendirmesi
- Kavram kanıtı; gerçek kullanıcı verisini indirmeden ve sistemi bozucu yük oluşturmadan

## Güvenli araştırma sınırları

Aşağıdakileri yapmayın:

- Gerçek kullanıcı hesabına veya verisine erişmek
- Hizmet engelleme ya da yüksek hacimli trafik üretmek
- Sosyal mühendislik veya kimlik avı yapmak
- Veriyi değiştirmek, silmek ya da yayımlamak
- Açığı düzeltme süresi tanımadan herkese açıklamak

## Hedef yanıt süreci

- İlk alındı bildirimi: makul olarak en kısa sürede
- Önceliklendirme: etki ve sömürülebilirliğe göre
- Kritik açık: geçici azaltım, anahtar döndürme veya ilgili özelliği kapatma
- Düzeltme sonrası: bildirimi yapan araştırmacıyla doğrulama ve uygun olduğunda teşekkür

Bu süreler hizmet seviyesi garantisi değildir. Acil durumda etkilenen erişim anahtarları ve oturumlar derhâl iptal edilmelidir.
