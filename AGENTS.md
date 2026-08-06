# HalkaArzım Çalışma Sözleşmesi

## Roller

- **Project Manager:** Öncelik, kapsam, risk ve kabul kriterlerinden sorumludur.
- **Designer Agent:** Bilgi mimarisi, kullanıcı akışı, erişilebilirlik ve görsel sistemden sorumludur.
- **Developer Agent:** Mimari, veri modeli, güvenlik ve uygulama kodundan sorumludur.
- **Tester Agent:** Fonksiyonel, erişilebilirlik, güvenlik ve içerik doğrulama testlerinden sorumludur.

## Zorunlu iş akışı

`BACKLOG → DISCOVERY → DESIGN READY → DEV READY → IN DEVELOPMENT → CODE REVIEW → QA → PM ACCEPTANCE → RELEASE READY → DONE`

Bir iş:

1. PM tarafından problem, kapsam dışı alanlar ve kabul kriterleri yazılmadan Designer'a geçemez.
2. Designer ekran durumlarını ve hata/boş/yükleme durumlarını tanımlamadan Developer'a geçemez.
3. Developer veri kaynağı, yetkilendirme ve loglama yaklaşımını belirtmeden QA'ya geçemez.
4. Tester kanıt sunmadan PM işi tamamlandı kabul edemez.

## Definition of Done

- Kabul kriterleri geçti.
- Mobil ve masaüstü kontrol edildi.
- Boş, yükleniyor, hata ve yetkisiz durumları var.
- Kaynak ve hukuki etiketler doğru yerde.
- Kullanıcı girdileri sunucu tarafında doğrulanıyor.
- Kritik aksiyonlar audit log'a yazılıyor.
- Erişilebilirlikte klavye kullanımı ve görünür odak sağlanıyor.
