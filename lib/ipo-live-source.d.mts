export type LiveSourceLink = { company: string; slug: string; url: string };
export type LiveSourceRecord = LiveSourceLink & {
  dateText: string;
  collectionStart: string | null;
  collectionEnd: string | null;
  price: number | null;
  totalLots: number | null;
  distribution: string | null;
  intermediary: string | null;
  status: "approved" | "collecting" | "listing_pending" | "cancelled";
};
export function decodeHtml(value: unknown): string;
export function htmlToText(html: unknown): string;
export function slugifyTurkish(value: unknown): string;
export function parseTurkishDateRange(value: unknown): { start: string | null; end: string | null };
export function parseTurkishNumber(value: unknown): number | null;
export function extractHalkarzCompanyLinks(html: string, baseUrl?: string): LiveSourceLink[];
export function dbStatusForRecord(record: { start?: string | null; end?: string | null; dateText?: string | null }, now?: Date): LiveSourceRecord["status"];
export function parseHalkarzDetailPage(html: string, seed: LiveSourceLink, now?: Date): LiveSourceRecord;
