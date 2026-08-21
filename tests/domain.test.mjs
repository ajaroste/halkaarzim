import assert from "node:assert/strict";
import fs from "node:fs";

const payload = JSON.parse(fs.readFileSync("data/generated/ipos.json", "utf8"));
const overrides = JSON.parse(fs.readFileSync("data/verified-overrides.json", "utf8"));
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
  if (item.firstTradeDate != null) {
    assert.match(item.firstTradeDate, /^\d{4}-\d{2}-\d{2}$/, `${item.company}: firstTradeDate ISO tarih olmalı`);
  }
}

// generated/ipos.json bir last-known-good snapshot'tır; zamanla değişen/sonradan doğrulanan
// alanları snapshot'a zorunlu kılmak yerine verified-overrides katmanında doğrula.
const quickOverride = overrides["quick-sigorta"];
assert.ok(quickOverride, "QUICK için doğrulanmış override bulunmalı");
assert.equal(normalizeStatus(quickOverride.status), "listed");
assert.equal(quickOverride.firstTradeDate, "2026-08-06");

console.log(`domain.test: ${items.length} gerçek halka arz kaydı doğrulandı`);
