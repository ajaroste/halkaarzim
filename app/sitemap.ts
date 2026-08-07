import type { MetadataRoute } from "next";
import { ipos } from "@/data/ipos";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://halkaarzim.vercel.app").replace(/\/+$/, "");
  const lastModified = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: base, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${base}/halka-arzlar`, lastModified, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/gundem`, lastModified, changeFrequency: "daily", priority: 0.75 },
    { url: `${base}/metodoloji`, lastModified, changeFrequency: "monthly", priority: 0.65 },
    { url: `${base}/hakkimizda`, lastModified, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/gizlilik`, lastModified, changeFrequency: "monthly", priority: 0.35 },
    { url: `${base}/cerez-politikasi`, lastModified, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/kullanim-kosullari`, lastModified, changeFrequency: "monthly", priority: 0.35 },
    { url: `${base}/ai-politikasi`, lastModified, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/yatirim-tavsiyesi-degildir`, lastModified, changeFrequency: "monthly", priority: 0.55 },
    { url: `${base}/icerik-kaldirma`, lastModified, changeFrequency: "monthly", priority: 0.3 }
  ];

  return [
    ...pages,
    ...ipos.map((ipo) => ({
      url: `${base}/arz/${ipo.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.85
    }))
  ];
}
