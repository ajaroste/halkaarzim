from __future__ import annotations

import json
import unittest
from datetime import date
from io import BytesIO

from openpyxl import Workbook

from scripts.sync_public_calendar import (
    merge_public_calendar,
    parse_collection_dates,
    parse_json_rows,
    parse_xlsx_rows,
)


class PublicCalendarSyncTests(unittest.TestCase):
    def test_compact_turkish_date_range(self) -> None:
        start, end = parse_collection_dates("12-13-14 Ağustos 2026")
        self.assertEqual(start, date(2026, 8, 12))
        self.assertEqual(end, date(2026, 8, 14))

    def test_explicit_numeric_date_range(self) -> None:
        start, end = parse_collection_dates("12.08.2026 - 14.08.2026")
        self.assertEqual(start, date(2026, 8, 12))
        self.assertEqual(end, date(2026, 8, 14))

    def test_xlsx_headers_and_merge(self) -> None:
        workbook = Workbook()
        sheet = workbook.active
        sheet.append([
            "Şirket Adı",
            "Borsa Kodu",
            "Talep Toplama Tarihleri",
            "Halka Arz Fiyatı",
            "Dağıtım Yöntemi",
            "Aracı Kurum",
            "Pazar",
        ])
        sheet.append([
            "Türker Vangölü Enerji Yatırım A.Ş.",
            "VEYAS",
            "12-13-14 Ağustos 2026",
            "999,00",
            "Eşit Dağıtım",
            "Örnek Yatırım A.Ş.",
            "Yıldız Pazar",
        ])
        stream = BytesIO()
        workbook.save(stream)

        source_rows = parse_xlsx_rows(stream.getvalue())
        items = [{
            "company": "Türker Vangölü Enerji Yatırım A.Ş.",
            "price": 136.0,
            "sources": [{"url": "https://spk.gov.tr/test"}],
        }]
        merged, report = merge_public_calendar(items, source_rows)

        self.assertEqual(report.matched_rows, 1)
        self.assertEqual(report.changed_items, 1)
        self.assertEqual(merged[0]["ticker"], "VEYAS")
        self.assertEqual(merged[0]["collectionStart"], "2026-08-12")
        self.assertEqual(merged[0]["collectionEnd"], "2026-08-14")
        self.assertEqual(merged[0]["dates"], "12-13-14 Ağustos 2026")
        self.assertEqual(merged[0]["price"], 136.0, "SPK fiyatı ikincil kaynakla ezilmemeli")

    def test_json_source_is_supported(self) -> None:
        payload = {
            "data": [{
                "Şirket Adı": "Kapeks Kimya Sanayi A.Ş.",
                "Borsa Kodu": "KPEKS",
                "Talep Toplama Tarihleri": "12-13-14 Ağustos 2026",
            }]
        }
        rows = parse_json_rows(json.dumps(payload, ensure_ascii=False).encode("utf-8"))
        self.assertEqual(rows[0]["company"], "Kapeks Kimya Sanayi A.Ş.")
        self.assertEqual(rows[0]["ticker"], "KPEKS")

    def test_company_name_abbreviation_matches(self) -> None:
        items = [{
            "company": "Teknika Plast Teknik Kalıp Plastik Sanayi ve Ticaret A.Ş.",
            "price": 85.4,
            "sources": [{"url": "https://spk.gov.tr/test"}],
        }]
        source_rows = [{
            "company": "Teknika Plast Teknik Kalıp Plastik San. ve Tic. A.Ş.",
            "ticker": "TNKKA",
            "dates": "12-13-14 Ağustos 2026",
        }]
        merged, report = merge_public_calendar(items, source_rows)
        self.assertEqual(report.matched_rows, 1)
        self.assertEqual(merged[0]["ticker"], "TNKKA")
        self.assertEqual(merged[0]["collectionStart"], "2026-08-12")


if __name__ == "__main__":
    unittest.main()
