from __future__ import annotations

import json
import os
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from scripts.enrich_ipo_data import apply_manual_overrides

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


def main() -> None:
    if not DATA_PATH.exists():
        raise SystemExit("data/generated/ipos.json bulunamadı")
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    items = apply_manual_overrides(payload.get("items", []))
    validate(items)
    payload["items"] = items
    payload["generatedAt"] = datetime.now(timezone.utc).isoformat()
    payload["updateMode"] = "official-snapshot-plus-reviewed-public-sources"
    payload["networkSyncRequested"] = os.getenv("ALLOW_NETWORK_SYNC", "false").lower() == "true"
    atomic_write(DATA_PATH, payload)
    print(f"Validated and enriched {len(items)} IPO records")


if __name__ == "__main__":
    main()
