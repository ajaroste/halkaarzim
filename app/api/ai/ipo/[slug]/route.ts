import { NextResponse } from "next/server";
import { getIpoBySlug } from "@/data/ipos";
import { generateGeminiIpoAnalysis } from "@/lib/gemini-ipo";
import { getCachedIpoAiAnalysis, storeIpoAiAnalysisOnce } from "@/lib/ipo-ai-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function response(body: unknown, status = 200, cache = false) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": cache
        ? "public, s-maxage=31536000, stale-while-revalidate=86400"
        : "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function safeReason(error: unknown) {
  if (!(error instanceof Error)) return "unknown_error";
  const message = error.message || "unknown_error";
  if (/GEMINI_API_KEY/i.test(message)) return "missing_api_key";
  if (/IPO AI cache is not configured/i.test(message)) return "ai_cache_not_configured";
  if (/IPO AI cache (read|write)/i.test(message)) return "ai_cache_error";
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

  try {
    const cached = await getCachedIpoAiAnalysis(slug);
    if (cached) return response(cached, 200, true);
  } catch (error) {
    const reason = safeReason(error);
    console.error("IPO AI persistent cache read failed", reason, error instanceof Error ? error.message : error);
    return response({ error: "AI analizi kalıcı önbelleği kullanılamıyor.", reason }, 503);
  }

  if (!process.env.GEMINI_API_KEY) return response({ error: "AI analizi yapılandırılmadı.", reason: "missing_api_key" }, 503);

  const facts = {
    company: ipo.company,
    ticker: ipo.ticker,
    sector: ipo.sector,
    status: ipo.status,
    statusLabel: ipo.statusLabel,
    price: ipo.price,
    dates: ipo.dates,
    collectionStart: ipo.collectionStart,
    collectionEnd: ipo.collectionEnd,
    firstTradeDate: ipo.firstTradeDate,
    approvalDate: ipo.approvalDate,
    approvalLabel: ipo.approvalLabel,
    distribution: ipo.distribution,
    intermediary: ipo.intermediary,
    lotCount: ipo.lotCount,
    maxLotCount: ipo.maxLotCount,
    retailLots: ipo.retailLots,
    participantCount: ipo.participantCount,
    offerSize: ipo.offerSize,
    publicFloat: ipo.publicFloat,
    market: ipo.market,
    priceStability: ipo.priceStability,
    valuationDiscount: ipo.valuationDiscount,
    allocationText: ipo.allocationText,
    dataCompleteness: ipo.dataCompleteness,
    dataNotes: ipo.dataNotes,
    capitalBefore: ipo.capitalBefore,
    capitalAfter: ipo.capitalAfter,
    capitalIncreaseShares: ipo.capitalIncreaseShares,
    shareholderSaleShares: ipo.shareholderSaleShares,
    extraSaleShares: ipo.extraSaleShares,
    fundUse: ipo.fundUse.map((item) => ({ label: item.label, value: item.value, min: item.min, max: item.max })),
    financials: ipo.financials,
    risks: ipo.risks,
    agenda: ipo.agenda.map((item) => ({
      date: item.date,
      category: item.category,
      title: item.title,
      summary: item.summary,
      source: item.source,
      impact: item.impact
    })),
    promises: ipo.promises,
    sources: ipo.sources.map((source) => ({ title: source.title, url: source.url, page: source.page, kind: source.kind }))
  };

  try {
    const analysis = await generateGeminiIpoAnalysis(facts);
    const persisted = await storeIpoAiAnalysisOnce(slug, analysis);
    return response(persisted, 200, true);
  } catch (error) {
    const reason = safeReason(error);
    console.error("Runtime IPO AI analysis failed", reason, error instanceof Error ? error.message : error);
    return response({ error: "AI analizi şu anda hazırlanamadı.", reason }, 502);
  }
}
