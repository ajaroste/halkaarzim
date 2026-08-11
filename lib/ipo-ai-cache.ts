import type { IpoAiAnalysis } from "@/lib/gemini-ipo";

function supabaseUrl(): string {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  if (!url) throw new Error("IPO AI cache URL is not configured");
  return url;
}

function readKey(): string {
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  ).trim();
  if (!key) throw new Error("IPO AI cache read key is not configured");
  return key;
}

function writeKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!key) throw new Error("IPO AI cache write key is not configured");
  return key;
}

function headers(key: string): HeadersInit {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}

type CacheRow = {
  provider: "google-gemini";
  model: string;
  summary: string;
  strengths: unknown;
  risks: unknown;
  data_gaps: unknown;
  confidence: number;
};

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toAnalysis(row: CacheRow): IpoAiAnalysis {
  return {
    provider: "google-gemini",
    model: row.model,
    summary: row.summary,
    strengths: stringList(row.strengths),
    risks: stringList(row.risks),
    dataGaps: stringList(row.data_gaps),
    confidence: row.confidence
  };
}

function looksComplete(analysis: IpoAiAnalysis): boolean {
  const summary = analysis.summary.trim();
  return summary.length >= 220 && /[.!?…]["')\]]?$/.test(summary);
}

export async function getCachedIpoAiAnalysis(slug: string): Promise<IpoAiAnalysis | null> {
  const url = supabaseUrl();
  const key = readKey();
  const query = new URLSearchParams({
    slug: `eq.${slug}`,
    select: "provider,model,summary,strengths,risks,data_gaps,confidence",
    limit: "1"
  });
  const response = await fetch(`${url}/rest/v1/ipo_ai_analyses?${query}`, {
    headers: headers(key),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(`IPO AI cache read failed ${response.status}`);
  const rows = await response.json() as CacheRow[];
  if (!rows[0]) return null;
  const analysis = toAnalysis(rows[0]);
  return looksComplete(analysis) ? analysis : null;
}

export async function storeIpoAiAnalysisOnce(slug: string, analysis: IpoAiAnalysis): Promise<IpoAiAnalysis> {
  const url = supabaseUrl();
  const key = writeKey();
  if (!looksComplete(analysis)) throw new Error("IPO AI cache write refused incomplete analysis");

  const response = await fetch(`${url}/rest/v1/ipo_ai_analyses?on_conflict=slug`, {
    method: "POST",
    headers: {
      ...headers(key),
      Prefer: "resolution=merge-duplicates,return=representation"
    },
    body: JSON.stringify({
      slug,
      provider: analysis.provider,
      model: analysis.model,
      summary: analysis.summary,
      strengths: analysis.strengths,
      risks: analysis.risks,
      data_gaps: analysis.dataGaps,
      confidence: analysis.confidence
    })
  });
  if (!response.ok) throw new Error(`IPO AI cache write failed ${response.status}`);
  const rows = await response.json() as CacheRow[];
  if (rows[0]) return toAnalysis(rows[0]);

  const persisted = await getCachedIpoAiAnalysis(slug);
  if (!persisted) throw new Error("IPO AI cache write completed without persisted row");
  return persisted;
}
