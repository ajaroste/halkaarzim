"use client";

import { useEffect, useRef, useState } from "react";
import type { ToastPayload } from "@/lib/toast";

type ToastItem = ToastPayload & { id: number };

function ToastIcon({ kind }: { kind: ToastPayload["kind"] }) {
  const symbol = kind === "error" ? "!" : kind === "warning" ? "!" : kind === "info" ? "i" : "✓";
  return <span className={`toastIcon ${kind || "success"}`} aria-hidden="true">{symbol}</span>;
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastPayload>).detail;
      if (!detail?.title) return;
      const id = ++idRef.current;
      const item: ToastItem = { id, kind: "success", duration: 3600, ...detail };
      setItems((current) => [...current.slice(-2), item]);
      window.setTimeout(() => setItems((current) => current.filter((toast) => toast.id !== id)), item.duration || 3600);
    };
    window.addEventListener("halkaarzim-toast", onToast);
    return () => window.removeEventListener("halkaarzim-toast", onToast);
  }, []);

  function dismiss(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return <div className="toastViewport" aria-live="polite" aria-atomic="false">
    {items.map((item) => <div className={`toastCard ${item.kind || "success"}`} role="status" key={item.id}>
      <ToastIcon kind={item.kind} />
      <div className="toastCopy"><strong>{item.title}</strong>{item.message && <span>{item.message}</span>}</div>
      <button type="button" className="toastClose" onClick={() => dismiss(item.id)} aria-label="Bildirimi kapat">×</button>
      <span className="toastProgress" style={{ animationDuration: `${item.duration || 3600}ms` }} />
    </div>)}
  </div>;
}
