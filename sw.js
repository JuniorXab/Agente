const CACHE = "cbetting-v1";
const ASSETS = [
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Rajdhani:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // Para APIs externas, siempre red (no cachear respuestas de IA)
  const url = e.request.url;
  if (
    url.includes("api.anthropic.com") ||
    url.includes("api.groq.com") ||
    url.includes("generativelanguage.googleapis.com") ||
    url.includes("serpapi.com")
  ) {
    return; // pass-through, no cache
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        // Solo cachear recursos estáticos OK
        if (resp && resp.status === 200 && resp.type === "basic") {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match("./index.html"));
    })
  );
});
