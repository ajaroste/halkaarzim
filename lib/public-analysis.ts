const INTERNAL_PHRASES = [
  "şuraya",
  "buraya",
  "buraya şu",
  "şuraya şu",
  "burada gösterilecek",
  "burada yer alacak",
  "kullanıcıya göster",
  "placeholder",
  "prompt",
  "model cevabı",
  "model çıktısı",
  "ai olarak",
  "yapay zekâ olarak",
  "yapay zeka olarak",
  "taslak olarak",
  "lorem ipsum",
  "todo:",
  "fixme:",
  "örnek metin",
  "dummy content",
  "mock content",
  "daha sonra eklenecek",
  "yakında eklenecek"
];

function normalizePublicText(value: string): string {
  return String(value || "")
    .replace(/Henüz işlenmeyen alanlar:/gi, "Henüz açıklanmayan alanlar:")
    .replace(/Bu bir getiri tahmini değil, kaynak kapsamlı ön analizdir\.?/gi, "Değerlendirme yalnız doğrulanmış kaynak kapsamına dayanır.")
    .replace(/bu taslak yalnız sağlanan kaynaklı gerçekleri özetler\.?/gi, "bu değerlendirme yalnız doğrulanmış kaynaklardaki bilgileri özetler.")
    .replace(/\bAI taslağı\b/gi, "değerlendirme")
    .replace(/\bAI çıktısı\b/gi, "değerlendirme")
    .replace(/\bmodel çıktısı\b/gi, "değerlendirme")
    .trim();
}

export function publicAnalysisText(value: string): string {
  const text = normalizePublicText(value);
  if (!text) return "";
  const lower = text.toLocaleLowerCase("tr-TR");
  return INTERNAL_PHRASES.some((phrase) => lower.includes(phrase)) ? "" : text;
}

export function publicAnalysisList(values: string[]): string[] {
  return values.map(publicAnalysisText).filter(Boolean);
}
