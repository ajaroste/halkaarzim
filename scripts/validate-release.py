from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_PATHS = (
    ROOT / "app",
    ROOT / "components",
    ROOT / "lib",
    ROOT / "data" / "generated" / "ipos.json",
    ROOT / "sql" / "schema.sql",
)


def run(command: list[str]) -> None:
    print("+", " ".join(command), flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def validate_snapshot() -> None:
    snapshot = ROOT / "data" / "generated" / "ipos.json"
    payload = json.loads(snapshot.read_text(encoding="utf-8"))
    items = payload.get("items", [])
    if len(items) < 30:
        raise ValueError(f"En az 30 halka arz kaydı bekleniyordu, bulunan: {len(items)}")
    if any(not item.get("sources") for item in items):
        raise ValueError("Kaynaksız halka arz kaydı bulundu.")


def main() -> int:
    missing = [str(path.relative_to(ROOT)) for path in REQUIRED_PATHS if not path.exists()]
    if missing:
        print("Eksik yayın dosyaları: " + ", ".join(missing), file=sys.stderr)
        return 1
    try:
        validate_snapshot()
        run(["node", "tests/source-check.mjs"])
        run(["node", "tests/validate-source.mjs"])
    except (ValueError, json.JSONDecodeError, subprocess.CalledProcessError, FileNotFoundError) as error:
        print(f"Release validation failed: {error}", file=sys.stderr)
        return 1
    print("Release source validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
