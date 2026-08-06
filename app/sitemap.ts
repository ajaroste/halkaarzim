import type { MetadataRoute } from "next";
import { ipos } from "@/data/ipos";
export default function sitemap(): MetadataRoute.Sitemap { const base=process.env.NEXT_PUBLIC_SITE_URL||"https://halkaarzim.com"; const pages=["","/halka-arzlar","/gundem","/metodoloji","/hakkimizda","/gizlilik","/kullanim-kosullari"].map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:"weekly" as const,priority:path===""?1:.7})); return [...pages,...ipos.map(ipo=>({url:`${base}/arz/${ipo.slug}`,lastModified:new Date(),changeFrequency:"daily" as const,priority:.8}))]; }
