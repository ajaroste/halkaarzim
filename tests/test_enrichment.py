from __future__ import annotations

import unittest
from datetime import date

from scripts.enrich_ipo_data import clean_ticker, compute_status, load_manual_overrides, normalize_company_name


class EnrichmentTests(unittest.TestCase):
    def test_company_normalization(self) -> None:
        self.assertEqual(normalize_company_name("Çağdaş Cam Sanayi ve Ticaret A.Ş."), "cagdas cam")

    def test_ticker_cleanup(self) -> None:
        self.assertEqual(clean_ticker("DAGI.H"), "DAGI")
        self.assertEqual(clean_ticker("BIST:TCKRC"), "TCKRC")
        self.assertIsNone(clean_ticker(None))

    def test_status_transitions(self) -> None:
        today = date(2026, 8, 6)
        self.assertEqual(compute_status({"demandStart": "2026-02-04", "demandEnd": "2026-02-05", "firstTradeDate": "2026-02-12"}, today), "listed")
        self.assertEqual(compute_status({"demandStart": "2026-02-04", "demandEnd": "2026-02-05"}, today), "completed")
        self.assertEqual(compute_status({"demandStart": "2026-09-01", "demandEnd": "2026-09-03"}, today), "upcoming")
        self.assertEqual(compute_status({"demandStart": "2026-08-05", "demandEnd": "2026-08-07"}, today), "active")
        self.assertEqual(compute_status({"postponed": True}, today), "delayed")
        self.assertEqual(compute_status({"status": "active"}, today), "active")

    def test_manual_sources_are_public_and_secure(self) -> None:
        rows = load_manual_overrides()
        self.assertIsInstance(rows, list)
        for row in rows:
            for source in row.get("sources", []):
                self.assertTrue(source.get("url", "").startswith("https://"))


if __name__ == "__main__":
    unittest.main()
