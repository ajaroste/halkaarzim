const CACHE = "halkaarzim-shell-v3";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/manifest.webmanifest"])));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  ]));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

  const url = new URL(event.request.url);
  const isNavigation = event.request.mode === "navigate" || event.request.destination === "document";
  const isNextRuntime = url.pathname.startsWith("/_next/") || event.request.headers.get("RSC") === "1";

  // Never persist Next.js route/RSC/runtime responses across deployments.
  if (isNavigation || isNextRuntime) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(fetch(event.request).then((response) => {
    if (response.ok && ["image", "style", "font", "manifest"].includes(event.request.destination)) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request)));
});

self.addEventListener("push", (event) => {
  let payload = {
    title: "Yeni halka arz gelişmesi",
    body: "HalkaArzım listesinde yeni bir gelişme var.",
    url: "/halka-arzlar",
    tag: "halkaarzim-update"
  };
  try { payload = { ...payload, ...(event.data?.json() || {}) }; } catch {}
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    tag: payload.tag,
    renotify: true,
    data: { url: payload.url }
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/halka-arzlar", self.location.origin).href;
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
    for (const client of windows) {
      if ("navigate" in client) await client.navigate(target);
      if ("focus" in client) return client.focus();
    }
    return self.clients.openWindow(target);
  }));
});
