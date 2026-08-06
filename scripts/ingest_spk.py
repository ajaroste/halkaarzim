from __future__ import annotations

import hashlib
import json
import re
import unicodedata
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "generated" / "ipos.json"
NAMESPACE = uuid.UUID("f31c85d2-6c44-42df-9e62-5d5349fd63eb")


def parse_number(value: str | None) -> float:
    if not value or value.strip() in {"-", "—"}:
        return 0
    text = re.sub(r"[^0-9,.-]", "", value.strip())
    if "," in text:
        text = text.replace(".", "").replace(",", ".")
    elif text.count(".") > 1 or ("." in text and len(text.rsplit(".", 1)[1]) == 3):
        text = text.replace(".", "")
    try:
        number = float(text)
        return int(number) if number.is_integer() else number
    except ValueError:
        return 0


def tr_slug(value: str) -> str:
    text = value.lower().replace("ı", "i")
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"\b(a\.?s\.?|anonim sirketi)\b", " ", text)
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")


def parse_bulletin_meta(text: str, source_url: str) -> tuple[str, str]:
    number_match = re.search(r"(?:BÜLTENİ|BULTENI)\s*(20\d{2})\s*/\s*(\d+)", text, re.I)
    date_match = re.search(r"\b(\d{2})[./](\d{2})[./](20\d{2})\b", text)
    if number_match:
        bulletin_no = f"{number_match.group(1)}/{int(number_match.group(2))}"
    else:
        url_match = re.search(r"(20\d{2})[-_/](\d+)", source_url)
        bulletin_no = f"{url_match.group(1)}/{int(url_match.group(2))}" if url_match else "Bilinmiyor"
    if date_match:
        date_iso = f"{date_match.group(3)}-{date_match.group(2)}-{date_match.group(1)}"
    else:
        date_iso = datetime.now(timezone.utc).date().isoformat()
    return bulletin_no, date_iso


def deterministic_analysis(item: dict[str, Any]) -> dict[str, Any]:
    capital = float(item.get("capitalIncreaseShares") or 0)
    shareholder = float(item.get("shareholderSaleShares") or 0)
    extra = float(item.get("extraSaleShares") or 0)
    total = max(1.0, capital + shareholder)
    company_share = capital / total
    score = round(max(20, min(90, 45 + company_share * 35 - (extra > 0) * 5)))
    strengths = []
    risks = []
    if company_share >= 0.7:
        strengths.append("Arzın büyük bölümü sermaye artırımı yoluyla şirket kasasına girmektedir.")
    else:
        risks.append("Ortak satışı oranı görece yüksektir.")
    if extra:
        risks.append("Ek satış imkânı arz edilen pay miktarını artırabilir.")
    return {
        "aiScore": score,
        "analysisStatus": "preliminary",
        "analysisModel": "rules-v1",
        "humanReviewed": False,
        "strengths": strengths,
        "risks": risks,
    }


def _section(text: str) -> str:
    match = re.search(r"(?:1\.?\s*)?İlk Halka Arzlar(.*?)(?:\n\s*2\.|Halka Açık Ortaklıkların Başvuruları|$)", text, re.I | re.S)
    return match.group(1) if match else text


def parse_initial_public_offerings(text: str, source_url: str) -> list[dict[str, Any]]:
    bulletin_no, approval_date = parse_bulletin_meta(text, source_url)
    section = re.sub(r"\s+", " ", _section(text)).strip()
    company_pattern = re.compile(r"([A-ZÇĞİÖŞÜ0-9][A-Za-zÇĞİÖŞÜçğıöşü0-9 .,&'()/-]+?A\.?Ş\.?)\s+", re.I)
    matches = list(company_pattern.finditer(section))
    items: list[dict[str, Any]] = []
    for index, match in enumerate(matches):
        tail_end = matches[index + 1].start() if index + 1 < len(matches) else len(section)
        tail = section[match.end():tail_end]
        tokens = re.findall(r"(?:\d{1,3}(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d+)?|-)", tail)
        if len(tokens) < 6:
            continue
        company = re.sub(r"\s+", " ", match.group(1)).strip()
        values = [parse_number(token) for token in tokens[:7]]
        while len(values) < 7:
            values.insert(-1, 0)
        current_capital, new_capital, capital_increase, bonus, shareholder_sale, extra_sale, price = values[:7]
        if price <= 0 and len(tokens) >= 6:
            current_capital, new_capital, capital_increase, bonus, shareholder_sale, price = [parse_number(x) for x in tokens[:6]]
            extra_sale = 0
        if not company or price <= 0:
            continue
        stable_id = str(uuid.uuid5(NAMESPACE, f"{bulletin_no}|{company}"))
        lot_count = int(capital_increase + shareholder_sale)
        item: dict[str, Any] = {
            "id": stable_id,
            "slug": tr_slug(company),
            "company": company,
            "ticker": None,
            "status": "approved",
            "approvalDate": approval_date,
            "bulletinNo": bulletin_no,
            "price": price,
            "currency": "TRY",
            "currentCapital": int(current_capital),
            "newCapital": int(new_capital),
            "capitalIncreaseShares": int(capital_increase),
            "bonusShares": int(bonus),
            "shareholderSaleShares": int(shareholder_sale),
            "extraSaleShares": int(extra_sale),
            "lotCount": lot_count,
            "maxLotCount": lot_count + int(extra_sale),
            "sources": [{"title": f"SPK Bülteni {bulletin_no}", "url": source_url, "type": "SPK"}],
            "sourceHash": hashlib.sha256(f"{bulletin_no}|{company}|{price}".encode()).hexdigest(),
        }
        item.update(deterministic_analysis(item))
        items.append(item)
    return items


def save_snapshot(items: list[dict[str, Any]], output: Path = OUTPUT) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = {"generatedAt": datetime.now(timezone.utc).isoformat(), "items": items}
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    payload = json.loads(OUTPUT.read_text(encoding="utf-8")) if OUTPUT.exists() else {"items": []}
    save_snapshot(payload.get("items", []))
    print(f"Validated {len(payload.get('items', []))} records")
