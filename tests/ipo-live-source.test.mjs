import test from "node:test";
import assert from "node:assert/strict";
import { canonicalCompanySlug, sameCompanySlug } from "../lib/company-identity.mjs";
import { extractHalkarzCompanyLinks, parseHalkarzDetailPage, parseTurkishDateRange, parseTurkishNumber, slugifyTurkish } from "../lib/ipo-live-source.mjs";

test("Turkish dates parse same-month and cross-month ranges", () => {
  assert.deepEqual(parseTurkishDateRange("26-27 Ağustos 2026"), { start: "2026-08-26", end: "2026-08-27" });
  assert.deepEqual(parseTurkishDateRange("29-30 Haziran, 1 Temmuz 2026"), { start: "2026-06-29", end: "2026-07-01" });
  assert.deepEqual(parseTurkishDateRange("Hazırlanıyor..."), { start: null, end: null });
});

test("Turkish numbers and company slugs normalize", () => {
  assert.equal(parseTurkishNumber("53,60 ₺"), 53.6);
  assert.equal(parseTurkishNumber("167.000.000 Lot"), 167000000);
  assert.equal(parseTurkishNumber("65.000.000 Lot 12.500.000 ek pay"), 65000000);
  assert.equal(slugifyTurkish("İntetra Teknoloji ve Bilişim Hizmetleri A.Ş."), "intetra-teknoloji-ve-bilisim-hizmetleri");
});

test("company identity treats San./Tic. abbreviations as the same issuer", () => {
  const pairs = [
    ["teknika-plast-teknik-kalip-plastik-san-ve-tic", "teknika-plast-teknik-kalip-plastik-sanayi-ve-ticaret"],
    ["albayrak-hazir-beton-san-ve-tic", "albayrak-hazir-beton-sanayi-ve-ticaret"],
    ["sa-ra-enerji-insaat-tic-ve-san", "sa-ra-enerji-insaat-ticaret-ve-sanayi"],
    ["saat-ve-saat-san-ve-tic", "saat-ve-saat-sanayi-ve-ticaret"],
    ["ekim-turizm-tic-ve-san", "ekim-turizm-ticaret-ve-sanayi"],
    ["golda-gida-san-ve-tic", "golda-gida-sanayi-ve-ticaret"]
  ];
  for (const [liveSlug, canonicalSlug] of pairs) {
    assert.equal(sameCompanySlug(liveSlug, canonicalSlug), true, `${liveSlug} aliası eşleşmeli`);
    assert.equal(canonicalCompanySlug(liveSlug), canonicalCompanySlug(canonicalSlug));
  }
  assert.equal(sameCompanySlug("intetra-teknoloji-ve-bilisim-hizmetleri", "bakirci-gayrimenkul-yatirim-ortakligi"), false);
});

test("homepage parser stops before draft archive", () => {
  const html = `<main><a href="/intetra-teknoloji-ve-bilisim-hizmetleri-a-s/"><h3>İntetra Teknoloji ve Bilişim Hizmetleri A.Ş.</h3></a><a href="/bakirci-gayrimenkul-yatirim-ortakligi-a-s/">Bakırcı Gayrimenkul Yatırım Ortaklığı A.Ş.</a><button>Daha Fazla Göster</button><a href="/taslak-a-s/">Taslak A.Ş.</a></main>`;
  const rows = extractHalkarzCompanyLinks(html);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].company, "İntetra Teknoloji ve Bilişim Hizmetleri A.Ş.");
});

test("detail parser derives approved and collecting status", () => {
  const html = `<table><tr><td>Halka Arz Tarihi :</td><td>26-27 Ağustos 2026</td></tr><tr><td>Halka Arz Fiyatı/Aralığı :</td><td>53,60 ₺</td></tr><tr><td>Dağıtım Yöntemi :</td><td>Tamamen Eşit</td></tr><tr><td>Pay :</td><td>40.000.000 Lot</td></tr><tr><td>Aracı Kurum :</td><td>Bulls Yatırım Menkul Değerler A.Ş.</td></tr><tr><td>Son Güncelleme:</td><td>21.08.2026</td></tr></table>`;
  const seed = { company: "İntetra Teknoloji ve Bilişim Hizmetleri A.Ş.", slug: "intetra-teknoloji-ve-bilisim-hizmetleri", url: "https://halkarz.com/intetra/" };
  const before = parseHalkarzDetailPage(html, seed, new Date("2026-08-21T12:00:00Z"));
  assert.equal(before.status, "approved");
  assert.equal(before.price, 53.6);
  assert.equal(before.totalLots, 40000000);
  const active = parseHalkarzDetailPage(html, seed, new Date("2026-08-26T12:00:00Z"));
  assert.equal(active.status, "collecting");
});
