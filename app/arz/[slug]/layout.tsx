import type { ReactNode } from "react";

// Halka arz detay sayfaları yeni deployment/veri değişikliklerinden sonra
// eski statik HTML'in CDN'de uzun süre kalmaması için kısa ISR kullanır.
// Bu, her sayfa görüntülemesinde server function çalıştırmaz; cache en fazla
// 60 saniye sonra arka planda yenilenir.
export const revalidate = 60;

export default function IpoDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
