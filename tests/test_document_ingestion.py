from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from pypdf import PdfWriter

from scripts.ingest_documents import (
    extract_document,
    extract_financial_facts,
    extract_fund_use_facts,
    extract_promise_facts,
    is_direct_pdf,
)


class DocumentIngestionTests(unittest.TestCase):
    def test_pdf_url_detection(self) -> None:
        self.assertTrue(is_direct_pdf("https://spk.gov.tr/data/report.pdf"))
        self.assertTrue(is_direct_pdf("https://kap.org.tr/tr/api/about/content-file/123"))
        self.assertFalse(is_direct_pdf("https://example.com/company"))

    def test_deterministic_document_metadata(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "blank.pdf"
            writer = PdfWriter()
            writer.add_blank_page(width=200, height=200)
            with path.open("wb") as handle:
                writer.write(handle)
            first = extract_document(path, "https://spk.gov.tr/data/blank.pdf", "Test PDF")
            second = extract_document(path, "https://spk.gov.tr/data/blank.pdf", "Test PDF")
            self.assertEqual(first["id"], second["id"])
            self.assertEqual(first["sha256"], second["sha256"])
            self.assertEqual(first["pageCount"], 1)
            self.assertEqual(first["status"], "indexed")

    def test_fact_wrappers(self) -> None:
        self.assertTrue(extract_financial_facts("Hasılat (milyon TL) 2024 100"))
        self.assertTrue(extract_fund_use_facts("Makine yatırımı %50"))
        self.assertTrue(extract_promise_facts("Ortaklar 1 yıl süreyle pay satmama taahhüdü verdi."))


if __name__ == "__main__":
    unittest.main()
