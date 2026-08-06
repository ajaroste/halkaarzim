const CACHE = "halkaarzim-shell-v1";
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/", "/halka-arzlar", "/manifest.webmanifest"]))));
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request)));
});
self.addEventListener("push", (event) => {
  let payload = { title: "HalkaArzım", body: "Takip ettiğin bir şirkette yeni gelişme var.", url: "/profil" };
  try { payload = { ...payload, ...(event.data?.json() || {}) }; } catch {}
  event.waitUntil(self.registration.showNotification(payload.title, { body: payload.body, data: { url: payload.url }, icon: "/icons/icon-192.png" }));
});
self.addEventListener("notificationclick", (event) => { event.notification.close(); event.waitUntil(clients.openWindow(event.notification.data?.url || "/profil")); });
