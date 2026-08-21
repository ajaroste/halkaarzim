import { createHash, randomUUID } from "node:crypto";
import { canonicalCompanySlug } from "../company-identity.mjs";
import { extractHalkarzCompanyLinks, parseHalkarzDetailPage } from "../ipo-live-source.mjs";
import type { LiveSourceLink, LiveSourceRecord } from "../ipo-live-source.mjs";

const DEFAULT_SOURCE_URL = "https://halkarz.com/";
const USER_AGENT = "HalkaArzimLiveSync/2.0 (+https://halkaarzim.vercel.app)";

type DbCompany = { id: string; slug: string; legal_name: string; short_name: string | null; ticker: string | null; sector: string | null };
type DbIpo = {
  id: string;
  company_id: string;
  status: string;
  offer_price: number | string | null;
  total_lots: number | string | null;
  distribution_method: string | null;
  collection_start: string | null;
  collection_end: string | null;
  intermediary: string | null;
  live_source_url: string | null;
  live_date_text: string | null;
  source_checked_at: string | null;
};

type SyncResult = {
  ok: boolean;
  dryRun: boolean;
  source: string;
  discovered: number;
  parsed: number;
  added: number;
  updated: number;
  unchanged: number;
  detailErrors: number;
  records?: Array<Pick<LiveSourceRecord, "company" | "slug" | "status" | "collectionStart" | "collectionEnd" | "price" | "totalLots">>;
};

function config() {
  return {
    sourceUrl: process.env.IPO_LIVE_SOURCE_URL || DEFAULT_SOURCE_URL,
    supabaseUrl: (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/+$/, ""),
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  };
}

async function fetchHtml(url: string, timeoutMs = 20_000): Promise<string> {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml", "Accept-Language": "tr-TR,tr;q=0.9" },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs)
  });
  if (!response.ok) throw new Error(`Source HTTP ${response.status}: ${url}`);
  const text = await response.text();
  if (text.length < 1_000) throw new Error(`Source response is unexpectedly short: ${url}`);
  return text;
}

async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(items.length);
  let cursor = 0;
  async function run() {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return output;
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

async function collectRecords(sourceUrl: string): Promise<{ records: LiveSourceRecord[]; discovered: number; detailErrors: number }> {
  const homepage = await fetchHtml(sourceUrl);
  const links = extractHalkarzCompanyLinks(homepage, sourceUrl).slice(0, 40);
  if (links.length < 5) throw new Error(`Live source safety gate failed: only ${links.length} IPO link(s) discovered`);
  let detailErrors = 0;
  const records = await mapLimit(links, 4, async (link) => {
    try {
      return parseHalkarzDetailPage(await fetchHtml(link.url), link, new Date());
    } catch (error) {
      detailErrors += 1;
      console.warn("[ipo-sync] detail source failed", link.slug, error instanceof Error ? error.message : String(error));
      return fallbackRecord(link);
    }
  });
  return { records, discovered: links.length, detailErrors };
}

async function dbRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { supabaseUrl, serviceKey } = config();
  if (!supabaseUrl || !serviceKey) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are required for live sync");
  const headers = new Headers(init.headers);
  headers.set("apikey", serviceKey);
  headers.set("Authorization", `Bearer ${serviceKey}`);
  headers.set("Content-Type", "application/json");
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, { ...init, headers, cache: "no-store" });
  if (!response.ok) throw new Error(`Supabase ${response.status} ${path}: ${(await response.text()).slice(0, 500)}`);
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function insertRow(table: string, row: Record<string, unknown>) {
  await dbRequest(`${table}`, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(row) });
}

async function patchRow(table: string, id: string, patch: Record<string, unknown>) {
  await dbRequest(`${table}?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { Prefer: "return=minimal" }, body: JSON.stringify(patch) });
}

function effectiveStatus(incoming: LiveSourceRecord["status"], existing?: string) {
  if (existing === "listed") return "listed";
  if (existing === "cancelled" && incoming !== "cancelled") return "cancelled";
  return incoming;
}

function buildIpoPatch(record: LiveSourceRecord, existing: DbIpo | undefined, now: string) {
  const patch: Record<string, unknown> = {
    status: effectiveStatus(record.status, existing?.status),
    source_checked_at: now,
    updated_at: now,
    live_source_url: record.url,
    live_date_text: record.dateText
  };
  if (record.price != null && record.price > 0) patch.offer_price = record.price;
  if (record.totalLots != null && record.totalLots > 0) patch.total_lots = Math.round(record.totalLots);
  if (record.distribution) patch.distribution_method = record.distribution;
  if (record.collectionStart) patch.collection_start = record.collectionStart;
  if (record.collectionEnd) patch.collection_end = record.collectionEnd;
  if (record.intermediary) patch.intermediary = record.intermediary;
  return patch;
}

function hasMeaningfulChange(existing: DbIpo, patch: Record<string, unknown>) {
  const keys: Array<keyof DbIpo> = ["status", "offer_price", "total_lots", "distribution_method", "collection_start", "collection_end", "intermediary", "live_source_url", "live_date_text"];
  return keys.some((key) => key in patch && String(existing[key] ?? "") !== String(patch[key] ?? ""));
}

async function enqueueNewIpo(ipoId: string, record: LiveSourceRecord) {
  try {
    await dbRequest("notification_outbox?on_conflict=ipo_id,event_key", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        ipo_id: ipoId,
        event_key: `new_ipo:${ipoId}`,
        title: "Yeni halka arz firması",
        body: `${record.company} halka arz listesine eklendi.`,
        target_url: "/halka-arzlar",
        payload: { company: record.company, slug: record.slug, status: record.status, source: record.url }
      })
    });
  } catch (error) {
    console.warn("[ipo-sync] notification enqueue skipped", error instanceof Error ? error.message : String(error));
  }
}

async function logRun(payload: Record<string, unknown>) {
  try { await insertRow("ipo_sync_runs", payload); }
  catch (error) { console.warn("[ipo-sync] run log skipped", error instanceof Error ? error.message : String(error)); }
}

async function saveSnapshot(runId: string, sourceUrl: string, records: LiveSourceRecord[]) {
  try {
    const compact = records.map(({ company, slug, url, status, collectionStart, collectionEnd, price, totalLots }) => ({ company, slug, url, status, collectionStart, collectionEnd, price, totalLots }));
    const serialized = JSON.stringify(compact);
    await insertRow("ipo_source_snapshots", {
      sync_run_id: runId,
      source: "halkarz",
      source_url: sourceUrl,
      checksum: createHash("sha256").update(serialized).digest("hex"),
      record_count: compact.length,
      payload: compact
    });
  } catch (error) {
    console.warn("[ipo-sync] snapshot skipped", error instanceof Error ? error.message : String(error));
  }
}

export async function runLiveIpoSync(options: { dryRun?: boolean } = {}): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const runId = randomUUID();
  const { sourceUrl, supabaseUrl, serviceKey } = config();
  try {
    const { records, discovered, detailErrors } = await collectRecords(sourceUrl);
    if (options.dryRun) {
      return { ok: true, dryRun: true, source: sourceUrl, discovered, parsed: records.length, added: 0, updated: 0, unchanged: 0, detailErrors, records: records.slice(0, 12).map(({ company, slug, status, collectionStart, collectionEnd, price, totalLots }) => ({ company, slug, status, collectionStart, collectionEnd, price, totalLots })) };
    }
    if (!supabaseUrl || !serviceKey) throw new Error("Supabase server credentials are not configured");

    const [companies, ipos] = await Promise.all([
      dbRequest<DbCompany[]>("companies?select=id,slug,legal_name,short_name,ticker,sector&limit=5000"),
      dbRequest<DbIpo[]>("ipos?select=id,company_id,status,offer_price,total_lots,distribution_method,collection_start,collection_end,intermediary,live_source_url,live_date_text,source_checked_at&limit=5000")
    ]);
    const companyBySlug = new Map(companies.map((company) => [company.slug, company]));
    const companyByIdentity = new Map(
      companies
        .map((company) => [canonicalCompanySlug(company.slug), company] as const)
        .filter(([identity]) => Boolean(identity))
    );
    const ipoByCompany = new Map(ipos.map((ipo) => [ipo.company_id, ipo]));
    const now = new Date().toISOString();
    let added = 0;
    let updated = 0;
    let unchanged = 0;

    for (const record of records) {
      const identity = canonicalCompanySlug(record.slug);
      let company = companyBySlug.get(record.slug) || (identity ? companyByIdentity.get(identity) : undefined);
      if (!company) {
        company = { id: randomUUID(), slug: record.slug, legal_name: record.company, short_name: record.company, ticker: null, sector: null };
        await insertRow("companies", { ...company, created_at: now, updated_at: now });
        companyBySlug.set(record.slug, company);
        if (identity) companyByIdentity.set(identity, company);
      } else {
        // Remember source aliases so an abbreviated live slug resolves to the established issuer.
        companyBySlug.set(record.slug, company);
        if (identity) companyByIdentity.set(identity, company);

        // Do not replace a full legal name with an abbreviated public-source label.
        const incomingIsMoreDescriptive = record.company.length > company.legal_name.length;
        if (incomingIsMoreDescriptive && company.legal_name !== record.company) {
          await patchRow("companies", company.id, { legal_name: record.company, short_name: record.company, updated_at: now });
          company = { ...company, legal_name: record.company, short_name: record.company };
        }
      }

      const existing = ipoByCompany.get(company.id);
      const patch = buildIpoPatch(record, existing, now);
      if (!existing) {
        const ipoId = randomUUID();
        await insertRow("ipos", {
          id: ipoId,
          company_id: company.id,
          ...patch,
          currency: "TRY",
          published_at: now,
          created_at: now
        });
        ipoByCompany.set(company.id, { id: ipoId, company_id: company.id, status: String(patch.status), offer_price: record.price, total_lots: record.totalLots, distribution_method: record.distribution, collection_start: record.collectionStart, collection_end: record.collectionEnd, intermediary: record.intermediary, live_source_url: record.url, live_date_text: record.dateText, source_checked_at: now });
        added += 1;
        await enqueueNewIpo(ipoId, record);
      } else if (hasMeaningfulChange(existing, patch)) {
        await patchRow("ipos", existing.id, patch);
        updated += 1;
      } else {
        await patchRow("ipos", existing.id, { source_checked_at: now });
        unchanged += 1;
      }
    }

    const finishedAt = new Date().toISOString();
    await logRun({ id: runId, source: "halkarz", source_url: sourceUrl, status: "success", started_at: startedAt, finished_at: finishedAt, discovered_count: discovered, parsed_count: records.length, added_count: added, updated_count: updated, detail_error_count: detailErrors });
    await saveSnapshot(runId, sourceUrl, records);
    console.info("[ipo-sync] completed", { discovered, parsed: records.length, added, updated, unchanged, detailErrors });
    return { ok: true, dryRun: false, source: sourceUrl, discovered, parsed: records.length, added, updated, unchanged, detailErrors };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!options.dryRun && config().serviceKey) {
      await logRun({ id: runId, source: "halkarz", source_url: sourceUrl, status: "failed", started_at: startedAt, finished_at: new Date().toISOString(), error_message: message });
    }
    console.error("[ipo-sync] failed", message);
    throw error;
  }
}
