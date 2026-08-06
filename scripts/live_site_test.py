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
    "social_redirects": {},
}


def add_check(name: str, ok: bool, detail: str = "") -> None:
    report["checks"].append({"name": name, "ok": ok, "detail": detail})


def wait_for_live(page: Page) -> None:
    last_error = ""
    for attempt in range(20):
        try:
            response = page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30_000)
            page.wait_for_timeout(1500)
            body = page.locator("body").inner_text(timeout=10_000)
            if response and response.ok and "HalkaArzım" in body and "Giriş yap" in body:
                add_check("Canlı site erişimi", True, f"HTTP {response.status}; deneme {attempt + 1}")
                return
            last_error = f"HTTP {response.status if response else 'yok'}; beklenen güncel arayüz bulunamadı"
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
        page.wait_for_timeout(10_000)
    raise RuntimeError(f"Canlı site hazır olmadı: {last_error}")


def track_console(page: Page) -> None:
    def on_console(message) -> None:
        if message.type == "error":
            report["console_errors"].append(message.text)

    page.on("console", on_console)


def open_auth(page: Page) -> None:
    page.get_by_role("button", name="Giriş yap", exact=True).click()
    page.get_by_role("dialog").wait_for(state="visible", timeout=10_000)


def test_social_redirect(browser: Browser, provider_label: str) -> None:
    context = browser.new_context(viewport={"width": 1280, "height": 800}, locale="tr-TR")
    page = context.new_page()
    try:
        page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30_000)
        open_auth(page)
        page.get_by_role("button", name=provider_label, exact=True).click()
        try:
            page.wait_for_url(lambda url: urlparse(url).netloc not in {"halkaarzim.vercel.app", ""}, timeout=20_000)
        except Exception:
            page.wait_for_timeout(3000)
        final_url = page.url
        parsed = urlparse(final_url)
        is_external = parsed.netloc not in {"halkaarzim.vercel.app", ""}
        has_localhost = "localhost" in final_url.lower()
        report["social_redirects"][provider_label] = {
            "url": final_url,
            "host": parsed.netloc,
            "external": is_external,
            "localhost": has_localhost,
        }
        add_check(f"{provider_label} yönlendirmesi", is_external and not has_localhost, parsed.netloc or final_url)
    except Exception as exc:  # noqa: BLE001
        report["social_redirects"][provider_label] = {"error": str(exc)}
        add_check(f"{provider_label} yönlendirmesi", False, str(exc))
    finally:
        context.close()


def run() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context(viewport={"width": 1440, "height": 1000}, locale="tr-TR")
        page = context.new_page()
        track_console(page)

        wait_for_live(page)
        page.screenshot(path=OUT / "01-home-light.png", full_page=True)
        add_check("Ana sayfa başlığı", "HalkaArzım" in page.locator("body").inner_text())
        add_check("Üst giriş butonu", page.get_by_role("button", name="Giriş yap", exact=True).count() == 1)

        theme_button = page.get_by_role("button", name=re.compile("Koyu temayı aç|Açık temayı aç"))
        theme_button.click()
        page.wait_for_timeout(500)
        dark_theme = page.evaluate("document.documentElement.dataset.theme") == "dark"
        add_check("Koyu tema", dark_theme)
        page.screenshot(path=OUT / "02-home-dark.png", full_page=True)

        open_auth(page)
        dialog = page.get_by_role("dialog")
        add_check("Giriş penceresi", dialog.is_visible())
        for label in ["GitHub ile devam et", "LinkedIn ile devam et", "Spotify ile devam et"]:
            add_check(label, dialog.get_by_role("button", name=label, exact=True).count() == 1)
        page.screenshot(path=OUT / "03-login-modal.png", full_page=True)

        dialog.get_by_label("E-posta").fill("qa-nonexistent@halkaarzim.invalid")
        dialog.get_by_label("Parola").fill("TestPassword123!")
        dialog.get_by_role("button", name="Giriş yap", exact=True).click()
        page.wait_for_timeout(4500)
        dialog_text = dialog.inner_text()
        no_fetch_error = "Failed to fetch" not in dialog_text
        invalid_login_handled = "E-posta adresi veya parola hatalı" in dialog_text
        add_check("Supabase bağlantısı", no_fetch_error, dialog_text[-300:])
        add_check("Güvenli sahte giriş yanıtı", invalid_login_handled, dialog_text[-300:])
        page.screenshot(path=OUT / "04-login-result.png", full_page=True)

        page.get_by_role("button", name="Kapat").click()
        page.goto(f"{BASE_URL}/halka-arzlar", wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(1000)
        filters = ["Tümü", "SPK onaylı", "Talep topluyor", "Yaklaşan", "Arzı tamamlanan", "İşlem gören", "Ertelenen"]
        for label in filters:
            button = page.get_by_role("button", name=re.compile(rf"^{re.escape(label)}"))
            exists = button.count() > 0
            if exists:
                button.first.click()
                page.wait_for_timeout(250)
            add_check(f"Filtre: {label}", exists)
        page.screenshot(path=OUT / "05-ipo-filters.png", full_page=True)

        detail_links = page.get_by_role("link", name=re.compile("Detay|İncele|Aç"))
        if detail_links.count() > 0:
            detail_links.first.click()
            page.wait_for_load_state("domcontentloaded")
            page.wait_for_timeout(800)
            add_check("Halka arz detay rotası", "/arz/" in page.url, page.url)
            page.screenshot(path=OUT / "06-detail-page.png", full_page=True)
        else:
            add_check("Halka arz detay rotası", False, "Detay bağlantısı bulunamadı")

        context.close()

        mobile = browser.new_context(viewport={"width": 390, "height": 844}, locale="tr-TR", device_scale_factor=1)
        mobile_page = mobile.new_page()
        track_console(mobile_page)
        mobile_page.goto(BASE_URL, wait_until="domcontentloaded", timeout=30_000)
        mobile_page.wait_for_timeout(1000)
        overflow = mobile_page.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        add_check("Mobil yatay taşma", not overflow, f"overflow={overflow}")
        mobile_page.screenshot(path=OUT / "07-mobile-home.png", full_page=True)
        menu = mobile_page.get_by_role("button", name="Menüyü aç")
        if menu.count():
            menu.click()
            mobile_page.wait_for_timeout(300)
            mobile_page.screenshot(path=OUT / "08-mobile-menu.png", full_page=True)
            add_check("Mobil menü", True)
        else:
            add_check("Mobil menü", False, "Menü butonu bulunamadı")
        mobile.close()

        for provider in ["GitHub ile devam et", "LinkedIn ile devam et", "Spotify ile devam et"]:
            test_social_redirect(browser, provider)

        browser.close()

    errors = [item for item in report["console_errors"] if "favicon" not in item.lower()]
    add_check("Tarayıcı konsol hataları", len(errors) == 0, "\n".join(errors[:10]))
    report["finished_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    report["passed"] = sum(1 for item in report["checks"] if item["ok"])
    report["failed"] = sum(1 for item in report["checks"] if not item["ok"])
    (OUT / "live-test-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    if report["failed"]:
        raise SystemExit(f"Live test failed: {report['failed']} checks")


if __name__ == "__main__":
    run()
