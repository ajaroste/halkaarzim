import type { Ipo, IpoStatus } from "@/data/ipos";
import { extractHalkarzCompanyLinks, parseHalkarzDetailPage } from "../ipo-live-source.mjs";
import type { LiveSourceLink, LiveSourceRecord } from "../ipo-live-source.mjs";

const DEFAULT_SOURCE_URL = "https://halkarz.com/";
const USER_AGENT = "HalkaArzimReadThrough/1.0 (+https://halkaarzim.vercel.app)";

const STATUS_LABELS: Record<IpoStatus, string> = {
  active: "Talep topluyor",
  upcoming: "Yaklaşan",
  approved: "SPK onaylı",
  completed: "Arzı tamamlandı",
  listed: "İşlem görüyor",
  delayed: "Ertelendi",
  draft: "Taslak"
};

async function fetchSource(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml", "Accept-Language": "tr-TR,tr;q=0.9" },
    next: { revalidate: 300 },
    signal: AbortSignal.timeout(10_000)
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  const text = await response.text();
  if (text.length < 1_000) throw new Error(`Unexpectedly short source response: ${url}`);
  return text;
}

function fallbackRecord(link: LiveSourceLink): LiveSourceRecord {
  return {
    ...link,
    dateText: "Hazırlanıyor...",
    collectionStart: null,
    collectionEnd: null,
    price: null,
    totalLots: null,
    distribution: null,
    intermediary: null,
    status: "approved"
  };
}

function uiStatus(record: LiveSourceRecord): IpoStatus {
  if (record.status === "collecting") return "active";
  if (record.status === "listing_pending") return "completed";
  if (record.status === "cancelled") return "delayed";
  if (record.collectionStart && record.collectionStart > new Date().toISOString().slice(0, 10)) return "upcoming";
  return "approved";
}

function toIpo(record: LiveSourceRecord): Ipo {
  const now = new Date().toISOString();
  const status = uiStatus(record);
  const price = record.price && record.price > 0 ? record.price : 0;
  const lots = record.totalLots && record.totalLots > 0 ? Math.round(record.totalLots) : 0;
  return {
    id: `live-${record.slug}`,
    slug: record.slug,
    ticker: null,
    company: record.company,
    sector: "Diğer",
    status,
    statusLabel: STATUS_LABELS[status],
    price,
    dates: record.dateText || "Hazırlanıyor...",
    collectionStart: record.collectionStart,
    collectionEnd: record.collectionEnd,
    firstTradeDate: null,
    participantCount: 0,
    offerSize: price > 0 && lots > 0 ? price * lots : 0,
    intermediary: record.intermediary,
    publicFloat: 0,
    market: undefined,
    priceStability: undefined,
    valuationDiscount: undefined,
    allocationText: "",
    dataCompleteness: [price > 0, lots > 0, Boolean(record.collectionStart), Boolean(record.distribution), Boolean(record.intermediary)].filter(Boolean).length * 20,
    dataNotes: ["Kayıt canlı kaynak keşif katmanından gösteriliyor; kalıcı Supabase senkronizasyonu ayrıca çalışır."],
    lotCount: lots,
    maxLotCount: lots,
    retailLots: 0,
    distribution: record.distribution || "Hazırlanıyor...",
    aiScore: 0,
    risk: "Belirsiz",
    aiSummary: "Yeni halka arz canlı kaynakta tespit edildi. Kaynak bağlı ayrıntılı analiz hazırlanıyor.",
    aiProvider: "live-read-through",
    reportVersion: "canli-1",
    reportDate: now.slice(0, 10),
    humanReviewed: false,
    analysisStatus: "preliminary",
    analysisScope: "Canlı açık kaynak keşif katmanı",
    capitalBefore: 0,
    capitalAfter: 0,
    capitalIncreaseShares: 0,
    shareholderSaleShares: 0,
    extraSaleShares: 0,
    fundUse: [],
    highlights: [],
    risks: ["SPK belgesi ve ayrıntılı veri alanları henüz tam işlenmemiş olabilir."],
    sources: [{ title: "HalkArz.com güncel halka arz takvimi", page: "Halka arz detay sayfası", kind: "İkincil kamuya açık veri", url: record.url }],
    agenda: [],
    promises: [],
    financials: [],
    performance: null,
    bulletinNo: "Canlı kaynak",
    approvalDate: now.slice(0, 10),
    approvalLabel: "Canlı kaynak tarihi",
    sourceUpdatedAt: now
  };
}

export async function discoverLiveOnlyIpos(existingSlugs: Set<string>): Promise<Ipo[]> {
  const sourceUrl = process.env.IPO_LIVE_SOURCE_URL || DEFAULT_SOURCE_URL;
  try {
    const homepage = await fetchSource(sourceUrl);
    const links = extractHalkarzCompanyLinks(homepage, sourceUrl);
    if (links.length < 5) {
      console.warn(`[live-discovery] safety gate: only ${links.length} active links found`);
      return [];
    }
    const missing = links.filter((link) => !existingSlugs.has(link.slug)).slice(0, 8);
    if (!missing.length) return [];

    const records = await Promise.all(missing.map(async (link) => {
      try {
        return parseHalkarzDetailPage(await fetchSource(link.url), link, new Date());
      } catch (error) {
        console.warn("[live-discovery] detail fallback", link.slug, error instanceof Error ? error.message : String(error));
        return fallbackRecord(link);
      }
    }));
    console.info("[live-discovery] found new IPOs", records.map((record) => record.slug));
    return records.map(toIpo);
  } catch (error) {
    console.warn("[live-discovery] source unavailable; DB/snapshot remains authoritative", error instanceof Error ? error.message : String(error));
    return [];
  }
}
