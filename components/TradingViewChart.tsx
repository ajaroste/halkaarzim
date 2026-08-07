"use client";

import { useEffect, useRef, useState } from "react";

type ChartState = "idle" | "loading" | "ready" | "error";

function normalizeTicker(ticker: string): string {
  return ticker.trim().toLocaleUpperCase("tr-TR").replace(/[^A-Z0-9]/g, "");
}

export function TradingViewChart({ ticker }: { ticker: string | null }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [visible, setVisible] = useState(false);
  const [state, setState] = useState<ChartState>("idle");

  const normalizedTicker = ticker ? normalizeTicker(ticker) : "";
  const symbol = normalizedTicker ? `BIST:${normalizedTicker}` : "";

  useEffect(() => {
    const readTheme = () => setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
    readTheme();
    const observer = new MutationObserver(readTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell || visible) return;
    if (!("IntersectionObserver" in window)) { setVisible(true); return; }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "280px 0px" });
    observer.observe(shell);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !symbol || !visible) return;

    setState("loading");
    root.replaceChildren();

    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    root.appendChild(widget);

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.text = JSON.stringify({
      autosize: true,
      symbol,
      interval: "D",
      timezone: "Europe/Istanbul",
      theme,
      style: "1",
      locale: "tr",
      allow_symbol_change: false,
      calendar: false,
      hide_side_toolbar: false,
      hide_top_toolbar: false,
      save_image: false,
      support_host: "https://www.tradingview.com"
    });
    script.onload = () => setState("ready");
    script.onerror = () => setState("error");
    root.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
      root.replaceChildren();
    };
  }, [symbol, theme, visible]);

  if (!symbol) {
    return <div className="chartEmpty"><strong>Borsa kodu henüz açıklanmadı.</strong><p>Kod açıklandığında gerçek piyasa grafiği TradingView üzerinden gösterilecek.</p></div>;
  }

  return <div className="tradingViewWrap" ref={shellRef}>
    <div className="chartSymbolBar">
      <div><span>Gösterilen sembol</span><strong>{symbol}</strong></div>
      <a href={`https://tr.tradingview.com/symbols/BIST-${normalizedTicker}/`} target="_blank" rel="noreferrer">TradingView&apos;da aç ↗</a>
    </div>
    <div className="tradingview-widget-container" aria-label={`${symbol} TradingView fiyat grafiği`}>
      {!visible && <div className="chartLoading" role="status">Grafik görüntülendiğinde yüklenecek.</div>}
      {state === "loading" && <div className="chartLoading" role="status">{symbol} grafiği yükleniyor…</div>}
      {state === "error" && <div className="chartEmpty"><strong>Grafik şu anda yüklenemedi.</strong><p>TradingView bağlantısını veya reklam/gizlilik eklentisini kontrol et. Yanlış bir varsayılan hisse gösterilmez.</p></div>}
      <div ref={rootRef} className="tradingViewMount" data-tv-symbol={symbol} />
    </div>
    <small>Grafik TradingView tarafından sağlanır. Piyasa verisinin sahibi ve gecikme bilgisi grafik üzerinde belirtilir.</small>
  </div>;
}
