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

export async function listCommentDislikeCounts(commentIds: string[], token?: string): Promise<Record<string, number>> {
  if (!url || !publicKey || !commentIds.length) return {};

  const safeIds = commentIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (!safeIds.length) return {};

  const query = new URLSearchParams({
    select: "comment_id",
    comment_id: `in.(${safeIds.join(",")})`
  });

  const response = await fetch(`${url}/rest/v1/comment_dislikes?${query}`, {
    headers: {
      apikey: publicKey,
      Authorization: `Bearer ${token || publicKey}`
    },
    cache: "no-store"
  });

  if (!response.ok) return {};
  const rows = await response.json() as Array<{ comment_id?: string }>;
  return rows.reduce<Record<string, number>>((counts, row) => {
    if (row.comment_id) counts[row.comment_id] = (counts[row.comment_id] || 0) + 1;
    return counts;
  }, {});
}
