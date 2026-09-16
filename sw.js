/* Lettura Contatori app-shell cache. Generated: 059630faab7f */
const CACHE_NAME = "lettura-shell-059630faab7f";
const OFFLINE_URL = "./offline.html";
const PRECACHE = [
  "./",
  "./404.html",
  "./404/",
  "./404/index.html",
  "./__next.__PAGE__.txt",
  "./__next._full.txt",
  "./__next._tree.txt",
  "./_next/static/AsKfwGM-0vS1Do83-1kQ-/_buildManifest.js",
  "./_next/static/AsKfwGM-0vS1Do83-1kQ-/_clientMiddlewareManifest.js",
  "./_next/static/AsKfwGM-0vS1Do83-1kQ-/_ssgManifest.js",
  "./_next/static/chunks/0cz1d0mv5g_q7.js",
  "./_next/static/chunks/0czynddgnv9ea.js",
  "./_next/static/chunks/0nq1bhf4k6a2e.js",
  "./_next/static/chunks/15y8zfjo-xh4-.js",
  "./_next/static/chunks/1inwntv0b4r-7.js",
  "./_next/static/chunks/276x6jh3f4-t1.css",
  "./_next/static/chunks/34q-qtwa-h_oh.js",
  "./_next/static/chunks/3a0us1_bayeal.js",
  "./_next/static/chunks/3fntmmi971322.js",
  "./_next/static/chunks/turbopack-42r5xyun1ektt.js",
  "./_next/static/media/1b99372b3eaef0c8-s.p.1gsd1jahc5dg_.woff2",
  "./_next/static/media/4fa387ec64143e14-s.2tuy5pz7dlieh.woff2",
  "./_next/static/media/5ce348bf30bf5439-s.31988l_ccedte.woff2",
  "./_next/static/media/6306c77e7c8268e4-s.2dbetqa9o8jxf.woff2",
  "./_next/static/media/797e433ab948586e-s.p.0r6juujl39pe6.woff2",
  "./_next/static/media/7d817b4c03b0c5f1-s.1uyisp29ctx0d.woff2",
  "./_next/static/media/apple-icon.2navtzbtgs-r7.png",
  "./_next/static/media/b2ea385cb5ae8625-s.p.1spbknb88wd48.woff2",
  "./_next/static/media/bbc41e54d2fcbd21-s.1rgnod-3esatf.woff2",
  "./_next/static/media/icon.0hb3hm0ddg0h-.png",
  "./_not-found/",
  "./_not-found/__next._full.txt",
  "./_not-found/__next._not-found.__PAGE__.txt",
  "./_not-found/__next._tree.txt",
  "./_not-found/index.html",
  "./_not-found/index.txt",
  "./acqua_riscaldamento.ods",
  "./apple-icon.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
  "./favicon.svg",
  "./file.svg",
  "./globe.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./icon.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./index.html",
  "./index.txt",
  "./logo.png",
  "./logo.svg",
  "./manifest.webmanifest",
  "./next.svg",
  "./offline.html",
  "./sample-import.csv",
  "./serve.json",
  "./vercel.svg",
  "./window.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE.map(async (url) => {
          try {
            const request = new Request(url, { cache: "reload", credentials: "same-origin" });
            const response = await fetch(request);
            if (response.ok) await cache.put(request, response);
          } catch {
            /* skip missing files so install still completes */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const stored = await cache.keys();
      const hasShell = stored.some((req) => {
        const path = new URL(req.url).pathname;
        return path.endsWith("/") || path.endsWith("/index.html");
      });
      if (hasShell) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("lettura-") && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        );
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.endsWith("/sw.js")) return;
  event.respondWith(handleRequest(request));
});

function isPageRequest(request) {
  if (request.mode === "navigate") return true;
  if (request.destination === "document") return true;
  const accept = request.headers.get("accept") || "";
  return accept.includes("text/html");
}

async function lookup(request) {
  const url = new URL(request.url);
  const base = url.origin + url.pathname.replace(/\/+$/, "");
  const candidates = [
    request,
    url.origin + url.pathname,
    url.origin + url.pathname + "index.html",
    base + "/",
    base + "/index.html",
  ];
  if (!url.pathname.endsWith("/")) {
    candidates.push(url.origin + url.pathname + "/");
    candidates.push(url.origin + url.pathname + "/index.html");
  }
  for (const candidate of candidates) {
    const hit = await caches.match(candidate, { ignoreSearch: true });
    if (hit) return hit;
  }
  return undefined;
}

async function store(request, response) {
  if (!response || !response.ok || response.type === "opaque" || response.status === 206) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  const url = new URL(request.url);
  if (url.search) {
    await cache.put(url.origin + url.pathname, response.clone());
  }
}

async function offlinePage() {
  return (
    (await caches.match(new Request(OFFLINE_URL))) ||
    new Response("Sei offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  );
}

async function handleRequest(request) {
  const hit = await lookup(request);
  if (hit) return hit;

  try {
    const response = await fetch(request);
    await store(request, response);
    return response;
  } catch {
    if (isPageRequest(request)) return offlinePage();
    return new Response("", { status: 503, statusText: "Offline" });
  }
}
