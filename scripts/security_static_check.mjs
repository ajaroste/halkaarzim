import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import process from "node:process";

const root = process.cwd();
const roots = ["app", "components", "lib", "scripts"].filter((path) => existsSync(join(root, path)));
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs"]);
const scannerPath = "scripts/security_static_check.mjs";
const allowedDangerousHtml = new Set(["app/layout.tsx", "components/JsonLd.tsx"]);
const privateEnvNames = [
  "GEMINI_API_KEY",
  "AI_ADMIN_TOKEN",
  "CLOUDFLARE_API_TOKEN",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "VAPID_PRIVATE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "BREVO_API_KEY",
  "CRON_SECRET"
];
const secretPatterns = [
  { name: "Google API key", pattern: /AIza[0-9A-Za-z_-]{30,}/g },
  { name: "Supabase secret key", pattern: /sb_secret_[0-9A-Za-z_-]{20,}/g },
  { name: "JWT/access token", pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g },
  { name: "private key block", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g }
];

function extension(path) {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot);
}

function collect(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    if (["node_modules", ".next", ".git", "qa-site"].includes(entry)) continue;
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) collect(full, files);
    else if (extensions.has(extension(entry))) files.push(full);
  }
  return files;
}

const failures = [];
for (const sourceRoot of roots) {
  for (const file of collect(join(root, sourceRoot))) {
    const path = relative(root, file).replaceAll("\\", "/");
    const content = readFileSync(file, "utf8");
    const firstCodeLine = content.split(/\r?\n/).find((line) => line.trim() && !line.trim().startsWith("//"))?.trim();
    const isClient = firstCodeLine === '"use client";' || firstCodeLine === "'use client';";
    const isScanner = path === scannerPath;

    if (isClient) {
      for (const name of privateEnvNames) {
        if (content.includes(`process.env.${name}`)) failures.push(`${path}: client component references private environment variable ${name}`);
      }
    }

    if (!isScanner && (content.includes("eval(") || content.includes("new Function("))) {
      failures.push(`${path}: dynamic code execution detected`);
    }

    if (!isScanner && content.includes("dangerouslySetInnerHTML") && !allowedDangerousHtml.has(path)) {
      failures.push(`${path}: dangerouslySetInnerHTML is not in the reviewed allowlist`);
    }

    if (!isScanner) {
      for (const { name, pattern } of secretPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(content)) failures.push(`${path}: possible hard-coded ${name}`);
      }
    }
  }
}

if (failures.length) {
  console.error("Security static check failed:\n" + failures.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Security static check passed: no reviewed secret or unsafe-code pattern found.");
