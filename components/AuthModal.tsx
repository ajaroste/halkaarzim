"use client";

import { useState } from "react";
import type { MouseEvent } from "react";
import { signInWithGoogle } from "@/lib/supabase-browser";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  async function continueWithGoogle() {
    setBusy(true);
    setMessage("");
    try {
      await signInWithGoogle();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Google ile giriş başlatılamadı.");
      setBusy(false);
    }
  }

  return <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
    <section className="modalCard authModalCard" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event: MouseEvent<HTMLElement>) => event.stopPropagation()}>
      <button className="modalClose" onClick={onClose} aria-label="Kapat">×</button>
      <span className="eyebrow">HalkaArzım hesabı</span>
      <h2 id="auth-title">Giriş yap veya kaydol</h2>
      <p>Takip listen, yorumların ve bildirim tercihlerin Google hesabınla güvenli biçimde eşitlenir.</p>
      <button type="button" className="googleButton" onClick={() => void continueWithGoogle()} disabled={busy}>
        <span className="googleMark" aria-hidden="true">G</span>
        <span>{busy ? "Google açılıyor…" : "Google ile devam et"}</span>
      </button>
      <small className="authPrivacy">Devam ederek kullanım koşullarını ve gizlilik politikasını kabul etmiş olursun.</small>
      {message && <p className="formMessage" role="status">{message}</p>}
    </section>
  </div>;
}
