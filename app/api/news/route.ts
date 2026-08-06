import { NextResponse } from "next/server";

export const runtime = "nodejs";

function decodeXml(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function tag(xml: string, name: string): string {
  return decodeXml(xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"))?.[1]?.trim() || "");
}

export async function GET(request: Request) {
  const company = new URL(request.url).searchParams.get("company")?.trim();
  if (!company || company.length > 160) return NextResponse.json({ error: "Geçersiz şirket" }, { status: 400 });
  const query = encodeURIComponent(`"${company.replace(/A\.Ş\.$/i, "").trim()}"`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=tr&gl=TR&ceid=TR:tr`;
  try {
    const response = await fetch(url, { headers: { "User-Agent": "HalkaArzim/1.0" }, cache: "force-cache" });
    if (!response.ok) throw new Error(`RSS ${response.status}`);
    const xml = await response.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].slice(0, 8).map((match) => {
      const item = match[1];
      return { title: tag(item, "title"), link: tag(item, "link"), source: tag(item, "source") || "Haber kaynağı", publishedAt: tag(item, "pubDate") };
    }).filter((item) => item.title && item.link);
    return NextResponse.json({ company, items }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ company, items: [] }, { status: 200, headers: { "Cache-Control": "public, s-maxage=300" } });
  }
}
