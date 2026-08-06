# HalkaArzım — v1.0.0-rc.3

Gerçek SPK/KAP kaynaklarına dayalı, Vercel ve Cloudflare Workers/OpenNext uyumlu Next.js halka arz platformu. Kurgusal şirket kaydı içermez.

## Mevcut veri kapsamı

- **33 gerçek halka arz kaydı**
- **30 kayıt**, 2026 yılına ait **15 resmî SPK bülteninden** ayrıştırıldı
- **3 kayıt**, önceki yıl onaylanıp 2026'da talep gören resmî KAP kaynaklı devreden kayıttır
- 33 kaydın tamamında en az bir resmî SPK veya KAP bağlantısı bulunur

## Yerel kurulum

```bash
npm install
npm run dev
```

Üretim doğrulaması:

```bash
npm run test:all
npm run build
```

## Veri güncelleme

```bash
pip install -r requirements.txt
python scripts/update_all.py
```

GitHub Actions içindeki `SPK data sync` işi günlük olarak resmî kaynakları kontrol eder. Supabase, Cloudflare AI ve Web Push anahtarları tanımlı değilse bu entegrasyonlar güvenli biçimde atlanır.

## Dağıtım

Proje Vercel ile uyumludur. Reklamlı ücretsiz ticari yayın için Cloudflare Workers/OpenNext yapılandırması da bulunur.

Gerekli değişkenlerin örnekleri `.env.example` dosyasındadır.

## Veri ilkesi

- Kaynaksız finansal veri üretilmez.
- Açıklanmayan alanlar `Henüz açıklanmadı` olarak kalır.
- AI özeti yatırım tavsiyesi değildir.
- Otomatik belge çıkarımları insan onayı sayılmaz.
