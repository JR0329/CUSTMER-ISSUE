// Service Worker：負責把App的內容快取下來，讓「加到主畫面」安裝後
// 即使完全沒有網路，也能正常打開使用。

const CACHE_NAME = "complaint-entry-v1";
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// 安裝階段：把所有必要檔案下載並存進本機快取
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// 啟用階段：清掉舊版本的快取(如果之後更新App版本用)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// 攔截所有網路請求：優先用本機快取回應，快取沒有才嘗試連網路
// 這就是離線也能打開的關鍵機制
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
