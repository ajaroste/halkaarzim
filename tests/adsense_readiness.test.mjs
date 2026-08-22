import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Gemini runtime ignores retired default model and keeps current fallback", async () => {
  const gemini = await source("lib/gemini-ipo.ts");
  assert.match(gemini, /const DEFAULT_MODELS = \["gemini-3\.6-flash"\]/);
  assert.match(gemini, /RETIRED_MODELS = new Set\(\["gemini-2\.5-flash"\]\)/);
  assert.match(gemini, /!RETIRED_MODELS\.has\(model\)/);
});

test("IPO AI route supports live SPK records and optional persistent cache", async () => {
  const route = await source("app/api/ai/ipo/[slug]/route.ts");
  assert.match(route, /getMergedIpoBySlug/);
  assert.match(route, /isIpoAiCacheWriteConfigured/);
  assert.doesNotMatch(route, /persistent cache write failed/);
});

test("canonical metadata is page-specific instead of globally forcing root", async () => {
  const layout = await source("app/layout.tsx");
  const home = await source("app/page.tsx");
  const list = await source("app/halka-arzlar/page.tsx");
  const agenda = await source("app/gundem/page.tsx");
  const detail = await source("app/arz/[slug]/page.tsx");

  assert.doesNotMatch(layout, /alternates:\s*\{\s*canonical:\s*"\/"\s*\}/);
  assert.match(home, /alternates:\s*\{\s*canonical:\s*"\/"\s*\}/);
  assert.match(list, /canonical:\s*"\/halka-arzlar"/);
  assert.match(agenda, /canonical:\s*"\/gundem"/);
  assert.match(detail, /canonical:\s*`\/arz\/\$\{ipo\.slug\}`/);
});

test("tickerless IPO detail titles use the company name", async () => {
  const detail = await source("app/arz/[slug]/page.tsx");
  assert.match(detail, /ipo\.ticker\s*\?\s*`\$\{ipo\.ticker\} Halka Arz/);
  assert.match(detail, /:\s*`\$\{ipo\.company\} Halka Arz/);
  assert.doesNotMatch(detail, /const code = ipo\.ticker \|\| "Halka arz"/);
});

test("analytics and Search Console hooks remain consent-aware and optional", async () => {
  const layout = await source("app/layout.tsx");
  const analytics = await source("components/ConsentAnalytics.tsx");
  assert.match(layout, /NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION/);
  assert.match(layout, /<ConsentAnalytics \/>/);
  assert.match(analytics, /NEXT_PUBLIC_GA_MEASUREMENT_ID/);
  assert.match(analytics, /halkaarzim-cookie-choice/);
  assert.match(analytics, /=== "all"/);
});
