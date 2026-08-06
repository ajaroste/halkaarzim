export type LotEstimateInput = {
  budget: number;
  price: number;
  estimatedParticipants: number;
  retailLots: number;
};

export type LotEstimate = {
  requestedLots: number;
  estimatedLots: number;
  estimatedCost: number;
};

const bannedPatterns = [
  /kesin\s+(tavan|kazanç|kazandırır)/i,
  /içeriden\s+bilgi/i,
  /(telegram|whatsapp)\s+(grup|kanal)/i,
  /hepimiz\s+(alalım|toplayalım)/i,
  /garanti\s+(kazanç|tavan)/i
];

export function scoreLevel(score: number): "Güçlü" | "Dengeli" | "Dikkat" {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError("score must be between 0 and 100");
  }
  return score >= 75 ? "Güçlü" : score >= 60 ? "Dengeli" : "Dikkat";
}

export function estimateLots(input: LotEstimateInput): LotEstimate {
  const budget = Math.max(0, Number(input.budget) || 0);
  const price = Math.max(0, Number(input.price) || 0);
  const participants = Math.max(1, Math.floor(Number(input.estimatedParticipants) || 1));
  const pool = Math.max(0, Math.floor(Number(input.retailLots) || 0));
  if (!price) return { requestedLots: 0, estimatedLots: 0, estimatedCost: 0 };
  const requestedLots = Math.floor(budget / price);
  const equalShare = Math.floor(pool / participants);
  const estimatedLots = Math.max(0, Math.min(requestedLots, equalShare));
  return { requestedLots, estimatedLots, estimatedCost: Number((estimatedLots * price).toFixed(2)) };
}

export function moderateComment(text: string): { allowed: boolean; reason: string | null } {
  const normalized = String(text ?? "").trim();
  if (normalized.length < 2) return { allowed: false, reason: "Yorum çok kısa." };
  if (normalized.length > 500) return { allowed: false, reason: "Yorum 500 karakteri aşamaz." };
  if (bannedPatterns.some((pattern) => pattern.test(normalized))) {
    return { allowed: false, reason: "Manipülatif yönlendirme veya grup reklamı tespit edildi." };
  }
  return { allowed: true, reason: null };
}

export function formatTry(value: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 }).format(value || 0);
}
