"use client";

import { useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { isSupabaseConfigured, requestPasswordReset, signIn, signUp } from "@/lib/supabase-rest";
import { signInWithSocialProvider, type SocialAuthProvider } from "@/lib/supabase-browser";

type Mode = "signin" | "signup" | "reset";
type BusyAction = "email" | SocialAuthProvider | null;

const socialProviders: Array<{ provider: SocialAuthProvider; label: string; mark: string }> = [
  { provider: "github", label: "GitHub ile devam et", mark: "GH" },
  { provider: "linkedin_oidc", label: "LinkedIn ile devam et", mark: "in" },
  { provider: "spotify", label: "Spotify ile devam et", mark: "♪" }
];

function authErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "İşlem tamamlanamadı.";
  const normalized = raw.toLowerCase();
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror") || normalized.includes("load failed")) {
    return "Giriş hizmetine şu anda ulaşılamıyor. Lütfen kısa süre sonra tekrar dene.";
  }
  if (normalized.includes("email not confirmed")) {
    return "E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısını kullan.";
  }
  if (normalized.includes("invalid login credentials")) {
    return "E-posta adresi veya parola hatalı.";
  }
  if (normalized.includes("user already registered")) {
    return "Bu e-posta adresiyle daha önce hesap oluşturulmuş.";
  }
  return raw;
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction>(null);

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

    setBusyAction("email");
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
      setMessage(authErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function continueWithProvider(provider: SocialAuthProvider) {
    if (!isSupabaseConfigured()) {
      setMessage("Üyelik sistemi şu anda aktif değil.");
      return;
    }
    setMessage("");
    setBusyAction(provider);
    try {
      await signInWithSocialProvider(provider);
    } catch (error) {
      setMessage(authErrorMessage(error));
      setBusyAction(null);
    }
  }

  const busy = busyAction !== null;

  return <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
    <section className="modalCard authModalCard" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
      <button className="modalClose" onClick={onClose} aria-label="Kapat">×</button>
      <span className="eyebrow">HalkaArzım hesabı</span>
      <h2 id="auth-title">{mode === "signin" ? "Giriş yap" : mode === "signup" ? "Ücretsiz hesap oluştur" : "Parolanı yenile"}</h2>
      <p>{mode === "signup" ? "E-posta ile kayıt olabilir veya aşağıdaki hesaplardan biriyle devam edebilirsin." : mode === "reset" ? "Parola yenileme bağlantısını e-posta adresine göndereceğiz." : "E-posta adresinle veya sosyal hesabınla giriş yapabilirsin."}</p>

      {mode !== "reset" && <>
        <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
          {socialProviders.map(({ provider, label, mark }) => <button
            key={provider}
            type="button"
            className="secondaryButton"
            style={{ width: "100%", minHeight: 46, justifyContent: "flex-start", gap: 12 }}
            disabled={busy}
            onClick={() => void continueWithProvider(provider)}
          >
            <span aria-hidden="true" style={{ width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: 8, background: "var(--surface-2)", fontWeight: 900, fontSize: 12 }}>{mark}</span>
            <span style={{ flex: 1, textAlign: "center", paddingRight: 28 }}>{busyAction === provider ? "Yönlendiriliyor…" : label}</span>
          </button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 18px", color: "var(--muted)", fontSize: 12 }}>
          <span style={{ height: 1, flex: 1, background: "var(--line)" }} />
          <span>veya e-posta ile</span>
          <span style={{ height: 1, flex: 1, background: "var(--line)" }} />
        </div>
      </>}

      <form className="authForm" onSubmit={submit}>
        {mode === "signup" && <label>Görünen ad<input name="displayName" minLength={2} maxLength={40} autoComplete="name" required /></label>}
        <label>E-posta<input name="email" type="email" autoComplete="email" required /></label>
        {mode !== "reset" && <label>Parola<input name="password" type="password" minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} required /></label>}
        <button className="primaryButton full" disabled={busy || !isSupabaseConfigured()}>
          {busyAction === "email" ? "İşleniyor…" : mode === "signin" ? "Giriş yap" : mode === "signup" ? "Hesap oluştur" : "Bağlantı gönder"}
        </button>
      </form>

      {message && <p className="formMessage" role="status">{message}</p>}
      <div className="authLinks">
        <button className="textButton" type="button" disabled={busy} onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
          {mode === "signin" ? "Hesabın yok mu? Kayıt ol" : "Giriş ekranına dön"}
        </button>
        {mode === "signin" && <button className="textButton" type="button" disabled={busy} onClick={() => { setMode("reset"); setMessage(""); }}>Parolamı unuttum</button>}
      </div>
      <small className="authPrivacy">Devam ederek kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.</small>
    </section>
  </div>;
}
