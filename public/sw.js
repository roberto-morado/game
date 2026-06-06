const CACHE = "pixel-rpg-v1";
const PRECACHE = [
  "/",
  "/index.html",
  "/sheet.jpeg",
  "/sprite_map.json",
  "/manifest.webmanifest",
  "/icon-192.svg",
  "/game/constants.js",
  "/game/input.js",
  "/game/assets.js",
  "/game/main.js",
  "/game/world/map.js",
  "/game/world/camera.js",
  "/game/entities/player.js",
  "/game/entities/enemy.js",
  "/game/battle/skills.js",
  "/game/battle/battle.js",
  "/game/ui/hud.js",
  "/game/ui/screens.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
      }
      return res;
    }))
  );
});
