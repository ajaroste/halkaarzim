from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import Browser, Page, sync_playwright

BASE_URL = os.environ.get("LIVE_SITE_URL", "https://halkaarzim.vercel.app").rstrip("/")
OUT = Path(os.environ.get("LIVE_TEST_OUTPUT", "live-test-artifacts"))
OUT.mkdir(parents=True, exist_ok=True)

report: dict[str, object] = {
    "base_url": BASE_URL,
    "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "checks": [],
    "console_errors": [],
    "network_errors": [],
    "social_redirects": {},
}


def add_check(name: str, ok: bool, detail: str = "") -> None:
    report["checks"].append({"name": name, "ok": ok, "detail": detail})


def track_runtime(page: Page) -> None:
    page.on("console", lambda message: report["console_errors"].append(message.text) if message.type == "error" else None)
    page.on("requestfailed", lambda request: report["network_errors"].append(f"{request.method} {request.url}: {request.failure}"))
    page.on("response", lambda response: report["network_errors"].append(f"HTTP {response.status} {response.url}") if response.status >= 500 else None)


def wait_for_live(page: Page) -> None:
    last_error = ""
    for attempt in range(12):
        try:
            response = page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(1200)
            body = page.locator("body").inner_text(timeout=10_000)
            if response and response.ok and "HalkaArzım" in body:
                add_check("Canlı site erişimi", True, f"HTTP {response.status}; deneme {attempt + 1}")
                return
            last_error = f"HTTP {response.status if response else 'yok'}; güncel arayüz bulunamadı"
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
        page.wait_for_timeout(5000)
    raise RuntimeError(f"Canlı site hazır olmadı: {last_error}")


def auth_modal(page: Page):
    return page.locator("section.authModalCard")


def open_auth(page: Page) -> None:
    page.get_by_role("button", name="Giriş yap", exact=True).click()
    auth_modal(page).wait_for(state="visible", timeout=10_000)


def check_public_endpoint(context, path: str, marker: str) -> None:
    response = context.request.get(f"{BASE_URL}{path}", timeout=30_000)
    text = response.text()
    add_check(f"Endpoint {path}", response.status == 200 and marker.lower() in text.lower(), f"HTTP {response.status}; {response.headers.get('content-type', '')}")


def test_github_redirect(browser: Browser) -> None:
    context = browser.new_context(viewport={"width": 1280, "height": 800}, locale="tr-TR")
    page = context.new_page()
    try:
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30_000)
        open_auth(page)
        auth_modal(page).get_by_role("button", name="GitHub ile devam et", exact=True).click()
        try:
            page.wait_for_url(lambda url: urlparse(url).netloc not in {"halkaarzim.vercel.app", ""}, timeout=20_000)
        except Exception:
            page.wait_for_timeout(2500)
        final_url = page.url
        parsed = urlparse(final_url)
        ok = parsed.netloc == "github.com" and "localhost" not in final_url.lower()
        report["social_redirects"]["GitHub"] = {"url": final_url, "host": parsed.netloc}
        add_check("GitHub OAuth yönlendirmesi", ok, parsed.netloc or final_url)
    except Exception as exc:  # noqa: BLE001
        add_check("GitHub OAuth yönlendirmesi", False, str(exc))
    finally:
        context.close()


def run() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, locale="tr-TR")
        page = context.new_page()
        track_runtime(page)

        wait_for_live(page)
        add_check("Ana sayfa başlığı", "HalkaArzım" in page.locator("body").inner_text())
        add_check("Üst giriş butonu", page.get_by_role("button", name="Giriş yap", exact=True).count() == 1)
        page.screenshot(path=OUT / "01-home.png", full_page=True)

        theme_button = page.get_by_role("button", name=re.compile("Koyu temayı aç|Açık temayı aç"))
        add_check("Tema butonu", theme_button.count() == 1)
        before = page.evaluate("document.documentElement.dataset.theme")
        theme_button.click()
        page.wait_for_timeout(350)
        after = page.evaluate("document.documentElement.dataset.theme")
        add_check("Tema değiştirme", before != after, f"{before}->{after}")

        open_auth(page)
        dialog = auth_modal(page)
        add_check("Giriş penceresi", dialog.is_visible())
        add_check("GitHub ile giriş", dialog.get_by_role("button", name="GitHub ile devam et", exact=True).count() == 1)
        add_check("Kayıt görünümü bağlantısı", dialog.get_by_role("button", name=re.compile("Kayıt ol")).count() == 1)
        add_check("Parola sıfırlama bağlantısı", dialog.get_by_role("button", name="Parolamı unuttum", exact=True).count() == 1)
        page.screenshot(path=OUT / "02-login.png", full_page=True)
        dialog.get_by_role("button", name="Kapat").click()

        check_public_endpoint(context, "/sitemap.xml", "<urlset")
        check_public_endpoint(context, "/robots.txt", "user-agent")
        check_public_endpoint(context, "/feed.xml", "<rss")
        check_public_endpoint(context, "/.well-known/security.txt", "contact:")

        response = page.goto(f"{BASE_URL}/halka-arzlar", wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(1000)
        add_check("Halka arz liste sayfası", bool(response and response.ok) and page.locator("a[href^='/arz/']").count() > 0)
        detail_links = page.locator("a[href^='/arz/']")
        if detail_links.count():
            href = detail_links.first.get_attribute("href")
            detail_response = page.goto(f"{BASE_URL}{href}", wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(700)
            add_check("Halka arz detay sayfası", bool(detail_response and detail_response.ok) and "/arz/" in page.url, page.url)
            page.screenshot(path=OUT / "03-detail.png", full_page=True)
        else:
            add_check("Halka arz detay sayfası", False, "Detay bağlantısı bulunamadı")
        context.close()

        mobile = browser.new_context(viewport={"width": 390, "height": 844}, locale="tr-TR", device_scale_factor=1)
        mobile_page = mobile.new_page()
        track_runtime(mobile_page)
        mobile_page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30_000)
        mobile_page.wait_for_timeout(900)
        overflow = mobile_page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        add_check("iPhone 13 yatay taşma", not overflow, f"overflow={overflow}")
        add_check("Mobil giriş butonu", mobile_page.get_by_role("button", name="Giriş yap", exact=True).count() == 1)
        add_check("Mobil tema butonu", mobile_page.get_by_role("button", name=re.compile("Koyu temayı aç|Açık temayı aç")).count() == 1)
        add_check("Mobil menü butonu", mobile_page.get_by_role("button", name="Menüyü aç").count() == 1)
        mobile_page.screenshot(path=OUT / "04-mobile.png", full_page=True)
        mobile.close()

        test_github_redirect(browser)
        browser.close()

    console_errors = [item for item in report["console_errors"] if "favicon" not in item.lower()]
    network_errors = list(report["network_errors"])
    add_check("Kritik console hatası", len(console_errors) == 0, "\n".join(console_errors[:10]))
    add_check("Kritik network hatası", len(network_errors) == 0, "\n".join(network_errors[:10]))
    report["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    report["passed"] = sum(1 for item in report["checks"] if item["ok"])
    report["failed"] = sum(1 for item in report["checks"] if not item["ok"])
    (OUT / "live-test-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    if report["failed"]:
        raise SystemExit(f"Live test failed: {report['failed']} checks")


if __name__ == "__main__":
    run()
