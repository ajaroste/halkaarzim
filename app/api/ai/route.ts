import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Facts = {
  company?: string;
  capitalIncreaseShares?: number;
  shareholderSaleShares?: number;
  extraSaleShares?: number;
  fundUse?: Array<{ label: string; value: number }>;
  financials?: Array<{ period: string; revenue: number; netProfit: number; debt: number | null }>;
  risks?: string[];
  sources?: Array<{ title: string; url?: string; page?: string }>;
};

function deterministicDraft(facts: Facts) {
  const increase = Math.max(0, Number(facts.capitalIncreaseShares || 0));
  const sale = Math.max(0, Number(facts.shareholderSaleShares || 0));
  const extra = Math.max(0, Number(facts.extraSaleShares || 0));
  const total = Math.max(1, increase + sale);
  const companyShare = Math.round((increase / total) * 100);
  const score = Math.max(20, Math.min(90, Math.round(50 + companyShare * 0.35 - (sale / total) * 20 - (extra ? 8 : 0))));
  const strengths = increase > sale
    ? ["Temel arzda sermaye artırımı payı ortak satışından yüksektir."]
    : ["Arz yapısı SPK/KAP kaynaklarıyla kayıt altına alınmıştır."];
  const risks = [
    ...(sale > 0 ? ["Mevcut ortak satışı bulunmaktadır."] : []),
    ...(extra > 0 ? ["Ek pay satışı seçeneği toplam arz büyüklüğünü artırabilir."] : []),
    ...((facts.risks || []).slice(0, 4)),
  ];
  return {
    provider: "rules-v2",
    model: "deterministic-source-only",
    score,
    summary: `${facts.company || "Şirket"} için bu taslak yalnız sağlanan kaynaklı gerçekleri özetler. Temel arzın yaklaşık %${companyShare} kadarı sermaye artırımıdır. Finansal kalite veya getiri tahmini yapılmamıştır.`,
    strengths,
    risks: risks.length ? risks : ["İzahname ve finansal tablolar işlenmeden kapsam sınırlıdır."],
    reviewRequired: true,
    disclaimer: "Yatırım tavsiyesi değildir; yayımlanmadan önce insan kontrolü gerekir."
  };
}

function safeText(value: unknown, max = 240): string {
  return typeof value === "string" ? value.replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max) : "";
}

function safeNumber(value: unknown): number {
  const number = Number(value || 0);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function sanitizeFacts(input: unknown): Facts {
  const body = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const fundUse = Array.isArray(body.fundUse) ? body.fundUse.slice(0, 20).map((row) => {
    const item = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
    return { label: safeText(item.label, 120), value: Math.min(100, safeNumber(item.value)) };
  }).filter((item) => item.label) : [];
  const financials = Array.isArray(body.financials) ? body.financials.slice(0, 12).map((row) => {
    const item = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
    return { period: safeText(item.period, 40), revenue: safeNumber(item.revenue), netProfit: Number.isFinite(Number(item.netProfit)) ? Number(item.netProfit) : 0, debt: item.debt == null ? null : safeNumber(item.debt) };
  }).filter((item) => item.period) : [];
  const sources = Array.isArray(body.sources) ? body.sources.slice(0, 20).map((row) => {
    const item = (row && typeof row === "object" ? row : {}) as Record<string, unknown>;
    const rawUrl = safeText(item.url, 500);
    let sourceUrl: string | undefined;
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol === "https:") sourceUrl = parsed.toString();
    } catch { /* Geçersiz bağlantı AI bağlamına alınmaz. */ }
    return { title: safeText(item.title, 180), page: safeText(item.page, 80), url: sourceUrl };
  }).filter((item) => item.title) : [];
  return {
    company: safeText(body.company, 180) || undefined,
    capitalIncreaseShares: safeNumber(body.capitalIncreaseShares),
    shareholderSaleShares: safeNumber(body.shareholderSaleShares),
    extraSaleShares: safeNumber(body.extraSaleShares),
    fundUse,
    financials,
    risks: Array.isArray(body.risks) ? body.risks.map((x) => safeText(x, 280)).filter(Boolean).slice(0, 10) : [],
    sources
  };
}

export async function POST(request: Request) {
  const requiredToken = process.env.AI_ADMIN_TOKEN;
  const suppliedToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!requiredToken || suppliedToken !== requiredToken) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const facts = sanitizeFacts(await request.json().catch(() => ({})));
  const fallback = deterministicDraft(facts);
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const model = process.env.CLOUDFLARE_AI_MODEL || "@cf/meta/llama-3.1-8b-instruct-fast";
  if (!accountId || !apiToken) return NextResponse.json(fallback);

  const prompt = [
    "Aşağıdaki halka arz gerçeklerini Türkçe, tarafsız ve kaynak sınırlı biçimde özetle.",
    "Kesin kazanç, al/sat, tavan veya kişiye özel öneri verme.",
    "JSON döndür: summary, strengths (dizi), risks (dizi). Belgede olmayan bilgi üretme.",
    JSON.stringify(facts)
  ].join("\n");

  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "system", content: "Sen kaynak dışına çıkmayan bir halka arz belge özetleyicisisin." }, { role: "user", content: prompt }], max_tokens: 700, temperature: 0.1 })
    });
    if (!response.ok) throw new Error(`Cloudflare AI ${response.status}`);
    const payload = await response.json() as { result?: { response?: string } };
    const raw = payload.result?.response || "";
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI JSON üretmedi");
    const parsed = JSON.parse(match[0]) as { summary?: string; strengths?: string[]; risks?: string[] };
    return NextResponse.json({
      ...fallback,
      provider: "cloudflare-workers-ai",
      model,
      summary: safeText(parsed.summary || fallback.summary, 1800),
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((x) => safeText(x, 320)).filter(Boolean).slice(0, 8) : fallback.strengths,
      risks: Array.isArray(parsed.risks) ? parsed.risks.map((x) => safeText(x, 320)).filter(Boolean).slice(0, 8) : fallback.risks,
      reviewRequired: true
    });
  } catch (error) {
    return NextResponse.json({ ...fallback, fallbackReason: error instanceof Error ? error.message : "AI erişilemedi" });
  }
}
