"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { clearStoredSession, getProfile, isSupabaseConfigured, signOut, storeSession, type AuthSession, type PublicProfile, validSession } from "@/lib/supabase-rest";
import { getSupabaseBrowserClient, mapSupabaseSession } from "@/lib/supabase-browser";

type AuthContextValue = {
  session: AuthSession | null;
  profile: PublicProfile | null;
  loading: boolean;
  configured: boolean;
  reload: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const reloadPromise = useRef<Promise<void> | null>(null);

  async function performReload() {
    setLoading(true);
    let current: AuthSession | null = null;
    const browser = getSupabaseBrowserClient();

    if (browser) {
      const { data } = await browser.auth.getSession();
      if (data.session) current = storeSession(mapSupabaseSession(data.session));
    }

    if (!current && isSupabaseConfigured()) {
      const stored = await validSession();
      if (stored && browser) {
        const { data, error } = await browser.auth.setSession({
          access_token: stored.access_token,
          refresh_token: stored.refresh_token
        });
        current = !error && data.session ? storeSession(mapSupabaseSession(data.session)) : stored;
      } else {
        current = stored;
      }
    }

    setSession(current);
    setProfile(current ? await getProfile(current.access_token).catch(() => null) : null);
    setLoading(false);
  }

  function reload(): Promise<void> {
    if (reloadPromise.current) return reloadPromise.current;
    const promise = performReload().finally(() => {
      if (reloadPromise.current === promise) reloadPromise.current = null;
    });
    reloadPromise.current = promise;
    return promise;
  }

  useEffect(() => {
    void reload();
    const handler = () => void reload();
    window.addEventListener("halkaarzim-auth-changed", handler);
    const browser = getSupabaseBrowserClient();
    const subscription = browser?.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) storeSession(mapSupabaseSession(nextSession));
      else clearStoredSession();
      window.setTimeout(() => void reload(), 0);
    }).data.subscription;
    return () => {
      window.removeEventListener("halkaarzim-auth-changed", handler);
      subscription?.unsubscribe();
    };
  }, []);

  async function logout() {
    const browser = getSupabaseBrowserClient();
    await browser?.auth.signOut().catch(() => null);
    await signOut(session);
    setSession(null);
    setProfile(null);
  }

  const value = useMemo(() => ({ session, profile, loading, configured: isSupabaseConfigured(), reload, logout }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır");
  return value;
}
