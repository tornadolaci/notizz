// Self-destroying service worker.
//
// The old PWA (installed from GitHub Pages) serves its cached app shell and
// never hits the network for navigation - but it DOES check this sw.js URL
// for byte changes. When it finds this file, the new worker installs,
// activates, wipes every cache, unregisters itself and reloads the open
// clients, which then land on the redirect page above.
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (key) { return caches.delete(key); }));
      })
      .then(function () {
        return self.registration.unregister();
      })
      .then(function () {
        return self.clients.matchAll({ type: 'window' });
      })
      .then(function (clients) {
        clients.forEach(function (client) { client.navigate(client.url); });
      })
  );
});
