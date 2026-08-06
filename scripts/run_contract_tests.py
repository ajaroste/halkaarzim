from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def run(command: list[str]) -> None:
    print("+", " ".join(command), flush=True)
    subprocess.run(command, cwd=ROOT, check=True)


def main() -> int:
    try:
        run(["node", "--test", "tests/supabase_contract.mjs"])
        run([
            "npx",
            "tsc",
            "--noEmit",
            "--pretty",
            "false",
            "--target",
            "ES2022",
            "--module",
            "ESNext",
            "--moduleResolution",
            "Bundler",
            "tests/supabase.contract.ts",
        ])
    except (subprocess.CalledProcessError, FileNotFoundError) as error:
        print(f"Contract tests failed: {error}", file=sys.stderr)
        return 1
    print("Contract tests passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
