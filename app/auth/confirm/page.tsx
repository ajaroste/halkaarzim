"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { getSupabaseBrowserClient, syncSupabaseSession } from "@/lib/supabase-browser";
import { storeSession, type AuthSession } from "@/lib/supabase-rest";

export default function EmailConfirmPage() {
  const [title, setTitle] = useState("E-posta doğrulanıyor");
  const [message, setMessage] = useState("Hesabın hazırlanıyor…");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function complete() {
      const query = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const error = query.get("error_description") || query.get("error") || hash.get("error_description") || hash.get("error");

      if (error) {
        setTitle("Doğrulama tamamlanamadı");
        setMessage("Bağlantının süresi dolmuş veya daha önce kullanılmış olabilir. Tekrar kayıt ekranından giriş yapabilirsin.");
        return;
      }

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const expiresIn = Number(hash.get("expires_in") || 3600);

      if (accessToken && refreshToken) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
            Authorization: `Bearer ${accessToken}`
          }
        });
        if (!response.ok) {
          setTitle("Doğrulama tamamlanamadı");
          setMessage("Oturum bilgisi doğrulanamadı. Giriş ekranından tekrar deneyebilirsin.");
          return;
        }
        const user = await response.json();
        storeSession({ access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, user } as AuthSession);
        window.dispatchEvent(new Event("halkaarzim-auth-changed"));
        setTitle("E-posta doğrulandı");
        setMessage("Hesabın etkinleştirildi. Artık yorum yapabilir, halka arzları takip edebilir ve bildirimleri açabilirsin.");
        setSuccess(true);
        return;
      }

      const code = query.get("code");
      if (code) {
        const client = getSupabaseBrowserClient();
        if (!client) {
          setTitle("Doğrulama tamamlanamadı");
          setMessage("Giriş sistemi yapılandırması eksik.");
          return;
        }
        const result = await client.auth.exchangeCodeForSession(code);
        if (result.error || !result.data.session) {
          setTitle("Doğrulama tamamlanamadı");
          setMessage("Doğrulama kodu kullanılamadı. Giriş ekranından tekrar deneyebilirsin.");
          return;
        }
        syncSupabaseSession(result.data.session);
        window.dispatchEvent(new Event("halkaarzim-auth-changed"));
        setTitle("E-posta doğrulandı");
        setMessage("Hesabın etkinleştirildi. Artık giriş yapabilirsin.");
        setSuccess(true);
        return;
      }

      setTitle("Doğrulama bağlantısı eksik");
      setMessage("E-postadaki doğrulama bağlantısını yeniden aç veya kayıt ekranından tekrar dene.");
    }

    void complete();
  }, []);

  return <main className="authCallbackPage">
    <section className="authCallbackCard">
      <Brand />
      {!success && <div className="authSpinner" aria-hidden="true" />}
      <h1>{title}</h1>
      <p role="status">{message}</p>
      <Link className={success ? "primaryButton" : "secondaryButton"} href={success ? "/profil" : "/"}>{success ? "Profilime git" : "Ana sayfaya dön"}</Link>
    </section>
  </main>;
}
