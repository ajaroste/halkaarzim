import { ipos } from "@/data/ipos";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    "'": "&apos;",
    "\"": "&quot;"
  })[character] || character);
}

export async function GET() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://halkaarzim.vercel.app").replace(/\/+$/, "");
  const now = new Date().toUTCString();
  const items = ipos.slice(0, 40).map((ipo) => {
    const link = `${base}/arz/${ipo.slug}`;
    const title = `${ipo.ticker || "Halka arz"} — ${ipo.company}`;
    return `<item>
      <title>${escapeXml(title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <description>${escapeXml(ipo.aiSummary)}</description>
      <category>${escapeXml(ipo.statusLabel)}</category>
      <pubDate>${now}</pubDate>
    </item>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>HalkaArzım</title>
    <link>${escapeXml(base)}</link>
    <description>Yeni halka arzlar, resmî kaynaklı ön analizler ve önemli tarihler.</description>
    <language>tr-TR</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>60</ttl>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
