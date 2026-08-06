"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { getSupabaseBrowserClient, syncSupabaseSession } from "@/lib/supabase-browser";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Google hesabın doğrulanıyor…");

  useEffect(() => {
    async function complete() {
      const client = getSupabaseBrowserClient();
      if (!client) {
        setMessage("Giriş sistemi şu anda hazır değil.");
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const providerError = params.get("error_description") || params.get("error");
      if (providerError) {
        setMessage("Google girişi tamamlanamadı. Tekrar deneyebilirsin.");
        return;
      }
      let result = await client.auth.getSession();
      if (!result.data.session && params.get("code")) {
        result = await client.auth.exchangeCodeForSession(params.get("code") || "");
      }
      if (result.error || !result.data.session) {
        setMessage("Oturum oluşturulamadı. Giriş ekranından tekrar dene.");
        return;
      }
      syncSupabaseSession(result.data.session);
      window.dispatchEvent(new Event("halkaarzim-auth-changed"));
      window.location.replace("/profil");
    }
    void complete();
  }, []);

  return <main className="authCallbackPage">
    <section className="authCallbackCard">
      <Brand />
      <div className="authSpinner" aria-hidden="true" />
      <h1>Hesabın hazırlanıyor</h1>
      <p role="status">{message}</p>
      <Link className="secondaryButton" href="/">Ana sayfaya dön</Link>
    </section>
  </main>;
}
