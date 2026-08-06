# HalkaArzım v1.0 — Doğrulama Durumu

Bu dosya, v1.0 üretim adayının tek ve izlenebilir doğrulama noktasını tanımlar.

- Release commit zinciri: `main`
- Release gate: `.github/workflows/v1-release.yml`
- Testler: production dependency audit, tüm domain/parser/AI/growth/güvenlik testleri, TypeScript typecheck, kaynak doğrulama ve Next.js production build
- Vercel: ücretsiz build hız sınırı kalktığında son başarılı release gate commit’i yeniden dağıtılmalıdır
- Supabase: migration workflow sonucu ayrıca doğrulanmalıdır
- Canlı smoke test: yalnız yeni Vercel deployment production’a geçtiğinde yapılmalıdır

Durumlar başarılı sonuç gelmeden “tamamlandı” olarak işaretlenmez.
