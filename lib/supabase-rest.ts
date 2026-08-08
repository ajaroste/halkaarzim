export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
  };
};

export type PublicProfile = {
  id: string;
  display_name?: string | null;
  username?: string | null;
  role?: "user" | "moderator" | "admin";
  is_suspended?: boolean;
};

export const LEGAL_VERSION = "1.0";

function normalizeSupabaseUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") return undefined;
    return parsed.origin;
  } catch {
    return undefined;
  }
}

const url = normalizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const publicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SESSION_KEY = "halkaarzim-session";

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publicKey && process.env.NEXT_PUBLIC_DEMO_MODE !== "true");
}

function headers(token?: string): HeadersInit {
  if (!publicKey) throw new Error("Giriş sistemi anahtarı eksik");
  return {
    apikey: publicKey,
    Authorization: `Bearer ${token || publicKey}`,
    "Content-Type": "application/json"
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: Record<string, unknown> = {};
  if (text) {
    try { body = JSON.parse(text) as Record<string, unknown>; }
    catch { body = { message: text.slice(0, 300) }; }
  }
  if (!response.ok) {
    const message = body.msg || body.message || body.error_description || body.hint || "İstek tamamlanamadı";
    throw new Error(String(message));
  }
  return body as T;
}

function normalizeSession(session: AuthSession): AuthSession {
  return { ...session, expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600) };
}

export function storeSession(session: AuthSession): AuthSession {
  const normalized = normalizeSession(session);
  if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  return normalized;
}

export function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null") as AuthSession | null; }
  catch { localStorage.removeItem(SESSION_KEY); return null; }
}

export function clearStoredSession() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

export async function signUp(email: string, password: string, displayName?: string, legalVersion = LEGAL_VERSION): Promise<AuthSession | { user: unknown }> {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/confirm` : undefined;
  const legalAcceptedAt = new Date().toISOString();
  const result = await parseResponse<AuthSession | { user: unknown }>(await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      email,
      password,
      data: {
        display_name: displayName || email.split("@")[0],
        legal_version: legalVersion,
        legal_accepted_at: legalAcceptedAt,
        terms_accepted: true,
        privacy_acknowledged: true
      },
      email_redirect_to: redirectTo
    })
  }));
  return "access_token" in result ? storeSession(result) : result;
}

export async function signIn(email: string, password: string): Promise<AuthSession> {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  return storeSession(await parseResponse<AuthSession>(await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: headers(), body: JSON.stringify({ email, password })
  })));
}

export async function refreshSession(session: AuthSession): Promise<AuthSession> {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  return storeSession(await parseResponse<AuthSession>(await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST", headers: headers(), body: JSON.stringify({ refresh_token: session.refresh_token })
  })));
}

export async function validSession(): Promise<AuthSession | null> {
  const session = readStoredSession();
  if (!session) return null;
  if ((session.expires_at || 0) > Math.floor(Date.now() / 1000) + 60) return session;
  try { return await refreshSession(session); } catch { clearStoredSession(); return null; }
}

export async function signOut(session?: AuthSession | null) {
  const current = session || readStoredSession();
  if (url && current) {
    await fetch(`${url}/auth/v1/logout`, { method: "POST", headers: headers(current.access_token) }).catch(() => null);
  }
  clearStoredSession();
}

export async function requestPasswordReset(email: string) {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/confirm?mode=recovery` : undefined;
  await parseResponse(await fetch(`${url}/auth/v1/recover`, { method: "POST", headers: headers(), body: JSON.stringify({ email, redirect_to: redirectTo }) }));
}

export async function getProfile(token: string): Promise<PublicProfile | null> {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  const rows = await parseResponse<PublicProfile[]>(await fetch(`${url}/rest/v1/profiles?id=eq.${encodeURIComponent((await getUser(token)).id)}&select=id,username,display_name,role,is_suspended&limit=1`, { headers: headers(token), cache: "no-store" }));
  return rows[0] || null;
}

async function rpc<T>(name: string, body: Record<string, unknown>, token: string): Promise<T> {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  return parseResponse<T>(await fetch(`${url}/rest/v1/rpc/${name}`, { method: "POST", headers: headers(token), body: JSON.stringify(body) }));
}

export async function updateProfile(input: { username: string; displayName: string }, token: string): Promise<void> {
  await rpc("update_own_profile", { p_username: input.username, p_display_name: input.displayName }, token);
}

export async function acceptLegalDocuments(version: string, token: string): Promise<void> {
  await rpc("accept_legal_documents", { p_version: version }, token);
}

export async function getUser(token: string): Promise<{ id: string; email?: string }> {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  return parseResponse(await fetch(`${url}/auth/v1/user`, { headers: headers(token), cache: "no-store" }));
}

export async function listComments(ipoId: string, token?: string) {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  const query = new URLSearchParams({ ipo_id: `eq.${ipoId}`, select: "id,body,helpful_count,created_at,display_name", order: "created_at.desc", limit: "50" });
  return parseResponse<Array<Record<string, unknown>>>(await fetch(`${url}/rest/v1/published_comments?${query}`, { headers: headers(token), cache: "no-store" }));
}

export async function createComment(input: { ipoId: string; body: string; token: string }) {
  return rpc<string>("submit_comment", { p_ipo_id: input.ipoId, p_body: input.body }, input.token);
}
export async function voteComment(commentId: string, token: string) {
  return rpc<boolean>("toggle_comment_vote", { p_comment_id: commentId }, token);
}
export async function dislikeComment(commentId: string, token: string) {
  return rpc<boolean>("toggle_comment_dislike", { p_comment_id: commentId }, token);
}
export async function reportComment(commentId: string, reason: string, details: string, token: string) {
  return rpc<string>("report_comment", { p_comment_id: commentId, p_reason: reason, p_details: details }, token);
}
export async function listWatchlist(token: string): Promise<string[]> {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  const rows = await parseResponse<Array<{ ipo_id: string }>>(await fetch(`${url}/rest/v1/watchlists?select=ipo_id&order=created_at.desc`, { headers: headers(token), cache: "no-store" }));
  return rows.map((row) => row.ipo_id);
}
export async function toggleWatchlist(ipoId: string, enabled: boolean, token: string) {
  return rpc<boolean>("set_watchlist", { p_ipo_id: ipoId, p_enabled: enabled }, token);
}
export async function updateNotificationPreference(ipoId: string, enabled: boolean, token: string) {
  return rpc<boolean>("set_watchlist_notifications", { p_ipo_id: ipoId, p_enabled: enabled }, token);
}

export async function listModerationQueue(token: string) {
  if (!url) throw new Error("Giriş sistemi adresi eksik");
  return parseResponse<Array<Record<string, unknown>>>(await fetch(`${url}/rest/v1/comments?status=eq.pending&select=id,ipo_id,body,created_at,user_id&order=created_at.asc&limit=100`, { headers: headers(token), cache: "no-store" }));
}
export async function moderateQueuedComment(commentId: string, action: "publish" | "hide", token: string) {
  return rpc<boolean>("moderate_comment", { p_comment_id: commentId, p_action: action }, token);
}

export type PushSubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };
export async function savePushSubscription(subscription: PushSubscriptionInput, token: string) {
  return rpc<string>("upsert_push_subscription", {
    p_endpoint: subscription.endpoint,
    p_p256dh: subscription.keys.p256dh,
    p_auth: subscription.keys.auth,
    p_user_agent: typeof navigator !== "undefined" ? navigator.userAgent : ""
  }, token);
}
export async function removePushSubscription(endpoint: string, token: string) {
  return rpc<boolean>("delete_push_subscription", { p_endpoint: endpoint }, token);
}

export type AdminIpoPatch = {
  ipoId: string;
  status?: string;
  ticker?: string;
  collectionStart?: string;
  collectionEnd?: string;
  firstTradeDate?: string;
  intermediary?: string;
};

export async function adminPatchIpo(input: AdminIpoPatch, token: string) {
  return rpc<boolean>("admin_patch_ipo", {
    p_ipo_id: input.ipoId,
    p_status: input.status || null,
    p_ticker: input.ticker || null,
    p_collection_start: input.collectionStart || null,
    p_collection_end: input.collectionEnd || null,
    p_first_trade_date: input.firstTradeDate || null,
    p_intermediary: input.intermediary || null
  }, token);
}

export async function adminAddDocument(input: { ipoId: string; title: string; documentType: string; sourceKind: string; sourceUrl: string }, token: string) {
  return rpc<string>("admin_add_document", {
    p_ipo_id: input.ipoId,
    p_title: input.title,
    p_document_type: input.documentType,
    p_source_kind: input.sourceKind,
    p_source_url: input.sourceUrl
  }, token);
}
