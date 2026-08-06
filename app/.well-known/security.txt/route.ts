export const revalidate = 86400;

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://halkaarzim.vercel.app").replace(/\/+$/, "");
  const contactEmail = process.env.NEXT_PUBLIC_LEGAL_CONTACT_EMAIL?.trim();
  const lines = [
    contactEmail ? `Contact: mailto:${contactEmail}` : "Contact: https://github.com/ajaroste/halkaarzim/security/advisories/new",
    "Preferred-Languages: tr, en",
    `Policy: ${siteUrl}/icerik-kaldirma`,
    "Canonical: " + siteUrl + "/.well-known/security.txt",
    "Expires: 2027-08-06T00:00:00.000Z",
    "Hiring: " + siteUrl
  ];
  return new Response(lines.join("\n") + "\n", {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
