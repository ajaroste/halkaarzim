import test from "node:test";
import assert from "node:assert/strict";
import { extractKapEnrichment, extractNotificationCandidates, extractCollectionRange } from "../supabase/functions/kap-ipo-enrich/parser.mjs";

test("finds legacy KAP disclosure candidate by company tokens", () => {
  const html = `<table><tr><td>Bakırcı Gayrimenkul Yatırım Ortaklığı A.Ş.</td><td>Tasarruf Sahiplerine Satış Duyurusu</td><td><a href="/tr/Bildirim/1655001">Detay</a></td></tr></table>`;
  const candidates = extractNotificationCandidates(html, "Bakırcı Gayrimenkul Yatırım Ortaklığı A.Ş.");
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].id, "1655001");
});

test("parses disclosureBasic objects embedded in current KAP Next payload", () => {
  const html = String.raw`self.__next_f.push([1,"{\\\"disclosureBasic\\\":{\\\"publishDate\\\":\\\"21.08.2026 18:51:07\\\",\\\"disclosureIndex\\\":1654232,\\\"stockCode\\\":\\\"INM\\\",\\\"companyTitle\\\":\\\"İNTEGRAL YATIRIM MENKUL DEĞERLER A.Ş.\\\",\\\"title\\\":\\\"Tasarruf Sahiplerine Satış Duyurusu\\\",\\\"relatedStocks\\\":\\\"BKRGY\\\",\\\"summary\\\":\\\"Bakırcı Gayrimenkul Yatırım Ortaklığı A.Ş. paylarının halka arzına ilişkin Tasarruf Sahiplerine Satış Duyurusu Hk\\\"}}"]);`;
  const candidates = extractNotificationCandidates(html, "Bakırcı Gayrimenkul Yatırım Ortaklığı A.Ş.");
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].id, "1654232");
  assert.equal(candidates[0].ticker, "BKRGY");
  assert.match(candidates[0].url, /1654232$/);
});

test("matches Borsa İstanbul disclosure by known ticker", () => {
  const html = String.raw`{\\\"disclosureBasic\\\":{\\\"publishDate\\\":\\\"21.08.2026 18:10:18\\\",\\\"disclosureIndex\\\":1654174,\\\"stockCode\\\":null,\\\"companyTitle\\\":\\\"BORSA İSTANBUL A.Ş.\\\",\\\"title\\\":\\\"Payların Borsa Birincil Piyasada Halka Arzı\\\",\\\"relatedStocks\\\":\\\"INTET\\\",\\\"summary\\\":\\\"Payların Borsa Birincil Piyasada Halka Arzı\\\"}}`;
  const candidates = extractNotificationCandidates(html, "İntetra Teknoloji ve Bilişim Hizmetleri A.Ş.", 8, "INTET");
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].id, "1654174");
  assert.equal(candidates[0].ticker, "INTET");
});

test("parses Bakırcı schedule, ticker and market", () => {
  const html = `<div>Gönderim Tarihi 21.08.2026 18:30:00</div><h1>Bakırcı Gayrimenkul Yatırım Ortaklığı A.Ş.</h1><p>Şirket payları "BKRGY" işlem koduyla Borsa İstanbul Yıldız Pazar'da işlem görecektir.</p><p>Halka arz kapsamında talep toplama işlemleri 24-25-26 Ağustos 2026 tarihlerinde gerçekleştirilecektir.</p>`;
  const parsed = extractKapEnrichment(html, "Bakırcı Gayrimenkul Yatırım Ortaklığı A.Ş.", "2026-08-20");
  assert.equal(parsed?.ticker, "BKRGY");
  assert.equal(parsed?.collectionStart, "2026-08-24");
  assert.equal(parsed?.collectionEnd, "2026-08-26");
  assert.equal(parsed?.dates, "24-25-26 Ağustos 2026");
  assert.equal(parsed?.market, "Yıldız Pazar");
  assert.equal(parsed?.schedulePublishedAt, "2026-08-21");
});

test("parses İntetra two-day schedule", () => {
  const html = `<div>Gönderim Tarihi 21.08.2026 17:00:00</div><p>İntetra Teknoloji ve Bilişim Hizmetleri A.Ş. payları INTET işlem kodu ile işlem görecektir.</p><p>Halka arz talep toplama tarihleri 26-27 Ağustos 2026 olarak belirlenmiştir.</p><p>Paylar Yıldız Pazar'da işlem görecektir.</p>`;
  const parsed = extractKapEnrichment(html, "İntetra Teknoloji ve Bilişim Hizmetleri A.Ş.", "2026-08-20");
  assert.equal(parsed?.ticker, "INTET");
  assert.equal(parsed?.collectionStart, "2026-08-26");
  assert.equal(parsed?.collectionEnd, "2026-08-27");
});

test("ignores unrelated rights-issue date ranges", () => {
  const text = `Yeni pay alma hakkı 01.08.2026 - 20.08.2026 arasında kullanılacaktır. Halka arz talep toplama tarihleri 26-27 Ağustos 2026 olacaktır.`;
  const range = extractCollectionRange(text, "2026-08-20");
  assert.equal(range?.start, "2026-08-26");
  assert.equal(range?.end, "2026-08-27");
});

test("parses first trade date and investor count when later KAP result arrives", () => {
  const html = `<h1>İntetra Teknoloji ve Bilişim Hizmetleri A.Ş.</h1><p>Halka arz satış sonuçlarına göre toplam 512.345 yatırımcıya pay dağıtımı yapılmıştır.</p><p>INTET işlem koduyla paylar 02.09.2026 tarihinde işlem görmeye başlayacak.</p>`;
  const parsed = extractKapEnrichment(html, "İntetra Teknoloji ve Bilişim Hizmetleri A.Ş.", "2026-08-20");
  assert.equal(parsed?.ticker, "INTET");
  assert.equal(parsed?.firstTradeDate, "2026-09-02");
  assert.equal(parsed?.participantCount, 512345);
});
