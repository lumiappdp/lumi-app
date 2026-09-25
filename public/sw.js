// ==================================================
// SERVICE WORKER - LUMI APP (PWA INSTALÁVEL)
// Habilita a instalação como aplicativo nativo no celular (Android / iOS)
// ==================================================

const CACHE_NAME = 'lumi-pwa-v1';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Ativação e limpeza de versões antigas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de requisições: Network First com fallback
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
