from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from scripts.enrich_ipo_data import apply_manual_overrides
from scripts.sync_public_calendar import (
    DEFAULT_PUBLIC_CALENDAR_URL,
    PublicCalendarSyncError,
    fetch_public_rows,
    merge_public_calendar,
)

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "generated" / "ipos.json"


def env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def validate(items: list[dict]) -> None:
    ids: set[str] = set()
    slugs: set[str] = set()
    for item in items:
        if not item.get("id") or item["id"] in ids:
            raise ValueError(f"Geçersiz/tekrarlanan id: {item.get('id')}")
        if not item.get("slug") or item["slug"] in slugs:
            raise ValueError(f"Geçersiz/tekrarlanan slug: {item.get('slug')}")
        if not item.get("company") or not item.get("sources"):
            raise ValueError(f"Kaynak veya şirket adı eksik: {item.get('company')}")
        if not any(str(source.get("url", "")).startswith("https://") for source in item["sources"]):
            raise ValueError(f"HTTPS resmî kaynak eksik: {item['company']}")
        ids.add(item["id"])
        slugs.add(item["slug"])


def atomic_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary = Path(handle.name)
    temporary.replace(path)


def sync_live_public_calendar(items: list[dict]) -> list[dict]:
    if not env_bool("ALLOW_NETWORK_SYNC"):
        print("Network IPO sync disabled; using repository snapshot and reviewed overrides")
        return items

    source_url = os.getenv("PUBLIC_IPO_CALENDAR_URL", DEFAULT_PUBLIC_CALENDAR_URL).strip()
    required = env_bool("PUBLIC_CALENDAR_REQUIRED")
    minimum_matches = max(1, int(os.getenv("PUBLIC_CALENDAR_MIN_MATCHES", "1")))

    try:
        source_rows = fetch_public_rows(source_url)
        merged, report = merge_public_calendar(items, source_rows, source_url)
        expected_matches = min(minimum_matches, len(items))
        if report.matched_rows < expected_matches:
            raise PublicCalendarSyncError(
                f"Takvim kaynağı okundu ancak yalnızca {report.matched_rows}/{len(items)} mevcut halka arz eşleşti; "
                f"en az {expected_matches} eşleşme bekleniyordu"
            )
        print(
            "Public calendar sync: "
            f"rows={report.source_rows}, matched={report.matched_rows}, changed={report.changed_items}"
        )
        if report.unmatched_companies:
            print("Unmatched public-calendar rows (sample): " + " | ".join(report.unmatched_companies[:10]))
        return merged
    except (PublicCalendarSyncError, ValueError) as exc:
        if required:
            raise
        print(f"WARNING: live public calendar sync skipped: {exc}")
        return items


def main() -> None:
    if not DATA_PATH.exists():
        raise SystemExit("data/generated/ipos.json bulunamadı")

    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    original_items = payload.get("items", [])

    # Network data is merged first. Reviewed/manual values remain the final authority.
    live_items = sync_live_public_calendar(original_items)
    items = apply_manual_overrides(live_items)
    validate(items)

    update_mode = "official-snapshot-plus-live-calendar-plus-reviewed-overrides"
    network_sync_requested = env_bool("ALLOW_NETWORK_SYNC")
    changed = items != original_items or payload.get("updateMode") != update_mode

    if not changed:
        print(f"No IPO data change; kept existing snapshot timestamp for {len(items)} records")
        return

    payload["items"] = items
    payload["generatedAt"] = datetime.now(timezone.utc).isoformat()
    payload["updateMode"] = update_mode
    payload["networkSyncRequested"] = network_sync_requested
    atomic_write(DATA_PATH, payload)
    print(f"Updated {len(items)} IPO records with real data changes")


if __name__ == "__main__":
    main()
