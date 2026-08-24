const MONTHS = {
  ocak: 1,
  subat: 2,
  şubat: 2,
  mart: 3,
  nisan: 4,
  mayis: 5,
  mayıs: 5,
  haziran: 6,
  temmuz: 7,
  agustos: 8,
  ağustos: 8,
  eylul: 9,
  eylül: 9,
  ekim: 10,
  kasim: 11,
  kasım: 11,
  aralik: 12,
  aralık: 12,
};

const MONTH_NAMES = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const LEGAL_STOP = new Set(["anonim", "sirketi", "sirket", "as", "a", "sanayi", "ticaret", "ve", "yatirim", "yatirimlari", "ortakligi"]);
const TICKER_STOP = new Set([
  "HALKA", "SATIS", "SATIŞ", "DUYURU", "BILDIRIM", "BİLDİRİM", "SIRKET", "ŞİRKET", "YATIRIM", "MENKUL", "DEGERLER", "DEĞERLER",
  "BORSA", "ISTANBUL", "İSTANBUL", "YILDIZ", "PAZAR", "TASARRUF", "SAHIPLERINE", "SAHİPLERİNE", "PAYLAR", "PAYLARI", "KAMUYU",
]);

function decodeHtml(value) {
  return String(value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function stripHtml(html) {
  return decodeHtml(String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/tr>|<\/li>|<\/td>/gi, "\n")
    .replace(/<[^>]+>/g, " "))
    .replace(/\r/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

export function normalizeText(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function companyTokens(name) {
  return normalizeText(name)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !LEGAL_STOP.has(token));
}

function companyMatchScore(text, companyName) {
  const normalized = normalizeText(text);
  const tokens = companyTokens(companyName);
  if (!tokens.length) return 0;
  let matched = 0;
  for (const token of tokens) if (normalized.includes(token)) matched += 1;
  const required = tokens.length <= 2 ? 1 : Math.min(2, tokens.length);
  if (matched < required) return 0;
  return matched / tokens.length;
}

export function extractNotificationCandidates(indexHtml, companyName, maxCandidates = 8) {
  const html = String(indexHtml || "");
  const candidates = [];
  const seen = new Set();
  const linkRegex = /href=["'](?:https?:\/\/www\.kap\.org\.tr)?\/tr\/(?:Bildirim|bildirim)\/(\d+)["']/gi;
  for (const match of html.matchAll(linkRegex)) {
    const id = match[1];
    if (seen.has(id)) continue;
    const start = Math.max(0, (match.index || 0) - 2600);
    const end = Math.min(html.length, (match.index || 0) + 2600);
    const contextHtml = html.slice(start, end);
    const context = stripHtml(contextHtml);
    const score = companyMatchScore(context, companyName);
    if (!score) continue;
    const keywordBoost = /halka arz|tasarruf sahiplerine satış|tasarruf sahiplerine satis|borsa.?da satış|borsa.?da satis|işlem gör|islem gor/i.test(context) ? 1 : 0;
    candidates.push({ id, url: `https://www.kap.org.tr/tr/Bildirim/${id}`, context, score: score + keywordBoost });
    seen.add(id);
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxCandidates));
}

function isoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (y < 2020 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function dateDistanceDays(a, b) {
  const aa = Date.parse(`${a}T00:00:00Z`);
  const bb = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(aa) || !Number.isFinite(bb)) return Number.POSITIVE_INFINITY;
  return Math.abs(aa - bb) / 86400000;
}

function parseNumericRange(text) {
  const matches = [];
  const pattern = /\b(\d{1,2})[.\/]([01]?\d)[.\/](20\d{2})\s*(?:-|–|—|ile|ve)\s*(\d{1,2})[.\/]([01]?\d)[.\/](20\d{2})\b/g;
  for (const m of text.matchAll(pattern)) {
    const start = isoDate(m[3], m[2], m[1]);
    const end = isoDate(m[6], m[5], m[4]);
    if (start && end) matches.push({ start, end, raw: m[0], index: m.index || 0 });
  }
  return matches;
}

function parseTurkishRanges(text) {
  const matches = [];
  const monthPattern = "Ocak|Şubat|Subat|Mart|Nisan|Mayıs|Mayis|Haziran|Temmuz|Ağustos|Agustos|Eylül|Eylul|Ekim|Kasım|Kasim|Aralık|Aralik";
  const threeDays = new RegExp(`\\b(\\d{1,2})\\s*(?:-|–|,|\\s)\\s*(\\d{1,2})\\s*(?:-|–|ve|,)\\s*(\\d{1,2})\\s+(${monthPattern})\\s+(20\\d{2})\\b`, "gi");
  const twoDays = new RegExp(`\\b(\\d{1,2})\\s*(?:-|–|ve|,)\\s*(\\d{1,2})\\s+(${monthPattern})\\s+(20\\d{2})\\b`, "gi");
  for (const m of text.matchAll(threeDays)) {
    const month = MONTHS[normalizeText(m[4])];
    const start = isoDate(m[5], month, m[1]);
    const end = isoDate(m[5], month, m[3]);
    if (start && end) matches.push({ start, end, raw: m[0], index: m.index || 0 });
  }
  for (const m of text.matchAll(twoDays)) {
    const month = MONTHS[normalizeText(m[3])];
    const start = isoDate(m[4], month, m[1]);
    const end = isoDate(m[4], month, m[2]);
    if (start && end) matches.push({ start, end, raw: m[0], index: m.index || 0 });
  }
  return matches;
}

function nearbyKeywordScore(text, index) {
  const window = normalizeText(text.slice(Math.max(0, index - 240), index + 260));
  let score = 0;
  if (window.includes("talep toplama")) score += 6;
  if (window.includes("halka arz")) score += 4;
  if (window.includes("borsada satis") || window.includes("borsa da satis")) score += 3;
  if (window.includes("satis")) score += 1;
  if (window.includes("ruçhan") || window.includes("ruchan")) score -= 5;
  return score;
}

export function extractCollectionRange(text, approvalDate = "") {
  const source = stripHtml(text);
  const candidates = [...parseNumericRange(source), ...parseTurkishRanges(source)];
  const valid = candidates.filter((item) => {
    const startMs = Date.parse(`${item.start}T00:00:00Z`);
    const endMs = Date.parse(`${item.end}T23:59:59Z`);
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) return false;
    const span = (endMs - startMs) / 86400000;
    if (span > 10) return false;
    if (approvalDate && Number.isFinite(Date.parse(`${approvalDate}T00:00:00Z`))) {
      const delta = (startMs - Date.parse(`${approvalDate}T00:00:00Z`)) / 86400000;
      if (delta < -7 || delta > 75) return false;
    }
    return true;
  });
  if (!valid.length) return null;
  valid.sort((a, b) => {
    const scoreA = nearbyKeywordScore(source, a.index) - (approvalDate ? Math.min(3, dateDistanceDays(a.start, approvalDate) / 20) : 0);
    const scoreB = nearbyKeywordScore(source, b.index) - (approvalDate ? Math.min(3, dateDistanceDays(b.start, approvalDate) / 20) : 0);
    return scoreB - scoreA;
  });
  return valid[0];
}

function extractSingleDateNearPhrase(text, phraseRegex) {
  const source = stripHtml(text);
  const phrase = phraseRegex.exec(source);
  if (!phrase || phrase.index == null) return null;
  const window = source.slice(Math.max(0, phrase.index - 180), phrase.index + 280);
  const numeric = /\b(\d{1,2})[.\/]([01]?\d)[.\/](20\d{2})\b/.exec(window);
  if (numeric) return isoDate(numeric[3], numeric[2], numeric[1]);
  const monthPattern = "Ocak|Şubat|Subat|Mart|Nisan|Mayıs|Mayis|Haziran|Temmuz|Ağustos|Agustos|Eylül|Eylul|Ekim|Kasım|Kasim|Aralık|Aralik";
  const tr = new RegExp(`\\b(\\d{1,2})\\s+(${monthPattern})\\s+(20\\d{2})\\b`, "i").exec(window);
  if (!tr) return null;
  return isoDate(tr[3], MONTHS[normalizeText(tr[2])], tr[1]);
}

function extractTicker(text, companyName) {
  const source = stripHtml(text);
  const phrasePatterns = [
    /["“']?([A-ZÇĞİÖŞÜ0-9]{4,6})["”']?\s+(?:işlem|islem)\s+kod(?:u|uyla|uyla)/i,
    /(?:işlem|islem)\s+kod(?:u|u olarak|uyla)?\s*[:\-]?\s*["“']?([A-ZÇĞİÖŞÜ0-9]{4,6})/i,
    /["“']?([A-ZÇĞİÖŞÜ0-9]{4,6})["”']?\s+koduyla\s+Borsa/i,
  ];
  for (const pattern of phrasePatterns) {
    const m = pattern.exec(source);
    if (m && !TICKER_STOP.has(m[1].toUpperCase())) return m[1].toUpperCase();
  }

  if (!companyMatchScore(source, companyName)) return null;
  const tokens = source.match(/\b[A-ZÇĞİÖŞÜ0-9]{4,6}\b/g) || [];
  for (const token of tokens) {
    const value = token.toUpperCase();
    if (!TICKER_STOP.has(value) && /[A-ZÇĞİÖŞÜ]/.test(value) && !/^20\d\d$/.test(value)) return value;
  }
  return null;
}

function extractMarket(text) {
  const source = stripHtml(text);
  const m = /\b(Yıldız|YILDIZ|Ana|ANA|Alt|ALT)\s+Pazar(?:ı|ında|da)?\b/i.exec(source);
  if (!m) return null;
  const normalized = normalizeText(m[1]);
  if (normalized === "yildiz") return "Yıldız Pazar";
  if (normalized === "ana") return "Ana Pazar";
  if (normalized === "alt") return "Alt Pazar";
  return null;
}

function extractParticipantCount(text) {
  const source = stripHtml(text);
  const m = /(?:toplam\s+)?([0-9][0-9.\s]{2,})\s+(?:yatırımcıya|yatirimciya|yatırımcıya pay|yatırımcıya dağıtım|yatırımcıya dagitim)/i.exec(source);
  if (!m) return null;
  const value = Number(m[1].replace(/[^0-9]/g, ""));
  return Number.isFinite(value) && value >= 100 ? value : null;
}

function extractPublishedDate(text) {
  const source = stripHtml(text);
  const m = /Gönderim Tarihi\s*(\d{1,2})[.\/]([01]?\d)[.\/](20\d{2})/i.exec(source);
  return m ? isoDate(m[3], m[2], m[1]) : null;
}

function formatDates(start, end) {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime())) return `${start} - ${end}`;
  if (startDate.getUTCFullYear() === endDate.getUTCFullYear() && startDate.getUTCMonth() === endDate.getUTCMonth()) {
    const days = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate && days.length < 7) {
      days.push(cursor.getUTCDate());
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return `${days.join("-")} ${MONTH_NAMES[startDate.getUTCMonth() + 1]} ${startDate.getUTCFullYear()}`;
  }
  return `${startDate.getUTCDate()} ${MONTH_NAMES[startDate.getUTCMonth() + 1]} ${startDate.getUTCFullYear()} - ${endDate.getUTCDate()} ${MONTH_NAMES[endDate.getUTCMonth() + 1]} ${endDate.getUTCFullYear()}`;
}

export function extractKapEnrichment(detailHtml, companyName, approvalDate = "", indexContext = "") {
  const detailText = stripHtml(detailHtml);
  const combined = `${indexContext}\n${detailText}`;
  if (!companyMatchScore(combined, companyName)) return null;
  if (!/halka arz|tasarruf sahiplerine satış|tasarruf sahiplerine satis|borsa.?da satış|borsa.?da satis|işlem gör|islem gor/i.test(combined)) return null;

  const range = extractCollectionRange(combined, approvalDate);
  const ticker = extractTicker(combined, companyName);
  const market = extractMarket(combined);
  const participantCount = extractParticipantCount(combined);
  const firstTradeDate = extractSingleDateNearPhrase(combined, /(?:işlem|islem)\s+görmeye\s+(?:başlayacak|baslayacak|başladı|basladi|başlamıştır|baslamistir)/i);
  const publishedAt = extractPublishedDate(detailText);

  const result = {};
  if (ticker) result.ticker = ticker;
  if (range) {
    result.collectionStart = range.start;
    result.collectionEnd = range.end;
    result.dates = formatDates(range.start, range.end);
  }
  if (market) result.market = market;
  if (participantCount) result.participantCount = participantCount;
  if (firstTradeDate) result.firstTradeDate = firstTradeDate;
  if (publishedAt) result.schedulePublishedAt = publishedAt;
  return Object.keys(result).length ? result : null;
}
