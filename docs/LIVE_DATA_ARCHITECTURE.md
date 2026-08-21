# Canlı Halka Arz Veri Mimarisi

## Amaç

Production halka arz verisi GitHub Actions, JSON commit veya yeniden deploy zincirine bağlı değildir. GitHub yalnız kaynak kodu, CI ve migration sürümlemesi için kullanılır.

```text
HalkArz.com canlı takvim
        ↓
Vercel Cron /api/internal/ipo-sync
        ↓
normalize + doğrulama + last-known-good koruması
        ↓
Supabase PostgreSQL
        ↓
/halka-arzlar
```

## Çalışma modeli

- Vercel Cron her saat `:17` dakikasında `/api/internal/ipo-sync` endpointini çağırır.
- Endpoint `CRON_SECRET` ile korunur.
- Kaynak ana sayfasından güncel halka arz detay linkleri keşfedilir.
- Her detay kaynağı sınırlı eşzamanlılıkla okunur ve tarih/fiyat/lot/dağıtım/aracı kurum alanları normalize edilir.
- Yeni şirket ve halka arz kayıtları Supabase'e eklenir; mevcut kayıtlar yalnız doğrulanmış, boş olmayan canlı alanlarla güncellenir.
- Yeni halka arz için bildirim olayı `notification_outbox` tablosuna best-effort olarak yazılır. Bildirim hatası veri senkronizasyonunu bozmaz.
- `/halka-arzlar` sayfası Supabase'i 60 saniyelik revalidation ile okur. Supabase geçici olarak erişilemezse paket içindeki son bilinen snapshot gösterilir.

## Güvenilirlik kuralları

1. **Kaynak güvenlik kapısı:** Ana kaynakta beklenmedik biçimde 5'ten az güncel halka arz linki bulunursa DB yazımı başlamaz.
2. **Silme yok:** Kaynak boş veya bozuk döndü diye production kayıtları silinmez.
3. **Kısmi hata toleransı:** Tek bir detay sayfası hata verirse diğer kayıtların senkronizasyonu devam eder.
4. **Terminal durum koruması:** `listed` kayıtlar eksik/geri kalmış ikincil kaynak yüzünden geriye düşürülmez; `cancelled` durum otomatik olarak canlandırılmaz.
5. **Idempotent eşleme:** Şirketler normalize edilmiş slug ile mevcut kayda bağlanır; aynı çalışmanın tekrar edilmesi çoğaltma amacı taşımaz.
6. **Bildirim izolasyonu:** Outbox yazımı başarısız olsa bile halka arz kaydı korunur.
7. **Last-known-good UI:** Canlı DB okunamazsa sayfa son paketlenmiş snapshot'a geri döner.
8. **Kaynak izi:** `live_source_url`, `live_date_text`, `source_checked_at` alanları son canlı kontrolü izlenebilir tutar.

## İzlenebilirlik

`ipo_sync_runs` her çalışmanın sonucunu, keşfedilen/işlenen/eklenen/güncellenen kayıt sayılarını ve hatayı tutar.

`ipo_source_snapshots` normalize edilmiş kaynak anlık görüntüsünü ve SHA-256 checksum değerini saklar. Bu kayıtlar yalnız yönetici tarafından okunabilir.

Vercel function loglarında `[ipo-sync]` ve `[live-ipos]` ön ekleri kullanılır.

## Güvenlik

Production endpointi yalnız aşağıdaki header ile çalışır:

```text
Authorization: Bearer <CRON_SECRET>
```

`SUPABASE_SERVICE_ROLE_KEY` yalnız Vercel server runtime içinde kullanılır ve hiçbir zaman `NEXT_PUBLIC_` ile yayınlanmaz.

Preview deploymentlarında `?dryRun=1` yalnız kaynak parserını test eder; Supabase'e yazmaz. Production ortamında aynı dry-run çağrısı da `CRON_SECRET` ister.

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

- `/halka-arzlar` production verisini Supabase'den okuyabilmeli.
- Yeni halka arz DB'ye yazıldığında yeniden deploy olmadan en geç 60 saniye sonra listede görünebilmeli.
- Kaynak hatası mevcut kayıtları silememeli.
- GitHub Actions veri senkronizasyon workflow'u bulunmamalı.
- Vercel Cron route'u yetkisiz çağrıya `401` dönmeli.
- Parser testleri tarih aralıklarını, Türkçe sayı dönüşümünü, aktif liste sınırını ve durum hesaplamasını doğrulamalı.
- Preview dry-run gerçek canlı kaynaktan kayıt keşfedebilmeli ve DB yazmamalı.
