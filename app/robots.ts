import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://halkaarzim.vercel.app").replace(/\/+$/, "");
  return {
    rules: [{
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/profil", "/auth", "/api", "/notifications"]
    }],
    sitemap: `${base}/sitemap.xml`,
    host: base
  };
}
