"use client";

import { useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { isSupabaseConfigured, requestPasswordReset, signIn, signUp } from "@/lib/supabase-rest";

type Mode = "signin" | "signup" | "reset";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isSupabaseConfigured()) {
      setMessage("Üyelik sistemi şu anda aktif değil.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const displayName = String(form.get("displayName") || "").trim();

    if (!email.includes("@")) {
      setMessage("Geçerli bir e-posta adresi gir.");
      return;
    }
    if (mode !== "reset" && password.length < 8) {
      setMessage("Parola en az 8 karakter olmalıdır.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "reset") {
        await requestPasswordReset(email);
        setMessage("Parola yenileme bağlantısı e-posta adresine gönderildi.");
        return;
      }

      if (mode === "signup") {
        const result = await signUp(email, password, displayName);
        if ("access_token" in result) {
          window.dispatchEvent(new Event("halkaarzim-auth-changed"));
          setMessage("Hesabın oluşturuldu ve giriş yapıldı.");
          window.setTimeout(onClose, 600);
        } else {
          setMessage("Doğrulama e-postası gönderildi. Gelen kutundaki bağlantıya tıklayarak hesabını etkinleştir.");
        }
        return;
      }

      const session = await signIn(email, password);
      if (!session.user.email_confirmed_at) {
        setMessage("E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısını kullan.");
        return;
      }
      window.dispatchEvent(new Event("halkaarzim-auth-changed"));
      setMessage("Giriş başarılı.");
      window.setTimeout(onClose, 450);
    } catch (error) {
      const raw = error instanceof Error ? error.message : "İşlem tamamlanamadı.";
      const normalized = raw.toLowerCase();
      if (normalized.includes("email not confirmed")) {
        setMessage("E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısını kullan.");
      } else if (normalized.includes("invalid login credentials")) {
        setMessage("E-posta adresi veya parola hatalı.");
      } else if (normalized.includes("user already registered")) {
        setMessage("Bu e-posta adresiyle daha önce hesap oluşturulmuş.");
      } else {
        setMessage(raw);
      }
    } finally {
      setBusy(false);
    }
  }

  return <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
    <section className="modalCard authModalCard" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
      <button className="modalClose" onClick={onClose} aria-label="Kapat">×</button>
      <span className="eyebrow">HalkaArzım hesabı</span>
      <h2 id="auth-title">{mode === "signin" ? "Giriş yap" : mode === "signup" ? "Ücretsiz hesap oluştur" : "Parolanı yenile"}</h2>
      <p>{mode === "signup" ? "Kayıt sonrasında e-posta adresine doğrulama bağlantısı gönderilir." : "Takip listen, yorumların ve bildirim tercihlerin hesabınla eşitlenir."}</p>

      <form className="authForm" onSubmit={submit}>
        {mode === "signup" && <label>Görünen ad<input name="displayName" minLength={2} maxLength={40} autoComplete="name" required /></label>}
        <label>E-posta<input name="email" type="email" autoComplete="email" required /></label>
        {mode !== "reset" && <label>Parola<input name="password" type="password" minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} required /></label>}
        <button className="primaryButton full" disabled={busy || !isSupabaseConfigured()}>
          {busy ? "İşleniyor…" : mode === "signin" ? "Giriş yap" : mode === "signup" ? "Hesap oluştur" : "Bağlantı gönder"}
        </button>
      </form>

      {message && <p className="formMessage" role="status">{message}</p>}
      <div className="authLinks">
        <button className="textButton" type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
          {mode === "signin" ? "Hesabın yok mu? Kayıt ol" : "Giriş ekranına dön"}
        </button>
        {mode === "signin" && <button className="textButton" type="button" onClick={() => { setMode("reset"); setMessage(""); }}>Parolamı unuttum</button>}
      </div>
      <small className="authPrivacy">Kayıt olarak kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.</small>
    </section>
  </div>;
}
