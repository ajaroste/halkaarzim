from __future__ import annotations

import json
import unittest
from pathlib import Path

from scripts.ingest_spk import (
    deterministic_analysis,
    parse_bulletin_meta,
    parse_initial_public_offerings,
    parse_number,
    tr_slug,
)

ROOT = Path(__file__).resolve().parents[1]


class SpkParserTests(unittest.TestCase):
    def test_turkish_numbers(self) -> None:
        self.assertEqual(parse_number("1.250.000"), 1_250_000)
        self.assertEqual(parse_number("25,50"), 25.5)
        self.assertEqual(parse_number("-"), 0)

    def test_slug(self) -> None:
        self.assertEqual(tr_slug("Çağdaş Cam Sanayi A.Ş."), "cagdas-cam-sanayi")

    def test_bulletin_meta(self) -> None:
        text = "SERMAYE PİYASASI KURULU BÜLTENİ 2026/49 05.08.2026"
        self.assertEqual(parse_bulletin_meta(text, "https://spk.gov.tr/2026-49.pdf"), ("2026/49", "2026-08-05"))

    def test_single_offering(self) -> None:
        text = """
        SERMAYE PİYASASI KURULU BÜLTENİ 2026/49 05.08.2026
        İlk Halka Arzlar
        Örnek Teknoloji A.Ş. 100.000.000 120.000.000 20.000.000 0 0 0 25,00
        2. Halka Açık Ortaklıkların Başvuruları
        """
        items = parse_initial_public_offerings(text, "https://spk.gov.tr/data/2026-49.pdf")
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0]["price"], 25)
        self.assertEqual(items[0]["capitalIncreaseShares"], 20_000_000)
        self.assertTrue(items[0]["sources"][0]["url"].startswith("https://spk.gov.tr"))

    def test_multiple_rows(self) -> None:
        text = """
        SERMAYE PİYASASI KURULU BÜLTENİ 2026/50 06.08.2026
        İlk Halka Arzlar
        Alfa Enerji A.Ş. 10.000.000 12.000.000 2.000.000 0 0 0 10,00
        Beta Gıda A.Ş. 20.000.000 25.000.000 5.000.000 0 1.000.000 0 15,50
        2. Halka Açık Ortaklıkların Başvuruları
        """
        items = parse_initial_public_offerings(text, "https://spk.gov.tr/data/2026-50.pdf")
        self.assertEqual(len(items), 2)
        self.assertEqual(items[1]["shareholderSaleShares"], 1_000_000)

    def test_deterministic_analysis(self) -> None:
        analysis = deterministic_analysis({
            "capitalIncreaseShares": 80,
            "shareholderSaleShares": 20,
            "extraSaleShares": 0,
        })
        self.assertGreaterEqual(analysis["aiScore"], 20)
        self.assertLessEqual(analysis["aiScore"], 90)
        self.assertEqual(analysis["analysisModel"], "rules-v1")
        self.assertFalse(analysis["humanReviewed"])

    def test_generated_snapshot(self) -> None:
        payload = json.loads((ROOT / "data" / "generated" / "ipos.json").read_text(encoding="utf-8"))
        items = payload.get("items", [])
        self.assertGreaterEqual(len(items), 30)
        self.assertTrue(all(item.get("sources") for item in items))
        self.assertTrue(all(not item.get("company", "").startswith("Nova Enerji") for item in items))


if __name__ == "__main__":
    unittest.main()
