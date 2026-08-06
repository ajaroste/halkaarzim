import assert from "node:assert/strict";
import fs from "node:fs";

const payload = JSON.parse(fs.readFileSync("data/generated/ipos.json", "utf8"));
const items = payload.items ?? [];
const sourceHosts = new Set(["spk.gov.tr", "www.spk.gov.tr", "kap.org.tr", "www.kap.org.tr", "borsaistanbul.com", "www.borsaistanbul.com"]);

for (const item of items) {
  assert.match(item.id, /^[0-9a-f-]{20,}$/i, `${item.company}: id biçimi geçersiz`);
  assert.match(item.slug, /^[a-z0-9-]+$/, `${item.company}: slug biçimi geçersiz`);
  for (const source of item.sources ?? []) {
    const url = new URL(source.url);
    assert.equal(url.protocol, "https:", `${item.company}: HTTPS olmayan kaynak`);
    assert.ok(sourceHosts.has(url.hostname) || source.type !== "SPK", `${item.company}: SPK kaynağı beklenmeyen hostta`);
  }
  if (item.ticker) assert.match(item.ticker, /^[A-Z0-9]{3,8}$/, `${item.company}: borsa kodu geçersiz`);
}

console.log(`validate-source: ${items.length} kayıt doğrulandı`);
