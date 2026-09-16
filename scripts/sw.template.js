const BASE_PATH = "__BASE_PATH__";
const CACHE_VERSION = "lettura-contatori-v2";
const prefix = (path) => `${BASE_PATH}${path}`;

const PRECACHE = [
  prefix("/"),
  prefix("/manifest.json"),
  prefix("/icons/icon-192.png"),
  prefix("/icons/icon-512.png"),
  prefix("/icons/icon-maskable-512.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.includes("/_next/webpack-hmr")) return;

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      try {
        const network = await fetch(request);
        if (network.ok && url.pathname.includes("/_next/static")) {
          cache.put(request, network.clone());
        }
        return network;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        if (request.mode === "navigate") {
          const fallback = await cache.match(prefix("/"));
          if (fallback) return fallback;
        }
        throw new Error("offline");
      }
    })
  );
});
