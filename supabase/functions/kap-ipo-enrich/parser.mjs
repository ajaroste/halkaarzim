const MONTHS = {
  ocak: 1, subat: 2, şubat: 2, mart: 3, nisan: 4, mayis: 5, mayıs: 5,
  haziran: 6, temmuz: 7, agustos: 8, ağustos: 8, eylul: 9, eylül: 9,
  ekim: 10, kasim: 11, kasım: 11, aralik: 12, aralık: 12,
};
const MONTH_NAMES = ["", "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const LEGAL_STOP = new Set(["anonim", "sirketi", "sirket", "as", "sanayi", "ticaret", "ve", "yatirim", "yatirimlari", "ortakligi"]);
const RELEVANT_TITLES = /tasarruf sahiplerine satış|tasarruf sahiplerine satis|payların borsa birincil piyasada halka arzı|paylarin borsa birincil piyasada halka arzi|halka arz|izahname|fiyat tespit raporu|satış sonuç|satis sonuc|işlem gör|islem gor/i;

function decodeFlight(value) {
  let text = String(value || "");
  for (let i = 0; i < 3; i += 1) text = text.replace(/\\+"/g, '"').replace(/\\+'/g, "'");
  return text.replace(/\\u0026/gi, "&").replace(/\\u003c/gi, "<").replace(/\\u003e/gi, ">");
}
function decodeHtml(value) { return decodeFlight(value).replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">"); }
export function stripHtml(html) { return decodeHtml(String(html || "")).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (script) => script.includes("disclosureBasic") ? script : " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<br\s*\/?\s*>/gi, "\n").replace(/<\/p>|<\/div>|<\/tr>|<\/li>|<\/td>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/\r/g, "").replace(/[\t ]+/g, " ").replace(/\n\s*\n+/g, "\n").trim(); }
export function normalizeText(value) { return String(value || "").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9]+/g, " ").trim(); }
export function companyTokens(name) { return normalizeText(name).split(/\s+/).filter((token) => token.length >= 3 && !LEGAL_STOP.has(token)); }
function companyMatchScore(text, companyName) { const normalized = normalizeText(text), tokens = companyTokens(companyName); if (!tokens.length) return 0; let matched = 0; for (const token of tokens) if (normalized.includes(token)) matched += 1; const required = tokens.length <= 2 ? tokens.length : Math.max(2, Math.ceil(tokens.length * 0.6)); return matched >= required ? matched / tokens.length : 0; }
function field(block, name) { const match = new RegExp(`"${name}"\\s*:\\s*(?:"([\\s\\S]*?)"|null)`, "i").exec(block); return match?.[1] ? decodeHtml(match[1]).replace(/\\n/g, " ").trim() : ""; }
function disclosureBlocks(indexHtml) { const normalized = decodeFlight(indexHtml), blocks = [], re = /"disclosureBasic"\s*:\s*\{([\s\S]{0,5000}?)\}\s*\}/gi; for (const match of normalized.matchAll(re)) blocks.push(match[1]); return blocks; }

export function extractNotificationCandidates(indexHtml, companyName, maxCandidates = 8, knownTicker = "") {
  const candidates = [], seen = new Set(), tickerNeedle = String(knownTicker || "").trim().toUpperCase();
  for (const block of disclosureBlocks(indexHtml)) {
    const idMatch = /"disclosureIndex"\s*:\s*(\d+)/i.exec(block); if (!idMatch) continue;
    const id = idMatch[1]; if (seen.has(id)) continue;
    const publishDate = field(block, "publishDate"), companyTitle = field(block, "companyTitle"), title = field(block, "title"), relatedStocks = field(block, "relatedStocks"), summary = field(block, "summary");
    const context = [companyTitle, title, relatedStocks, summary, publishDate].filter(Boolean).join(" | ");
    const companyScore = companyMatchScore(`${summary} ${companyTitle}`, companyName);
    const related = relatedStocks.toUpperCase().split(/[,;\s]+/).filter(Boolean);
    const tickerMatch = Boolean(tickerNeedle && related.includes(tickerNeedle));
    // If we already know the BIST code, KAP's relatedStocks is the strongest identity key.
    if (tickerNeedle ? !tickerMatch : companyScore < 0.6) continue;
    if (!RELEVANT_TITLES.test(`${title} ${summary}`)) continue;
    const candidateTicker = tickerMatch ? tickerNeedle : (related.find((value) => /^[A-ZÇĞİÖŞÜ0-9]{4,6}$/.test(value)) || "");
    const relevance = /tasarruf sahiplerine satış|tasarruf sahiplerine satis|borsa birincil piyasada halka arz/i.test(title) ? 3 : /halka arz/i.test(`${title} ${summary}`) ? 2 : 1;
    candidates.push({ id, url: `https://www.kap.org.tr/tr/Bildirim/${id}`, context, ticker: candidateTicker, publishDate, title, score: companyScore + (tickerMatch ? 2 : 0) + relevance });
    seen.add(id);
  }
  if (!candidates.length && !tickerNeedle) {
    const html = String(indexHtml || ""), linkRegex = /href=["'](?:https?:\/\/www\.kap\.org\.tr)?\/tr\/(?:Bildirim|bildirim)\/(\d+)["']/gi;
    for (const match of html.matchAll(linkRegex)) { const id = match[1], start = Math.max(0, (match.index || 0) - 2600), end = Math.min(html.length, (match.index || 0) + 2600), context = stripHtml(html.slice(start, end)), score = companyMatchScore(context, companyName); if (score < 0.6 || !RELEVANT_TITLES.test(context)) continue; candidates.push({ id, url: `https://www.kap.org.tr/tr/Bildirim/${id}`, context, ticker: "", publishDate: "", title: "", score }); }
  }
  return candidates.sort((a, b) => b.score - a.score).slice(0, Math.max(1, maxCandidates));
}

function isoDate(year, month, day) { const y = Number(year), m = Number(month), d = Number(day); if (y < 2020 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null; return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`; }
function dateDistanceDays(a, b) { const aa = Date.parse(`${a}T00:00:00Z`), bb = Date.parse(`${b}T00:00:00Z`); return Number.isFinite(aa) && Number.isFinite(bb) ? Math.abs(aa - bb) / 86400000 : Number.POSITIVE_INFINITY; }
function parseNumericRange(text) { const matches = [], pattern = /\b(\d{1,2})[.\/]([01]?\d)[.\/](20\d{2})\s*(?:-|–|—|ile|ve)\s*(\d{1,2})[.\/]([01]?\d)[.\/](20\d{2})\b/g; for (const m of text.matchAll(pattern)) { const start = isoDate(m[3], m[2], m[1]), end = isoDate(m[6], m[5], m[4]); if (start && end) matches.push({ start, end, index: m.index || 0 }); } return matches; }
function parseTurkishRanges(text) { const matches = [], monthPattern = "Ocak|Şubat|Subat|Mart|Nisan|Mayıs|Mayis|Haziran|Temmuz|Ağustos|Agustos|Eylül|Eylul|Ekim|Kasım|Kasim|Aralık|Aralik", p3 = new RegExp(`\\b(\\d{1,2})\\s*(?:-|–|,|\\s)\\s*(\\d{1,2})\\s*(?:-|–|ve|,)\\s*(\\d{1,2})\\s+(${monthPattern})\\s+(20\\d{2})\\b`, "gi"), p2 = new RegExp(`\\b(\\d{1,2})\\s*(?:-|–|ve|,)\\s*(\\d{1,2})\\s+(${monthPattern})\\s+(20\\d{2})\\b`, "gi"); for (const m of text.matchAll(p3)) { const month = MONTHS[normalizeText(m[4])], start = isoDate(m[5], month, m[1]), end = isoDate(m[5], month, m[3]); if (start && end) matches.push({ start, end, index: m.index || 0 }); } for (const m of text.matchAll(p2)) { const month = MONTHS[normalizeText(m[3])], start = isoDate(m[4], month, m[1]), end = isoDate(m[4], month, m[2]); if (start && end) matches.push({ start, end, index: m.index || 0 }); } return matches; }
function nearbyKeywordScore(text, index) { const window = normalizeText(text.slice(Math.max(0, index - 300), index + 320)); let score = 0; if (window.includes("talep toplama")) score += 8; if (window.includes("halka arz")) score += 5; if (window.includes("borsa birincil")) score += 3; if (window.includes("ruchan")) score -= 8; return score; }
export function extractCollectionRange(text, approvalDate = "") { const source = stripHtml(text), candidates = [...parseNumericRange(source), ...parseTurkishRanges(source)].filter((item) => { const start = Date.parse(`${item.start}T00:00:00Z`), end = Date.parse(`${item.end}T23:59:59Z`); if (!Number.isFinite(start) || !Number.isFinite(end) || end < start || (end - start) / 86400000 > 10) return false; if (approvalDate) { const approval = Date.parse(`${approvalDate}T00:00:00Z`), delta = (start - approval) / 86400000; if (Number.isFinite(approval) && (delta < -7 || delta > 75)) return false; } return true; }); candidates.sort((a, b) => nearbyKeywordScore(source, b.index) - nearbyKeywordScore(source, a.index) - (approvalDate ? (dateDistanceDays(b.start, approvalDate) - dateDistanceDays(a.start, approvalDate)) / 20 : 0)); return candidates[0] || null; }
function extractSingleDateNearPhrase(text, phraseRegex) { const source = stripHtml(text), phrase = phraseRegex.exec(source); if (!phrase || phrase.index == null) return null; const window = source.slice(Math.max(0, phrase.index - 220), phrase.index + 320), numeric = /\b(\d{1,2})[.\/]([01]?\d)[.\/](20\d{2})\b/.exec(window); if (numeric) return isoDate(numeric[3], numeric[2], numeric[1]); const tr = /\b(\d{1,2})\s+(Ocak|Şubat|Subat|Mart|Nisan|Mayıs|Mayis|Haziran|Temmuz|Ağustos|Agustos|Eylül|Eylul|Ekim|Kasım|Kasim|Aralık|Aralik)\s+(20\d{2})\b/i.exec(window); return tr ? isoDate(tr[3], MONTHS[normalizeText(tr[2])], tr[1]) : null; }
function extractTicker(text) { const source = stripHtml(text), patterns = [/["“']?([A-ZÇĞİÖŞÜ0-9]{4,6})["”']?\s+(?:işlem|islem)\s+kod(?:u|uyla)/i, /(?:işlem|islem)\s+kod(?:u|u olarak|uyla)?\s*[:\-]?\s*["“']?([A-ZÇĞİÖŞÜ0-9]{4,6})/i, /["“']?([A-ZÇĞİÖŞÜ0-9]{4,6})["”']?\s+koduyla\s+Borsa/i]; for (const pattern of patterns) { const m = pattern.exec(source); if (m) return m[1].toUpperCase(); } return null; }
function extractMarket(text) { const m = /\b(Yıldız|YILDIZ|Ana|ANA|Alt|ALT)\s+Pazar(?:ı|ında|da)?\b/i.exec(stripHtml(text)); if (!m) return null; const v = normalizeText(m[1]); return v === "yildiz" ? "Yıldız Pazar" : v === "ana" ? "Ana Pazar" : v === "alt" ? "Alt Pazar" : null; }
function extractParticipantCount(text) { const m = /(?:toplam\s+)?([0-9][0-9.\s]{2,})\s+(?:yatırımcıya|yatirimciya)(?:\s+pay|\s+dağıtım|\s+dagitim)?/i.exec(stripHtml(text)); if (!m) return null; const n = Number(m[1].replace(/[^0-9]/g, "")); return Number.isFinite(n) && n >= 100 ? n : null; }
function extractPublishedDate(text) { const source = stripHtml(text), m = /(?:Gönderim Tarihi|publishDate)[^0-9]{0,20}(\d{1,2})[.\/]([01]?\d)[.\/](20\d{2})/i.exec(source); return m ? isoDate(m[3], m[2], m[1]) : null; }
function formatDates(start, end) { const a = new Date(`${start}T00:00:00Z`), b = new Date(`${end}T00:00:00Z`); if (a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()) { const days = [], cursor = new Date(a); while (cursor <= b && days.length < 7) { days.push(cursor.getUTCDate()); cursor.setUTCDate(cursor.getUTCDate() + 1); } return `${days.join("-")} ${MONTH_NAMES[a.getUTCMonth() + 1]} ${a.getUTCFullYear()}`; } return `${a.getUTCDate()} ${MONTH_NAMES[a.getUTCMonth() + 1]} ${a.getUTCFullYear()} - ${b.getUTCDate()} ${MONTH_NAMES[b.getUTCMonth() + 1]} ${b.getUTCFullYear()}`; }
export function extractKapEnrichment(detailHtml, companyName, approvalDate = "", indexContext = "") { const combined = `${indexContext}\n${stripHtml(detailHtml)}`; if (!companyMatchScore(combined, companyName) && !RELEVANT_TITLES.test(indexContext)) return null; if (!RELEVANT_TITLES.test(combined)) return null; const range = extractCollectionRange(combined, approvalDate), ticker = extractTicker(combined), market = extractMarket(combined), participantCount = extractParticipantCount(combined), firstTradeDate = extractSingleDateNearPhrase(combined, /(?:işlem|islem)\s+görmeye\s+(?:başlayacak|baslayacak|başladı|basladi|başlamıştır|baslamistir)/i), publishedAt = extractPublishedDate(detailHtml), result = {}; if (ticker) result.ticker = ticker; if (range) { result.collectionStart = range.start; result.collectionEnd = range.end; result.dates = formatDates(range.start, range.end); } if (market) result.market = market; if (participantCount) result.participantCount = participantCount; if (firstTradeDate) result.firstTradeDate = firstTradeDate; if (publishedAt) result.schedulePublishedAt = publishedAt; return Object.keys(result).length ? result : null; }
