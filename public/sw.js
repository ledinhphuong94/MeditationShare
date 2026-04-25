const CACHE_NAME = 'bandoanhsang-v2'
const urlsToCache = ['/', '/index.html']

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    )
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key)) // xóa cache cũ
            )
        )
    )
})

self.addEventListener('fetch', (event) => {
    event.respondWith(
        // Ưu tiên gọi lên server trước (Network-first)
        fetch(event.request)
            .then(response => {
                // Tùy chọn: Bạn có thể lưu bản mới nhất vào cache tại đây để dùng khi offline
                return response;
            })
            .catch(() => {
                // Nếu gọi server thất bại (mất mạng), mới dùng đến cache
                return caches.match(event.request);
            })
    );
});