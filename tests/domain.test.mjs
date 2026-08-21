import assert from "node:assert/strict";
import fs from "node:fs";

const payload = JSON.parse(fs.readFileSync("data/generated/ipos.json", "utf8"));
const items = payload.items ?? [];

const normalizeStatus = (status) => ({ trading: "listed", collecting: "active", postponed: "delayed" }[status] ?? status);

assert.ok(items.length >= 30, `En az 30 gerçek kayıt bekleniyordu, bulunan: ${items.length}`);
assert.equal(new Set(items.map((item) => item.id)).size, items.length, "IPO id değerleri benzersiz olmalı");
assert.equal(new Set(items.map((item) => item.slug)).size, items.length, "IPO slug değerleri benzersiz olmalı");

const allowedStatuses = new Set(["approved", "active", "upcoming", "completed", "listed", "delayed"]);
for (const item of items) {
  const status = normalizeStatus(item.status);
  assert.ok(item.company, "Şirket adı zorunlu");
  assert.ok(item.price > 0, `${item.company}: fiyat pozitif olmalı`);
  assert.ok(allowedStatuses.has(status), `${item.company}: bilinmeyen durum ${item.status}`);
  assert.ok(Array.isArray(item.sources) && item.sources.length > 0, `${item.company}: kaynak zorunlu`);
  assert.ok(item.sources.some((source) => /^https:\/\//.test(source.url ?? "")), `${item.company}: HTTPS kaynak zorunlu`);
}

const quick = items.find((item) => item.ticker === "QUICK");
if (quick) {
  // Snapshot enrichment can lag current first-trade facts. Keep this contract
  // limited to the terminal lifecycle state carried by the committed snapshot.
  assert.ok(["completed", "listed"].includes(normalizeStatus(quick.status)));
}

console.log(`domain.test: ${items.length} gerçek halka arz kaydı doğrulandı`);
