from __future__ import annotations

import json
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "generated" / "ipos.json"
OUTPUT_PATH = ROOT / "content" / "generated" / "social-posts.json"
NEWSLETTER_PATH = ROOT / "content" / "generated" / "weekly-brief.md"


def atomic_write_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=path.parent, delete=False) as handle:
        handle.write(value)
        temporary = Path(handle.name)
    temporary.replace(path)


def atomic_write_json(path: Path, value: dict[str, Any]) -> None:
    atomic_write_text(path, json.dumps(value, ensure_ascii=False, indent=2) + "\n")


def short_company(company: str) -> str:
    return company.replace("Anonim Şirketi", "A.Ş.").replace("Anonim Şti.", "A.Ş.").strip()


def build_post(item: dict[str, Any], site_url: str) -> dict[str, Any]:
    company = short_company(str(item.get("company", "Halka arz")))
    ticker = str(item.get("ticker") or "Kod bekleniyor")
    price = float(item.get("price") or 0)
    dates = str(item.get("dates") or "Talep tarihleri açıklanmadı")
    status = str(item.get("statusLabel") or "Güncel kayıt")
    capital = int(item.get("capitalIncreaseShares") or 0)
    sale = int(item.get("shareholderSaleShares") or 0)
    total = max(1, capital + sale)
    capital_ratio = round(capital / total * 100, 1)
    sale_ratio = round(sale / total * 100, 1)
    link = f"{site_url}/arz/{item['slug']}"
    price_text = f"{price:,.2f} TL".replace(",", "X").replace(".", ",").replace("X", ".") if price else "Açıklanmadı"
    source_count = len(item.get("sources") or [])

    x_text = (
        f"{company} halka arz özeti\n\n"
        f"• Durum: {status}\n"
        f"• Fiyat: {price_text}\n"
        f"• Talep: {dates}\n"
        f"• Sermaye artırımı: %{capital_ratio}\n"
        f"• Ortak satışı: %{sale_ratio}\n\n"
        f"{source_count} kaynak ve eksik veri notları: {link}\n\n"
        "Yatırım tavsiyesi değildir."
    )

    telegram_text = (
        f"📌 <b>{company}</b>\n"
        f"{status} · {ticker}\n\n"
        f"💰 Fiyat: <b>{price_text}</b>\n"
        f"📅 Talep: {dates}\n"
        f"🏢 Sermaye artırımı: %{capital_ratio}\n"
        f"👥 Ortak satışı: %{sale_ratio}\n\n"
        f"🔎 Kaynaklı ön analiz: {link}\n\n"
        "<i>Yatırım tavsiyesi değildir.</i>"
    )

    carousel = [
        {"slide": 1, "headline": f"{company} halka arz", "body": f"{status} · {ticker}"},
        {"slide": 2, "headline": "Temel bilgiler", "body": f"Fiyat: {price_text}\nTalep: {dates}"},
        {"slide": 3, "headline": "Arz yapısı", "body": f"Sermaye artırımı %{capital_ratio}\nOrtak satışı %{sale_ratio}"},
        {"slide": 4, "headline": "Eksik veriyi de gösteriyoruz", "body": "Açıklanmayan tarih, kod ve finansal alanlar tahmin edilmez."},
        {"slide": 5, "headline": "Kaynağından incele", "body": link},
    ]

    return {
        "ipoId": item.get("id"),
        "slug": item.get("slug"),
        "company": company,
        "status": item.get("status"),
        "sourceUpdatedAt": item.get("sourceUpdatedAt"),
        "url": link,
        "x": x_text,
        "telegramHtml": telegram_text,
        "instagramCarousel": carousel,
        "shortVideoScript": (
            f"{company} halka arzında açıklanan temel veriler şöyle: fiyat {price_text}. "
            f"Arzın yaklaşık yüzde {capital_ratio} bölümü sermaye artırımı, yüzde {sale_ratio} bölümü ortak satışından oluşuyor. "
            f"Talep tarihi: {dates}. Açıklanmayan bilgileri tahmin etmiyoruz. Kaynaklı detay HalkaArzım'da."
        ),
    }


def main() -> None:
    payload = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    items = payload.get("items", [])
    if not isinstance(items, list):
        raise SystemExit("Invalid IPO data")

    site_url = "https://halkaarzim.vercel.app"
    recent = sorted(
        items,
        key=lambda item: str(item.get("sourceUpdatedAt") or item.get("reportDate") or ""),
        reverse=True,
    )[:12]
    posts = [build_post(item, site_url) for item in recent]
    generated_at = datetime.now(timezone.utc).isoformat()
    atomic_write_json(OUTPUT_PATH, {
        "generatedAt": generated_at,
        "sourceGeneratedAt": payload.get("generatedAt"),
        "disclaimer": "Paylaşım metinleri yatırım tavsiyesi içermez; yayın öncesi kaynak ve tarih kontrolü yapılmalıdır.",
        "posts": posts,
    })

    lines = [
        "# HalkaArzım Haftalık Kaynaklı Özet",
        "",
        f"> İçerik paketi: {generated_at}",
        "> Genel bilgilendirme amaçlıdır; yatırım tavsiyesi değildir.",
        "",
    ]
    for post in posts[:6]:
        lines.extend([
            f"## {post['company']}",
            "",
            post["x"],
            "",
        ])
    atomic_write_text(NEWSLETTER_PATH, "\n".join(lines).rstrip() + "\n")
    print(f"Generated {len(posts)} growth content records")


if __name__ == "__main__":
    main()
