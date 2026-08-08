import { NextResponse } from "next/server";
import { getIpoBySlug } from "@/data/ipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function response(body: unknown, status = 200, cache = false) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": cache
        ? "public, s-maxage=86400, stale-while-revalidate=604800"
        : "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ipo = getIpoBySlug(slug);
  if (!ipo) return response({ error: "Halka arz bulunamadı." }, 404);

  const adminToken = process.env.AI_ADMIN_TOKEN;
  if (!adminToken || !process.env.GEMINI_API_KEY) {
    return response({ error: "AI analizi yapılandırılmadı." }, 503);
  }

  const facts = {
    company: ipo.company,
    capitalIncreaseShares: ipo.capitalIncreaseShares,
    shareholderSaleShares: ipo.shareholderSaleShares,
    extraSaleShares: ipo.extraSaleShares,
    fundUse: ipo.fundUse.map((item) => ({ label: item.label, value: item.value })),
    financials: ipo.financials,
    risks: ipo.risks,
    sources: ipo.sources.map((source) => ({ title: source.title, url: source.url, page: source.page }))
  };

  const origin = new URL(request.url).origin;
  try {
    const upstream = await fetch(`${origin}/api/ai`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(facts),
      cache: "no-store",
      signal: AbortSignal.timeout(28_000)
    });

    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return response({ error: "AI analizi şu anda hazırlanamadı." }, 502);

    const provider = typeof payload.provider === "string" ? payload.provider : "unknown";
    return response(payload, 200, provider === "google-gemini");
  } catch {
    return response({ error: "AI analizi şu anda hazırlanamadı." }, 502);
  }
}
