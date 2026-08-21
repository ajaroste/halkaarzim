import test from "node:test";
import assert from "node:assert/strict";
import { parseInitialPublicOfferings, trSlug } from "../supabase/functions/spk-ipo-sync/parser.mjs";

const header = "Ortaklık Mevcut Sermaye Yeni Sermaye Sermaye Artırımı Mevcut Pay Satışı Ek Pay Satışı Satış Fiyatı Bedelli Bedelsiz";

test("2026/49 official SPK rows keep prices and extra sale aligned", async () => {
  const text = `SERMAYE PİYASASI KURULU BÜLTENİ 2026/49 05.08.2026\n1. İlk Halka Arzlar ${header} Çitlekçi Mağazacılık Gıda A.Ş. 150.000.000 180.000.000 30.000.000 - 6.500.000 (1) - 73,70 (2) Teknika Plast Teknik Kalıp Plastik Sanayi ve Ticaret A.Ş. 100.000.000 125.000.000 25.000.000 - 6.000.000 - 85,40 (3) Türker Vangölü Enerji Yatırım A.Ş. 529.354.723 566.854.723 37.500.000 - 27.500.000 12.500.000 136,00 (4) Kapeks Kimya Sanayi A.Ş. 100.000.000 125.100.000 25.100.000 - - - 94,00\n2. Halka Açık Ortaklıkların Pay İhraçları`;
  const rows = await parseInitialPublicOfferings(text, "https://spk.gov.tr/data/example/2026-49.pdf");
  assert.equal(rows.length, 4);
  assert.deepEqual(rows.map(({ company, price, extraSaleShares, lotCount }) => ({ company, price, extraSaleShares, lotCount })), [
    { company: "Çitlekçi Mağazacılık Gıda A.Ş.", price: 73.7, extraSaleShares: 0, lotCount: 36_500_000 },
    { company: "Teknika Plast Teknik Kalıp Plastik Sanayi ve Ticaret A.Ş.", price: 85.4, extraSaleShares: 0, lotCount: 31_000_000 },
    { company: "Türker Vangölü Enerji Yatırım A.Ş.", price: 136, extraSaleShares: 12_500_000, lotCount: 65_000_000 },
    { company: "Kapeks Kimya Sanayi A.Ş.", price: 94, extraSaleShares: 0, lotCount: 25_100_000 },
  ]);
});

test("2026/52 official SPK rows strip table header and legal suffix from slug", async () => {
  const text = `SERMAYE PİYASASI KURULU BÜLTENİ 2026/52 20.08.2026\n1. İlk Halka Arzlar ${header} İntetra Teknoloji ve Bilişim Hizmetleri A.Ş. 130.000.000 160.000.000 30.000.000 - 10.000.000 - 53,60 Bakırcı Gayrimenkul Yatırım Ortaklığı A.Ş. 501.000.000 668.000.000 167.000.000 - - - 12,93\n2. Halka Açık Ortaklıkların Pay İhraçları`;
  const rows = await parseInitialPublicOfferings(text, "https://spk.gov.tr/data/example/2026-52.pdf");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].company, "İntetra Teknoloji ve Bilişim Hizmetleri A.Ş.");
  assert.equal(rows[0].slug, "intetra-teknoloji-ve-bilisim-hizmetleri");
  assert.equal(rows[0].price, 53.6);
  assert.equal(rows[0].lotCount, 40_000_000);
  assert.equal(rows[1].slug, "bakirci-gayrimenkul-yatirim-ortakligi");
  assert.equal(rows[1].price, 12.93);
  assert.equal(rows[1].lotCount, 167_000_000);
  assert.equal(trSlug("Örnek Teknoloji A.Ş."), "ornek-teknoloji");
});
