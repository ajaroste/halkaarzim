"use client";

import { useState } from "react";

type ShareActionsProps = {
  title: string;
  url: string;
};

export function ShareActions({ title, url }: ShareActionsProps) {
  const [message, setMessage] = useState("");
  const text = `${title} — resmî kaynaklı halka arz özeti`;

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        setMessage("Paylaşım penceresi açıldı.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setMessage("Bağlantı kopyalandı.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Paylaşım başlatılamadı.");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Bağlantı kopyalandı.");
    } catch {
      setMessage("Bağlantı kopyalanamadı.");
    }
  }

  return <div className="shareActions" aria-label="Sayfayı paylaş">
    <button className="secondaryButton" type="button" onClick={() => void share()}>Paylaş</button>
    <button className="secondaryButton" type="button" onClick={() => void copy()}>Bağlantıyı kopyala</button>
    <a className="secondaryButton" href={`https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer">X</a>
    <a className="secondaryButton" href={`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
    {message && <span className="shareMessage" role="status">{message}</span>}
  </div>;
}
