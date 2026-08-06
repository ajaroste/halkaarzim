import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const candidates = ["sql/schema.sql", "supabase/schema.sql", "sql/migrations"];
let sql = "";
for (const candidate of candidates) {
  if (!fs.existsSync(candidate)) continue;
  const stat = fs.statSync(candidate);
  if (stat.isFile()) sql += fs.readFileSync(candidate, "utf8");
  else {
    for (const file of fs.readdirSync(candidate).filter((name) => name.endsWith(".sql"))) {
      sql += "\n" + fs.readFileSync(path.join(candidate, file), "utf8");
    }
  }
}
assert.ok(sql.length > 100, "Supabase SQL şeması bulunamadı");
const normalized = sql.toLowerCase();
for (const keyword of ["row level security", "comments", "watchlist", "profiles"]) {
  assert.ok(normalized.includes(keyword), `SQL sözleşmesinde '${keyword}' eksik`);
}
assert.ok(normalized.includes("policy") || normalized.includes("create policy"), "RLS politikaları eksik");
console.log("supabase_contract: SQL şeması ve RLS sözleşmeleri doğrulandı");
