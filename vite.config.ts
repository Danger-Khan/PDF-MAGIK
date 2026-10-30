import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vitest/config';

function offlineServiceWorker(): Plugin {
  return {
    name: 'pdf-magik-offline-service-worker',
    generateBundle(_options, bundle) {
      const precache = [
        './',
        './index.html',
        ...Object.keys(bundle)
          .filter((fileName) => fileName !== 'sw.js' && !fileName.endsWith('.map'))
          .map((fileName) => `./${fileName}`),
      ];

      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `const CACHE_NAME = 'pdf-magik-static-v1';
const PRECACHE_URLS = ${JSON.stringify(precache)};

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
});`,
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), offlineServiceWorker()],
  worker: {
    format: 'es',
  },
  server: {
    host: true,
    allowedHosts: true,
    strictPort: false,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
