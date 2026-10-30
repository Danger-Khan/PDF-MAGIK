const CACHE_NAME = 'pdf-magik-static-v1';
const PRECACHE_URLS = ["./","./index.html","./assets/Mountain_Green-IX94jeul.jpg","./assets/Mountain_Desert-BFXMCslR.jpg","./assets/House_Desert-D6QBdmoB.jpg","./assets/Mountain_Snow-D_hTCIIy.jpg","./assets/Buildings_AboveSky-QTgrdJqO.jpg","./assets/Map_Farmland-CBpymJv0.jpg","./assets/Japenese_Gate_Shadow-Cb9C-JEu.jpg","./assets/Village_Desert-BGI2a-ve.jpg","./assets/index-vnslfUoT.css","./assets/index-C7CdLgbc.js","./assets/pdf-tools-DoQAcfBg.js","./assets/protection-service-C9CHlEZc.js","./assets/index-DKVsjh2v.js","./assets/pdf-tools-BtLnviyY.js","./assets/protection-service-CAcpAd04.js","./assets/index-B3ApkMlz.js","./assets/pdf-tools.worker-B-DmGimT.js"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('pdf-magik-static-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    event.respondWith(new Response('PDF Magik works offline and blocks external requests.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    }));
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return caches.match(new URL('index.html', self.registration.scope))
            .then((index) => index ?? new Response('PDF Magik is not available offline yet.', { status: 503 }));
        }
        return new Response('This resource is not available in the offline app cache.', {
          status: 503,
        });
      }),
  );
});