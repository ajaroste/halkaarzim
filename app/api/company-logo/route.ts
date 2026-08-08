import { NextRequest, NextResponse } from "next/server";

const DOMAIN_RE = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
const CACHE_SECONDS = 60 * 60 * 24 * 30;
const STALE_SECONDS = 60 * 60 * 24 * 90;

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain")?.trim().toLowerCase() || "";
  if (!DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: "invalid_domain" }, { status: 400 });
  }

  const clientId = process.env.BRANDFETCH_CLIENT_ID;
  if (!clientId) {
    return new NextResponse(null, {
      status: 404,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" }
    });
  }

  const upstream = `https://cdn.brandfetch.io/domain/${encodeURIComponent(domain)}?c=${encodeURIComponent(clientId)}`;

  try {
    const response = await fetch(upstream, {
      headers: { Accept: "image/avif,image/webp,image/png,image/svg+xml,image/*,*/*;q=0.8" },
      next: { revalidate: CACHE_SECONDS }
    });

    if (!response.ok) {
      return new NextResponse(null, {
        status: 404,
        headers: { "Cache-Control": "public, max-age=900, s-maxage=900" }
      });
    }

    const body = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": `public, max-age=${CACHE_SECONDS}, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${STALE_SECONDS}`,
        "CDN-Cache-Control": `public, max-age=${CACHE_SECONDS}`,
        "Vercel-CDN-Cache-Control": `public, max-age=${CACHE_SECONDS}`,
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return new NextResponse(null, {
      status: 502,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" }
    });
  }
}
