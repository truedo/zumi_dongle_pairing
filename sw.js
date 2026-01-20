const CACHE_NAME = 'zumi-v1';
const ASSETS = [
  'index.html',
  'styles.css',
  'serialManager.js',
  'logo.png',
  'icon.png'
];

// 설치 시 리소스 캐싱
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

// 네트워크 요청 가로채기 (오프라인 대응)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});