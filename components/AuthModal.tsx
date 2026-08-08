"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { isSupabaseConfigured, requestPasswordReset, signIn, signOut, signUp } from "@/lib/supabase-rest";
import { signInWithSocialProvider, type SocialAuthProvider } from "@/lib/supabase-browser";

type Mode = "signin" | "signup" | "reset";
type BusyAction = "email" | SocialAuthProvider | null;

const socialProviders: Array<{ provider: SocialAuthProvider; label: string }> = [
  { provider: "github", label: "GitHub ile devam et" }
];

function authErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : "İşlem tamamlanamadı.";
  const normalized = raw.toLowerCase();
  if (normalized.includes("failed to fetch") || normalized.includes("networkerror") || normalized.includes("load failed")) return "Giriş hizmetine şu anda ulaşılamıyor. Lütfen kısa süre sonra tekrar dene.";
  if (normalized.includes("email not confirmed")) return "E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısını kullan.";
  if (normalized.includes("invalid login credentials")) return "E-posta adresi veya parola hatalı.";
  if (normalized.includes("user already registered")) return "Bu e-posta adresiyle daha önce hesap oluşturulmuş.";
  return raw;
}

function Icon({ name }: { name: "mail" | "lock" | "user" | "github" | "eye" | "eyeOff" | "check" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "mail") return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>;
  if (name === "lock") return <svg {...common}><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>;
  if (name === "user") return <svg {...common}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
  if (name === "github") return <svg {...common}><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.69c-2.78.6-3.37-1.18-3.37-1.18-.45-1.17-1.11-1.48-1.11-1.48-.91-.63.07-.62.07-.62 1 .07 1.53 1.04 1.53 1.04.9 1.54 2.35 1.1 2.92.84.09-.65.35-1.1.64-1.35-2.22-.26-4.56-1.12-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.26-.45-1.3.1-2.65 0 0 .84-.27 2.75 1.03A9.5 9.5 0 0 1 12 6.93a9.5 9.5 0 0 1 2.5.34c1.91-1.3 2.75-1.03 2.75-1.03.55 1.35.2 2.39.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.35 4.69-4.58 4.94.36.32.68.94.68 1.9v2.59c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>;
  if (name === "eye") return <svg {...common}><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
  if (name === "eyeOff") return <svg {...common}><path d="m3 3 18 18"/><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c6.5 0 10 6 10 6a17.7 17.7 0 0 1-3 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6a9.8 9.8 0 0 0 3.4-.6"/></svg>;
  return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
}

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("signin");
  const [message, setMessage] = useState("");
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", handler); };
  }, [open, onClose]);

  if (!open) return null;

  function switchMode(next: Mode) {
    setMode(next);
    setMessage("");
    setShowPassword(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!isSupabaseConfigured()) { setMessage("Üyelik sistemi şu anda aktif değil."); return; }

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const displayName = String(form.get("displayName") || "").trim();
    const termsAccepted = form.get("termsAccepted") === "on";

    if (!email.includes("@")) { setMessage("Geçerli bir e-posta adresi gir."); return; }
    if (mode !== "reset" && password.length < 8) { setMessage("Parola en az 8 karakter olmalıdır."); return; }
    if (mode === "signup" && (displayName.length < 2 || displayName.length > 40)) { setMessage("Görünen ad 2-40 karakter olmalıdır."); return; }
    if (mode === "signup" && !termsAccepted) { setMessage("Hesap oluşturmak için kullanım koşullarını kabul etmen ve gizlilik metnini okuduğunu onaylaman gerekir."); return; }

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
          if (!result.user.email_confirmed_at) {
            await signOut(result);
            setMessage("Hesabın oluşturuldu. Gelen kutundaki doğrulama bağlantısına tıklayarak hesabını etkinleştir.");
            return;
          }
          window.dispatchEvent(new Event("halkaarzim-auth-changed"));
          setMessage("Hesabın oluşturuldu ve giriş yapıldı.");
          window.setTimeout(onClose, 650);
        } else setMessage("Doğrulama e-postası gönderildi. Gelen kutundaki bağlantıya tıklayarak hesabını etkinleştir.");
        return;
      }
      const session = await signIn(email, password);
      if (!session.user.email_confirmed_at) {
        await signOut(session);
        setMessage("E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısını kullan.");
        return;
      }
      window.dispatchEvent(new Event("halkaarzim-auth-changed"));
      setMessage("Giriş başarılı.");
      window.setTimeout(onClose, 480);
    } catch (error) {
      setMessage(authErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  async function continueWithProvider(provider: SocialAuthProvider) {
    if (!isSupabaseConfigured()) { setMessage("Üyelik sistemi şu anda aktif değil."); return; }
    setMessage("");
    setBusyAction(provider);
    try { await signInWithSocialProvider(provider); }
    catch (error) { setMessage(authErrorMessage(error)); setBusyAction(null); }
  }

  const busy = busyAction !== null;
  const success = /başar|gönderildi|oluşturuldu/i.test(message);

  return <div className="modalBackdrop authBackdrop" role="presentation" onMouseDown={onClose}>
    <section className="modalCard authModalCard authModalModern" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
      <div className="authVisualPane" aria-hidden="true">
        <div className="authVisualMark">H</div>
        <div><span>HalkaArzım</span><strong>Takiplerini tek hesabınla yönet.</strong><p>Favoriler, bildirimler ve profil tercihlerin cihazlar arasında senkron kalsın.</p></div>
        <ul><li><Icon name="check"/> Takip listesi senkronizasyonu</li><li><Icon name="check"/> Kullanıcı adı ve profil yönetimi</li><li><Icon name="check"/> Bildirim tercihleri</li></ul>
      </div>

      <div className="authFormPane">
        <button className="modalClose authModalClose" onClick={onClose} aria-label="Kapat">×</button>
        {mode !== "reset" && <div className="authModeSwitch" role="tablist" aria-label="Hesap işlemi">
          <button type="button" role="tab" aria-selected={mode === "signin"} className={mode === "signin" ? "active" : ""} onClick={() => switchMode("signin")}>Giriş</button>
          <button type="button" role="tab" aria-selected={mode === "signup"} className={mode === "signup" ? "active" : ""} onClick={() => switchMode("signup")}>Kayıt ol</button>
        </div>}

        <div className="authHeading">
          <span className="eyebrow">{mode === "reset" ? "Hesap kurtarma" : "HalkaArzım hesabı"}</span>
          <h2 id="auth-title">{mode === "signin" ? "Tekrar hoş geldin" : mode === "signup" ? "Hesabını oluştur" : "Parolanı yenile"}</h2>
          <p>{mode === "signin" ? "Takiplerine kaldığın yerden devam et." : mode === "signup" ? "Bir dakikadan kısa sürede hesabını hazırla." : "E-posta adresine güvenli yenileme bağlantısı göndereceğiz."}</p>
        </div>

        {mode !== "reset" && <>
          {socialProviders.map(({ provider, label }) => <button key={provider} type="button" className="authSocialButton" disabled={busy} onClick={() => void continueWithProvider(provider)}><Icon name="github"/><span>{busyAction === provider ? "Yönlendiriliyor…" : label}</span></button>)}
          <div className="authDivider"><span>veya e-posta ile</span></div>
        </>}

        <form className="authForm authFormModern" onSubmit={submit}>
          {mode === "signup" && <label><span>Görünen ad</span><div className="authInputShell"><Icon name="user"/><input name="displayName" minLength={2} maxLength={40} autoComplete="name" placeholder="Adın veya görünen adın" required /></div></label>}
          <label><span>E-posta</span><div className="authInputShell"><Icon name="mail"/><input name="email" type="email" autoComplete="email" inputMode="email" placeholder="ornek@mail.com" required /></div></label>
          {mode !== "reset" && <label><span>Parola</span><div className="authInputShell"><Icon name="lock"/><input name="password" type={showPassword ? "text" : "password"} minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="En az 8 karakter" required /><button type="button" className="authPasswordToggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Parolayı gizle" : "Parolayı göster"}><Icon name={showPassword ? "eyeOff" : "eye"}/></button></div></label>}
          {mode === "signup" && <label className="legalConsentRow modernConsent"><input name="termsAccepted" type="checkbox" required /><span><Link href="/kullanim-kosullari" target="_blank">Kullanım koşullarını</Link> kabul ediyorum ve <Link href="/gizlilik" target="_blank">Gizlilik/KVKK metnini</Link> okudum.</span></label>}
          <button className="primaryButton full authSubmitButton" disabled={busy || !isSupabaseConfigured()}>{busyAction === "email" ? <><span className="authSpinner"/> İşleniyor…</> : mode === "signin" ? "Giriş yap" : mode === "signup" ? "Hesap oluştur" : "Bağlantı gönder"}</button>
        </form>

        {message && <p className={`formMessage authMessage ${success ? "success" : ""}`} role="status">{message}</p>}
        <div className="authLinks modernAuthLinks">
          {mode === "reset" ? <button className="textButton" type="button" disabled={busy} onClick={() => switchMode("signin")}>← Giriş ekranına dön</button> : <>
            <button className="textButton" type="button" disabled={busy} onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}>{mode === "signin" ? "Hesabın yok mu? Kayıt ol" : "Zaten hesabın var mı? Giriş yap"}</button>
            {mode === "signin" && <button className="textButton" type="button" disabled={busy} onClick={() => switchMode("reset")}>Parolamı unuttum</button>}
          </>}
        </div>
        <small className="authPrivacy">Hesap işlemlerinde <Link href="/kullanim-kosullari">kullanım koşulları</Link> ve <Link href="/gizlilik">gizlilik metni</Link> uygulanır.</small>
      </div>
    </section>
  </div>;
}
