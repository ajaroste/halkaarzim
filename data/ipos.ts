import generated from "./generated/ipos.json";

export type IpoStatus = "active" | "upcoming" | "approved" | "completed" | "listed" | "delayed" | "draft";
export type EventImpact = "potential-positive" | "neutral" | "risk";

export type IpoSource = { title: string; page: string; kind: string; url?: string };
export type IpoEvent = {
  date: string;
  category: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl?: string;
  impact: EventImpact;
};

export type Ipo = {
  id: string;
  slug: string;
  ticker: string | null;
  company: string;
  sector: string;
  status: IpoStatus;
  statusLabel: string;
  price: number;
  dates: string;
  collectionStart?: string | null;
  collectionEnd?: string | null;
  firstTradeDate?: string | null;
  participantCount?: number;
  offerSize?: number;
  intermediary?: string | null;
  publicFloat?: number;
  market?: string;
  priceStability?: string;
  valuationDiscount?: number;
  allocationText?: string;
  dataCompleteness?: number;
  dataNotes?: string[];
  lotCount: number;
  maxLotCount?: number;
  retailLots: number;
  distribution: string;
  aiScore: number;
  risk: "Düşük" | "Orta" | "Yüksek" | "Belirsiz";
  aiSummary: string;
  aiProvider: string;
  reportVersion: string;
  reportDate: string;
  humanReviewed: boolean;
  analysisStatus: "preliminary" | "full";
  analysisScope: string;
  capitalBefore: number;
  capitalAfter: number;
  capitalIncreaseShares: number;
  shareholderSaleShares: number;
  extraSaleShares: number;
  fundUse: Array<{ label: string; value: number; min?: number; max?: number }>;
  highlights: string[];
  risks: string[];
  sources: IpoSource[];
  agenda: IpoEvent[];
  promises: Array<{ title: string; status: "completed" | "in-progress" | "not-started"; note: string }>;
  financials: Array<{ period: string; revenue: number; netProfit: number; debt: number | null }>;
  performance?: Array<{ date: string; close: number }> | null;
  bulletinNo: string;
  approvalDate: string;
  approvalLabel?: string;
  sourceUpdatedAt: string;
};

function normalizeStatus(item: Ipo): Ipo {
  const label = (item.statusLabel || "").toLocaleLowerCase("tr-TR");
  let status = item.status;

  if (item.firstTradeDate || label.includes("işlem görüyor") || label.includes("işlem gören")) status = "listed";
  else if (label.includes("talep topluyor")) status = "active";
  else if (label.includes("yaklaş")) status = "upcoming";
  else if (label.includes("tamamlan")) status = "completed";
  else if (label.includes("ertelen")) status = "delayed";
  else if (label.includes("spk") || label.includes("onay")) status = "approved";

  const statusLabels: Record<IpoStatus, string> = {
    active: "Talep topluyor",
    upcoming: "Yaklaşan",
    approved: "SPK onaylı",
    completed: "Arzı tamamlandı",
    listed: "İşlem görüyor",
    delayed: "Ertelendi",
    draft: "Taslak"
  };

  return { ...item, status, statusLabel: statusLabels[status] };
}

export const dataGeneratedAt = generated.generatedAt;
export const dataSource = generated.source;
export const ipos = (generated.items as Ipo[]).map(normalizeStatus);

export function getIpoBySlug(slug: string): Ipo | undefined {
  return ipos.find((ipo) => ipo.slug === slug);
}

export function getAllEvents() {
  return ipos
    .flatMap((ipo) => ipo.agenda.map((event) => ({ ...event, ticker: ipo.ticker || "—", company: ipo.company, slug: ipo.slug })))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function formatSourceUpdate(): string {
  const date = new Date(dataGeneratedAt);
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(date);
}
