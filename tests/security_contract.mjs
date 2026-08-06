import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("global response headers include baseline browser protections", () => {
  const config = read("next.config.ts");
  for (const expected of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ]) assert.match(config, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `Missing security control: ${expected}`);
  assert.match(config, /poweredByHeader:\s*false/);
});

test("AI route is server-only, authenticated and bounded", () => {
  const route = read("app/api/ai/route.ts");
  for (const expected of [
    "AI_ADMIN_TOKEN",
    "GEMINI_API_KEY",
    "timingSafeEqual",
    "MAX_REQUEST_BYTES",
    "RATE_LIMIT_REQUESTS",
    "AbortSignal.timeout",
    "responseMimeType: \"application/json\"",
    "verified_sources_required",
    "Cache-Control"
  ]) assert.ok(route.includes(expected), `AI route missing: ${expected}`);
  assert.doesNotMatch(route, /NEXT_PUBLIC_(?:GEMINI|AI_ADMIN|CLOUDFLARE_API|SERVICE_ROLE|VAPID_PRIVATE)/);
});

test("REST login session is synchronized into Supabase browser auth", () => {
  const provider = read("components/AuthProvider.tsx");
  for (const expected of [
    "validSession()",
    "browser.auth.setSession",
    "access_token: stored.access_token",
    "refresh_token: stored.refresh_token",
    "mapSupabaseSession(data.session)",
    "reloadPromise"
  ]) assert.ok(provider.includes(expected), `Auth session synchronization missing: ${expected}`);
});

test("private routes are excluded from robots", () => {
  const robots = read("app/robots.ts");
  for (const path of ["/admin", "/profil", "/auth", "/api"]) assert.ok(robots.includes(path));
});

test("legal and trust pages are present in sitemap and footer", () => {
  const sitemap = read("app/sitemap.ts");
  const footer = read("components/Footer.tsx");
  for (const path of [
    "/gizlilik",
    "/cerez-politikasi",
    "/kullanim-kosullari",
    "/ai-politikasi",
    "/yatirim-tavsiyesi-degildir",
    "/icerik-kaldirma"
  ]) {
    assert.ok(sitemap.includes(path), `Sitemap missing ${path}`);
    assert.ok(footer.includes(path), `Footer missing ${path}`);
  }
});

test("example environment file contains no assigned private secret", () => {
  const env = read(".env.example");
  const privateNames = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_DB_PASSWORD",
    "AI_ADMIN_TOKEN",
    "GEMINI_API_KEY",
    "CLOUDFLARE_API_TOKEN",
    "VAPID_PRIVATE_KEY",
    "TELEGRAM_BOT_TOKEN",
    "BREVO_API_KEY",
    "CRON_SECRET"
  ];
  for (const name of privateNames) {
    const match = env.match(new RegExp(`^${name}=(.*)$`, "m"));
    assert.ok(match, `Missing env declaration: ${name}`);
    assert.equal(match[1].trim(), "", `${name} must not contain a value in .env.example`);
  }
});
