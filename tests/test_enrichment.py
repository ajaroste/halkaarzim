from __future__ import annotations

import unittest
from datetime import date

from scripts.enrich_ipo_data import apply_manual_overrides, clean_ticker, compute_status, load_manual_overrides, normalize_company_name
from scripts.update_all import preserve_unchanged_source_timestamps


class EnrichmentTests(unittest.TestCase):
    def test_company_normalization(self) -> None:
        self.assertEqual(normalize_company_name("Çağdaş Cam Sanayi ve Ticaret A.Ş."), "cagdas cam")
        self.assertEqual(
            normalize_company_name("Teknika Plast Teknik Kalıp Plastik Sanayi ve Ticaret A.Ş."),
            normalize_company_name("Teknika Plast Teknik Kalıp Plastik San. ve Tic. A.Ş."),
        )

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

    def test_impossible_first_trade_does_not_override_active_demand(self) -> None:
        item = {
            "company": "Örnek Enerji A.Ş.",
            "status": "active",
            "statusLabel": "Talep topluyor",
            "collectionStart": "2026-08-12",
            "collectionEnd": "2026-08-14",
            "firstTradeDate": "2026-08-12",
            "sources": [{"url": "https://example.com/source"}],
        }
        self.assertEqual(compute_status(item, date(2026, 8, 14)), "active")
        cleaned = apply_manual_overrides([item])[0]
        self.assertNotIn("firstTradeDate", cleaned)

    def test_timestamp_only_refresh_is_suppressed(self) -> None:
        original = [{
            "id": "ipo-1",
            "company": "Örnek Enerji A.Ş.",
            "status": "completed",
            "sourceUpdatedAt": "2026-08-18T06:00:00+00:00",
            "sources": [{"url": "https://example.com/source"}],
        }]
        refreshed = [{
            **original[0],
            "sourceUpdatedAt": "2026-08-18T08:00:00+00:00",
        }]
        stabilized = preserve_unchanged_source_timestamps(original, refreshed)
        self.assertEqual(stabilized, original)

    def test_real_data_change_keeps_new_source_timestamp(self) -> None:
        original = [{
            "id": "ipo-1",
            "company": "Örnek Enerji A.Ş.",
            "status": "approved",
            "sourceUpdatedAt": "2026-08-18T06:00:00+00:00",
            "sources": [{"url": "https://example.com/source"}],
        }]
        changed = [{
            **original[0],
            "status": "upcoming",
            "sourceUpdatedAt": "2026-08-18T08:00:00+00:00",
        }]
        stabilized = preserve_unchanged_source_timestamps(original, changed)
        self.assertEqual(stabilized[0]["status"], "upcoming")
        self.assertEqual(stabilized[0]["sourceUpdatedAt"], "2026-08-18T08:00:00+00:00")

    def test_manual_sources_are_public_and_secure(self) -> None:
        rows = load_manual_overrides()
        self.assertIsInstance(rows, list)
        for row in rows:
            for source in row.get("sources", []):
                self.assertTrue(source.get("url", "").startswith("https://"))


if __name__ == "__main__":
    unittest.main()
