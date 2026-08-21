const MONTHS = new Map([
  ["ocak", 1], ["subat", 2], ["şubat", 2], ["mart", 3], ["nisan", 4], ["mayis", 5], ["mayıs", 5],
  ["haziran", 6], ["temmuz", 7], ["agustos", 8], ["ağustos", 8], ["eylul", 9], ["eylül", 9], ["ekim", 10],
  ["kasim", 11], ["kasım", 11], ["aralik", 12], ["aralık", 12]
]);

function normalizeSpace(value) {
  return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}

export function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function htmlToText(html) {
  return normalizeSpace(decodeHtml(String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")));
}

export function slugifyTurkish(value) {
  return String(value || "")
    .replace(/\s+(?:A\.?\s*Ş\.?|Anonim Şirketi)$/i, "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(a\.?\s*ş\.?|anonim şirketi)\b/gi, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function dateIso(year, month, day) {
  const value = new Date(Date.UTC(year, month - 1, day));
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) return null;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function monthNumber(value) {
  return MONTHS.get(String(value || "").toLocaleLowerCase("tr-TR")) || null;
}

export function parseTurkishDateRange(value) {
  const text = normalizeSpace(value);
  if (!text || /hazırlanıyor|aciklanmadi|açıklanmadı|bekleniyor/i.test(text)) return { start: null, end: null };
  const yearMatch = text.match(/\b(20\d{2})\b/);
  if (!yearMatch) return { start: null, end: null };
  const year = Number(yearMatch[1]);
  const monthRe = /(Ocak|Şubat|Subat|Mart|Nisan|Mayıs|Mayis|Haziran|Temmuz|Ağustos|Agustos|Eylül|Eylul|Ekim|Kasım|Kasim|Aralık|Aralik)/gi;
  const matches = [...text.matchAll(monthRe)];
  if (!matches.length) return { start: null, end: null };

  const dates = [];
  let segmentStart = 0;
  for (const match of matches) {
    const month = monthNumber(match[0]);
    if (!month) continue;
    const segment = text.slice(segmentStart, match.index).replace(/20\d{2}/g, " ");
    for (const token of segment.matchAll(/(?<!\d)(\d{1,2})(?!\d)/g)) {
      const day = Number(token[1]);
      if (day < 1 || day > 31) continue;
      const iso = dateIso(year, month, day);
      if (iso) dates.push(iso);
    }
    segmentStart = Number(match.index) + match[0].length;
  }
  if (!dates.length) return { start: null, end: null };
  dates.sort();
  return { start: dates[0], end: dates[dates.length - 1] };
}

export function parseTurkishNumber(value) {
  const text = normalizeSpace(value).toLocaleLowerCase("tr-TR");
  if (!text || /hazırlanıyor|aciklanmadi|açıklanmadı|^-$/i.test(text)) return null;
  let multiplier = 1;
  if (text.includes("milyar")) multiplier = 1_000_000_000;
  else if (text.includes("milyon")) multiplier = 1_000_000;
  else if (text.includes("bin")) multiplier = 1_000;
  let cleaned = text.replace(/[^0-9,.-]/g, "");
  if (!cleaned) return null;
  if (cleaned.includes(",")) cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  else if ((cleaned.match(/\./g) || []).length > 1 || (/\.\d{3}$/.test(cleaned))) cleaned = cleaned.replace(/\./g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed * multiplier : null;
}

function companyLike(text) {
  const normalized = normalizeSpace(text);
  return /(?:A\.?\s*Ş\.?|Anonim Şirketi)$/i.test(normalized) && normalized.length >= 8 && normalized.length <= 180;
}

function absoluteUrl(href, baseUrl) {
  try { return new URL(decodeHtml(href), baseUrl).toString(); } catch { return null; }
}

export function extractHalkarzCompanyLinks(html, baseUrl = "https://halkarz.com/") {
  const source = String(html || "");
  const markerIndex = source.toLocaleLowerCase("tr-TR").indexOf("daha fazla göster");
  const working = markerIndex > 0 ? source.slice(0, markerIndex) : source;
  const anchorRe = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set();
  const records = [];
  for (const match of working.matchAll(anchorRe)) {
    const company = htmlToText(match[2]);
    if (!companyLike(company)) continue;
    const url = absoluteUrl(match[1], baseUrl);
    if (!url || !url.startsWith("https://halkarz.com/")) continue;
    const slug = slugifyTurkish(company.replace(/^\([^)]*\)\s*/, ""));
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    records.push({ company: company.replace(/^\([^)]*\)\s*/, "").trim(), slug, url });
  }
  return records;
}

const DETAIL_LABELS = ["Halka Arz Tarihi", "Halka Arz Fiyatı/Aralığı", "Dağıtım Yöntemi", "Pay", "Aracı Kurum", "Son Güncelleme"];
function extractField(text, label) {
  const start = text.indexOf(label);
  if (start < 0) return null;
  const after = text.slice(start + label.length, start + label.length + 500);
  let end = after.length;
  for (const other of DETAIL_LABELS) {
    if (other === label) continue;
    const idx = after.indexOf(other);
    if (idx >= 0 && idx < end) end = idx;
  }
  return normalizeSpace(after.slice(0, end).replace(/^\s*[:|•-]+\s*/, "")) || null;
}

export function dbStatusForRecord(record, now = new Date()) {
  const raw = normalizeSpace(record?.dateText || "");
  if (/ertel|iptal/i.test(raw)) return "cancelled";
  const { start, end } = record || {};
  if (!start || !end) return "approved";
  const current = now.toISOString().slice(0, 10);
  if (current < start) return "approved";
  if (current <= end) return "collecting";
  return "listing_pending";
}

export function parseHalkarzDetailPage(html, seed, now = new Date()) {
  const text = htmlToText(html);
  const dateText = extractField(text, "Halka Arz Tarihi") || "Hazırlanıyor...";
  const priceText = extractField(text, "Halka Arz Fiyatı/Aralığı");
  const distribution = extractField(text, "Dağıtım Yöntemi");
  const lotText = extractField(text, "Pay");
  const intermediary = extractField(text, "Aracı Kurum");
  const { start, end } = parseTurkishDateRange(dateText);
  const record = {
    ...seed,
    dateText,
    collectionStart: start,
    collectionEnd: end,
    price: parseTurkishNumber(priceText),
    totalLots: parseTurkishNumber(lotText),
    distribution: distribution && !/hazırlanıyor/i.test(distribution) ? distribution.replace(/\*+/g, "").trim() : null,
    intermediary: intermediary && !/hazırlanıyor/i.test(intermediary) ? intermediary : null
  };
  return { ...record, status: dbStatusForRecord({ start, end, dateText }, now) };
}
