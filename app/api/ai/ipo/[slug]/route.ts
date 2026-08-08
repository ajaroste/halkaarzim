import { NextResponse } from "next/server";
import { getIpoBySlug } from "@/data/ipos";
import { generateGeminiIpoAnalysis } from "@/lib/gemini-ipo";

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

function safeReason(error: unknown) {
  if (!(error instanceof Error)) return "unknown_error";
  const message = error.message || "unknown_error";
  if (/GEMINI_API_KEY/i.test(message)) return "missing_api_key";
  if (/Gemini upstream \d+/i.test(message)) return message.replace(/[^a-zA-Z0-9 _-]/g, "").slice(0, 80);
  if (/JSON|parse/i.test(message)) return "invalid_model_json";
  if (/boş yanıt/i.test(message)) return "empty_model_response";
  if (/yatırım yönlendirmesi/i.test(message)) return "blocked_model_output";
  if (/timeout/i.test(message)) return "timeout";
  return "runtime_error";
}

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ipo = getIpoBySlug(slug);
  if (!ipo) return response({ error: "Halka arz bulunamadı." }, 404);
  if (!process.env.GEMINI_API_KEY) return response({ error: "AI analizi yapılandırılmadı.", reason: "missing_api_key" }, 503);

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

  try {
    const analysis = await generateGeminiIpoAnalysis(facts);
    return response(analysis, 200, true);
  } catch (error) {
    const reason = safeReason(error);
    console.error("Runtime IPO AI analysis failed", reason, error instanceof Error ? error.message : error);
    return response({ error: "AI analizi şu anda hazırlanamadı.", reason }, 502);
  }
}
