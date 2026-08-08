import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

const GEMINI_MODEL = "gemini-3.5-flash";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const model = GEMINI_MODEL;

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, configured: false, model, reason: "missing_api_key" },
      { status: 503, headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Yalnız OK yaz." }] }],
        generationConfig: { temperature: 0, maxOutputTokens: 8 }
      }),
      signal: AbortSignal.timeout(10_000),
      cache: "no-store"
    });

    if (!upstream.ok) {
      const raw = await upstream.text().catch(() => "");
      let reason = "upstream_error";
      try {
        const parsed = JSON.parse(raw) as { error?: { status?: string; message?: string } };
        reason = parsed.error?.status || reason;
      } catch {}
      return NextResponse.json(
        { ok: false, configured: true, model, upstreamStatus: upstream.status, reason },
        { status: 502, headers: { "Cache-Control": "public, s-maxage=60" } }
      );
    }

    return NextResponse.json(
      { ok: true, configured: true, model, upstreamStatus: upstream.status },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, configured: true, model, reason: error instanceof Error && error.name === "TimeoutError" ? "timeout" : "network_error" },
      { status: 502, headers: { "Cache-Control": "public, s-maxage=60" } }
    );
  }
}
