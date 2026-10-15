// Just enough for the hub to be installable. There's deliberately no fetch
// handler and no cache, so guidance is always fetched fresh and never goes
// stale; offline use is out of scope.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
