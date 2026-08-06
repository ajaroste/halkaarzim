from __future__ import annotations

import hashlib
import json
import os
import tempfile
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "generated" / "ipos.json"
PROHIBITED = (
    "kesin kazanç",
    "garanti kazanç",
    "kesin tavan",
    "alınmalı",
    "mutlaka alın",
    "kaçırmayın",
    "güvenli yatırım",
)


def canonical_input(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "company": item.get("company"),
        "capitalIncreaseShares": item.get("capitalIncreaseShares", 0),
        "shareholderSaleShares": item.get("shareholderSaleShares", 0),
        "extraSaleShares": item.get("extraSaleShares", 0),
        "fundUse": item.get("fundUse", []),
        "financials": item.get("financials", []),
        "risks": item.get("risks", []),
        "sources": item.get("sources", []),
    }


def input_hash(item: dict[str, Any]) -> str:
    encoded = json.dumps(canonical_input(item), ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def atomic_write(path: Path, payload: dict[str, Any]) -> None:
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary = Path(handle.name)
    temporary.replace(path)


def validate_output(result: dict[str, Any]) -> None:
    summary = str(result.get("summary", "")).strip()
    strengths = result.get("strengths")
    risks = result.get("risks")
    if not summary or len(summary) > 1800:
        raise ValueError("AI özeti boş veya çok uzun")
    if not isinstance(strengths, list) or not isinstance(risks, list):
        raise ValueError("AI dizi alanları geçersiz")
    combined = " ".join([summary, *map(str, strengths), *map(str, risks)]).lower()
    if any(term in combined for term in PROHIBITED):
        raise ValueError("AI çıktısı yasak yatırım yönlendirmesi içeriyor")


def request_report(endpoint: str, token: str, facts: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(facts, ensure_ascii=False).encode("utf-8")
    request = urllib.request.Request(
        endpoint,
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "halkaarzim-data-bot/1.0",
        },
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(request, timeout=35) as response:
                result = json.loads(response.read().decode("utf-8"))
                if not isinstance(result, dict):
                    raise ValueError("AI yanıtı nesne değil")
                validate_output(result)
                return result
        except urllib.error.HTTPError as error:
            if error.code == 429 and attempt < 2:
                retry_after = int(error.headers.get("Retry-After", "5") or 5)
                time.sleep(max(2, min(retry_after, 30)))
                continue
            detail = error.read().decode("utf-8", errors="replace")[:300]
            raise RuntimeError(f"AI HTTP {error.code}: {detail}") from error
        except urllib.error.URLError as error:
            if attempt < 2:
                time.sleep(2 ** attempt)
                continue
            raise RuntimeError(f"AI bağlantı hatası: {error.reason}") from error
    raise RuntimeError("AI çağrısı tamamlanamadı")


def apply_result(item: dict[str, Any], result: dict[str, Any], digest: str) -> None:
    item["aiSummary"] = str(result["summary"]).strip()
    item["highlights"] = [str(value).strip() for value in result.get("strengths", []) if str(value).strip()][:8]
    item["risks"] = [str(value).strip() for value in result.get("risks", []) if str(value).strip()][:8]
    item["dataGaps"] = [str(value).strip() for value in result.get("dataGaps", []) if str(value).strip()][:8]
    item["aiScore"] = max(0, min(100, int(result.get("score", item.get("aiScore", 0)) or 0)))
    item["aiConfidence"] = max(0, min(100, int(result.get("confidence", 0) or 0)))
    item["aiProvider"] = str(result.get("provider", "unknown"))[:80]
    item["aiModel"] = str(result.get("model", "unknown"))[:120]
    item["aiInputHash"] = digest
    item["aiGeneratedAt"] = datetime.now(timezone.utc).isoformat()
    item["reportVersion"] = f"v1-{digest[:10]}"
    item["humanReviewed"] = False
    item["analysisStatus"] = "needs_review"


def main() -> None:
    enabled = os.getenv("ENABLE_AI_GENERATION", "false").lower() == "true"
    if not enabled:
        print("AI generation disabled; set ENABLE_AI_GENERATION=true to run.")
        return

    endpoint = os.getenv("AI_ENDPOINT", "").strip()
    token = os.getenv("AI_ADMIN_TOKEN", "").strip()
    if not endpoint.startswith("https://") or not token:
        raise SystemExit("AI_ENDPOINT (HTTPS) and AI_ADMIN_TOKEN are required")

    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    items = payload.get("items", [])
    if not isinstance(items, list):
        raise SystemExit("Invalid IPO payload")

    max_items = max(1, min(50, int(os.getenv("AI_MAX_ITEMS", "5"))))
    force = os.getenv("AI_FORCE_REGENERATE", "false").lower() == "true"
    changed = 0
    failures: list[str] = []

    for item in items:
        digest = input_hash(item)
        if not force and item.get("aiInputHash") == digest:
            continue
        try:
            result = request_report(endpoint, token, canonical_input(item))
            apply_result(item, result, digest)
            changed += 1
            print(f"AI report updated: {item.get('company')} ({result.get('provider')})")
        except Exception as error:  # noqa: BLE001 - batch continues and reports every failed company
            failures.append(f"{item.get('company')}: {error}")
            print(f"WARNING: {failures[-1]}")
        if changed >= max_items:
            break

    if changed:
        payload["generatedAt"] = datetime.now(timezone.utc).isoformat()
        payload["aiPipeline"] = "vercel-secured-api-v1"
        atomic_write(DATA_PATH, payload)

    print(f"AI generation finished: {changed} updated, {len(failures)} failed")
    if failures and os.getenv("AI_REQUIRED", "false").lower() == "true":
        raise SystemExit("AI generation had failures:\n" + "\n".join(failures))


if __name__ == "__main__":
    main()
