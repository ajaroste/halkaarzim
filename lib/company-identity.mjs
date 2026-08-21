const BUSINESS_NOISE = new Set([
  "a",
  "as",
  "anonim",
  "sirketi",
  "ve",
  "san",
  "sanayi",
  "tic",
  "ticaret"
]);

export function canonicalCompanySlug(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .filter((token) => token && !BUSINESS_NOISE.has(token))
    .join("-");
}

export function sameCompanySlug(left, right) {
  const a = canonicalCompanySlug(left);
  const b = canonicalCompanySlug(right);
  return Boolean(a && b && a === b);
}
