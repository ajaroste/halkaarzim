from __future__ import annotations

import unittest

from scripts.document_facts import extract_financials, extract_fund_use, extract_price_stability, extract_promises


class DocumentFactTests(unittest.TestCase):
    def test_financials(self) -> None:
        text = """
        Hasılat (milyon TL) 2024 1.000 2023 800
        Net dönem kârı (milyon TL) 2024 100 2023 80
        """
        rows = extract_financials(text)
        by_year = {row["year"]: row for row in rows}
        self.assertEqual(by_year[2024]["revenue"], 1_000_000_000)
        self.assertEqual(by_year[2023]["netProfit"], 80_000_000)

    def test_fund_use_midpoint(self) -> None:
        text = """
        Makine ve ekipman yatırımları %40-%60
        İşletme sermayesi %20-%30
        """
        rows = extract_fund_use(text)
        values = {row["label"]: row["percentage"] for row in rows}
        self.assertEqual(values["Makine ve ekipman yatırımları"], 50)
        self.assertEqual(values["İşletme sermayesi"], 25)

    def test_promises(self) -> None:
        rows = extract_promises("Ortaklar 1 yıl süreyle dolaşımdaki pay miktarını artırmama taahhüdü vermiştir.")
        self.assertTrue(rows)
        self.assertIn("1 yıl", rows[0]["statement"])
        self.assertFalse(rows[0]["humanReviewed"])

    def test_price_stability(self) -> None:
        result = extract_price_stability("Halka arz sonrası 30 gün boyunca fiyat istikrarı işlemleri planlanmaktadır.")
        self.assertIsNotNone(result)
        self.assertEqual(result["days"], 30)


if __name__ == "__main__":
    unittest.main()
