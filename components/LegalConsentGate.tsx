"use client";

import Link from "next/link";
import { useState } from "react";
import type { ChangeEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { acceptLegalDocuments, LEGAL_VERSION } from "@/lib/supabase-rest";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function LegalConsentGate() {
  const { session, loading, reload, logout } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  if (loading || !session) return null;

  const activeSession = session;
  const currentVersion = String(activeSession.user.user_metadata?.legal_version || "");
  if (currentVersion === LEGAL_VERSION) return null;

  async function confirm() {
    if (!accepted) {
      setMessage("Devam etmek için iki metni kabul ettiğini onayla.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      if (!client) throw new Error("Oturum hizmeti hazır değil.");
      const acceptedAt = new Date().toISOString();
      const { error } = await client.auth.updateUser({
        data: {
          legal_version: LEGAL_VERSION,
          legal_accepted_at: acceptedAt,
          terms_accepted: true,
          privacy_acknowledged: true
        }
      });
      if (error) throw error;
      await acceptLegalDocuments(LEGAL_VERSION, activeSession.access_token).catch(() => null);
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Onay kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  function handleAcceptanceChange(event: ChangeEvent<HTMLInputElement>) {
    setAccepted(event.target.checked);
  }

  return <div className="legalGateBackdrop" role="presentation">
    <section className="legalGateCard" role="dialog" aria-modal="true" aria-labelledby="legal-gate-title">
      <span className="eyebrow">İlk giriş onayı</span>
      <h2 id="legal-gate-title">Hesabını kullanmadan önce</h2>
      <p>HalkaArzım sürüm {LEGAL_VERSION} kullanım koşullarını ve kişisel veri bilgilendirmesini incele. Bu onay özellikle GitHub ile oluşturulan yeni hesaplarda istenir.</p>
      <div className="legalGateLinks"><Link href="/kullanim-kosullari" target="_blank">Kullanım koşullarını aç ↗</Link><Link href="/gizlilik" target="_blank">Gizlilik/KVKK metnini aç ↗</Link></div>
      <label className="legalConsentRow"><input type="checkbox" checked={accepted} onChange={handleAcceptanceChange} /><span>İki metni okudum; kullanım koşullarını kabul ediyorum ve gizlilik/KVKK metni hakkında bilgilendirildim.</span></label>
      {message && <p className="formMessage" role="alert">{message}</p>}
      <div className="legalGateActions"><button className="textButton" type="button" disabled={busy} onClick={() => void logout()}>Hesaptan çık</button><button className="primaryButton" type="button" disabled={busy || !accepted} onClick={() => void confirm()}>{busy ? "Kaydediliyor…" : "Kabul et ve devam et"}</button></div>
    </section>
  </div>;
}
