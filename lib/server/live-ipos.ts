import { ipos as staticIpos } from "@/data/ipos";
import type { Ipo, IpoStatus } from "@/data/ipos";
import { canonicalCompanySlug } from "@/lib/company-identity.mjs";
import { discoverLiveOnlyIpos } from "@/lib/server/live-discovery";

type DbCompany = {
  id: string;
  legal_name: string;
  short_name: string | null;
  slug: string;
  ticker: string | null;
  sector: string | null;
};

type DbIpo = {
  id: string;
  company_id: string;
  status: string;
  offer_price: number | string | null;
  total_lots: number | string | null;
  distribution_method: string | null;
  collection_start: string | null;
  collection_end: string | null;
  first_trade_date: string | null;
  market_name: string | null;
  intermediary: string | null;
  capital_increase_lots: number | string | null;
  shareholder_sale_lots: number | string | null;
  source_checked_at: string | null;
  published_at: string | null;
  live_source_url?: string | null;
  live_date_text?: string | null;
};

const STATUS_LABELS: Record<IpoStatus, string> = {
  active: "Talep topluyor",
  upcoming: "Yaklaşan",
  approved: "SPK onaylı",
  completed: "Arzı tamamlandı",
  listed: "İşlem görüyor",
  delayed: "Ertelendi",
  draft: "Taslak"
};

function config() {
  return {
    url: (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, ""),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  };
}

async function rest<T>(path: string): Promise<T> {
  const { url, key } = config();
  if (!url || !key) throw new Error("Supabase read configuration is missing");
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    next: { revalidate: 60 }
  });
  if (!response.ok) throw new Error(`Supabase read ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response.json() as Promise<T>;
}

function numberValue(value: number | string | null | undefined, fallback = 0): number {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function uiStatus(row: DbIpo): IpoStatus {
  if (row.status === "draft") return "draft";
  if (row.status === "cancelled") return "delayed";
  if (row.status === "listed") return "listed";
  if (row.status === "collecting") return "active";
  if (row.status === "listing_pending") return "completed";
  if (row.status === "spk_pending") return "approved";
  if (row.status === "approved" && row.collection_start) {
    const today = new Date().toISOString().slice(0, 10);
    if (row.collection_start > today) return "upcoming";
  }
  return "approved";
}

function dateText(row: DbIpo): string {
  if (row.live_date_text?.trim()) return row.live_date_text.trim();
  if (row.collection_start && row.collection_end) {
    const format = (value: string) => new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }).format(new Date(`${value}T12:00:00+03:00`));
    return row.collection_start === row.collection_end ? format(row.collection_start) : `${format(row.collection_start)} - ${format(row.collection_end)}`;
  }
  return "Hazırlanıyor...";
}

function sourceFor(row: DbIpo) {
  return {
    title: "HalkArz.com güncel halka arz takvimi",
    page: "Halka arz detay sayfası",
    kind: "İkincil kamuya açık veri",
    url: row.live_source_url || "https://halkarz.com/"
  };
}

function baselineFor(company: DbCompany): Ipo | undefined {
  const exact = staticIpos.find((item) => item.slug === company.slug);
  if (exact) return exact;
  const identity = canonicalCompanySlug(company.slug);
  return identity ? staticIpos.find((item) => canonicalCompanySlug(item.slug) === identity) : undefined;
}

function protectedStatus(row: DbIpo, baseline: Ipo | undefined): IpoStatus {
  const incoming = uiStatus(row);
  // A secondary/live calendar must not downgrade terminal states already confirmed by
  // Borsa/KAP or a verified manual override in the last-known-good layer.
  if (baseline?.status === "listed") return "listed";
  if (baseline?.status === "delayed" && incoming !== "delayed") return "delayed";
  return incoming;
}

function mergeRow(row: DbIpo, company: DbCompany): Ipo {
  const baseline = baselineFor(company);
  const status = protectedStatus(row, baseline);
  const checkedAt = row.source_checked_at || row.published_at || new Date().toISOString();
  const liveSource = sourceFor(row);
  const price = numberValue(row.offer_price, baseline?.price || 0);
  const lots = Math.round(numberValue(row.total_lots, baseline?.lotCount || 0));
  const capital = Math.round(numberValue(row.capital_increase_lots, baseline?.capitalIncreaseShares || 0));
  const shareholder = Math.round(numberValue(row.shareholder_sale_lots, baseline?.shareholderSaleShares || 0));

  if (baseline) {
    const sources = row.live_source_url && !baseline.sources.some((source) => source.url === row.live_source_url)
      ? [...baseline.sources, liveSource]
      : baseline.sources;
    return {
      ...baseline,
      id: row.id,
      slug: baseline.slug,
      company: baseline.company || company.legal_name,
      ticker: company.ticker || baseline.ticker,
      sector: company.sector || baseline.sector,
      status,
      statusLabel: STATUS_LABELS[status],
      price,
      dates: dateText(row),
      collectionStart: row.collection_start || baseline.collectionStart,
      collectionEnd: row.collection_end || baseline.collectionEnd,
      firstTradeDate: row.first_trade_date || baseline.firstTradeDate,
      lotCount: lots,
      maxLotCount: Math.max(lots, baseline.maxLotCount || baseline.lotCount),
      distribution: row.distribution_method || baseline.distribution,
      market: row.market_name || baseline.market,
      intermediary: row.intermediary || baseline.intermediary,
      capitalIncreaseShares: capital,
      shareholderSaleShares: shareholder,
      sourceUpdatedAt: checkedAt,
      sources
    };
  }

  return {
    id: row.id,
    slug: company.slug,
    ticker: company.ticker || null,
    company: company.legal_name,
    sector: company.sector || "Diğer",
    status,
    statusLabel: STATUS_LABELS[status],
    price,
    dates: dateText(row),
    collectionStart: row.collection_start,
    collectionEnd: row.collection_end,
    firstTradeDate: row.first_trade_date,
    participantCount: 0,
    offerSize: price > 0 && lots > 0 ? price * lots : 0,
    intermediary: row.intermediary,
    market: row.market_name || undefined,
    publicFloat: 0,
    priceStability: undefined,
    valuationDiscount: undefined,
    allocationText: "",
    dataCompleteness: [price > 0, lots > 0, Boolean(row.collection_start), Boolean(row.distribution_method), Boolean(row.intermediary)].filter(Boolean).length * 20,
    dataNotes: [],
    lotCount: lots,
    maxLotCount: lots,
    retailLots: 0,
    distribution: row.distribution_method || "Hazırlanıyor...",
    aiScore: 0,
    risk: "Belirsiz",
    aiSummary: "Yeni halka arz kaydı canlı veri hattından alındı. Kaynak bağlı ayrıntılı analiz hazırlanıyor.",
    aiProvider: "live-database",
    reportVersion: "canli-1",
    reportDate: checkedAt.slice(0, 10),
    humanReviewed: false,
    analysisStatus: "preliminary",
    analysisScope: "Canlı açık kaynak takvimi ve Supabase temel alanları",
    capitalBefore: 0,
    capitalAfter: 0,
    capitalIncreaseShares: capital,
    shareholderSaleShares: shareholder,
    extraSaleShares: 0,
    fundUse: [],
    highlights: [],
    risks: ["SPK belgesi ve ayrıntılı veri alanları henüz tam işlenmemiş olabilir."],
    sources: [liveSource],
    agenda: [],
    promises: [],
    financials: [],
    performance: null,
    bulletinNo: "Canlı kaynak",
    approvalDate: (row.published_at || checkedAt).slice(0, 10),
    approvalLabel: "Canlı kaynak tarihi",
    sourceUpdatedAt: checkedAt
  };
}

function sortLive(items: Ipo[]) {
  const rank: Record<IpoStatus, number> = { active: 0, upcoming: 1, approved: 2, completed: 3, listed: 4, delayed: 5, draft: 6 };
  return [...items].sort((a, b) => {
    const statusDifference = rank[a.status] - rank[b.status];
    if (statusDifference) return statusDifference;
    const aDate = a.collectionStart || a.approvalDate || "";
    const bDate = b.collectionStart || b.approvalDate || "";
    return bDate.localeCompare(aDate);
  });
}

function qualityScore(item: Ipo): number {
  return (item.ticker ? 4 : 0) + (item.firstTradeDate ? 3 : 0) + Math.min(item.sources.length, 3) + (item.sector !== "Diğer" ? 1 : 0);
}

function dedupeByCompanyIdentity(items: Ipo[]): Ipo[] {
  const chosen = new Map<string, Ipo>();
  for (const item of items) {
    const key = canonicalCompanySlug(item.slug) || item.slug;
    const current = chosen.get(key);
    if (!current || qualityScore(item) > qualityScore(current)) chosen.set(key, item);
  }
  return [...chosen.values()];
}

async function fetchDbIpos(): Promise<DbIpo[]> {
  const common = "id,company_id,status,offer_price,total_lots,distribution_method,collection_start,collection_end,first_trade_date,market_name,intermediary,capital_increase_lots,shareholder_sale_lots,source_checked_at,published_at";
  try {
    return await rest<DbIpo[]>(`ipos?select=${common},live_source_url,live_date_text&published_at=not.is.null&limit=5000`);
  } catch (error) {
    console.warn("[live-ipos] extended columns unavailable, retrying legacy schema", error instanceof Error ? error.message : String(error));
    return rest<DbIpo[]>(`ipos?select=${common}&published_at=not.is.null&limit=5000`);
  }
}

export async function getLiveIpos(): Promise<Ipo[]> {
  let baseItems: Ipo[] = staticIpos;
  try {
    const [companies, rows] = await Promise.all([
      rest<DbCompany[]>("companies?select=id,legal_name,short_name,slug,ticker,sector&limit=5000"),
      fetchDbIpos()
    ]);
    const companyById = new Map(companies.map((company) => [company.id, company]));
    const mapped = dedupeByCompanyIdentity(rows.flatMap((row) => {
      const company = companyById.get(row.company_id);
      return company ? [mergeRow(row, company)] : [];
    }));
    if (mapped.length) {
      const liveIdentities = new Set(mapped.map((item) => canonicalCompanySlug(item.slug) || item.slug));
      const lastKnownGood = staticIpos.filter((item) => !liveIdentities.has(canonicalCompanySlug(item.slug) || item.slug));
      baseItems = [...mapped, ...lastKnownGood];
    } else {
      console.warn("[live-ipos] Supabase returned no published IPO rows; bundled snapshot retained");
    }
  } catch (error) {
    console.warn("[live-ipos] Supabase unavailable; bundled snapshot retained", error instanceof Error ? error.message : String(error));
  }

  const existingSlugs = new Set(baseItems.map((item) => item.slug));
  const newlyDiscovered = await discoverLiveOnlyIpos(existingSlugs);
  return sortLive(dedupeByCompanyIdentity([...baseItems, ...newlyDiscovered]));
}

export async function getLiveIpoBySlug(slug: string): Promise<Ipo | undefined> {
  const identity = canonicalCompanySlug(slug);
  return (await getLiveIpos()).find((ipo) => ipo.slug === slug || (identity && canonicalCompanySlug(ipo.slug) === identity));
}
