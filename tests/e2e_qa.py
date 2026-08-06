from __future__ import annotations

from playwright.sync_api import sync_playwright

BASE = "http://127.0.0.1:8765"


def main() -> None:
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1365, "height": 900})
        errors: list[str] = []
        page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)

        page.goto(BASE, wait_until="networkidle")
        page.locator("#open-list").click()
        page.wait_for_url("**/halka-arzlar/")
        assert page.locator(".card").count() >= 30

        page.locator("[data-filter='trading']").click()
        visible = page.locator(".card:not(.hidden)").count()
        assert visible >= 1
        assert page.locator("#result-count").inner_text() == str(visible)

        before = page.locator("html").get_attribute("data-theme")
        page.locator("#theme-toggle").click()
        after = page.locator("html").get_attribute("data-theme")
        assert before != after

        page.locator("[data-filter='all']").click()
        quick = page.locator(".card", has_text="QUICK")
        if quick.count():
            quick.first.click()
            page.wait_for_load_state("networkidle")
            assert page.locator("[data-symbol='BIST:QUICK']").count() == 1
            assert "Apple Inc" not in page.content()
            assert "AAPL" not in page.content()

        mobile = browser.new_page(viewport={"width": 390, "height": 844})
        mobile.goto(f"{BASE}/halka-arzlar/", wait_until="networkidle")
        overflow = mobile.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth")
        assert not overflow
        assert not errors, f"Browser console errors: {errors}"
        browser.close()
    print("e2e_qa: filters, theme, detail route and mobile layout passed")


if __name__ == "__main__":
    main()
