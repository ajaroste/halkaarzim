import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { extractText, getDocumentProxy } from "npm:unpdf@1.8.1";
import { parseInitialPublicOfferings } from "./parser.mjs";

const SPK_LIST_URL = "https://spk.gov.tr/spk-bultenleri/2026-yili-spk-bultenleri";
const MAX_PDF_BYTES = 12 * 1024 * 1024;
const DEFAULT_MAX_BULLETINS = 8;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function discoverPdfUrls(html: string) {
  const urls = new Set<string>();
  const hrefPattern = /href=["']([^"']+\.pdf(?:\?[^"']*)?)["']/gi;
  for (const match of html.matchAll(hrefPattern)) {
    try {
      const url = new URL(match[1], SPK_LIST_URL);
      if (url.hostname.endsWith("spk.gov.tr") && /\/data\//.test(url.pathname) && /2026[-_/]\d+/i.test(url.pathname)) urls.add(url.toString());
    } catch { /* ignore malformed href */ }
  }
  return [...urls].sort((a, b) => {
    const na = Number(a.match(/2026[-_/](\d+)/)?.[1] || 0);
    const nb = Number(b.match(/2026[-_/](\d+)/)?.[1] || 0);
    return nb - na;
  });
}

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, { headers: { "user-agent": "HalkaArzim-SPK-Sync/1.0" }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}

async function fetchPdfText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch(url, { headers: { "user-agent": "HalkaArzim-SPK-Sync/1.0" }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    const length = Number(response.headers.get("content-length") || 0);
    if (length > MAX_PDF_BYTES) throw new Error(`PDF too large: ${length}`);
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_PDF_BYTES) throw new Error(`PDF too large: ${buffer.byteLength}`);
    const pdf = await getDocumentProxy(new Uint8Array(buffer), { maxImageSize: 16_777_216 });
    if (pdf.numPages > 80) throw new Error(`Unexpected page count: ${pdf.numPages}`);
    const extracted = await extractText(pdf, { mergePages: true });
    return extracted.text;
  } finally { clearTimeout(timeout); }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) return json({ ok: false, error: "supabase_env_missing" }, 500);
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: control, error: controlError } = await admin.from("ipo_sync_control").select("enabled,secret_hash,last_success_at").eq("id", true).single();
  if (controlError || !control) return json({ ok: false, error: "sync_control_unavailable" }, 503);
  const suppliedSecret = req.headers.get("x-sync-secret") || "";
  if (!suppliedSecret || (await sha256(suppliedSecret)) !== control.secret_hash) return json({ ok: false, error: "unauthorized" }, 401);

  let body: { dryRun?: boolean; maxBulletins?: number } = {};
  try { body = await req.json(); } catch { /* empty body */ }
  const dryRun = body.dryRun === true;
  if (!dryRun && !control.enabled) return json({ ok: false, error: "sync_disabled" }, 423);
  const maxBulletins = Math.max(1, Math.min(16, Number(body.maxBulletins || DEFAULT_MAX_BULLETINS)));

  let runId: number | null = null;
  if (!dryRun) {
    const { data: run } = await admin.from("ipo_sync_runs").insert({ source: "spk_official", status: "running" }).select("id").single();
    runId = run?.id || null;
  }

  try {
    const html = await fetchText(SPK_LIST_URL);
    const pdfUrls = discoverPdfUrls(html).slice(0, maxBulletins);
    if (!pdfUrls.length) throw new Error("SPK bulletin PDF links could not be discovered");

    const parsed: Array<Record<string, unknown>> = [];
    const bulletinErrors: Array<{ url: string; error: string }> = [];
    for (const pdfUrl of pdfUrls) {
      try {
        const text = await fetchPdfText(pdfUrl);
        parsed.push(...await parseInitialPublicOfferings(text, pdfUrl));
      } catch (error) {
        bulletinErrors.push({ url: pdfUrl, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const unique = [...new Map(parsed.map((item) => [String(item.sourceKey), item])).values()];
    if (!unique.length && bulletinErrors.length === pdfUrls.length) throw new Error("All SPK bulletin parses failed");
    if (unique.length > 40) throw new Error(`Sanity check failed: ${unique.length} IPO rows from ${pdfUrls.length} bulletins`);

    if (dryRun) return json({ ok: true, dryRun: true, bulletinsChecked: pdfUrls.length, recordsFound: unique.length, bulletinErrors, records: unique });

    let added = 0;
    let updated = 0;
    for (const item of unique) {
      const slug = String(item.slug);
      const company = String(item.company);
      const { data: existingCompany } = await admin.from("companies").select("id").eq("slug", slug).maybeSingle();
      let companyId = existingCompany?.id as string | undefined;
      if (!companyId) {
        const { data: createdCompany, error } = await admin.from("companies").insert({ legal_name: company, short_name: company, slug, updated_at: new Date().toISOString() }).select("id").single();
        if (error) throw error;
        companyId = createdCompany.id;
      }

      const sourceKey = String(item.sourceKey);
      const { data: existing } = await admin.from("ipos").select("id,source_hash").eq("source_key", sourceKey).maybeSingle();
      const now = new Date().toISOString();
      const row = {
        company_id: companyId,
        status: "approved",
        offer_price: Number(item.price),
        total_lots: Number(item.lotCount),
        capital_increase_lots: Number(item.capitalIncreaseShares),
        shareholder_sale_lots: Number(item.shareholderSaleShares),
        currency: "TRY",
        source_checked_at: now,
        updated_at: now,
        source_key: sourceKey,
        spk_bulletin_no: String(item.bulletinNo),
        spk_source_url: String(item.sourceUrl),
        source_hash: String(item.sourceHash),
        source_payload: item,
      };

      if (!existing?.id) {
        const { data: createdIpo, error } = await admin.from("ipos").insert({ ...row, published_at: now }).select("id").single();
        if (error) throw error;
        added += 1;
        if (control.last_success_at) {
          await admin.from("notification_outbox").upsert({
            ipo_id: createdIpo.id,
            event_key: `new_spk_ipo:${sourceKey}`,
            title: "Yeni SPK onaylı halka arz",
            body: `${company} SPK bülteninde ilk halka arz olarak yayımlandı.`,
            target_url: `/arz/${slug}`,
            payload: { company, slug, bulletinNo: item.bulletinNo, source: "spk" },
          }, { onConflict: "ipo_id,event_key" });
        }
      } else if (existing.source_hash !== item.sourceHash) {
        const { error } = await admin.from("ipos").update(row).eq("id", existing.id);
        if (error) throw error;
        updated += 1;
      } else {
        await admin.from("ipos").update({ source_checked_at: now, updated_at: now }).eq("id", existing.id);
      }
    }

    const status = bulletinErrors.length ? "partial" : "success";
    if (runId) await admin.from("ipo_sync_runs").update({ finished_at: new Date().toISOString(), status, bulletins_checked: pdfUrls.length, records_found: unique.length, records_added: added, records_updated: updated, details: { bulletinErrors } }).eq("id", runId);
    await admin.from("ipo_sync_control").update({ last_success_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", true);
    return json({ ok: true, status, bulletinsChecked: pdfUrls.length, recordsFound: unique.length, added, updated, bulletinErrors });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (runId) await admin.from("ipo_sync_runs").update({ finished_at: new Date().toISOString(), status: "failed", error: message }).eq("id", runId);
    return json({ ok: false, error: message }, 503);
  }
});
