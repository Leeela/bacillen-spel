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

      // Skicka "Hem"-knappar tillbaka till app-startsidan (/app/),
      // inte huvudsajtens startsida (som har header med Shop/meny).
      document.querySelectorAll('a').forEach(function (a) {
        if (a.origin === location.origin &&
            (a.pathname === '/' || a.pathname === '/index.html')) {
          a.setAttribute('href', '/app/');
        }
      });
    });
    return;
  }

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
