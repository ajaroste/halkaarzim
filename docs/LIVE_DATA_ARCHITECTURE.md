# Canlı Halka Arz Veri Mimarisi

## Amaç

Production halka arz verisi GitHub Actions, JSON commit veya yeniden deploy zincirine bağlı değildir. GitHub yalnız kaynak kodu, CI ve migration sürümlemesi için kullanılır.

```text
                         ┌─ 5 dk cache'li read-through keşif ──────────┐
HalkArz.com canlı takvim ┤                                             ├→ /halka-arzlar
                         └→ Vercel günlük güvenlik senkronu → Supabase ┘
```

Bu iki katman bilinçli olarak ayrıdır: yeni halka arzın listede görünmesi günlük cron'u beklemez; kalıcı veritabanı yazımı ise güvenli ve izlenebilir senkronizasyon hattından geçer.

## Çalışma modeli

- `/halka-arzlar` önce Supabase'deki yayımlanmış kayıtları okur ve paket içindeki son bilinen iyi snapshot ile birleştirir.
- Sayfa ayrıca HalkArz.com ana sayfasını 5 dakikalık Next.js veri cache'iyle kontrol eder. Supabase/snapshot içinde bulunmayan yeni şirketler tespit edilirse yalnız bu yeni şirketlerin detay sayfaları okunur ve kartlar hemen gösterilir.
- Bu read-through keşif katmanı **veritabanına yazmaz**; kaynak geçici olarak erişilemezse mevcut DB/snapshot içeriği aynen gösterilmeye devam eder.
- Vercel Hobby zamanlayıcı sınırına uyum için kalıcı `/api/internal/ipo-sync` işi günde bir kez `03:17 UTC` çalışır. Pro plana geçildiğinde yalnız cron ifadesi değiştirilerek sıklık artırılabilir.
- Cron endpointi `CRON_SECRET` ile korunur.
- Kalıcı senkron ana sayfadaki güncel halka arz detay linklerini keşfeder ve detayları sınırlı eşzamanlılıkla okur.
- Tarih, fiyat, lot, dağıtım ve aracı kurum alanları normalize edilir.
- Yeni şirket ve halka arz kayıtları Supabase'e eklenir; mevcut kayıtlar yalnız boş olmayan canlı alanlarla güncellenir.
- Yeni halka arz için bildirim olayı `notification_outbox` tablosuna best-effort olarak yazılır. Bildirim hatası veri senkronizasyonunu bozmaz.
- Supabase okuması 60 saniyelik revalidation kullanır; DB geçici olarak erişilemezse paket içindeki son bilinen snapshot korunur.

## Güvenilirlik kuralları

1. **Kaynak güvenlik kapısı:** Ana kaynakta beklenmedik biçimde 5'ten az güncel halka arz linki bulunursa DB yazımı başlamaz.
2. **Silme yok:** Kaynak boş veya bozuk döndü diye production kayıtları silinmez.
3. **Kısmi hata toleransı:** Tek bir detay sayfası hata verirse diğer kayıtların senkronizasyonu devam eder.
4. **Terminal durum koruması:** `listed` kayıtlar eksik/geri kalmış ikincil kaynak yüzünden geriye düşürülmez; `cancelled` durum otomatik olarak canlandırılmaz.
5. **Idempotent eşleme:** Şirketler normalize edilmiş slug ile mevcut kayda bağlanır; aynı çalışmanın tekrar edilmesi çoğaltma amacı taşımaz.
6. **Bildirim izolasyonu:** Outbox yazımı başarısız olsa bile halka arz kaydı korunur.
7. **Çift katman last-known-good:** DB erişilemezse snapshot; dış kaynak erişilemezse DB + snapshot kullanılmaya devam eder.
8. **Hızlı keşif:** Yeni şirketin listede görünmesi günlük persistence cron'una bağlı değildir; read-through katmanı en fazla 5 dakikalık cache gecikmesiyle yeniden kontrol eder.
9. **Kaynak izi:** `live_source_url`, `live_date_text`, `source_checked_at` alanları son kalıcı canlı kontrolü izlenebilir tutar.

## İzlenebilirlik

`ipo_sync_runs` her kalıcı senkronizasyonun sonucunu, keşfedilen/işlenen/eklenen/güncellenen kayıt sayılarını ve hatayı tutar.

`ipo_source_snapshots` normalize edilmiş kaynak anlık görüntüsünü ve SHA-256 checksum değerini saklar. Bu kayıtlar yalnız yönetici tarafından okunabilir.

Vercel function loglarında `[ipo-sync]`, `[live-ipos]` ve `[live-discovery]` ön ekleri kullanılır.

## Güvenlik

Production persistence endpointi yalnız aşağıdaki header ile çalışır:

```text
Authorization: Bearer <CRON_SECRET>
```

`SUPABASE_SERVICE_ROLE_KEY` yalnız Vercel server runtime içinde kullanılır ve hiçbir zaman `NEXT_PUBLIC_` ile yayınlanmaz.

Preview deploymentlarında `?dryRun=1` yalnız kaynak parserını test eder; Supabase'e yazmaz. Production ortamında aynı dry-run çağrısı da `CRON_SECRET` ister.

Read-through katmanı yalnız GET yapar; dış kaynaktan gelen içerik doğrudan HTML olarak render edilmez, normalize edilmiş alanlara çevrilir.

## GitHub'ın rolü

GitHub'da kalanlar:

- kaynak kodu
- Pull Request ve review
- CI / güvenlik / build testleri
- Supabase migration dosyalarının sürümlenmesi

GitHub'dan kaldırılan production sorumluluğu:

- zamanlanmış halka arz veri çekme
- `data/generated/ipos.json` için bot commitleri
- veri değişti diye Vercel deploy tetikleme
- production verisinin Git geçmişi üzerinden taşınması

## Kabul kriterleri

- `/halka-arzlar` Supabase + last-known-good snapshot birleşimini kullanabilmeli.
- DB'de henüz olmayan yeni bir halka arz canlı kaynakta belirdiğinde yeniden deploy gerektirmeden read-through katmanında görüntülenebilmeli.
- Yeni halka arz DB'ye yazıldığında yeniden deploy olmadan en geç 60 saniye sonra kalıcı listede görünebilmeli.
- Kaynak veya DB hatası mevcut kayıtları silememeli.
- GitHub Actions veri senkronizasyon workflow'u bulunmamalı.
- Vercel Cron route'u yetkisiz production çağrısına `401` dönmeli.
- Parser testleri tarih aralıklarını, Türkçe sayı dönüşümünü, çoklu sayı alanında ilk değeri seçmeyi, aktif liste sınırını ve durum hesaplamasını doğrulamalı.
- Preview dry-run gerçek canlı kaynaktan kayıt keşfedebilmeli ve DB yazmamalı.
