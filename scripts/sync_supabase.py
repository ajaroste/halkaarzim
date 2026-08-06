from __future__ import annotations

import json
import os
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "generated" / "ipos.json"


def main() -> None:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not service_key:
        print("Supabase secrets are not configured; sync skipped safely.")
        return
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    rows = []
    for item in payload.get("items", []):
        rows.append({
            "id": item["id"],
            "slug": item["slug"],
            "company_name": item["company"],
            "ticker": item.get("ticker"),
            "status": item.get("status", "approved"),
            "approval_date": item.get("approvalDate"),
            "price": item.get("price"),
            "currency": item.get("currency", "TRY"),
            "source_payload": item,
        })
    response = requests.post(
        f"{url}/rest/v1/ipos?on_conflict=id",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=rows,
        timeout=60,
    )
    response.raise_for_status()
    print(f"Synced {len(rows)} IPO records to Supabase")


if __name__ == "__main__":
    main()
