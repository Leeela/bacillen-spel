# STATUS — Google Play TWA-åtgärdsrunda

**Datum:** 2026-06-12  
**Repo:** Leeela/bacillen-spel (bacillerna.se)  
**Syfte:** Uppfylla Data Safety-krav inför Google Play TWA-publicering

---

## Åtgärder genomförda 2026-06-12

### Åtgärd VP3 — YouTube Privacy-Enhanced Mode (commit ff9abb0 + 6175442)

Byter embed-domän i alla iframe-källor från `youtube.com/embed` till `youtube-nocookie.com/embed`.

**bacillerna.se:**
- `index.html` rad 909
- `titta.html` rad 227 och 250

**luvbugscollection.com (repo: Leeela/luvbugscollection):**
- `index.html` rad 780
- `watch.html` rad 200 och 223

---

### Åtgärd VP1 — Villkorad GA4-laddning via app-mode.js (commit ff9abb0)

**Problem:** GA4 (G-VPN8T03G8N) laddades alltid, även i installerad TWA/PWA-app — vilket bryter mot Google Plays Data Safety-krav för barnapp.

**Lösning:** Ersätter statiskt GA4-snippet i 33 HTML-sidor med `<script src="/app-mode.js">`.

`app-mode.js` kontrollerar:
```javascript
window.matchMedia('(display-mode: standalone)').matches  // PWA/TWA
document.referrer.startsWith('android-app://')           // extra TWA-signal
```

- **Webbläsarläge:** GA4 laddas dynamiskt (identiskt beteende med tidigare snippet)
- **Standalone/TWA-läge:** GA4 laddas INTE — noll requests till googletagmanager.com
- **Bieffekt shop.html:** `window.gtag = function () {}` (no-op) förhindrar JS-fel från event-tracking-anrop i onclick-attribut

**Service-worker:** Inga ändringar krävdes — befintlig regel `url.origin !== self.location.origin` exkluderar redan alla externa domäner.

---

### Åtgärd C — Dölj /love/-länk i app-läge (commit ff9abb0)

Bacillpost (/love/) ligger utanför TWA-appens scope per låst beslut.  
`app-mode.js` döljer `a[href="/love/"]` via `style.display = 'none'` vid DOMContentLoaded när standalone/TWA detekteras.

Berörda sidor (16 st, alla i footer-nav): index.html, titta.html, godisbacillen.html, karaktarer.html, spel.html, dansbacillen.html, gladjebacillen.html, karleksbacillen.html, retbacillen.html, rikedomsbacillen.html, sagor.html, bocker.html, om.html, kontakt.html, foraldrar.html, shop.html

---

### Radering luvbugscollection/ (commit ff9abb0)

Divergerad dubblett av luvbugscollection.com-filer låg i bacillen-spel-repot och ingick i TWA-appens scope (`/luvbugscollection/*`). Verifiering visade noll interna eller externa länkar till `bacillerna.se/luvbugscollection/`. Katalogen raderades (21 filer).

---

### Åtgärd B — Korrigera GA4-ID i dress-up-bug.html (commit 6175442, luvbugscollection-repo)

`dress-up-bug.html` använde fel GA4-egendom (`G-VPN8T03G8N` = bacillerna.se) istället för `G-6CYV4QCNBS` (luvbugscollection.com). Korrigerat till rätt ID med standardsnippet.

---

### Åtgärd — Ta bort dött GA4-snippet ur mata-godisbacillen.html (commit 3)

`mata-godisbacillen.html` hade ett orört `G-GJG476R480`-snippet utan tillhörande `<script async src>` loader — dött kod som aldrig skickade data. Borttaget.

---

## Commits

| Commit | Repo | Innehåll |
|--------|------|----------|
| ff9abb0 | bacillen-spel | VP1 app-mode.js, VP3 nocookie (sv), radering luvbugscollection/ |
| 6175442 | luvbugscollection | VP3 nocookie (en), B dress-up-bug GA4-korrigering |
| *(commit 3)* | bacillen-spel | Ta bort dött G-GJG476R480-snippet |

---

## Testplan för Android (utförs manuellt — blockerar Data Safety-formuläret)

### Förberedelse
- TWA-app paketerad och installerad på Android-enhet
- Chrome med remote debugging aktiverat (`chrome://inspect`)

### Test 1 — GA4 i webbläsare (ska ladda)
- Öppna bacillerna.se i Chrome på Android
- DevTools → Network → filter: `googletagmanager`
- **Förväntat:** Request till `googletagmanager.com/gtag/js?id=G-VPN8T03G8N` syns ✓

### Test 2 — GA4 i TWA-app (ska INTE ladda)
- Öppna installerad TWA-app
- `chrome://inspect` → WebView → Network
- **Förväntat:** Noll requests mot `googletagmanager.com` eller `google-analytics.com` ✓

### Test 3 — GA4 i installerad PWA (ska INTE ladda)
- Installera bacillerna.se som PWA från webbläsare
- Öppna installerad PWA → `chrome://inspect` → Network
- **Förväntat:** Noll requests mot `googletagmanager.com` ✓

### Test 4 — YouTube nocookie
- Öppna index.html och titta.html
- DevTools → Network → filter: `youtube`
- **Förväntat:** Requests till `youtube-nocookie.com`, inga till `www.youtube.com` ✓

### Test 5 — /love/-länk dold i app
- Öppna TWA-app eller installerad PWA
- Kontrollera footer-navigationen
- **Förväntat:** 💌 Bacillpost-länken syns inte ✓

### Test 6 — /love/-länk synlig i webbläsare
- Öppna bacillerna.se i vanlig webbläsare
- **Förväntat:** 💌 Bacillpost-länken syns normalt ✓

### Test 7 — shop.html event-tracking (inga JS-fel i app)
- Öppna shop.html i TWA-app
- `chrome://inspect` → Console
- Klicka en nedladdningsknapp
- **Förväntat:** Inga `gtag is not defined`-fel i konsolen ✓

---

## Blockering
**Data Safety-formuläret är blockerat** tills Android-testerna (1–7 ovan) är genomförda och loggade med godkänt resultat.

---

## Återstående
- [ ] Android-testprotokoll (test 1–7) genomförs och signeras
- [ ] Data Safety-formuläret fylls i och skickas in i Google Play Console
