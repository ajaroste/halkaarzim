from __future__ import annotations

import unittest
from datetime import date
from io import BytesIO

from openpyxl import Workbook

from scripts.public_calendar import merge_public_records, parse_export, parse_turkish_date_range


class PublicCalendarTests(unittest.TestCase):
    def test_parse_turkish_date_range(self) -> None:
        self.assertEqual(parse_turkish_date_range("12-13-14 Ağustos 2026"), ("2026-08-12", "2026-08-14"))
        self.assertEqual(parse_turkish_date_range("29-30 Haziran, 1 Temmuz 2026"), ("2026-06-29", "2026-07-01"))
        self.assertEqual(parse_turkish_date_range("12.08.2026"), ("2026-08-12", "2026-08-12"))

    def test_parse_export_and_merge_existing_company(self) -> None:
        workbook = Workbook()
        sheet = workbook.active
        sheet.append(["Şirket Adı", "BIST Kodu", "Durum", "Talep Toplama Tarihi", "Fiyat", "Pay / Lot", "Dağıtım Yöntemi"])
        sheet.append(["Türker Vangölü Enerji Yatırım A.Ş.", "VEYAS", "Talep Toplama", "12-13-14 Ağustos 2026", "136,00 TL", "65.000.000 Lot", "Eşit Dağıtım"])
        buffer = BytesIO()
        workbook.save(buffer)

        records = parse_export(buffer.getvalue())
        self.assertEqual(records[0]["ticker"], "VEYAS")
        self.assertEqual(records[0]["collectionStart"], "2026-08-12")
        self.assertEqual(records[0]["collectionEnd"], "2026-08-14")
        self.assertEqual(records[0]["lotCount"], 65_000_000)

        items = [{
            "id": "289e3024-2ae6-517e-9798-e6986266ccd2",
            "slug": "turker-vangolu-enerji-yatirim",
            "company": "Türker Vangölü Enerji Yatırım A.Ş.",
            "ticker": None,
            "status": "approved",
            "statusLabel": "SPK onaylı",
            "sources": [{"title": "SPK", "url": "https://spk.gov.tr/test.pdf", "type": "SPK"}],
        }]
        merged, stats = merge_public_records(items, records, "https://api.halkaarz.com.tr/export.xlsx", today=date(2026, 8, 13))
        self.assertEqual(stats["changed"], 1)
        self.assertEqual(merged[0]["ticker"], "VEYAS")
        self.assertEqual(merged[0]["status"], "active")
        self.assertEqual(merged[0]["statusLabel"], "Talep topluyor")

    def test_source_status_is_preserved_without_dates(self) -> None:
        items = [{
            "id": "ea5b2229-c096-536e-bf4f-b4ce8b32e1c8",
            "slug": "kapeks-kimya-sanayi",
            "company": "Kapeks Kimya Sanayi A.Ş.",
            "status": "approved",
            "statusLabel": "SPK onaylı",
            "sources": [{"title": "SPK", "url": "https://spk.gov.tr/test.pdf", "type": "SPK"}],
        }]
        records = [{"company": "Kapeks Kimya Sanayi A.Ş.", "ticker": "KPEKS", "status": "active"}]
        merged, _ = merge_public_records(items, records, "https://api.halkaarz.com.tr/export.xlsx", today=date(2026, 8, 13))
        self.assertEqual(merged[0]["status"], "active")


if __name__ == "__main__":
    unittest.main()
