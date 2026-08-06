function supabaseOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) throw new Error("Giriş sistemi adresi eksik");
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") throw new Error();
    return parsed.origin;
  } catch {
    throw new Error("Giriş sistemi adresi geçersiz");
  }
}

function publicKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("Giriş sistemi anahtarı eksik");
  return key;
}

async function callRpc<T>(name: string, body: Record<string, unknown>, token: string): Promise<T> {
  const key = publicKey();
  const response = await fetch(`${supabaseOrigin()}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  let payload: unknown = text;
  try { payload = text ? JSON.parse(text) : null; } catch { /* readable fallback below */ }
  if (!response.ok) {
    const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    throw new Error(String(record.message || record.hint || "Hesap silme talebi tamamlanamadı."));
  }
  return payload as T;
}

export function requestAccountDeletion(token: string, reason = ""): Promise<string> {
  return callRpc<string>("request_account_deletion", { p_reason: reason.trim() || null }, token);
}

export function cancelAccountDeletion(token: string): Promise<boolean> {
  return callRpc<boolean>("cancel_account_deletion_request", {}, token);
}
