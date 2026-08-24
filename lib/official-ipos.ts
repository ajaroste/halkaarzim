import type { Ipo, IpoSource, IpoStatus } from "@/data/ipos";
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

const STATUS_LABELS: Record<IpoStatus, string> = {
  active: "Talep topluyor",
  upcoming: "Yaklaşan",
  approved: "SPK onaylı",
  completed: "Arzı tamamlandı",
  listed: "İşlem görüyor",
  delayed: "Ertelendi",
  draft: "Taslak",
};

function numberValue(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: unknown): string | null {
  const result = stringValue(value);
  return result || null;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).map((item) => item.trim());
}

function companyFrom(row: OfficialRow) {
  return Array.isArray(row.companies) ? row.companies[0] : row.companies;
}

function istanbulBoundary(value: unknown, endOfDay = false): number {
  const date = stringValue(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return Number.NaN;
  return new Date(`${date}${endOfDay ? "T23:59:59+03:00" : "T00:00:00+03:00"}`).getTime();
}

function deriveStatus(payload: Record<string, unknown>, rowStatus: string): IpoStatus {
  const raw = stringValue(payload.status || rowStatus || "approved").toLocaleLowerCase("tr-TR");
  if (["draft", "taslak"].some((value) => raw.includes(value))) return "draft";
  if (["delayed", "postponed", "ertelen"].some((value) => raw.includes(value))) return "delayed";

  const firstTrade = istanbulBoundary(payload.firstTradeDate);
  if (Number.isFinite(firstTrade) && firstTrade <= Date.now()) return "listed";
  if (["listed", "trading", "işlem gör"].some((value) => raw.includes(value))) return "listed";

  const start = istanbulBoundary(payload.collectionStart);
  const end = istanbulBoundary(payload.collectionEnd, true);
  if (Number.isFinite(start) && Number.isFinite(end)) {
    const now = Date.now();
    if (now < start) return "upcoming";
    if (now <= end) return "active";
    return "completed";
  }

  if (["active", "collecting", "talep topluyor"].some((value) => raw.includes(value))) return "active";
  if (["upcoming", "yaklaş"].some((value) => raw.includes(value))) return "upcoming";
  if (["completed", "tamamlan"].some((value) => raw.includes(value))) return "completed";
  return "approved";
}

function sourceArray(payload: Record<string, unknown>, bulletinNo: string, sourceUrl: string): IpoSource[] {
  const sources: IpoSource[] = [{
    title: `SPK Bülteni ${bulletinNo}`,
    page: "İlk Halka Arzlar tablosu",
    kind: "Resmî belge",
    url: sourceUrl || undefined,
  }];

  const additional = payload.additionalSources;
  if (Array.isArray(additional)) {
    for (const item of additional) {
      if (!item || typeof item !== "object") continue;
      const record = item as Record<string, unknown>;
      const title = stringValue(record.title);
      const url = stringValue(record.url);
      if (!title || !url || sources.some((source) => source.url === url)) continue;
      sources.push({
        title,
        page: stringValue(record.page) || "Halka arz duyurusu",
        kind: stringValue(record.kind) || "Resmî / birincil kaynak",
        url,
      });
    }
  }

  return sources;
}

function officialRowToIpo(row: OfficialRow): Ipo | null {
  const company = companyFrom(row);
  if (!company?.legal_name || !company.slug) return null;
  const payload = row.source_payload || {};
  const approvalDate = stringValue(payload.approvalDate || row.published_at).slice(0, 10);
  const bulletinNo = stringValue(payload.bulletinNo || row.spk_bulletin_no) || "SPK";
  const sourceUrl = stringValue(payload.sourceUrl || row.spk_source_url);
  const capitalIncrease = numberValue(payload.capitalIncreaseShares ?? row.capital_increase_lots);
  const shareholderSale = numberValue(payload.shareholderSaleShares ?? row.shareholder_sale_lots);
  const lotCount = numberValue(payload.lotCount ?? row.total_lots);
  const maxLotCount = numberValue(payload.maxLotCount) || lotCount;
  const price = numberValue(payload.price ?? row.offer_price);
  if (!approvalDate || !lotCount || !price) return null;

  const status = deriveStatus(payload, row.status);
  const collectionStart = nullableString(payload.collectionStart);
  const collectionEnd = nullableString(payload.collectionEnd);
  const firstTradeDate = nullableString(payload.firstTradeDate);
  const ticker = nullableString(payload.ticker) || company.ticker;
  const sector = nullableString(payload.sector) || company.sector || "Henüz açıklanmadı";
  const intermediary = nullableString(payload.intermediary);
  const market = nullableString(payload.market) || undefined;
  const distribution = stringValue(payload.distribution) || "Henüz açıklanmadı";
  const dates = stringValue(payload.dates) || (collectionStart && collectionEnd ? `${collectionStart} - ${collectionEnd}` : "Talep toplama tarihi bekleniyor");
  const sources = sourceArray(payload, bulletinNo, sourceUrl);
  const dataNotes = stringArray(payload.dataNotes);
  const completeness = numberValue(payload.dataCompleteness) || (sources.length > 1 || ticker || collectionStart ? 67 : 45);

  return {
    id: row.id,
    slug: company.slug,
    ticker,
    company: company.legal_name,
    sector,
    status,
    statusLabel: STATUS_LABELS[status],
    price,
    dates,
    collectionStart,
    collectionEnd,
    firstTradeDate,
    participantCount: numberValue(payload.participantCount) || undefined,
    offerSize: numberValue(payload.offerSize) || undefined,
    intermediary,
    publicFloat: numberValue(payload.publicFloat) || undefined,
    market,
    priceStability: nullableString(payload.priceStability) || undefined,
    allocationText: nullableString(payload.allocationText) || undefined,
    lotCount,
    maxLotCount,
    retailLots: numberValue(payload.retailLots),
    distribution,
    aiScore: 0,
    risk: "Belirsiz",
    aiSummary: `${company.legal_name}, ${bulletinNo} numaralı SPK bülteninde ilk halka arz olarak yayımlandı.${collectionStart ? ` Talep toplama takvimi ${dates} olarak birincil kaynaklardan doğrulandı.` : " Talep toplama ve dağıtım bilgileri resmî olarak açıklandıkça güncellenecektir."}`,
    aiProvider: "rules-v1",
    reportVersion: sources.length > 1 ? "spk-kap-resmi-1" : "spk-resmi-1",
    reportDate: approvalDate,
    humanReviewed: false,
    analysisStatus: "preliminary",
    analysisScope: sources.length > 1 ? "SPK onayı ile KAP/aracı kurum halka arz duyurularındaki doğrulanmış alanlar" : "SPK İlk Halka Arzlar tablosundaki doğrulanmış temel alanlar",
    capitalBefore: numberValue(payload.currentCapital),
    capitalAfter: numberValue(payload.newCapital),
    capitalIncreaseShares: capitalIncrease,
    shareholderSaleShares: shareholderSale,
    extraSaleShares: numberValue(payload.extraSaleShares),
    fundUse: Array.isArray(payload.fundUse) ? payload.fundUse as Ipo["fundUse"] : [],
    highlights: capitalIncrease > shareholderSale ? ["Temel arzın büyük bölümü sermaye artırımı kaynaklıdır."] : [],
    risks: shareholderSale > capitalIncrease ? ["Temel arzda mevcut ortak satışı payı yüksektir."] : [],
    sources,
    agenda: [
      {
        date: approvalDate,
        category: "Resmî",
        title: "Halka arz SPK bülteninde yayımlandı",
        summary: `${company.legal_name} ilk halka arz bilgileri ${bulletinNo} numaralı SPK bülteninde yer aldı.`,
        source: "SPK",
        sourceUrl: sourceUrl || undefined,
        impact: "neutral",
      },
      ...(collectionStart && sources[1] ? [{
        date: stringValue(payload.schedulePublishedAt).slice(0, 10) || collectionStart,
        category: "Resmî",
        title: "Talep toplama takvimi yayımlandı",
        summary: `${company.legal_name} için talep toplama tarihleri ${dates} olarak açıklandı${ticker ? `; işlem kodu ${ticker}.` : "."}`,
        source: stringValue(payload.scheduleSourceName) || "KAP / aracı kurum",
        sourceUrl: sources[1].url,
        impact: "neutral" as const,
      }] : []),
    ],
    promises: [],
    financials: [],
    performance: null,
    bulletinNo,
    approvalDate,
    sourceUpdatedAt: row.source_checked_at || row.published_at || new Date(approvalDate).toISOString(),
    dataCompleteness: completeness,
    dataNotes: dataNotes.length ? dataNotes : [sources.length > 1 ? "SPK onayı sonrası yayımlanan halka arz takvimi birincil kaynakla zenginleştirilmiştir." : "Kayıt doğrudan SPK bültenindeki İlk Halka Arzlar tablosundan oluşturulmuştur."],
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
