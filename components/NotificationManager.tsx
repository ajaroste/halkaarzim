"use client";

import { useEffect, useState } from "react";
import { ipos } from "@/data/ipos";
import { savePushSubscription } from "@/lib/supabase-rest";
import { useAuth } from "./AuthProvider";

const SNAPSHOT_KEY = "halkaarzim-known-ipo-ids";
const DISMISSED_KEY = "halkaarzim-notification-prompt-dismissed";
const DEFAULT_VAPID_PUBLIC_KEY = "BA7L3ZmAU4nf5RNknQjQUXZr-hO5Q3peXE--97QuZ8XQiJyfAHdE6HkCP8bJqGXaZ4fqRsQvASvA69QKUJjtM3s";

function decodePublicKey(value: string): Uint8Array {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob((value + padding).replace(/-/g, "+").replace(/_/g, "/")), (character) => character.charCodeAt(0));
}

async function getRegistration(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration();
  return existing || navigator.serviceWorker.register("/sw.js");
}

export function NotificationManager() {
  const { session } = useAuth();
  const [promptVisible, setPromptVisible] = useState(false);
  const [message, setMessage] = useState("");

  async function syncRemoteSubscription(registration: ServiceWorkerRegistration) {
    if (!session || !("PushManager" in window)) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodePublicKey(publicKey)
      });
    }
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return;
    await savePushSubscription({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth }
    }, session.access_token);
  }

  async function enableNotifications() {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setMessage("Bu tarayıcı bildirimleri desteklemiyor.");
      return;
    }
    const permission = await Notification.requestPermission();
    window.dispatchEvent(new CustomEvent("halkaarzim-notification-state", { detail: permission }));
    if (permission !== "granted") {
      setMessage("Bildirim izni verilmedi.");
      return;
    }
    const registration = await getRegistration();
    await syncRemoteSubscription(registration).catch(() => null);
    await registration.showNotification("HalkaArzım bildirimleri açık", {
      body: "Yeni halka arz olacak bir firma eklendiğinde haber vereceğiz.",
      tag: "halkaarzim-notifications-enabled",
      data: { url: "/halka-arzlar" }
    });
    localStorage.setItem(DISMISSED_KEY, "1");
    setPromptVisible(false);
    setMessage("Bildirimler açıldı.");
  }

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    let cancelled = false;
    let timer = 0;

    async function initialize() {
      const registration = await getRegistration().catch(() => null);
      const currentIds = ipos.map((ipo) => ipo.id);
      let previousIds: string[] = [];
      try { previousIds = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || "[]") as string[]; } catch { previousIds = []; }
      const previousSet = new Set(previousIds);
      const newItems = previousIds.length ? ipos.filter((ipo) => !previousSet.has(ipo.id)) : [];
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(currentIds));

      if (registration && Notification.permission === "granted") {
        for (const ipo of newItems.slice(0, 3)) {
          await registration.showNotification("Yeni halka arz firması", {
            body: `${ipo.company} listeye eklendi. Detayları incelemek için bildirime tıkla.`,
            tag: `new-ipo-${ipo.id}`,
            data: { url: `/arz/${ipo.slug}` }
          });
        }
        if (newItems.length > 3) {
          await registration.showNotification(`${newItems.length} yeni halka arz kaydı`, {
            body: "Yeni eklenen firmaları halka arz listesinden inceleyebilirsin.",
            tag: "new-ipo-summary",
            data: { url: "/halka-arzlar" }
          });
        }
        await syncRemoteSubscription(registration).catch(() => null);
      }

      if (!cancelled && Notification.permission === "default" && localStorage.getItem(DISMISSED_KEY) !== "1") {
        timer = window.setTimeout(() => setPromptVisible(true), 1400);
      }
    }

    const requestHandler = () => void enableNotifications();
    window.addEventListener("halkaarzim-enable-notifications", requestHandler);
    void initialize();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      window.removeEventListener("halkaarzim-enable-notifications", requestHandler);
    };
  }, [session]);

  if (!promptVisible) return null;
  return <aside className="notificationPrompt" role="dialog" aria-label="Bildirimleri aç">
    <div className="notificationPromptIcon" aria-hidden="true">🔔</div>
    <div className="notificationPromptCopy">
      <strong>Yeni halka arzları kaçırma</strong>
      <p>Yeni bir firma eklendiğinde tarayıcı bildirimi gönderelim.</p>
      {message && <small>{message}</small>}
    </div>
    <div className="notificationPromptActions">
      <button className="primaryButton" onClick={() => void enableNotifications()}>Bildirimleri aç</button>
      <button className="textButton" onClick={() => { localStorage.setItem(DISMISSED_KEY, "1"); setPromptVisible(false); }}>Şimdi değil</button>
    </div>
  </aside>;
}
