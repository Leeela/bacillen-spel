const CACHE_NAME = 'bacillerna-v69';

// Filer som cachas vid installation
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/dansbacillen.html',
  '/foraldrar.html',
  '/gladjebacillen.html',
  '/godisbacillen.html',
  '/karaktarer.html',
  '/karleksbacillen.html',
  '/kontakt.html',
  '/mata-godisbacillen.html',
  '/rakna-godisbacillen.html',
  '/om.html',
  '/retbacillen.html',
  '/rikedomsbacillen.html',
  '/sagor.html',
  '/spel.html',
  '/titta.html',
  '/manifest.json',
  '/godisbacillen.png',
  '/godisbacillen-gapar.png',
  // Dansa med Dansbacillen (dans challenge) — sida och lokala fonter för offline
  '/dansa-med-dansbacillen.html',
  '/fonts/Fredoka-VariableFont.ttf',
  '/fonts/Nunito-VariableFont.ttf',
  // Dansbacillens Dansvåg (trumspel) — spel, bild och röstklipp för offline
  '/dansbacillen-spelet.html',
  '/bilder/dansbacillen.png',
  '/ljud/Let_s_dance_.mp3',
  '/ljud/Bra_.mp3',
  '/ljud/F_rs_k_igen_.mp3',
  '/ljud/Min_tur_.mp3',
  '/ljud/Din_tur_.mp3',
  '/icons/icon-180.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  // Spara med Rikedomsbacillen (sparspel) — sida, bild och röstklipp för offline
  '/rikedomsbacillen-spara.html',
  '/bilder/rikedomsbacillen.png',
  '/ljud/rost/rikedomsbacillen/SV/rik-valj.mp3',
  '/ljud/rost/rikedomsbacillen/SV/rik-start.mp3',
  '/ljud/rost/rikedomsbacillen/SV/rik-spara.mp3',
  '/ljud/rost/rikedomsbacillen/SV/rik-kop.mp3',
  '/ljud/rost/rikedomsbacillen/SV/rik-streak.mp3',
  '/ljud/rost/rikedomsbacillen/SV/rik-vinst.mp3',
  '/ljud/rost/rikedomsbacillen/SV/rik-forlite.mp3',
  '/ljud/rost/rikedomsbacillen/SV/rik-rea.mp3',
  '/ljud/rost/rikedomsbacillen/SV/rik-bra-pris.mp3',
];

// Filtyper som aldrig cachas (video är för stora)
const NEVER_CACHE_EXTENSIONS = ['.mp4', '.mov', '.webm'];

function shouldNeverCache(url) {
  return NEVER_CACHE_EXTENSIONS.some(ext => url.pathname.endsWith(ext));
}

function isHTMLRequest(request) {
  const accept = request.headers.get('Accept') || '';
  return accept.includes('text/html') || request.url.endsWith('.html') || request.url.endsWith('/');
}

function isNetworkFirstRequest(request) {
  return isHTMLRequest(request) || request.url.endsWith('.json');
}

// Install: precacha viktiga filer
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate: rensa gamla cacher
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cachestrategi per resurstyp
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Ignorera icke-GET-förfrågningar
  if (event.request.method !== 'GET') return;

  // Ignorera externa resurser (t.ex. Google Fonts CDN)
  if (url.origin !== self.location.origin) return;

  // Aldrig cacha videofiler
  if (shouldNeverCache(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML och JSON: network-first, fallback till cache
  if (isNetworkFirstRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // CSS, JS, bilder, ljud: cache-first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      });
    })
  );
});
