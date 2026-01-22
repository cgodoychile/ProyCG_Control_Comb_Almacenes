// Minimal Service Worker for PWA installability
const CACHE_NAME = 'proycg-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Required for PWA installability, even if it just fetches normally
    event.respondWith(fetch(event.request));
});
