const SHELL = 'shell-v1';
const SHARE = 'share-v1';
const FILES = ['./', 'index.html', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method === 'POST' && url.pathname.endsWith('/share')) {
    e.respondWith(handleShare(e.request));
    return;
  }
  if (e.request.method === 'GET') {
    e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request)));
  }
});

async function handleShare(request) {
  const form = await request.formData();
  const cache = await caches.open(SHARE);
  await cache.delete('file');
  const meta = {};
  for (const k of ['title', 'text', 'url']) meta[k] = form.get(k) || '';
  const file = form.get('media');
  if (file && file.size) {
    await cache.put('file', new Response(file, { headers: { 'Content-Type': file.type || 'application/octet-stream' } }));
  }
  await cache.put('meta', new Response(JSON.stringify(meta), { headers: { 'Content-Type': 'application/json' } }));
  return Response.redirect('./?shared=1', 303);
}
