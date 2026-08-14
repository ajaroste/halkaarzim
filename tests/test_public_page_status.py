from __future__ import annotations

import unittest

from scripts.public_page_status import extract_public_page_records, merge_public_page_statuses


class PublicPageStatusTests(unittest.TestCase):
    def test_extracts_active_status_from_nearby_card(self) -> None:
        html = """
        <section>
          <div class="card">
            <span>Talep Toplama</span><span>Yıldız Pazar</span>
            <a href="/turker-vangolu-enerji-yatirim-as">Türker Vangölü Enerji Yatırım A.Ş.</a>
            <span>12-13-14 Ağustos 2026</span>
          </div>
          <div class="card">
            <span>Talep Toplama</span><span>Yıldız Pazar</span>
            <a href="/teknika-plast">Teknika Plast Teknik Kalıp Plastik San. ve Tic. A.Ş.</a>
          </div>
        </section>
        """
        items = [
            {"company": "Türker Vangölü Enerji Yatırım A.Ş."},
            {"company": "Teknika Plast Teknik Kalıp Plastik Sanayi ve Ticaret A.Ş."},
        ]
        records = extract_public_page_records(html, items)
        by_company = {row["company"]: row for row in records}
        self.assertEqual(by_company["Türker Vangölü Enerji Yatırım A.Ş."]["status"], "active")
        self.assertEqual(by_company["Türker Vangölü Enerji Yatırım A.Ş."]["collectionStart"], "2026-08-12")
        self.assertEqual(by_company["Türker Vangölü Enerji Yatırım A.Ş."]["collectionEnd"], "2026-08-14")
        self.assertEqual(by_company["Teknika Plast Teknik Kalıp Plastik Sanayi ve Ticaret A.Ş."]["status"], "active")

    def test_merge_preserves_date_driven_completed_status(self) -> None:
        items = [{
            "company": "Çitlekçi Mağazacılık Gıda A.Ş.",
            "status": "completed",
            "statusLabel": "Arzı tamamlandı",
            "collectionStart": "2026-08-10",
            "collectionEnd": "2026-08-12",
            "sources": [],
        }]
        records = [{"company": "Çitlekçi Mağazacılık Gıda A.Ş.", "status": "active"}]
        merged, stats = merge_public_page_statuses(items, records, "https://www.halkaarz.com.tr/")
        self.assertEqual(stats["matched"], 1)
        self.assertEqual(merged[0]["status"], "completed")
        self.assertEqual(merged[0]["statusLabel"], "Arzı tamamlandı")


if __name__ == "__main__":
    unittest.main()
