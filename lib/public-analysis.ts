const INTERNAL_PHRASES = [
  "şuraya",
  "buraya",
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
  "taslak olarak"
];

export function publicAnalysisText(value: string): string {
  const text = String(value || "")
    .replace(/Henüz işlenmeyen alanlar:/gi, "Henüz açıklanmayan alanlar:")
    .replace(/Bu bir getiri tahmini değil, kaynak kapsamlı ön analizdir\.?/gi, "Değerlendirme yalnız doğrulanmış kaynak kapsamına dayanır.")
    .replace(/bu taslak yalnız sağlanan kaynaklı gerçekleri özetler\.?/gi, "bu değerlendirme yalnız doğrulanmış kaynaklardaki bilgileri özetler.")
    .trim();

  if (!text) return "";
  const lower = text.toLocaleLowerCase("tr-TR");
  return INTERNAL_PHRASES.some((phrase) => lower.includes(phrase)) ? "" : text;
}

export function publicAnalysisList(values: string[]): string[] {
  return values.map(publicAnalysisText).filter(Boolean);
}
