from __future__ import annotations

import re
from typing import Any


def _number(value: str) -> float:
    text = re.sub(r"[^0-9,.-]", "", value)
    if not text:
        return 0.0
    if "," in text:
        text = text.replace(".", "").replace(",", ".")
    elif text.count(".") > 1 or ("." in text and len(text.rsplit(".", 1)[1]) == 3):
        text = text.replace(".", "")
    try:
        return float(text)
    except ValueError:
        return 0.0


def _scale(line: str) -> float:
    lowered = line.lower()
    if "milyar" in lowered:
        return 1_000_000_000.0
    if "milyon" in lowered:
        return 1_000_000.0
    if "bin" in lowered:
        return 1_000.0
    return 1.0


def extract_financials(text: str) -> list[dict[str, Any]]:
    results: dict[int, dict[str, Any]] = {}
    patterns = {
        "revenue": r"(?:hasılat|hasilat|satış gelirleri|satis gelirleri|ciro)",
        "netProfit": r"(?:net dönem kârı|net donem kari|net kâr|net kar)",
        "totalAssets": r"(?:toplam varlıklar|toplam varliklar)",
        "equity": r"(?:özkaynaklar|ozkaynaklar)",
    }
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip()
        if not line:
            continue
        years = [int(value) for value in re.findall(r"\b(20\d{2})\b", line)]
        if not years:
            continue
        metric = next((key for key, pattern in patterns.items() if re.search(pattern, line, re.I)), None)
        if not metric:
            continue
        values = [_number(value) for value in re.findall(r"-?\d[\d.]*,?\d*", line)]
        values = [value for value in values if value not in years]
        if not values:
            continue
        scale = _scale(line)
        for year, value in zip(years, values):
            results.setdefault(year, {"year": year})[metric] = value * scale
    return [results[year] for year in sorted(results, reverse=True)]


def _percent_midpoint(fragment: str) -> float | None:
    range_match = re.search(r"%\s*(\d+(?:[.,]\d+)?)\s*[-–]\s*%?\s*(\d+(?:[.,]\d+)?)", fragment)
    if range_match:
        return round((_number(range_match.group(1)) + _number(range_match.group(2))) / 2, 2)
    single_match = re.search(r"%\s*(\d+(?:[.,]\d+)?)", fragment)
    return _number(single_match.group(1)) if single_match else None


def extract_fund_use(text: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    seen: set[str] = set()
    for raw_line in text.splitlines():
        line = re.sub(r"\s+", " ", raw_line).strip(" •-\t")
        percentage = _percent_midpoint(line)
        if percentage is None:
            continue
        label = re.sub(r"%\s*\d+(?:[.,]\d+)?(?:\s*[-–]\s*%?\s*\d+(?:[.,]\d+)?)?", "", line)
        label = re.sub(r"[:;,-]+$", "", label).strip(" :-–")
        if len(label) < 3:
            continue
        key = label.lower()
        if key in seen:
            continue
        seen.add(key)
        items.append({"label": label, "percentage": percentage})
    return items


def extract_promises(text: str) -> list[dict[str, Any]]:
    promise_patterns = [
        r"[^.\n]{0,140}(?:\d+\s*(?:ay|yıl|yil)\s+süreyle[^.\n]{0,180}(?:pay miktarını artırmama|pay miktarini artirmama|satmama|satış yapmama))[^.\n]*",
        r"[^.\n]{0,140}(?:fiyat istikrarı|fiyat istikrari)[^.\n]{0,180}",
        r"[^.\n]{0,140}(?:geri alım|geri alim)[^.\n]{0,180}",
    ]
    output: list[dict[str, Any]] = []
    seen: set[str] = set()
    for pattern in promise_patterns:
        for match in re.finditer(pattern, text, re.I):
            statement = re.sub(r"\s+", " ", match.group(0)).strip(" .;-\n")
            if len(statement) < 15 or statement.lower() in seen:
                continue
            seen.add(statement.lower())
            output.append({"statement": statement, "status": "declared", "humanReviewed": False})
    return output


def extract_price_stability(text: str) -> dict[str, Any] | None:
    match = re.search(
        r"(?:fiyat istikrarı|fiyat istikrari)[^.\n]{0,160}?(\d+)\s*(?:gün|gun)",
        text,
        re.I,
    )
    if not match:
        match = re.search(
            r"(\d+)\s*(?:gün|gun)[^.\n]{0,160}?(?:fiyat istikrarı|fiyat istikrari)",
            text,
            re.I,
        )
    if not match:
        return None
    return {"planned": True, "days": int(match.group(1)), "humanReviewed": False}
