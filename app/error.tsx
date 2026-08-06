"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="section"><div className="narrow emptyState"><strong>Sayfa yüklenemedi</strong><p>Geçici bir hata oluştu. Kayıtların hiçbirini değiştirmedik.</p><button className="primaryButton" onClick={reset}>Tekrar dene</button></div></main>;
}
