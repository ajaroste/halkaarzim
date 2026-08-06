"use client";

import { useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { isSupabaseConfigured, requestPasswordReset, signIn, signUp } from "@/lib/supabase-rest";

type Mode = "signin" | "signup" | "reset";
export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("signin"); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  if (!open) return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isSupabaseConfigured()) { setMessage("Üyelik sistemi şu anda aktif değil."); return; }
    const form = new FormData(event.currentTarget); const email = String(form.get("email") || "").trim(); const password = String(form.get("password") || ""); const displayName = String(form.get("displayName") || "").trim();
    if (!email.includes("@") || (mode !== "reset" && password.length < 8)) { setMessage("Geçerli e-posta ve en az 8 karakter parola girin."); return; }
    setBusy(true);
    try {
      if (mode === "reset") { await requestPasswordReset(email); setMessage("Parola yenileme bağlantısı e-postana gönderildi."); }
      else {
        const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password, displayName);
        if ("access_token" in result) { window.dispatchEvent(new Event("halkaarzim-auth-changed")); setMessage("Giriş başarılı."); setTimeout(onClose, 450); }
        else setMessage("Kayıt oluşturuldu. E-posta doğrulama bağlantısını kontrol edin.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı."); } finally { setBusy(false); }
  }
  return <div className="modalBackdrop" role="presentation" onMouseDown={onClose}><section className="modalCard" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(e: MouseEvent<HTMLElement>) => e.stopPropagation()}><button className="modalClose" onClick={onClose} aria-label="Kapat">×</button><span className="eyebrow">Topluluk hesabı</span><h2 id="auth-title">{mode === "signin" ? "Giriş yap" : mode === "signup" ? "Ücretsiz hesap oluştur" : "Parolanı yenile"}</h2><p>Yorumlar, takip listesi ve moderasyon güvenli biçimde saklanır.</p><form onSubmit={submit} className="authForm">{mode === "signup" && <label>Görünen ad<input name="displayName" minLength={2} maxLength={40} required /></label>}<label>E-posta<input name="email" type="email" autoComplete="email" required /></label>{mode !== "reset" && <label>Parola<input name="password" type="password" minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} required /></label>}<button className="primaryButton full" disabled={busy || !isSupabaseConfigured()}>{busy ? "İşleniyor…" : mode === "signin" ? "Giriş yap" : mode === "signup" ? "Hesap oluştur" : "Bağlantı gönder"}</button></form>{message && <p className="formMessage" role="status">{message}</p>}<div className="authLinks"><button className="textButton" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Hesabın yok mu? Kayıt ol" : "Giriş ekranına dön"}</button>{mode === "signin" && <button className="textButton" onClick={() => setMode("reset")}>Parolamı unuttum</button>}</div></section></div>;
}
