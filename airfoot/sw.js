/* Bump VERSION whenever an application shell asset changes. */
const VERSION = 'v10';
const PREFIX = `airfoot:${self.registration.scope}:`;
const CACHE = PREFIX + VERSION;
const SHELL = ['index.html', 'manifest.json', 'icon.svg'].map(path => new URL(path, self.registration.scope).href);
self.addEventListener('install', event => {
  /* A new shell must not reuse fresh-but-outdated HTTP cache entries. */
  const freshShell = SHELL.map(url => new Request(url, {cache: 'reload'}));
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(freshShell)));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'ACTIVATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || !url.href.startsWith(self.registration.scope)) return;
  const key = event.request.mode === 'navigate' ? SHELL[0] : url.href;
  if (!SHELL.includes(key)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(key)) || fetch(event.request)));
});
