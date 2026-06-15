/* Neutral åldersgrind för Bacillerna-appen.
   Visas före tredjepartsinnehåll (YouTube/Spotify) i appläge.
   - Frågar fritt efter födelsedatum (inga ledtrådar om vilken ålder som krävs).
   - Släpper igenom 13+ (COPPA-gränsen / YouTube & Spotify min. 13 år).
   - Laddar INTE något tredjepartsinnehåll förrän grinden passerats.
   Sidan anropar: BacillAgeGate.protect(function () { ...ladda embeds... });
*/
(function () {
  var KEY = 'bacillerna_alder_ok';
  var MIN_ALDER = 13;

  function verified() {
    try { return localStorage.getItem(KEY) === 'yes'; } catch (e) { return false; }
  }
  function remember() {
    try { localStorage.setItem(KEY, 'yes'); } catch (e) {}
  }

  function buildOverlay(onPass) {
    var wrap = document.createElement('div');
    wrap.id = 'age-gate';
    var now = new Date();
    var yearOpts = '';
    for (var y = now.getFullYear(); y >= 1920; y--) yearOpts += '<option value="' + y + '">' + y + '</option>';
    var dayOpts = '<option value="">Dag</option>';
    for (var d = 1; d <= 31; d++) dayOpts += '<option value="' + d + '">' + d + '</option>';
    var months = ['Månad','januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
    var monthOpts = '';
    for (var m = 0; m < months.length; m++) monthOpts += '<option value="' + m + '">' + months[m] + '</option>';

    wrap.innerHTML =
      '<div class="ag-card">' +
        '<div class="ag-icon">🔒</div>' +
        '<h2 class="ag-title">Vuxenkoll</h2>' +
        '<p class="ag-text">Skriv in ditt födelsedatum för att fortsätta.</p>' +
        '<div class="ag-row">' +
          '<select id="ag-day" aria-label="Dag">' + dayOpts + '</select>' +
          '<select id="ag-month" aria-label="Månad">' + monthOpts + '</select>' +
          '<select id="ag-year" aria-label="År"><option value="">År</option>' + yearOpts + '</select>' +
        '</div>' +
        '<p class="ag-error" id="ag-error" aria-live="polite"></p>' +
        '<button class="ag-btn" id="ag-go" type="button">Fortsätt</button>' +
        '<a class="ag-back" href="/app/">← Tillbaka till start</a>' +
      '</div>';
    document.body.appendChild(wrap);

    document.getElementById('ag-go').addEventListener('click', function () {
      var d = document.getElementById('ag-day').value;
      var mo = document.getElementById('ag-month').value;
      var yr = document.getElementById('ag-year').value;
      var err = document.getElementById('ag-error');
      if (d === '' || mo === '' || yr === '') { err.textContent = 'Fyll i hela datumet.'; return; }
      var birth = new Date(parseInt(yr, 10), parseInt(mo, 10), parseInt(d, 10));
      var t = new Date();
      var age = t.getFullYear() - birth.getFullYear();
      var mDiff = t.getMonth() - birth.getMonth();
      if (mDiff < 0 || (mDiff === 0 && t.getDate() < birth.getDate())) age--;
      if (age >= MIN_ALDER) {
        remember();
        wrap.parentNode.removeChild(wrap);
        onPass();
      } else {
        // Neutralt resultat – avslöjar inte gränsen, uppmanar inte till att ljuga
        document.querySelector('#age-gate .ag-card').innerHTML =
          '<div class="ag-icon">🧑‍🍼</div>' +
          '<h2 class="ag-title">Hämta en vuxen</h2>' +
          '<p class="ag-text">Den här delen öppnas av en vuxen. Be någon stor om hjälp!</p>' +
          '<a class="ag-btn" href="/app/">Tillbaka till start</a>';
      }
    });
  }

  function injectStyles() {
    if (document.getElementById('age-gate-style')) return;
    var s = document.createElement('style');
    s.id = 'age-gate-style';
    s.textContent =
      '#age-gate{position:fixed;inset:0;z-index:9999;background:linear-gradient(160deg,#E5F4D6 0%,#FFE0EE 100%);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Nunito,sans-serif;}' +
      '#age-gate .ag-card{background:#fff;border-radius:24px;padding:30px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25);}' +
      '#age-gate .ag-icon{font-size:48px;margin-bottom:6px;}' +
      '#age-gate .ag-title{font-family:Fredoka,sans-serif;font-size:26px;font-weight:700;margin:0 0 8px;color:#2a2a2a;}' +
      '#age-gate .ag-text{font-size:15px;color:#555;line-height:1.5;margin:0 0 18px;}' +
      '#age-gate .ag-row{display:flex;gap:8px;margin-bottom:6px;}' +
      '#age-gate select{flex:1;min-width:0;padding:12px 8px;border:2px solid #ddd;border-radius:12px;font-family:Nunito,sans-serif;font-size:15px;background:#fff;-webkit-appearance:none;appearance:none;}' +
      '#age-gate select:focus{outline:none;border-color:#FF6B9D;}' +
      '#age-gate .ag-error{font-size:13px;color:#E55A40;font-weight:700;min-height:18px;margin:6px 0 10px;}' +
      '#age-gate .ag-btn{display:block;width:100%;background:linear-gradient(135deg,#FF6B9D,#D63A75);color:#fff;border:none;border-radius:999px;font-family:Fredoka,sans-serif;font-size:19px;font-weight:700;padding:15px;cursor:pointer;text-decoration:none;margin-bottom:10px;}' +
      '#age-gate .ag-back{display:inline-block;color:#999;font-size:13px;font-weight:700;text-decoration:underline;}';
    document.head.appendChild(s);
  }

  window.BacillAgeGate = {
    protect: function (onPass) {
      if (verified()) { onPass(); return; }
      injectStyles();
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { buildOverlay(onPass); });
      } else {
        buildOverlay(onPass);
      }
    }
  };
})();
