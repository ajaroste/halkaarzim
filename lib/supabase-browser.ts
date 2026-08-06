"use client";

import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import { clearStoredSession, storeSession, type AuthSession } from "./supabase-rest";

let browserClient: SupabaseClient | null | undefined;

export type SocialAuthProvider = "github" | "linkedin_oidc" | "spotify";

function getPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function getAuthCallbackUrl(): string {
  const configuredSite = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const vercelSite = process.env.NEXT_PUBLIC_VERCEL_URL?.trim();
  let baseUrl = configuredSite || (vercelSite ? `https://${vercelSite}` : window.location.origin);

  if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
    baseUrl = `https://${baseUrl}`;
  }

  return `${baseUrl.replace(/\/$/, "")}/auth/callback`;
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (browserClient !== undefined) return browserClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = getPublicKey();
  if (!url || !key) {
    browserClient = null;
    return null;
  }
  browserClient = createClient(url, key, {
    auth: {
      flowType: "pkce",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: "halkaarzim-supabase-auth"
    }
  });
  return browserClient;
}

export function mapSupabaseSession(session: Session): AuthSession {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
    user: {
      id: session.user.id,
      email: session.user.email,
      email_confirmed_at: session.user.email_confirmed_at
    }
  };
}

export function syncSupabaseSession(session: Session | null): AuthSession | null {
  if (!session) {
    clearStoredSession();
    return null;
  }
  return storeSession(mapSupabaseSession(session));
}

export async function signInWithSocialProvider(provider: SocialAuthProvider): Promise<void> {
  const client = getSupabaseBrowserClient();
  if (!client) throw new Error("Sosyal giriş sistemi şu anda hazır değil.");

  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthCallbackUrl(),
      skipBrowserRedirect: false
    }
  });

  if (error) throw error;
}
