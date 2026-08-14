from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from scripts.enrich_ipo_data import apply_manual_overrides
from scripts.public_calendar import fetch_public_export, merge_public_records

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "generated" / "ipos.json"


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
            raise ValueError(f"HTTPS kaynak eksik: {item['company']}")
        ids.add(item["id"])
        slugs.add(item["slug"])


def atomic_write(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary = Path(handle.name)
    temporary.replace(path)


def main() -> None:
    if not DATA_PATH.exists():
        raise SystemExit("data/generated/ipos.json bulunamadı")

    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    original_items = payload.get("items", [])
    items = original_items

    network_sync_requested = os.getenv("ALLOW_NETWORK_SYNC", "false").lower() == "true"
    if network_sync_requested:
        try:
            records, source_url = fetch_public_export()
            items, stats = merge_public_records(items, records, source_url)
            print(
                "Public calendar sync: "
                f"{len(records)} rows, {stats['matched']} matched, "
                f"{stats['changed']} changed, {stats['added']} added, {stats['ignored']} ignored"
            )
        except Exception as exc:
            if os.getenv("NETWORK_SYNC_REQUIRED", "true").lower() == "true":
                raise
            print(f"WARNING: public calendar sync skipped: {exc}")

    # Elle doğrulanmış kayıtlar son katmandır; otomatik kaynak bunları ezemez.
    items = apply_manual_overrides(items)
    validate(items)

    update_mode = "official-snapshot-plus-live-public-calendar-v2"
    changed = (
        items != original_items
        or payload.get("updateMode") != update_mode
        or payload.get("networkSyncRequested") != network_sync_requested
        or payload.get("recordCount") != len(items)
    )

    if not changed:
        print(f"No IPO data change; kept existing snapshot timestamp for {len(items)} records")
        return

    payload["items"] = items
    payload["recordCount"] = len(items)
    payload["generatedAt"] = datetime.now(timezone.utc).isoformat()
    payload["updateMode"] = update_mode
    payload["networkSyncRequested"] = network_sync_requested
    atomic_write(DATA_PATH, payload)
    print(f"Updated {len(items)} IPO records with live calendar and reviewed overrides")


if __name__ == "__main__":
    main()
