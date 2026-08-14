from __future__ import annotations

import json
import re
import unicodedata
from datetime import date, datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

ROOT = Path(__file__).resolve().parents[1]
MANUAL_PATH = ROOT / "data" / "manual" / "ipo_enrichment.json"

STATUS_LABELS = {
    "active": "Talep topluyor",
    "upcoming": "Yaklaşan",
    "approved": "SPK onaylı",
    "completed": "Arzı tamamlandı",
    "listed": "İşlem görüyor",
    "delayed": "Ertelendi",
    "draft": "Taslak",
}


def _ascii_text(value: Any) -> str:
    text = str(value or "").lower().replace("ı", "i")
    return unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")


def normalize_company_name(value: str) -> str:
    """Normalize company names so public-source abbreviations still match our records."""
    text = _ascii_text(value)
    # Leading brand hints such as "(Intercity)" are not part of the legal title.
    text = re.sub(r"\([^)]*\)", " ", text)
    text = re.sub(r"[^a-z0-9]+", " ", text)
    ignored = {
        "a", "s", "as", "anonim", "anonimortaklik", "sirket", "sirketi",
        "san", "sanayi", "tic", "ticaret", "ve", "ltd", "limited", "sti",
        "st", "inc", "corp", "corporation",
    }
    tokens = [token for token in text.split() if token not in ignored]
    return " ".join(tokens).strip()


def clean_ticker(value: str | None) -> str | None:
    if not value:
        return None
    ticker = value.upper().strip().replace("BIST:", "")
    ticker = re.sub(r"\.(H|E)$", "", ticker)
    ticker = re.sub(r"[^A-Z0-9]", "", ticker)
    if not ticker or len(ticker) < 3 or len(ticker) > 8 or not re.search(r"[A-Z]", ticker):
        return None
    return ticker


def _as_date(value: str | date | None) -> date | None:
    if value is None or isinstance(value, date):
        return value
    return datetime.fromisoformat(value[:10]).date()


def _status_text(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", " ", _ascii_text(value)).strip()


def _validated_first_trade(item: dict[str, Any]) -> date | None:
    first_trade = _as_date(item.get("firstTradeDate"))
    demand_end = _as_date(item.get("collectionEnd") or item.get("demandEnd"))
    # Borsa işlemi talep toplama bitmeden başlayamaz. Some secondary exports
    # expose the demand-start date under a similarly named column; ignore it.
    if first_trade and demand_end and first_trade <= demand_end:
        return None
    return first_trade


def compute_status(item: dict[str, Any], today: date | None = None) -> str:
    """Return the canonical status consumed by the public app and domain contract."""
    today = today or datetime.now(ZoneInfo("Europe/Istanbul")).date()
    raw_status = _status_text(item.get("status"))
    raw_label = _status_text(item.get("statusLabel"))

    if item.get("postponed") or raw_status in {"delayed", "postponed"} or "ertelen" in raw_label:
        return "delayed"
    if raw_status == "draft" or "taslak" in raw_label:
        return "draft"

    first_trade = _validated_first_trade(item)
    demand_start = _as_date(item.get("collectionStart") or item.get("demandStart"))
    demand_end = _as_date(item.get("collectionEnd") or item.get("demandEnd"))
    if first_trade and first_trade <= today:
        return "listed"
    if demand_start and demand_end and demand_start <= today <= demand_end:
        return "active"
    if demand_start and demand_start > today:
        return "upcoming"
    if demand_end and demand_end < today:
        return "completed"

    # Preserve a source status only when dates/trading data cannot decide it.
    if raw_status in STATUS_LABELS:
        return raw_status
    return "approved"


def load_manual_overrides(path: Path = MANUAL_PATH) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("items", payload) if isinstance(payload, dict) else payload
    return rows if isinstance(rows, list) else []


def apply_manual_overrides(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    overrides = load_manual_overrides()
    by_name = {normalize_company_name(row.get("company", "")): row for row in overrides}
    output: list[dict[str, Any]] = []
    for original in items:
        item = dict(original)
        override = by_name.get(normalize_company_name(item.get("company", "")), {})
        for key, value in override.items():
            if key not in {"company", "sources"} and value not in (None, ""):
                item[key] = value

        # Remove an impossible first-trade date before deriving public status.
        if item.get("firstTradeDate") and _validated_first_trade(item) is None:
            item.pop("firstTradeDate", None)

        item["ticker"] = clean_ticker(item.get("ticker"))
        item["status"] = compute_status(item)
        item["statusLabel"] = STATUS_LABELS[item["status"]]
        sources = list(item.get("sources") or [])
        for source in override.get("sources", []):
            if source.get("url") and not any(x.get("url") == source["url"] for x in sources):
                sources.append(source)
        item["sources"] = sources
        output.append(item)
    return output


if __name__ == "__main__":
    source = ROOT / "data" / "generated" / "ipos.json"
    payload = json.loads(source.read_text(encoding="utf-8"))
    payload["items"] = apply_manual_overrides(payload.get("items", []))
    source.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {len(payload['items'])} records")
