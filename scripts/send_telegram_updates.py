from __future__ import annotations

import json
import os
import tempfile
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = ROOT / "content" / "generated" / "social-posts.json"
STATE_PATH = ROOT / "data" / "generated" / "telegram-state.json"


def atomic_write(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary = Path(handle.name)
    temporary.replace(path)


def load_json(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return fallback
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else fallback
    except (OSError, json.JSONDecodeError):
        return fallback


def send_message(token: str, channel_id: str, html: str) -> None:
    endpoint = f"https://api.telegram.org/bot{urllib.parse.quote(token, safe=':')}/sendMessage"
    body = urllib.parse.urlencode({
        "chat_id": channel_id,
        "text": html,
        "parse_mode": "HTML",
        "disable_web_page_preview": "false",
        "disable_notification": "false",
    }).encode("utf-8")
    request = urllib.request.Request(endpoint, data=body, method="POST", headers={"User-Agent": "halkaarzim-data-bot/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"Telegram HTTP {error.code}: {detail}") from error
    if not payload.get("ok"):
        raise RuntimeError(f"Telegram API error: {payload.get('description', 'unknown')}")


def main() -> None:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    channel_id = os.getenv("TELEGRAM_CHANNEL_ID", "").strip()
    if not token or not channel_id:
        print("Telegram is not configured; skipping.")
        return

    content = load_json(CONTENT_PATH, {"posts": []})
    posts = content.get("posts", [])
    if not isinstance(posts, list):
        raise SystemExit("Invalid social content pack")

    state = load_json(STATE_PATH, {"sent": {}})
    sent = state.setdefault("sent", {})
    if not isinstance(sent, dict):
        sent = {}
        state["sent"] = sent

    limit = max(1, min(5, int(os.getenv("TELEGRAM_MAX_MESSAGES", "2"))))
    delivered = 0
    for post in posts:
        if delivered >= limit or not isinstance(post, dict):
            break
        ipo_id = str(post.get("ipoId") or "")
        source_updated_at = str(post.get("sourceUpdatedAt") or "")
        fingerprint = f"{ipo_id}:{source_updated_at}"
        if not ipo_id or sent.get(ipo_id) == fingerprint:
            continue
        html = str(post.get("telegramHtml") or "").strip()
        if not html:
            continue
        send_message(token, channel_id, html[:3900])
        sent[ipo_id] = fingerprint
        delivered += 1
        print(f"Telegram update sent: {post.get('company')}")

    state["updatedAt"] = datetime.now(timezone.utc).isoformat()
    atomic_write(STATE_PATH, state)
    print(f"Telegram delivery finished: {delivered} message(s)")


if __name__ == "__main__":
    main()
