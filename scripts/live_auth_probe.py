from __future__ import annotations
import json, time
from pathlib import Path
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

BASE = "https://halkaarzim.vercel.app"
OUT = Path("live-auth-probe")
OUT.mkdir(exist_ok=True)
result = {"base": BASE, "failed_requests": [], "responses": [], "social": {}}

with sync_playwright() as p:
    browser = p.chromium.launch()
    context = browser.new_context(viewport={"width": 1280, "height": 900}, locale="tr-TR")
    page = context.new_page()
    page.on("requestfailed", lambda req: result["failed_requests"].append({"url": req.url, "method": req.method, "failure": req.failure}))
    page.on("response", lambda res: result["responses"].append({"url": res.url, "status": res.status}) if ("supabase" in res.url or "/auth/" in res.url) else None)
    page.goto(BASE, wait_until="domcontentloaded", timeout=30000)
    page.get_by_role("button", name="Giriş yap", exact=True).click()
    modal = page.locator("section.authModalCard")
    modal.get_by_label("E-posta").fill("qa-nonexistent@halkaarzim.invalid")
    modal.get_by_label("Parola").fill("TestPassword123!")
    modal.get_by_role("button", name="Giriş yap", exact=True).click()
    page.wait_for_timeout(5000)
    result["login_message"] = modal.inner_text()
    page.screenshot(path=OUT / "auth-login.png", full_page=True)
    context.close()

    for label in ["GitHub ile devam et", "LinkedIn ile devam et", "Spotify ile devam et"]:
        ctx = browser.new_context(viewport={"width": 1280, "height": 900}, locale="tr-TR")
        pg = ctx.new_page()
        failed = []
        pg.on("requestfailed", lambda req, failed=failed: failed.append({"url": req.url, "method": req.method, "failure": req.failure}))
        pg.goto(BASE, wait_until="domcontentloaded", timeout=30000)
        pg.get_by_role("button", name="Giriş yap", exact=True).click()
        pg.locator("section.authModalCard").get_by_role("button", name=label, exact=True).click()
        pg.wait_for_timeout(5000)
        result["social"][label] = {"final_url": pg.url, "host": urlparse(pg.url).netloc, "failed_requests": failed}
        ctx.close()
    browser.close()

result["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
(OUT / "auth-probe.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
