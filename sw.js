// Service Worker：讓「加到主畫面」安裝後，即使沒有網路也能打開填單頁。
// 策略：「網路優先、失敗才用快取」。
//   有網路時一律抓最新版（所以更新網頁後手機會自動拿到新版）；
//   沒網路時才使用上次存下來的快取，確保離線也能開。
// 版本號(v3)：如果之後有新增/刪除需要快取的檔案，把這個版本號加一碼即可。

const CACHE_NAME = "complaint-entry-v3";
const FILES_TO_CACHE = [
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
];

// 安裝階段：把必要檔案下載並存進本機快取
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// 啟用階段：清掉舊版本的快取
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

// 只處理同網站的 GET 請求(寄信用的POST、外部CDN不介入)
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req, { cache: "no-cache" })
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then((cached) => cached || caches.match("./index.html"))
      )
  );
});
