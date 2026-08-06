"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProfile, isSupabaseConfigured, signOut, type AuthSession, type PublicProfile, validSession } from "@/lib/supabase-rest";

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

  async function reload() {
    setLoading(true);
    const current = isSupabaseConfigured() ? await validSession() : null;
    setSession(current);
    setProfile(current ? await getProfile(current.access_token).catch(() => null) : null);
    setLoading(false);
  }

  useEffect(() => {
    void reload();
    const handler = () => void reload();
    window.addEventListener("halkaarzim-auth-changed", handler);
    return () => window.removeEventListener("halkaarzim-auth-changed", handler);
  }, []);

  async function logout() {
    await signOut(session);
    setSession(null); setProfile(null);
    window.dispatchEvent(new Event("halkaarzim-auth-changed"));
  }

  const value = useMemo(() => ({ session, profile, loading, configured: isSupabaseConfigured(), reload, logout }), [session, profile, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth, AuthProvider içinde kullanılmalıdır");
  return value;
}
