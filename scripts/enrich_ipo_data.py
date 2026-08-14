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
ISTANBUL = ZoneInfo("Europe/Istanbul")


def normalize_company_name(value: str) -> str:
    text = value.lower().replace("ı", "i")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"\b(a\.?s\.?|anonim sirketi|sanayi|ticaret|ve)\b", " ", text)
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def clean_ticker(value: str | None) -> str | None:
    if not value:
        return None
    ticker = value.upper().strip().replace("BIST:", "")
    ticker = re.sub(r"\.(H|E)$", "", ticker)
    ticker = re.sub(r"[^A-Z0-9]", "", ticker)
    return ticker or None


def _as_date(value: str | date | None) -> date | None:
    if value is None or isinstance(value, date):
        return value
    return datetime.fromisoformat(value[:10]).date()


def compute_status(item: dict[str, Any], today: date | None = None) -> str:
    """Return the canonical status consumed by the public app and domain contract."""
    today = today or datetime.now(ISTANBUL).date()
    if item.get("postponed"):
        return "delayed"
    first_trade = _as_date(item.get("firstTradeDate"))
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
        item["ticker"] = clean_ticker(item.get("ticker"))
        item["status"] = compute_status(item)
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
