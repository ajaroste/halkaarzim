from __future__ import annotations

import hashlib
import json
import tempfile
import uuid
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import requests
from pypdf import PdfReader

from scripts.document_facts import (
    extract_financials,
    extract_fund_use,
    extract_price_stability,
    extract_promises,
)

ROOT = Path(__file__).resolve().parents[1]
DOCUMENT_INDEX = ROOT / "data" / "generated" / "documents.json"
NAMESPACE = uuid.UUID("e0e91d66-5062-45d2-8d3c-fd25a691aa6e")


def is_direct_pdf(url: str) -> bool:
    path = urlparse(url).path.lower()
    return path.endswith(".pdf") or "/content-file/" in path or "/data/" in path


def _read_pdf(path: Path) -> tuple[int, str]:
    reader = PdfReader(str(path))
    pages: list[str] = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception:
            pages.append("")
    return len(reader.pages), "\n\n".join(pages)


def extract_document(path: Path, source_url: str, title: str = "Resmî belge") -> dict[str, Any]:
    payload = path.read_bytes()
    digest = hashlib.sha256(payload).hexdigest()
    page_count, text = _read_pdf(path)
    document_id = str(uuid.uuid5(NAMESPACE, f"{source_url}|{digest}"))
    evidence = []
    if text.strip():
        evidence.append({"page": 1, "excerpt": " ".join(text.split())[:500]})
    return {
        "id": document_id,
        "title": title,
        "sourceUrl": source_url,
        "sha256": digest,
        "pageCount": page_count,
        "status": "indexed",
        "humanReviewed": False,
        "evidence": evidence,
        "facts": {
            "financials": extract_financials(text),
            "fundUse": extract_fund_use(text),
            "promises": extract_promises(text),
            "priceStability": extract_price_stability(text),
        },
    }


def extract_financial_facts(text: str) -> list[dict[str, Any]]:
    return extract_financials(text)


def extract_fund_use_facts(text: str) -> list[dict[str, Any]]:
    return extract_fund_use(text)


def extract_promise_facts(text: str) -> list[dict[str, Any]]:
    return extract_promises(text)


def download_pdf(url: str, destination: Path) -> None:
    response = requests.get(url, timeout=45, headers={"User-Agent": "HalkaArzim/1.0"})
    response.raise_for_status()
    if not response.content.startswith(b"%PDF"):
        raise ValueError(f"PDF olmayan yanıt: {url}")
    destination.write_bytes(response.content)


def ingest_sources(sources: list[dict[str, str]]) -> list[dict[str, Any]]:
    results: list[dict[str, Any]] = []
    with tempfile.TemporaryDirectory() as directory:
        base = Path(directory)
        for index, source in enumerate(sources):
            url = source.get("url", "")
            if not url or not is_direct_pdf(url):
                continue
            destination = base / f"document-{index}.pdf"
            try:
                download_pdf(url, destination)
                results.append(extract_document(destination, url, source.get("title", "Resmî belge")))
            except Exception as exc:
                results.append({
                    "title": source.get("title", "Resmî belge"),
                    "sourceUrl": url,
                    "status": "failed",
                    "error": str(exc),
                })
    return results


def save_documents(documents: list[dict[str, Any]], path: Path = DOCUMENT_INDEX) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"items": documents}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    source_path = ROOT / "data" / "generated" / "ipos.json"
    payload = json.loads(source_path.read_text(encoding="utf-8"))
    sources: list[dict[str, str]] = []
    for item in payload.get("items", []):
        sources.extend(item.get("documents", []))
    documents = ingest_sources(sources)
    save_documents(documents)
    print(f"Indexed {len(documents)} documents")
