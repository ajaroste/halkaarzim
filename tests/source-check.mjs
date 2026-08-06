import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const roots = ["app", "components", "lib"];
const files = [];
const walk = (directory) => {
  if (!fs.existsSync(directory)) return;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const current = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(current);
    else if (/\.(?:ts|tsx|js|jsx|mjs)$/.test(entry.name)) files.push(current);
  }
};
roots.forEach(walk);

const fictional = /Nova Enerji|Atlas Yazılım|Marmara Gıda/i;
const appleFallback = /Apple Inc|NASDAQ:AAPL|symbol\s*:\s*["']AAPL["']/i;
for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  assert.ok(!fictional.test(content), `${file}: kurgusal şirket kaydı bulundu`);
  assert.ok(!appleFallback.test(content), `${file}: Apple/AAPL grafik fallback'i bulundu`);
}

assert.ok(files.length > 10, "Kaynak taraması beklenenden az dosya gördü");
console.log(`source-check: ${files.length} kaynak dosyası tarandı`);
