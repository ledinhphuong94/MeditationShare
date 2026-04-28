const CACHE_NAME = 'bandoanhsang-v2.2.3';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // 1. Xóa cache cũ
            caches.keys().then(keys =>
                Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
            ),
            // 2. Chiếm quyền điều khiển các tab đang mở ngay lập tức
            self.clients.claim()
        ])
    );
});

self.addEventListener('fetch', (event) => {
    // Chỉ xử lý các request GET (tránh lỗi khi gửi form/POST)
    if (event.request.method !== 'GET') return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Nếu lấy dữ liệu thành công, lưu một bản sao vào cache (tùy chọn)
                const resClone = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    // Bạn có thể lọc chỉ cache những file cần thiết như js, css, image
                    if (event.request.url.startsWith('http')) {
                        cache.put(event.request, resClone);
                    }
                });
                return response;
            })
            .catch(() => {
                // Khi mất mạng hoàn toàn, mới lấy từ cache ra dùng
                return caches.match(event.request);
            })
    );
});