// 滤镜 PWA Service Worker
const CACHE_NAME = 'filter-lab-v1';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/filter-engine.js',
  '/js/presets.js',
  '/js/app.js',
  '/manifest.json'
];

// 安装 - 预缓存所有静态文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_FILES);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// 激活 - 清理旧缓存
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 拦截请求 - 缓存优先，网络回退
self.addEventListener('fetch', (event) => {
  // 跳过非 GET 请求
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 缓存命中直接返回
      if (cached) return cached;

      // 网络请求，成功后缓存
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      }).catch(() => {
        // 离线时返回空的响应（图片类请求）
        if (event.request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#1a1a1a" width="200" height="200"/><text fill="#666" x="100" y="105" text-anchor="middle" font-size="14">离线不可用</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      });
    })
  );
});
