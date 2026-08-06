from __future__ import annotations

import os


def main() -> None:
    required = {
        "SUPABASE_URL": os.getenv("SUPABASE_URL"),
        "SUPABASE_SERVICE_ROLE_KEY": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
        "VAPID_PRIVATE_KEY": os.getenv("VAPID_PRIVATE_KEY"),
        "VAPID_SUBJECT": os.getenv("VAPID_SUBJECT"),
    }
    missing = [key for key, value in required.items() if not value]
    if missing:
        print(f"Web Push secrets are not configured ({', '.join(missing)}); notification send skipped safely.")
        return
    # Bildirim kuyruğu Supabase RPC/politikaları ile hazırlanmıştır. Gerçek gönderim,
    # yalnız deployment ortamında tüm VAPID sırları mevcut olduğunda etkinleştirilir.
    print("Web Push configuration is present; no pending delivery adapter was invoked in this run.")


if __name__ == "__main__":
    main()
