from __future__ import annotations

import base64
import json
import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from pywebpush import WebPushException, webpush


def api_headers(service_key: str, prefer: str | None = None) -> dict[str, str]:
    value = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Content-Type": "application/json",
    }
    if prefer:
        value["Prefer"] = prefer
    return value


def resolve_private_key(value: str) -> tuple[str, Path | None]:
    if not value.startswith("base64:"):
        return value, None
    raw = base64.b64decode(value.removeprefix("base64:"))
    handle = tempfile.NamedTemporaryFile("wb", suffix=".pem", delete=False)
    handle.write(raw)
    handle.close()
    path = Path(handle.name)
    return str(path), path


def patch_outbox(url: str, service_key: str, row_id: str, payload: dict) -> None:
    response = requests.patch(
        f"{url}/rest/v1/notification_outbox",
        params={"id": f"eq.{row_id}"},
        headers=api_headers(service_key, "return=minimal"),
        json=payload,
        timeout=30,
    )
    response.raise_for_status()


def remove_subscription(url: str, service_key: str, subscription_id: str) -> None:
    requests.delete(
        f"{url}/rest/v1/push_subscriptions",
        params={"id": f"eq.{subscription_id}"},
        headers=api_headers(service_key, "return=minimal"),
        timeout=30,
    ).raise_for_status()


def main() -> None:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    private_key_value = os.getenv("VAPID_PRIVATE_KEY", "")
    subject = os.getenv("VAPID_SUBJECT", "mailto:admin@halkaarzim.com")
    missing = [name for name, value in {
        "SUPABASE_URL": url,
        "SUPABASE_SERVICE_ROLE_KEY": service_key,
        "VAPID_PRIVATE_KEY": private_key_value,
    }.items() if not value]
    if missing:
        print(f"Web Push secrets are not configured ({', '.join(missing)}); notification send skipped safely.")
        return

    now = datetime.now(timezone.utc)
    outbox_response = requests.get(
        f"{url}/rest/v1/notification_outbox",
        params={
            "status": "eq.pending",
            "available_at": f"lte.{now.isoformat()}",
            "select": "id,event_key,title,body,target_url,payload,attempt_count",
            "order": "created_at.asc",
            "limit": "20",
        },
        headers=api_headers(service_key),
        timeout=45,
    )
    outbox_response.raise_for_status()
    events = outbox_response.json()
    if not events:
        print("No pending Web Push notifications.")
        return

    subscriptions_response = requests.get(
        f"{url}/rest/v1/push_subscriptions",
        params={"select": "id,endpoint,p256dh,auth_key", "limit": "10000"},
        headers=api_headers(service_key),
        timeout=45,
    )
    subscriptions_response.raise_for_status()
    subscriptions = subscriptions_response.json()

    private_key, temporary_path = resolve_private_key(private_key_value)
    try:
        for event in events:
            attempts = int(event.get("attempt_count") or 0) + 1
            success_count = 0
            errors: list[str] = []
            message = json.dumps({
                "title": event["title"],
                "body": event["body"],
                "url": event["target_url"],
                "tag": event["event_key"],
                **(event.get("payload") or {}),
            }, ensure_ascii=False)

            for subscription in subscriptions:
                info = {
                    "endpoint": subscription["endpoint"],
                    "keys": {
                        "p256dh": subscription["p256dh"],
                        "auth": subscription["auth_key"],
                    },
                }
                try:
                    webpush(
                        subscription_info=info,
                        data=message,
                        vapid_private_key=private_key,
                        vapid_claims={"sub": subject},
                        ttl=86400,
                    )
                    success_count += 1
                except WebPushException as error:
                    status_code = getattr(error.response, "status_code", None)
                    if status_code in {404, 410}:
                        try:
                            remove_subscription(url, service_key, subscription["id"])
                        except requests.RequestException:
                            pass
                    errors.append(f"{subscription['id']}:{status_code or 'push_error'}")
                except Exception as error:  # noqa: BLE001
                    errors.append(f"{subscription['id']}:{type(error).__name__}")

            if not subscriptions:
                patch_outbox(url, service_key, event["id"], {
                    "status": "sent",
                    "attempt_count": attempts,
                    "sent_at": now.isoformat(),
                    "last_error": "No active subscriptions",
                })
                print(f"Skipped {event['event_key']}: no active subscriptions")
                continue

            if success_count > 0:
                patch_outbox(url, service_key, event["id"], {
                    "status": "sent",
                    "attempt_count": attempts,
                    "sent_at": now.isoformat(),
                    "last_error": "; ".join(errors)[:1000] or None,
                })
                print(f"Delivered {event['event_key']} to {success_count} subscription(s)")
            elif attempts >= 5:
                patch_outbox(url, service_key, event["id"], {
                    "status": "failed",
                    "attempt_count": attempts,
                    "last_error": "; ".join(errors)[:1000] or "Delivery failed",
                })
                print(f"Marked {event['event_key']} as failed after {attempts} attempts")
            else:
                patch_outbox(url, service_key, event["id"], {
                    "status": "pending",
                    "attempt_count": attempts,
                    "available_at": (now + timedelta(hours=6)).isoformat(),
                    "last_error": "; ".join(errors)[:1000] or "Delivery failed",
                })
                print(f"Scheduled retry for {event['event_key']}")
    finally:
        if temporary_path:
            temporary_path.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
