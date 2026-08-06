from __future__ import annotations

import html
import json
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "qa-site"


def page(title: str, body: str, script: str = "") -> str:
    return f"""<!doctype html><html lang='tr'><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>{html.escape(title)}</title><style>
:root{{--bg:#f4f7f6;--card:#fff;--text:#10221c;--muted:#64736d}}html[data-theme=dark]{{--bg:#0d1714;--card:#14211d;--text:#eef8f4;--muted:#9eb0a9}}*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--text);font:15px system-ui}}header,main{{max-width:1120px;margin:auto;padding:18px}}header{{display:flex;justify-content:space-between;align-items:center}}a{{color:inherit}}button{{cursor:pointer;padding:10px 13px;border:1px solid #ccd8d3;border-radius:10px;background:var(--card);color:var(--text)}}.filters{{display:flex;gap:8px;overflow:auto;padding-bottom:12px}}.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px}}.card{{display:block;background:var(--card);padding:18px;border-radius:16px;text-decoration:none;border:1px solid #dbe5e1}}.muted{{color:var(--muted)}}.hidden{{display:none!important}}.chart{{min-height:240px;background:#111;color:#eee;border-radius:16px;padding:24px}}@media(max-width:600px){{header{{padding:12px}}}}
</style></head><body><header><strong>HalkaArzım QA</strong><nav><a href='/halka-arzlar/'>Halka arzlar</a> <button id='theme-toggle' type='button'>Tema</button></nav></header><main>{body}</main><script>{script}</script></body></html>"""


def main() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)
    payload = json.loads((ROOT / "data" / "generated" / "ipos.json").read_text(encoding="utf-8"))
    items = payload.get("items", [])
    (OUTPUT / "index.html").write_text(page("HalkaArzım", "<h1>Gerçek halka arz verileri</h1><p><a id='open-list' href='/halka-arzlar/'>Tüm halka arzları görüntüle</a></p>", "document.getElementById('theme-toggle').onclick=()=>document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';"), encoding="utf-8")

    filters = ["all", "approved", "collecting", "upcoming", "completed", "trading", "postponed"]
    cards = []
    for item in items:
        ticker = html.escape(item.get("ticker") or "Kod bekleniyor")
        cards.append(f"<a class='card' data-status='{html.escape(item.get('status','approved'))}' href='/halka-arz/{html.escape(item['slug'])}/'><strong>{html.escape(item['company'])}</strong><p>{ticker} · {item.get('price','-')} TL</p><span class='muted'>{html.escape(item.get('status','approved'))}</span></a>")
    buttons = "".join(f"<button class='filter' data-filter='{value}'>{value}</button>" for value in filters)
    script = """
const root=document.documentElement;document.getElementById('theme-toggle').onclick=()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('theme',root.dataset.theme)};root.dataset.theme=localStorage.getItem('theme')||'light';
document.querySelectorAll('.filter').forEach(button=>button.onclick=()=>{const value=button.dataset.filter;document.querySelectorAll('.card').forEach(card=>card.classList.toggle('hidden',value!=='all'&&card.dataset.status!==value));document.getElementById('result-count').textContent=document.querySelectorAll('.card:not(.hidden)').length;});
"""
    list_dir = OUTPUT / "halka-arzlar"
    list_dir.mkdir()
    list_dir.joinpath("index.html").write_text(page("Halka arzlar", f"<h1>Halka arzlar</h1><div class='filters'>{buttons}</div><p><strong id='result-count'>{len(items)}</strong> kayıt</p><section class='grid'>{''.join(cards)}</section>", script), encoding="utf-8")

    for item in items:
        detail_dir = OUTPUT / "halka-arz" / item["slug"]
        detail_dir.mkdir(parents=True)
        ticker = item.get("ticker")
        if ticker:
            chart = f"<div class='chart' data-symbol='BIST:{html.escape(ticker)}'>TradingView sembolü: BIST:{html.escape(ticker)}</div>"
        else:
            chart = "<div class='chart muted' data-symbol=''>Borsa kodu açıklanmadığı için grafik gösterilmiyor.</div>"
        detail = f"<a href='/halka-arzlar/'>← Liste</a><h1>{html.escape(item['company'])}</h1><p>{item.get('price','-')} TL</p>{chart}"
        detail_dir.joinpath("index.html").write_text(page(item["company"], detail, "document.getElementById('theme-toggle').onclick=()=>document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';"), encoding="utf-8")
    print(f"QA site built with {len(items)} IPO routes")


if __name__ == "__main__":
    main()
