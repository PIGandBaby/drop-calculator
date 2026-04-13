// sw.js – MDD 계산기 Service Worker v2
// Cache-First 전략 + 오프라인 완전 지원
const CACHE_NAME = 'mdd-cache-v2';

const PRECACHE_URLS = [
  '/drop-calculator/',
  '/drop-calculator/index.html',
  '/drop-calculator/manifest.json',
  '/drop-calculator/privacy-policy.html',
  '/drop-calculator/icons/icon-192.png',
  '/drop-calculator/icons/icon-512.png',
];

// 설치: 핵심 파일 프리캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 활성화: 구버전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// 패치: Cache-First, 오프라인 시 index.html fallback
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return response;
      }).catch(() => {
        // 오프라인이고 캐시도 없을 때 → 메인 페이지 반환
        return caches.match('/drop-calculator/index.html');
      });
    })
  );
});
