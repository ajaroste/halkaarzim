from __future__ import annotations

import os
import re
import unicodedata
from copy import deepcopy
from datetime import datetime, timezone
from typing import Any

import requests
from bs4 import BeautifulSoup, Tag

from scripts.enrich_ipo_data import compute_status
from scripts.public_calendar import STATUS_LABELS, parse_turkish_date_range

DEFAULT_PAGE_URL = "https://www.halkaarz.com.tr/"
SOURCE_TITLE = "HalkaArz.com.tr güncel halka arz takvimi"
SOURCE_KIND = "İkincil kamuya açık veri"

_GENERIC_COMPANY_WORDS = {
    "a", "as", "anonim", "sirket", "sirketi", "san", "sanayi", "tic", "ticaret", "ve", "sti", "ltd"
}


def normalize_text(value: Any) -> str:
    text = str(value or "").strip().lower().replace("ı", "i")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def company_signature(company: str) -> tuple[str, ...]:
    words = [word for word in normalize_text(company).split() if word not in _GENERIC_COMPANY_WORDS and len(word) > 1]
    # Kısa unvanlarda 2, uzun unvanlarda ilk 4 ayırt edici kelime yeterlidir.
    return tuple(words[: min(4, len(words))])


def status_from_text(value: str) -> str | None:
    text = normalize_text(value)
    if not text:
        return None
    if "ertel" in text or "iptal" in text:
        return "delayed"
    if "islem gor" in text or "islemde" in text:
        return "listed"
    if "arz tamam" in text or "tamamlandi" in text:
        return "completed"
    if "talep topl" in text:
        return "active"
    if "yaklas" in text:
        return "upcoming"
    if "spk onay" in text:
        return "approved"
    if "taslak" in text or "basvuru" in text:
        return "draft"
    return None


def _card_text(anchor: Tag) -> str | None:
    """Find the smallest nearby card/container that carries a status label."""
    node: Tag | None = anchor
    for _ in range(6):
        if node is None:
            break
        text = " ".join(node.stripped_strings)
        if text and len(text) <= 900 and status_from_text(text):
            return text
        parent = node.parent
        node = parent if isinstance(parent, Tag) else None
    return None


def extract_public_page_records(html: str, items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    soup = BeautifulSoup(html, "html.parser")
    signatures: list[tuple[tuple[str, ...], dict[str, Any]]] = []
    for item in items:
        company = str(item.get("company") or "").strip()
        signature = company_signature(company)
        if company and len(signature) >= 2:
            signatures.append((signature, item))

    found: dict[str, dict[str, Any]] = {}
    for anchor in soup.find_all("a", href=True):
        if not isinstance(anchor, Tag):
            continue
        anchor_text = normalize_text(" ".join(anchor.stripped_strings))
        if not anchor_text:
            continue
        for signature, item in signatures:
            if not all(word in anchor_text for word in signature):
                continue
            card_text = _card_text(anchor)
            if not card_text:
                continue
            status = status_from_text(card_text)
            if not status:
                continue
            company = str(item["company"])
            record: dict[str, Any] = {"company": company, "status": status}
            start, end = parse_turkish_date_range(card_text)
            if start:
                record["collectionStart"] = start
            if end:
                record["collectionEnd"] = end
            normalized_card = normalize_text(card_text)
            if "yildiz pazar" in normalized_card:
                record["market"] = "Yıldız Pazar"
            elif "ana pazar" in normalized_card:
                record["market"] = "Ana Pazar"
            found[company] = record
            break
    return list(found.values())


def fetch_public_page_records(
    items: list[dict[str, Any]], url: str | None = None, timeout: int = 25
) -> tuple[list[dict[str, Any]], str]:
    url = url or os.getenv("IPO_PUBLIC_PAGE_URL", DEFAULT_PAGE_URL)
    headers = {
        "User-Agent": "HalkaArzimDataSync/1.1 (+https://halkaarzim.vercel.app)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.6",
    }
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    records = extract_public_page_records(response.text, items)
    return records, url


def merge_public_page_statuses(
    items: list[dict[str, Any]], records: list[dict[str, Any]], source_url: str
) -> tuple[list[dict[str, Any]], dict[str, int]]:
    output = [deepcopy(item) for item in items]
    by_company = {str(item.get("company") or ""): index for index, item in enumerate(output)}
    stats = {"matched": 0, "changed": 0}
    now_iso = datetime.now(timezone.utc).isoformat()

    for record in records:
        company = str(record.get("company") or "")
        index = by_company.get(company)
        if index is None:
            continue
        stats["matched"] += 1
        item = output[index]
        changed = False

        for field in ("collectionStart", "collectionEnd", "market"):
            value = record.get(field)
            if value not in (None, "") and item.get(field) != value:
                item[field] = value
                changed = True

        reported_status = record.get("status")
        if reported_status and item.get("status") != reported_status:
            item["status"] = reported_status
            changed = True

        computed = compute_status(item)
        label = STATUS_LABELS.get(computed, item.get("statusLabel") or "SPK onaylı")
        if item.get("status") != computed:
            item["status"] = computed
            changed = True
        if item.get("statusLabel") != label:
            item["statusLabel"] = label
            changed = True

        sources = list(item.get("sources") or [])
        if not any(source.get("url") == source_url for source in sources):
            sources.append({
                "title": SOURCE_TITLE,
                "page": "Ana sayfa güncel halka arz kartları",
                "kind": SOURCE_KIND,
                "url": source_url,
            })
            item["sources"] = sources
            changed = True

        if changed:
            item["sourceUpdatedAt"] = now_iso
            stats["changed"] += 1

    return output, stats
