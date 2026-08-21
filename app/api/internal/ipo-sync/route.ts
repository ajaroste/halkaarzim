import { runLiveIpoSync } from "@/lib/server/ipo-sync";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function execute(request: Request) {
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const previewDryRun = dryRun && process.env.VERCEL_ENV !== "production";
  if (!previewDryRun && !authorized(request)) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const result = await runLiveIpoSync({ dryRun });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export async function GET(request: Request) { return execute(request); }
export async function POST(request: Request) { return execute(request); }
