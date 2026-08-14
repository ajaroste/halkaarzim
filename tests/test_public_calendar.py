from __future__ import annotations

import unittest
from datetime import date
from io import BytesIO

from openpyxl import Workbook

from scripts.enrich_ipo_data import normalize_company_name
from scripts.public_calendar import merge_public_records, parse_export, parse_turkish_date_range


class PublicCalendarTests(unittest.TestCase):
    def test_parse_turkish_date_range(self) -> None:
        self.assertEqual(parse_turkish_date_range("12-13-14 Ağustos 2026"), ("2026-08-12", "2026-08-14"))
        self.assertEqual(parse_turkish_date_range("12-13-14 Ağustos 2026 09:00-17:00"), ("2026-08-12", "2026-08-14"))
        self.assertEqual(parse_turkish_date_range("29-30 Haziran, 1 Temmuz 2026"), ("2026-06-29", "2026-07-01"))
        self.assertEqual(parse_turkish_date_range("12.08.2026"), ("2026-08-12", "2026-08-12"))

    def test_company_abbreviations_normalize_to_same_key(self) -> None:
        full = "Teknika Plast Teknik Kalıp Plastik Sanayi ve Ticaret A.Ş."
        abbreviated = "Teknika Plast Teknik Kalıp Plastik San. ve Tic. A.Ş."
        self.assertEqual(normalize_company_name(full), normalize_company_name(abbreviated))

    def test_parse_export_and_merge_existing_company(self) -> None:
        workbook = Workbook()
        sheet = workbook.active
        sheet.append(["Şirket Adı", "BIST Kodu", "Durum", "Talep Toplama Tarihleri", "Fiyat", "Pay / Lot", "Dağıtım Yöntemi"])
        sheet.append([
            "Türker Vangölü Enerji Yatırım A.Ş.",
            "VEYAS",
            "Talep Toplama",
            "12-13-14 Ağustos 2026 09:00-17:00",
            "136,00 TL",
            "65.000.000 Lot",
            "Eşit Dağıtım",
        ])
        buffer = BytesIO()
        workbook.save(buffer)

        records = parse_export(buffer.getvalue())
        self.assertEqual(records[0]["ticker"], "VEYAS")
        self.assertEqual(records[0]["collectionStart"], "2026-08-12")
        self.assertEqual(records[0]["collectionEnd"], "2026-08-14")
        self.assertEqual(records[0]["dates"], "12-13-14 Ağustos 2026")
        self.assertEqual(records[0]["lotCount"], 65_000_000)

        items = [{
            "id": "74651958-3df4-5835-a3cf-f4415a752567",
            "slug": "turker-vangolu-enerji-yatirim",
            "company": "Türker Vangölü Enerji Yatırım A.Ş.",
            "ticker": None,
            "price": 136.0,
            "lotCount": 65_000_000,
            "status": "approved",
            "statusLabel": "SPK onaylı",
            "sources": [{"title": "SPK", "url": "https://spk.gov.tr/test.pdf", "type": "SPK"}],
        }]
        merged, stats = merge_public_records(items, records, "https://api.halkaarz.com.tr/export.xlsx", today=date(2026, 8, 13))
        self.assertEqual(stats["changed"], 1)
        self.assertEqual(merged[0]["ticker"], "VEYAS")
        self.assertEqual(merged[0]["status"], "active")
        self.assertEqual(merged[0]["statusLabel"], "Talep topluyor")
        self.assertEqual(merged[0]["dates"], "12-13-14 Ağustos 2026")

    def test_abbreviated_source_company_merges_without_duplicate(self) -> None:
        items = [{
            "id": "1b5c255c-2efc-5334-a00b-b7276fb4cd8b",
            "slug": "teknika-plast-teknik-kalip-plastik-sanayi-ve-ticaret",
            "company": "Teknika Plast Teknik Kalıp Plastik Sanayi ve Ticaret A.Ş.",
            "price": 85.4,
            "lotCount": 31_000_000,
            "status": "approved",
            "statusLabel": "SPK onaylı",
            "sources": [{"title": "SPK", "url": "https://spk.gov.tr/test.pdf", "type": "SPK"}],
        }]
        records = [{
            "company": "Teknika Plast Teknik Kalıp Plastik San. ve Tic. A.Ş.",
            "collectionStart": "2026-08-12",
            "collectionEnd": "2026-08-14",
            "dates": "12-13-14 Ağustos 2026",
            "intermediary": "Tera Yatırım Menkul Değerler A.Ş.",
        }]
        merged, stats = merge_public_records(items, records, "https://api.halkaarz.com.tr/export.xlsx", today=date(2026, 8, 14))
        self.assertEqual(len(merged), 1)
        self.assertEqual(stats["matched"], 1)
        self.assertEqual(stats["added"], 0)
        self.assertEqual(merged[0]["status"], "active")
        self.assertEqual(merged[0]["collectionStart"], "2026-08-12")
        self.assertEqual(merged[0]["collectionEnd"], "2026-08-14")

    def test_secondary_source_does_not_overwrite_spk_price_or_lots(self) -> None:
        items = [{
            "id": "ea5b2229-c096-536e-bf4f-b4ce8b32e1c8",
            "slug": "kapeks-kimya-sanayi",
            "company": "Kapeks Kimya Sanayi A.Ş.",
            "price": 94.0,
            "lotCount": 25_100_000,
            "status": "approved",
            "statusLabel": "SPK onaylı",
            "sources": [{"title": "SPK", "url": "https://spk.gov.tr/test.pdf", "type": "SPK"}],
        }]
        records = [{
            "company": "Kapeks Kimya Sanayi A.Ş.",
            "price": 999.0,
            "lotCount": 1,
            "collectionStart": "2026-08-12",
            "collectionEnd": "2026-08-14",
        }]
        merged, _ = merge_public_records(items, records, "https://api.halkaarz.com.tr/export.xlsx", today=date(2026, 8, 14))
        self.assertEqual(merged[0]["price"], 94.0)
        self.assertEqual(merged[0]["lotCount"], 25_100_000)
        self.assertEqual(merged[0]["status"], "active")

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
