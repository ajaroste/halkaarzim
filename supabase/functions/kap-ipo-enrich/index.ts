import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { extractKapEnrichment, extractNotificationCandidates } from "./parser.mjs";

const KAP_QUERY_URL = "https://www.kap.org.tr/tr/bildirim-sorgu-sonuc?cat=6&cmp=Y&slf=ALL&srcbar=Y";
const MAX_INDEX_BYTES = 7 * 1024 * 1024;
const MAX_DETAIL_BYTES = 2 * 1024 * 1024;
const DEFAULT_MAX_IPOS = 12;
const MAX_NOTIFICATION_DETAILS_PER_IPO = 5;
const LOOKBACK_DAYS = 75;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function fetchKap(url: string, maxBytes: number, timeoutMs = 20_000) {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || !["kap.org.tr", "www.kap.org.tr"].includes(parsed.hostname)) throw new Error("KAP host validation failed");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      redirect: "error",
      headers: {
        "user-agent": "HalkaArzim-KAP-Enrichment/1.1 (+https://halkaarzim.vercel.app)",
        "accept-language": "tr-TR,tr;q=0.9,en;q=0.5",
        accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`KAP HTTP ${response.status}`);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > maxBytes) throw new Error(`KAP response too large: ${length}`);
    const text = await response.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("KAP response exceeded size limit");
    return text;
  } finally { clearTimeout(timeout); }
}

function stringValue(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function asObject(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function asArray(value: unknown): Array<Record<string, unknown>> { return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") as Array<Record<string, unknown>> : []; }
function pickCompany(value: unknown) { return Array.isArray(value) ? value[0] as Record<string, unknown> | undefined : value && typeof value === "object" ? value as Record<string, unknown> : undefined; }

function isRecentEnough(payload: Record<string, unknown>, publishedAt: string | null) {
  const date = stringValue(payload.approvalDate || publishedAt).slice(0, 10);
  const ts = Date.parse(`${date}T00:00:00Z`);
  return !Number.isFinite(ts) || Date.now() - ts <= LOOKBACK_DAYS * 86_400_000;
}

function needsEnrichment(payload: Record<string, unknown>, ticker: string | null, publishedAt: string | null) {
  if (!isRecentEnough(payload, publishedAt)) return false;
  return !(stringValue(payload.ticker) || ticker)
    || !(stringValue(payload.collectionStart) && stringValue(payload.collectionEnd))
    || !stringValue(payload.firstTradeDate)
    || Number(payload.participantCount || 0) <= 0;
}

function mergeSources(payload: Record<string, unknown>, additions: Array<Record<string, unknown>>) {
  const existing = asArray(payload.additionalSources);
  const result = [...existing];
  const urls = new Set(existing.map((item) => stringValue(item.url)).filter(Boolean));
  for (const source of additions) {
    const url = stringValue(source.url);
    if (!url || urls.has(url)) continue;
    result.push(source); urls.add(url);
  }
  return result;
}

function mergeNotes(payload: Record<string, unknown>, note: string) {
  const existing = Array.isArray(payload.dataNotes) ? payload.dataNotes.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
  return existing.includes(note) ? existing : [...existing, note];
}

function completeness(payload: Record<string, unknown>, companyTicker: string | null) {
  let score = Math.max(45, Number(payload.dataCompleteness || 0));
  if (stringValue(payload.ticker) || companyTicker) score = Math.max(score, 55);
  if (stringValue(payload.collectionStart) && stringValue(payload.collectionEnd)) score = Math.max(score, 67);
  if (stringValue(payload.market)) score = Math.max(score, 72);
  if (stringValue(payload.firstTradeDate)) score = Math.max(score, 82);
  if (Number(payload.participantCount || 0) > 0) score = Math.max(score, 89);
  return Math.min(100, score);
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "supabase_env_missing" }, 500);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: control, error: controlError } = await admin.from("ipo_sync_control").select("enabled,secret_hash").eq("id", true).single();
  if (controlError || !control) return json({ ok: false, error: "sync_control_unavailable" }, 503);
  const suppliedSecret = req.headers.get("x-sync-secret") || "";
  if (!suppliedSecret || (await sha256(suppliedSecret)) !== control.secret_hash) return json({ ok: false, error: "unauthorized" }, 401);

  let body: { dryRun?: boolean; maxIpos?: number } = {};
  try { body = await req.json(); } catch { /* empty */ }
  const dryRun = body.dryRun === true;
  if (!dryRun && !control.enabled) return json({ ok: false, error: "sync_disabled" }, 423);
  const maxIpos = Math.max(1, Math.min(25, Number(body.maxIpos || DEFAULT_MAX_IPOS)));

  let runId: number | null = null;
  if (!dryRun) {
    const { data: run } = await admin.from("ipo_sync_runs").insert({ source: "kap_public", status: "running" }).select("id").single();
    runId = run?.id || null;
  }

  try {
    const { data: rows, error: rowsError } = await admin
      .from("ipos")
      .select("id,status,published_at,source_payload,companies!inner(id,legal_name,slug,ticker)")
      .not("source_key", "is", null).not("published_at", "is", null)
      .order("published_at", { ascending: false }).limit(50);
    if (rowsError) throw rowsError;

    const targets = (rows || []).filter((row) => {
      const company = pickCompany(row.companies);
      return company && needsEnrichment(asObject(row.source_payload), stringValue(company.ticker) || null, row.published_at);
    }).slice(0, maxIpos);

    if (!targets.length) {
      if (runId) await admin.from("ipo_sync_runs").update({ finished_at: new Date().toISOString(), status: "success", records_found: 0, records_updated: 0, details: { message: "no_enrichment_targets" } }).eq("id", runId);
      return json({ ok: true, dryRun, targets: 0, matched: 0, updated: 0 });
    }

    const indexHtml = await fetchKap(KAP_QUERY_URL, MAX_INDEX_BYTES, 25_000);
    let matched = 0, updated = 0;
    const results: Array<Record<string, unknown>> = [];
    const errors: Array<{ slug: string; error: string }> = [];

    for (const row of targets) {
      const company = pickCompany(row.companies);
      if (!company) continue;
      const companyName = stringValue(company.legal_name), slug = stringValue(company.slug);
      const payload = asObject(row.source_payload);
      const approvalDate = stringValue(payload.approvalDate || row.published_at).slice(0, 10);
      const existingTicker = stringValue(payload.ticker) || stringValue(company.ticker);
      try {
        const candidates = extractNotificationCandidates(indexHtml, companyName, MAX_NOTIFICATION_DETAILS_PER_IPO, existingTicker);
        if (!candidates.length) { results.push({ slug, company: companyName, candidates: 0, changed: false }); continue; }
        matched += 1;

        let newestScheduleDate = stringValue(payload.schedulePublishedAt).slice(0, 10);
        const enrichment: Record<string, unknown> = {};
        const kapSources: Array<Record<string, unknown>> = [];

        for (const candidate of candidates) {
          if (candidate.ticker && !stringValue(enrichment.ticker)) enrichment.ticker = candidate.ticker;
          const candidatePublished = stringValue(candidate.publishDate).match(/^(\d{1,2})\.(\d{1,2})\.(20\d{2})/)?.slice(1);
          if (candidatePublished && candidatePublished.length === 3 && !stringValue(enrichment.schedulePublishedAt)) {
            enrichment.schedulePublishedAt = `${candidatePublished[2]}-${candidatePublished[1].padStart(2, "0")}-${candidatePublished[0].padStart(2, "0")}`;
          }

          const detailHtml = await fetchKap(candidate.url, MAX_DETAIL_BYTES, 15_000);
          const parsed = extractKapEnrichment(detailHtml, companyName, approvalDate, candidate.context) as Record<string, unknown> | null;
          if (parsed) {
            const parsedPublished = stringValue(parsed.schedulePublishedAt).slice(0, 10);
            const canReplaceSchedule = !newestScheduleDate || !parsedPublished || parsedPublished >= newestScheduleDate;
            if (parsed.ticker && !stringValue(enrichment.ticker)) enrichment.ticker = parsed.ticker;
            if (parsed.market && !stringValue(enrichment.market)) enrichment.market = parsed.market;
            if (parsed.firstTradeDate && !stringValue(enrichment.firstTradeDate)) enrichment.firstTradeDate = parsed.firstTradeDate;
            if (parsed.participantCount && !Number(enrichment.participantCount || 0)) enrichment.participantCount = parsed.participantCount;
            if (parsed.collectionStart && parsed.collectionEnd && canReplaceSchedule) {
              enrichment.collectionStart = parsed.collectionStart; enrichment.collectionEnd = parsed.collectionEnd; enrichment.dates = parsed.dates;
              if (parsedPublished) { enrichment.schedulePublishedAt = parsedPublished; newestScheduleDate = parsedPublished; }
            }
          }
          kapSources.push({ title: `KAP — ${companyName}: ${candidate.title || "halka arz bildirimi"}`, page: candidate.title || "Halka arz bildirimi", kind: "KAP / resmî kayıt", url: candidate.url });
        }

        const hadSchedule = Boolean(stringValue(payload.collectionStart) && stringValue(payload.collectionEnd));
        const nextPayload: Record<string, unknown> = { ...payload };
        let changed = false;
        const candidateTicker = stringValue(enrichment.ticker);
        if (!existingTicker && candidateTicker) { nextPayload.ticker = candidateTicker; changed = true; }

        if (enrichment.collectionStart && enrichment.collectionEnd) {
          const incomingPublished = stringValue(enrichment.schedulePublishedAt), existingPublished = stringValue(payload.schedulePublishedAt);
          if (!hadSchedule || !existingPublished || !incomingPublished || incomingPublished >= existingPublished) {
            if (payload.collectionStart !== enrichment.collectionStart || payload.collectionEnd !== enrichment.collectionEnd) changed = true;
            nextPayload.collectionStart = enrichment.collectionStart; nextPayload.collectionEnd = enrichment.collectionEnd; nextPayload.dates = enrichment.dates;
            if (incomingPublished) nextPayload.schedulePublishedAt = incomingPublished;
          }
        }
        for (const key of ["market", "firstTradeDate", "participantCount"] as const) {
          if (!nextPayload[key] && enrichment[key]) { nextPayload[key] = enrichment[key]; changed = true; }
        }

        if (kapSources.length) {
          const mergedSources = mergeSources(nextPayload, kapSources);
          if (mergedSources.length !== asArray(payload.additionalSources).length) changed = true;
          nextPayload.additionalSources = mergedSources; nextPayload.scheduleSourceName = "KAP";
        }
        if (changed) {
          nextPayload.dataNotes = mergeNotes(nextPayload, "KAP halka arz bildirimleri düşük frekanslı otomatik kontrol ile eşleştirildi.");
          nextPayload.dataCompleteness = completeness(nextPayload, candidateTicker || existingTicker || null);
          nextPayload.kapCheckedAt = new Date().toISOString();
        }

        if (!dryRun && changed) {
          if (!existingTicker && candidateTicker) {
            const { error: companyError } = await admin.from("companies").update({ ticker: candidateTicker, updated_at: new Date().toISOString() }).eq("id", company.id);
            if (companyError) throw companyError;
          }
          const { error: updateError } = await admin.from("ipos").update({ source_payload: nextPayload, source_checked_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", row.id);
          if (updateError) throw updateError;
          updated += 1;
          if (!hadSchedule && nextPayload.collectionStart && nextPayload.collectionEnd) {
            await admin.from("notification_outbox").upsert({
              ipo_id: row.id,
              event_key: `ipo_schedule:${nextPayload.collectionStart}:${nextPayload.collectionEnd}`,
              title: "Halka arz takvimi açıklandı",
              body: `${companyName} için talep toplama takvimi ${stringValue(nextPayload.dates)} olarak açıklandı.`,
              target_url: `/arz/${slug}`,
              payload: { company: companyName, slug, source: "kap", collectionStart: nextPayload.collectionStart, collectionEnd: nextPayload.collectionEnd },
            }, { onConflict: "ipo_id,event_key" });
          }
        }
        results.push({ slug, company: companyName, candidates: candidates.length, candidateIds: candidates.map((c) => c.id), enrichment, changed, sources: kapSources.map((source) => source.url) });
      } catch (error) { errors.push({ slug, error: error instanceof Error ? error.message : String(error) }); }
    }

    const status = errors.length ? (updated || matched ? "partial" : "failed") : "success";
    if (runId) await admin.from("ipo_sync_runs").update({
      finished_at: new Date().toISOString(), status, records_found: matched, records_updated: updated,
      details: { targets: targets.length, errors },
      error: status === "failed" ? errors.map((item) => `${item.slug}: ${item.error}`).join("; ").slice(0, 2000) : null,
    }).eq("id", runId);
    return json({ ok: status !== "failed", dryRun, status, targets: targets.length, matched, updated, errors, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (runId) await admin.from("ipo_sync_runs").update({ finished_at: new Date().toISOString(), status: "failed", error: message }).eq("id", runId);
    return json({ ok: false, error: message }, 503);
  }
});
