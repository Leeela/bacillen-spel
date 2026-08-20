(function () {
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  var isTWA = document.referrer.startsWith('android-app://');

  if (isStandalone || isTWA) {
    // Shop-sidan ska aldrig renderas inne i appen. Döljning av länken räcker inte —
    // sidan nås via URL och innehåller externa Etsy-länkar (som inte täcks av
    // samma-origin-regeln nedan) samt ett Brevo-formulär med levande action.
    // Körs före allt annat i appgrenen, medan <body> ännu inte är parsad.
    // Regexen är ankrad i båda ändar mot location.pathname och kan bara träffa
    // exakt /shop eller /shop.html. Målet /app/ matchar inte, så ingen loop.
    if (/^\/shop(\.html)?$/i.test(location.pathname)) {
      location.replace('/app/');
      return;
    }

    // Selektorlistan delas av stilblocket nedan och borttagningen i
    // DOMContentLoaded-handlern, så att de två aldrig kan glida isär.
    var BREVO_SELEKTORER =
      '#recipient-subscribe, .recipient-subscribe, ' +
      '#sib-form-container, .sib-form-container, ' +
      '#sib-container, #sib-form, .sib-form, ' +
      '.subscribe-box, .subscribe-box-wrap, .brevo-section';

    // Synkront stilblock i <head>, före DOMContentLoaded. Formuläret ska aldrig
    // hinna synas i fönstret mellan parse och borttagning. Elementen tas ändå
    // bort ur DOM när den är klar — det här är ett komplement, inte en ersättning.
    var brevoStil = document.createElement('style');
    brevoStil.textContent = BREVO_SELEKTORER + ' { display: none !important; }';
    document.head.appendChild(brevoStil);

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

      // Barnsäkert: ta bort Brevo/e-postprenumerationsformulären UR DOM i appläge.
      // Tidigare doldes de med style.display='none', men markupen låg kvar med
      // levande action mot sibforms.com — ett formulär behöver ingen JS för att
      // kunna postas. Visas fortfarande normalt på webben.
      //
      // Listan innehåller både formuläret (#sib-form) och dess wrappers. Vi tar
      // bort de YTTERSTA träffarna, så att rubrik och beskrivningstext inuti
      // wrappern följer med och inget blir kvar som ser trasigt ut.
      // .brevo-section är med för att love/index.html och shop.html annars
      // lämnar en tom sektion med 48 px marginal efter sig.
      var brevoTraffar = [].slice.call(document.querySelectorAll(BREVO_SELEKTORER));
      brevoTraffar.filter(function (el) {
        return !brevoTraffar.some(function (annan) {
          return annan !== el && annan.contains(el);
        });
      }).forEach(function (el) {
        el.remove();
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

  // Brevo/Sendinblue-formuläret — laddas ENDAST i webbläsarläge, och bara på de sidor
  // som faktiskt har ett formulär. Tidigare låg <link> och <script> statiskt i nio sidor
  // och laddades även i appen, trots att formuläret döljs där. Döljning stoppar inte
  // inladdningen — därför förhindras den i stället.
  document.addEventListener('DOMContentLoaded', function () {
    if (!document.querySelector('#sib-form')) return;
    var cssLank = document.createElement('link');
    cssLank.rel = 'stylesheet';
    cssLank.href = 'https://sibforms.com/forms/end-form/build/sib-styles.css';
    document.head.appendChild(cssLank);
    var sib = document.createElement('script');
    sib.src = 'https://sibforms.com/forms/end-form/build/main.js';
    document.body.appendChild(sib);
  });

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
