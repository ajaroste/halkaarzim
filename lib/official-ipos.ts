import type { Ipo } from "@/data/ipos";
import { ipos as staticIpos } from "@/data/ipos";

type OfficialRow = {
  id: string;
  status: string;
  offer_price: number | string | null;
  total_lots: number | string | null;
  capital_increase_lots: number | string | null;
  shareholder_sale_lots: number | string | null;
  source_checked_at: string | null;
  published_at: string | null;
  spk_bulletin_no: string | null;
  spk_source_url: string | null;
  source_payload: Record<string, unknown> | null;
  companies: {
    legal_name: string;
    slug: string;
    ticker: string | null;
    sector: string | null;
  } | Array<{
    legal_name: string;
    slug: string;
    ticker: string | null;
    sector: string | null;
  }>;
};

function numberValue(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function companyFrom(row: OfficialRow) {
  return Array.isArray(row.companies) ? row.companies[0] : row.companies;
}

function officialRowToIpo(row: OfficialRow): Ipo | null {
  const company = companyFrom(row);
  if (!company?.legal_name || !company.slug) return null;
  const payload = row.source_payload || {};
  const approvalDate = String(payload.approvalDate || row.published_at || "").slice(0, 10);
  const bulletinNo = String(payload.bulletinNo || row.spk_bulletin_no || "SPK");
  const sourceUrl = String(payload.sourceUrl || row.spk_source_url || "");
  const capitalIncrease = numberValue(payload.capitalIncreaseShares ?? row.capital_increase_lots);
  const shareholderSale = numberValue(payload.shareholderSaleShares ?? row.shareholder_sale_lots);
  const lotCount = numberValue(payload.lotCount ?? row.total_lots);
  const maxLotCount = numberValue(payload.maxLotCount) || lotCount;
  const price = numberValue(payload.price ?? row.offer_price);
  if (!approvalDate || !lotCount || !price) return null;

  return {
    id: row.id,
    slug: company.slug,
    ticker: company.ticker,
    company: company.legal_name,
    sector: company.sector || "Henüz açıklanmadı",
    status: "approved",
    statusLabel: "SPK onaylı",
    price,
    dates: "Talep toplama tarihi bekleniyor",
    collectionStart: null,
    collectionEnd: null,
    firstTradeDate: null,
    lotCount,
    maxLotCount,
    retailLots: 0,
    distribution: "Henüz açıklanmadı",
    aiScore: 0,
    risk: "Belirsiz",
    aiSummary: `${company.legal_name}, ${bulletinNo} numaralı SPK bülteninde ilk halka arz olarak yayımlandı. Talep toplama ve dağıtım bilgileri resmî olarak açıklandıkça güncellenecektir.`,
    aiProvider: "rules-v1",
    reportVersion: "spk-resmi-1",
    reportDate: approvalDate,
    humanReviewed: false,
    analysisStatus: "preliminary",
    analysisScope: "SPK İlk Halka Arzlar tablosundaki doğrulanmış temel alanlar",
    capitalBefore: numberValue(payload.currentCapital),
    capitalAfter: numberValue(payload.newCapital),
    capitalIncreaseShares: capitalIncrease,
    shareholderSaleShares: shareholderSale,
    extraSaleShares: numberValue(payload.extraSaleShares),
    fundUse: [],
    highlights: capitalIncrease > shareholderSale ? ["Temel arzın büyük bölümü sermaye artırımı kaynaklıdır."] : [],
    risks: shareholderSale > capitalIncrease ? ["Temel arzda mevcut ortak satışı payı yüksektir."] : [],
    sources: [{
      title: `SPK Bülteni ${bulletinNo}`,
      page: "İlk Halka Arzlar tablosu",
      kind: "Resmî belge",
      url: sourceUrl || undefined,
    }],
    agenda: [{
      date: approvalDate,
      category: "Resmî",
      title: "Halka arz SPK bülteninde yayımlandı",
      summary: `${company.legal_name} ilk halka arz bilgileri ${bulletinNo} numaralı SPK bülteninde yer aldı.`,
      source: "SPK",
      sourceUrl: sourceUrl || undefined,
      impact: "neutral",
    }],
    promises: [],
    financials: [],
    performance: null,
    bulletinNo,
    approvalDate,
    sourceUpdatedAt: row.source_checked_at || row.published_at || new Date(approvalDate).toISOString(),
    dataCompleteness: 45,
    dataNotes: ["Kayıt doğrudan SPK bültenindeki İlk Halka Arzlar tablosundan oluşturulmuştur."],
  };
}

async function fetchOfficialIpos(): Promise<Ipo[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || process.env.NEXT_PUBLIC_DEMO_MODE === "true") return [];

  const query = new URLSearchParams({
    select: "id,status,offer_price,total_lots,capital_increase_lots,shareholder_sale_lots,source_checked_at,published_at,spk_bulletin_no,spk_source_url,source_payload,companies!inner(legal_name,slug,ticker,sector)",
    published_at: "not.is.null",
    order: "published_at.desc",
    limit: "200",
  });

  try {
    const response = await fetch(`${url}/rest/v1/ipos?${query}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      next: { revalidate: 300 },
    });
    if (!response.ok) return [];
    const rows = await response.json() as OfficialRow[];
    return rows.map(officialRowToIpo).filter((item): item is Ipo => Boolean(item));
  } catch {
    return [];
  }
}

export async function getMergedIpos(): Promise<Ipo[]> {
  const official = await fetchOfficialIpos();
  if (!official.length) return staticIpos;

  const merged = new Map<string, Ipo>();
  for (const item of staticIpos) merged.set(item.slug, item);
  for (const item of official) {
    if (!merged.has(item.slug)) merged.set(item.slug, item);
  }
  return [...merged.values()].sort((a, b) => b.approvalDate.localeCompare(a.approvalDate));
}

export async function getMergedIpoBySlug(slug: string): Promise<Ipo | undefined> {
  return (await getMergedIpos()).find((ipo) => ipo.slug === slug);
}
