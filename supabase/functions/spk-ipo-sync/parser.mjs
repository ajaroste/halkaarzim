function stripLegalSuffix(value) {
  return value.replace(/\s+(?:A\.?\s*Ş\.?|Anonim\s+Şirketi)\s*$/iu, "").trim();
}

export function trSlug(value) {
  return stripLegalSuffix(value)
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function parseNumber(value) {
  if (!value || value.trim() === "-" || value.trim() === "—") return 0;
  let text = value.trim().replace(/[^0-9,.-]/g, "");
  if (text.includes(",")) text = text.replaceAll(".", "").replace(",", ".");
  else if ((text.match(/\./g) || []).length > 1 || (/\.\d{3}$/.test(text))) text = text.replaceAll(".", "");
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeCompany(value) {
  return value.replace(/\s+/g, " ").replace(/\s+A\.?\s*Ş\.?$/iu, " A.Ş.").trim();
}

function parseBulletinMeta(text, sourceUrl) {
  const numberMatch = text.match(/(?:BÜLTENİ|BULTENI)\s*(20\d{2})\s*\/\s*(\d+)/i);
  const urlMatch = sourceUrl.match(/(20\d{2})[-_/](\d+)/);
  const bulletinNo = numberMatch ? `${numberMatch[1]}/${Number(numberMatch[2])}` : urlMatch ? `${urlMatch[1]}/${Number(urlMatch[2])}` : "Bilinmiyor";
  const dateMatch = text.match(/\b(\d{2})[./](\d{2})[./](20\d{2})\b/);
  const approvalDate = dateMatch ? `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}` : new Date().toISOString().slice(0, 10);
  return { bulletinNo, approvalDate };
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function cleanIpoSection(raw) {
  let section = raw
    .replace(/\(\s*\d+\s*\)/g, " ")
    .replace(/[¹²³⁴⁵⁶⁷⁸⁹⁰]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  section = section.replace(/^.*?Satış\s*Fiyatı\s*Bedelli\s*Bedelsiz\s*/iu, "");
  return section;
}

export async function parseInitialPublicOfferings(text, sourceUrl) {
  const { bulletinNo, approvalDate } = parseBulletinMeta(text, sourceUrl);
  const sectionMatch = text.match(/(?:1\.?\s*)?İlk\s+Halka\s+Arzlar([\s\S]*?)(?:\n\s*2\.|Halka\s+Açık\s+Ortaklıkların\s+(?:Pay\s+İhraçları|Başvuruları)|$)/iu);
  if (!sectionMatch) return [];
  const section = cleanIpoSection(sectionMatch[1]);
  const companyPattern = /([A-ZÇĞİÖŞÜ][A-Za-zÇĞİÖŞÜçğıöşü0-9 .,&'()\/-]+?A\.?\s*Ş\.?)\s+/giu;
  const matches = [...section.matchAll(companyPattern)];
  const result = [];

  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index];
    const start = (match.index || 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index || section.length) : section.length;
    const tail = section.slice(start, end);
    const tokens = tail.match(/(?:\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?|-)/g) || [];
    if (tokens.length < 6) continue;

    const company = normalizeCompany(match[1]);
    if (/^(Ortaklık|Mevcut Sermaye|Yeni Sermaye)/iu.test(company) || company.length > 180) continue;
    const values = tokens.slice(0, 7).map(parseNumber);
    while (values.length < 7) values.push(0);
    let [currentCapital, newCapital, capitalIncrease, , shareholderSale, extraSale, price] = values;
    if (tokens.length === 6) {
      [currentCapital, newCapital, capitalIncrease, , shareholderSale, price] = tokens.slice(0, 6).map(parseNumber);
      extraSale = 0;
    }
    if (!company || price <= 0 || price > 10000 || capitalIncrease < 0 || shareholderSale < 0 || extraSale < 0) continue;
    const lotCount = Math.round(capitalIncrease + shareholderSale);
    if (lotCount <= 0 || lotCount > 5_000_000_000) continue;
    const slug = trSlug(company);
    if (!slug) continue;
    const sourceKey = `${bulletinNo}|${slug}`;
    const sourceHash = await sha256(`${sourceKey}|${price}|${currentCapital}|${newCapital}|${capitalIncrease}|${shareholderSale}|${extraSale}`);
    result.push({ sourceKey, company, slug, bulletinNo, approvalDate, sourceUrl, price, currentCapital: Math.round(currentCapital), newCapital: Math.round(newCapital), capitalIncreaseShares: Math.round(capitalIncrease), shareholderSaleShares: Math.round(shareholderSale), extraSaleShares: Math.round(extraSale), lotCount, maxLotCount: lotCount + Math.round(extraSale), sourceHash });
  }
  return result;
}
