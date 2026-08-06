import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim();
  const publisher = client?.replace(/^ca-/, "");
  const body = publisher ? `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n` : "# AdSense publisher kimliği henüz tanımlanmadı.\n";
  return new NextResponse(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
