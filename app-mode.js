(function () {
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  var isTWA = document.referrer.startsWith('android-app://');

  if (isStandalone || isTWA) {
    window.gtag = function () {};
    document.addEventListener('DOMContentLoaded', function () {
      // Dölj Bacillpost-länken i appläge
      document.querySelectorAll('a[href="/love/"]').forEach(function (el) {
        el.style.display = 'none';
      });

      // Barnsäkert: dölj alla Shop-länkar i appläge
      document.querySelectorAll('a').forEach(function (a) {
        if (a.origin === location.origin && /\/shop(\.html)?$/i.test(a.pathname)) {
          a.style.display = 'none';
        }
      });

      // Håll kvar navigeringen i appen: skriv om länkar till huvudsajtens sidor
      // (Hem, Fler spel, Titta, Sagor) till app-versionerna — annars hamnar man
      // på bacillerna.se med header/Shop/meny.
      var APP_MAP = {
        '/': '/app/',
        '/index.html': '/app/',
        '/spel.html': '/app/spel.html',
        '/titta.html': '/app/titta.html',
        '/sagor.html': '/app/sagor.html'
      };
      document.querySelectorAll('a').forEach(function (a) {
        if (a.origin === location.origin && APP_MAP[a.pathname]) {
          a.setAttribute('href', APP_MAP[a.pathname]);
        }
      });

      // Barnsäkert: dölj Brevo/e-postprenumerationsformulär i appläge
      // (t.ex. på mottagarsidan /love/k/). Visas fortfarande på webben.
      document.querySelectorAll(
        '#recipient-subscribe, .recipient-subscribe, ' +
        '#sib-form-container, .sib-form-container, ' +
        '#sib-container, #sib-form, .sib-form, ' +
        '.subscribe-box, .subscribe-box-wrap'
      ).forEach(function (el) {
        el.style.display = 'none';
      });
    });
    return;
  }

  // Cloudflare Web Analytics — laddas ENDAST i webbläsarläge, aldrig i appen.
  // Tidigare låg taggen statiskt i varje HTML-sida och sköt iväg en RUM-request
  // även inuti TWA:n; verifierat på enhet 2026-08-20.
  var cf = document.createElement('script');
  cf.defer = true;
  cf.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  cf.setAttribute('data-cf-beacon', '{"token": "e985bdf04c164c86b40875af0397828c"}');
  document.head.appendChild(cf);

  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=G-VPN8T03G8N';
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', 'G-VPN8T03G8N');
}());
