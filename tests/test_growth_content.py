from __future__ import annotations

import os
import unittest
from unittest.mock import patch

from scripts.generate_growth_content import build_post, normalized_site_url


class GrowthContentTests(unittest.TestCase):
    def setUp(self) -> None:
        self.item = {
            "id": "00000000-0000-0000-0000-000000000001",
            "slug": "ornek-sanayi",
            "ticker": "ORNK",
            "company": "Örnek Sanayi Anonim Şirketi",
            "status": "approved",
            "statusLabel": "SPK onaylı",
            "price": 12.5,
            "dates": "10–11 Ağustos 2026",
            "capitalIncreaseShares": 80,
            "shareholderSaleShares": 20,
            "sources": [{"title": "SPK Bülteni", "url": "https://example.com/spk.pdf"}],
            "sourceUpdatedAt": "2026-08-06T18:00:00Z",
        }

    def test_generated_posts_include_source_url_and_disclaimer(self) -> None:
        result = build_post(self.item, "https://halkaarzim.site")
        self.assertIn("https://halkaarzim.site/arz/ornek-sanayi", result["x"])
        self.assertIn("Yatırım tavsiyesi değildir", result["x"])
        self.assertIn("Yatırım tavsiyesi değildir", result["telegramHtml"])
        self.assertEqual(len(result["instagramCarousel"]), 5)

    def test_https_custom_domain_is_used(self) -> None:
        with patch.dict(os.environ, {"SITE_URL": "https://halkaarzim.site/"}):
            self.assertEqual(normalized_site_url(), "https://halkaarzim.site")

    def test_insecure_domain_falls_back_to_production(self) -> None:
        with patch.dict(os.environ, {"SITE_URL": "http://example.com"}):
            self.assertEqual(normalized_site_url(), "https://halkaarzim.vercel.app")


if __name__ == "__main__":
    unittest.main()
