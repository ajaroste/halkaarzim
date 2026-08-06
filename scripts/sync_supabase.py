from __future__ import annotations

import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "generated" / "ipos.json"
COMPANY_NAMESPACE = uuid.UUID("a45802ba-a0c3-4ea5-b306-7807da7a6e01")
STATUS_MAP = {
    "draft": "draft",
    "approved": "approved",
    "upcoming": "approved",
    "active": "collecting",
    "completed": "listing_pending",
    "listed": "listed",
    "delayed": "cancelled",
}


def headers(service_key: str, prefer: str | None = None) -> dict[str, str]:
    value = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        value["Prefer"] = prefer
    return value


def company_id(slug: str) -> str:
    return str(uuid.uuid5(COMPANY_NAMESPACE, slug))


def fetch_existing_ipo_ids(url: str, service_key: str) -> set[str]:
    response = requests.get(
        f"{url}/rest/v1/ipos",
        params={"select": "id", "limit": "10000"},
        headers=headers(service_key),
        timeout=60,
    )
    if response.status_code == 404:
        return set()
    response.raise_for_status()
    return {str(row["id"]) for row in response.json()}


def upsert(url: str, service_key: str, table: str, rows: list[dict], conflict: str = "id") -> None:
    if not rows:
        return
    response = requests.post(
        f"{url}/rest/v1/{table}",
        params={"on_conflict": conflict},
        headers=headers(service_key, "resolution=merge-duplicates,return=minimal"),
        json=rows,
        timeout=90,
    )
    response.raise_for_status()


def main() -> None:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    if not url or not service_key:
        print("Supabase secrets are not configured; sync skipped safely.")
        return

    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    items = payload.get("items", [])
    existing_ids = fetch_existing_ipo_ids(url, service_key)
    now = datetime.now(timezone.utc).isoformat()

    companies: list[dict] = []
    ipos: list[dict] = []
    for item in items:
        cid = company_id(item["slug"])
        companies.append({
            "id": cid,
            "legal_name": item["company"],
            "short_name": item["company"],
            "slug": item["slug"],
            "ticker": item.get("ticker"),
            "sector": item.get("sector"),
            "updated_at": now,
        })
        ipos.append({
            "id": item["id"],
            "company_id": cid,
            "status": STATUS_MAP.get(item.get("status", "approved"), "approved"),
            "offer_price": item.get("price"),
            "total_lots": item.get("lotCount"),
            "distribution_method": item.get("distribution"),
            "collection_start": item.get("collectionStart"),
            "collection_end": item.get("collectionEnd"),
            "first_trade_date": item.get("firstTradeDate"),
            "market_name": item.get("market"),
            "intermediary": item.get("intermediary"),
            "capital_increase_lots": item.get("capitalIncreaseShares", 0),
            "shareholder_sale_lots": item.get("shareholderSaleShares", 0),
            "currency": item.get("currency", "TRY"),
            "source_checked_at": item.get("sourceUpdatedAt") or payload.get("generatedAt") or now,
            "published_at": item.get("sourceUpdatedAt") or payload.get("generatedAt") or now,
            "updated_at": now,
        })

    upsert(url, service_key, "companies", companies)
    upsert(url, service_key, "ipos", ipos)

    new_items = [item for item in items if item["id"] not in existing_ids]
    enqueue = os.getenv("ENABLE_NOTIFICATION_ENQUEUE", "false").lower() == "true"
    initial_import = not existing_ids
    if enqueue and new_items and not initial_import:
        outbox = [{
            "ipo_id": item["id"],
            "event_key": f"new_ipo:{item['id']}",
            "title": "Yeni halka arz firması",
            "body": f"{item['company']} halka arz listesine eklendi.",
            "target_url": f"/arz/{item['slug']}",
            "payload": {
                "company": item["company"],
                "slug": item["slug"],
                "ticker": item.get("ticker"),
                "status": item.get("status"),
            },
        } for item in new_items]
        upsert(url, service_key, "notification_outbox", outbox, "ipo_id,event_key")
        print(f"Queued {len(outbox)} new IPO notification event(s)")
    elif initial_import:
        print("Initial Supabase import detected; existing IPOs were not announced as new.")

    print(f"Synced {len(companies)} companies and {len(ipos)} IPO records to Supabase")


if __name__ == "__main__":
    main()
