export const BANNED_PATTERNS = [
  /kesin\s+(tavan|kazanç|kazandırır)/i,
  /içeriden\s+bilgi/i,
  /(telegram|whatsapp)\s+(grup|kanal)/i,
  /hepimiz\s+(alalım|toplayalım)/i,
  /garanti\s+(kazanç|tavan)/i
];

export function scoreLevel(score) {
  if (!Number.isFinite(score) || score < 0 || score > 100) throw new RangeError("score must be between 0 and 100");
  if (score >= 75) return "Güçlü";
  if (score >= 60) return "Dengeli";
  return "Dikkat";
}

export function estimateLots({ budget, price, estimatedParticipants, retailLots }) {
  const safeBudget = Math.max(0, Number(budget) || 0);
  const safePrice = Math.max(0, Number(price) || 0);
  const participants = Math.max(1, Math.floor(Number(estimatedParticipants) || 1));
  const pool = Math.max(0, Math.floor(Number(retailLots) || 0));
  if (!safePrice) return { requestedLots: 0, estimatedLots: 0, estimatedCost: 0 };
  const requestedLots = Math.floor(safeBudget / safePrice);
  const equalShare = Math.floor(pool / participants);
  const estimatedLots = Math.max(0, Math.min(requestedLots, equalShare));
  return {
    requestedLots,
    estimatedLots,
    estimatedCost: Number((estimatedLots * safePrice).toFixed(2))
  };
}

export function moderateComment(text) {
  const normalized = String(text ?? "").trim();
  if (normalized.length < 2) return { allowed: false, reason: "Yorum çok kısa." };
  if (normalized.length > 500) return { allowed: false, reason: "Yorum 500 karakteri aşamaz." };
  const hit = BANNED_PATTERNS.find((pattern) => pattern.test(normalized));
  if (hit) return { allowed: false, reason: "Manipülatif yönlendirme veya grup reklamı tespit edildi." };
  return { allowed: true, reason: null };
}

export function formatTry(value) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(Number(value) || 0);
}
