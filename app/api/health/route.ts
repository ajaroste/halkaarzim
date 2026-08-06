export async function GET() {
  return Response.json(
    { status: "ok", service: "halkaarzim", version: "1.0.0-rc.2", timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
