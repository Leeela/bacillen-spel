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

## Mätning på enhet 2026-08-20 (Samsung-surfplatta, TWA `se.bacillerna.app`)

Genomförd med den tillfälliga sidan `/app/diagnostik.html` (skannar varje sida i en dold
iframe på samma origin och läser av `performance.getEntriesByType('resource')`).
USB-felsökning fungerade inte, därför gjordes avläsningen på enheten.

**Appläge bekräftat:** `matchMedia('(display-mode: standalone)')` = JA.
`document.referrer` = `https://bacillerna.se/app/` — förväntat, eftersom `android-app://`
bara sätts på TWA:ns startdokument, inte vid navigering inuti appen. Detektionen i
`app-mode.js` vilar alltså i praktiken helt på display-mode-kontrollen, och den håller.

**Åldersgrinden var passerad**, så YouTube- och Spotify-inbäddningarna ingår i mätningen.

### Resultat per sida

| Sida | Resurser | Externa | GA-domäner |
|---|---|---|---|
| /app/index.html | 4 | 3 | 0 |
| /app/spel.html | 14 | 5 | 0 |
| /app/titta.html | 13 | 12 | 0 |
| /app/sagor.html | 9 | 8 | 0 |
| /app/halsning.html | 12 | 5 | 0 |

### Externa domäner (8 st)

| Domän | Requests | Vad det är |
|---|---|---|
| fonts.gstatic.com | 8 | Webbfont-filer (Fredoka, Nunito) |
| www.youtube-nocookie.com | 7 | Videoinbäddningar på Titta |
| fonts.googleapis.com | 5 | Font-CSS |
| static.cloudflareinsights.com | 5 | Analys-skript |
| cloudflareinsights.com | 5 | `/cdn-cgi/rum` — analysdata skickas |
| anchor.fm | 1 | Podd-RSS på Sagor |
| open.spotify.com | 1 | Spotify iframe-API |
| embed-cdn.spotifycdn.com | 1 | Spotify-spelaren |

### Godkänt

- **Test 2 (GA4 i TWA) — GODKÄNT.** Noll requests mot googletagmanager.com,
  google-analytics.com eller analytics.google.com på samtliga fem sidor.
  `typeof gtag` = `undefined`, `dataLayer` saknas. VP1 verifierad på enhet.
- **Test 4 (YouTube nocookie) — GODKÄNT.** Alla sju inbäddningar går mot
  `youtube-nocookie.com`, noll mot `www.youtube.com`. VP3 verifierad på enhet.
- Åldersgrinden laddar inget tredjepartsinnehåll före passage — bekräftat.
- `api.allorigins.win` användes inte; RSS hämtas direkt från anchor.fm, proxyn är reserv.

### Kvarstående problem för Data Safety

`cloudflareinsights.com/cdn-cgi/rum` är inte en nedladdning utan själva analysdatan som
skickas från enheten, på alla fem sidor. Så länge den ligger kvar går **"App doesn't collect
or share data" inte att deklarera**.

Åtgärdsförslag i prioritetsordning:

1. Villkora Cloudflare-beaconen på samma sätt som GA4 redan är (flytta in i `app-mode.js`)
   — mätningen behålls på webben, noll analysdata ur appen.
2. Självhosta Fredoka och Nunito i `/app` — tar bort 13 requests och två Google-domäner.
   Fonterna finns redan i `Spel/fonts/`.
3. YouTube och Spotify är appens faktiska innehåll och kan inte tas bort. De ligger bakom
   åldersgrinden och är användarinitierade — en annan och mer försvarbar position än
   passiv besöksmätning, men behöver bedömas separat inför formuläret.

### Ej mätt än

Skanningen täcker bara de fem `/app`-sidorna. De 15 spelen som `/app/spel.html` länkar till
ligger utanför manifest-scopet (`/mata-godisbacillen.html`, `/Memory/`, `/Tandlakaren/` m.fl.),
laddas i samma WebView och är där barnet tillbringar tiden. De laddar dessutom `app-mode.js`,
alltså de enda sidorna där GA4-gatingen överhuvudtaget körs. En separat knapp "Skanna spelen"
finns nu på diagnostiksidan — resultatet är ännu inte inhämtat från enheten.

**Tolkningsfälla vid spelskanningen:** en sida som laddas i iframe kan tappa
`display-mode: standalone`. Gör den det aktiverar `app-mode.js` inte appläget och laddar GA4
med flit — vilket ser ut som ett läckage men är en artefakt av mätmetoden. Diagnostiksidan
läser därför av display-mode inuti varje ram och flaggar utfallet som ogiltigt när appläget
tappats. Vid en sådan flagga: öppna spelet direkt i appen och läs av där i stället.

---

## Appens verkliga yta (verifierat på enhet 2026-08-20)

`app/manifest.json` deklarerar `"scope": "/app/"`, men **WebView:n navigerar fritt inom hela
origin**. Spelen ligger på rot-nivå (`/mata-godisbacillen.html`, `/Memory/`, `/Tandlakaren/`
m.fl.), öppnas inuti appen och behåller appläget — `display-mode: standalone` avläst till JA
inuti varje sida. Digital Asset Links täcker hela `bacillerna.se`.

**Appens yta är alltså hela bacillerna.se, inte de fem `/app`-sidorna.** Allt som gäller
Data Safety måste bedömas för hela sajten, inte bara `/app/`.

---

## Spelskanning på enhet 2026-08-20 (11 av 15 sidor)

Skannade med `/app/diagnostik.html`, knappen "Skanna spelen".
`display-mode: standalone inuti ramen` = JA på samtliga — mätningen är giltig, inga artefakter.

| Spel | Resurser | Externa | GA-domäner |
|---|---|---|---|
| /mata-godisbacillen.html | 32 | 2 | 0 |
| /rakna-godisbacillen.html | 22 | 1 | 0 |
| /kla-om-bacillen.html | 19 | 5 | 0 |
| /retbacillen-spelet.html | 10 | 2 | 0 |
| /gladjebacillen-spelet.html | 15 | 2 | 0 |
| /dansbacillen-spelet.html | 9 | 2 | 0 |
| /dansa-med-dansbacillen.html | 4 | 0 | 0 |
| /karleksbacillen-spelet/ | 7 | 3 | 0 |
| /karleksbacillen-labyrint/ | 6 | 3 | 0 |
| /Memory/ | 9 | 0 | 0 |
| /Tandlakaren/ | 13 | 0 | 0 |

**VP1 verifierad på riktigt.** Spelen är de enda sidorna som laddar `app-mode.js`, alltså de
enda där GA4-gatingen körs. På samtliga: `app-mode.js laddad` = JA, `typeof gtag` =
`function (no-op)`, `dataLayer` saknas, noll requests mot GA-domäner.

`/dansa-med-dansbacillen.html`, `/Memory/` och `/Tandlakaren/` hade redan noll externa
resurser — dansspelet självhostade fonterna, vilket blev mönstret för åtgärdsrundan nedan.

**Ej avlästa än:** `/aktivitetsbok.html`, `/rikedomsbacillen-spelet.html`,
`/rikedomsbacillen-guldregn.html`, `/rikedomsbacillen-spara.html`. Skanningen hann inte klart
innan sidan fotograferades (ca 20 s per sida på enheten). Enligt repot laddar de inga nya
domäner — aktivitetsboken hade Cloudflare-beacon + Google Fonts, Rikedomsbacillen-spelen bara
Google Fonts — men det är inte bekräftat på enhet.

---

## Åtgärdsrunda 2026-08-20 — bort med tredjepartsanropen

### Cloudflare Web Analytics — två olika lösningar, avsiktligt

**1. Övriga sajten (spel + webbsidor):** beacon-taggen flyttad in i `app-mode.js`, samma
mekanik som GA4 redan använder. Laddas i webbläsarläge, aldrig i appläge. Skriptet fanns
redan på alla dessa sidor och detektionen är verifierad på enhet.

**2. De fem `/app`-sidorna:** beacon-taggen **borttagen helt**. `app-mode.js` laddas inte där,
och att införa det beroendet enbart för beaconens skull vore fel. `/app`-sidorna har därmed
ingen besöksmätning alls — medvetet val.

Den statiska taggen togs bort ur samtliga 24 HTML-filer som hade den (byte-identisk i alla).
`integritetspolicy.html` saknade `app-mode.js` och fick det tillagt, annars hade den tappat
mätningen även i webbläsare.

**Medveten utökning som behöver kontrolleras:** `app-mode.js` laddar inte bara beaconen utan
även GA4. Integritetspolicysidan får därmed **GA4 i webbläsarläge, vilket den inte hade
tidigare**. I appläge laddas ingetdera. Detta måste stämmas av mot
sidans egen text om vilken mätning som sker, och mot cookie-samtycket — annars beskriver
policyn inte längre vad sidan faktiskt gör. Öppen punkt nedan.

### Google Fonts självhostade

Fredoka och Nunito laddades från `fonts.googleapis.com` + `fonts.gstatic.com` på 43 sidor.
Ersatta med lokala `@font-face` enligt mönstret i `dansa-med-dansbacillen.html`:

| Familj | Fil | Viktaxel |
|---|---|---|
| Fredoka | `/fonts/Fredoka-VariableFont.ttf` | 300–700 |
| Nunito | `/fonts/Nunito-VariableFont.ttf` | 200–1000 |
| Baloo 2 | `/fonts/Baloo2-VariableFont.ttf` | 400–800 |

`aktivitetsbok.html` använder Baloo 2, som inte fanns lokalt. Hämtad från Googles officiella
fonts-repo (OFL-licens, samma som de övriga). **Filen är 683 kB** — variabelfonten innehåller
både latinska och devanagariska tecken. Google levererade tidigare en subsettad woff2 på ca
30 kB. Sidan blir alltså tyngre. Subsetting kräver `fonttools`, som inte var tillgängligt.
Beslut 2026-08-20: **Baloo 2 behålls.** Subsetting noteras som framtida
optimering, inte ett hinder.

### html2canvas hostad lokalt

`kla-om-bacillen.html` laddade `html2canvas.hertzen.com/dist/html2canvas.min.js` vid tryck på
Spara. Filen (1.4.1, MIT) ligger nu i `/vendor/html2canvas.min.js`.

### Verifierat lokalt

- Noll referenser till `fonts.googleapis`, `fonts.gstatic`, `cloudflareinsights` eller
  `hertzen` kvar i någon HTML-fil på bacillerna.se.
- Fonterna laddas och renderar: `Fredoka:loaded`, `Nunito:loaded`, `Baloo 2:loaded`.
- I webbläsarläge injicerar `app-mode.js` fortfarande både beacon och GA4 — mätningen på
  webben är intakt.

**Obs vid utrullning:** `app-mode.js` cachas av webbläsare och av appens WebView. Ändringen
slår igenom först när cachen förnyas.

### Brevo-runda 2026-08-20 — förhindra i stället för att dölja

`app-mode.js` dolde prenumerationsformuläret med `display:none` i appläge, men
`sib-styles.css` och `main.js` laddades ändå — **två requests mot `sibforms.com` på nio
sidor, även inuti appen**. Döljning stoppar inte inladdning.

Berörda filer: `shop.html`, `love/index.html`, `love/k/index.html` och de sex
`love/<karaktär>/index.html`.

Åtgärd: `<link>` och `<script>` borttagna ur alla nio och injiceras nu från `app-mode.js`,
i webbläsargrenen och bara när `#sib-form` finns på sidan. De tre `@font-face`-reglerna mot
`assets.brevo.com` är helt borttagna — Roboto faller tillbaka på systemfont inuti
formuläret, även på webben (beslut 2026-08-20).

Formulärets `action` mot `sibforms.com` är orörd. Den är användarinitierad och nås bara i
webbläsarläge.

Verifierat lokalt: nio formulärsidor får 2 Brevo-requests i webbläsarläge och formuläret
fungerar; sidor utan formulär får noll.

### Döljs eller förhindras — full genomgång 2026-08-20

| Vad | Mekanism | Verdikt |
|---|---|---|
| GA4 | tidig `return` + no-op `gtag` | Förhindras |
| Cloudflare-beacon | villkorad injektion | Förhindras |
| YouTube + Spotify | åldersgrind + `data-src` | Förhindras |
| Brevo-formulär | villkorad injektion | Förhindras (efter denna runda) |
| `/love/`-länken | `display:none` | **Endast dold** — `/love/*` nås via URL |
| Shop-länkar | `display:none` | **Endast dold** — `shop.html` nås via URL |
| Länkomskrivning till `/app/` | `setAttribute('href')` | Byter destination, ingen döljning |

De två länkfallen laddar ingenting i sig — en dold länk gör inga requests. Men de leder till
sidor som nås via URL ändå. Efter Brevo-rundan laddar de sidorna inget tredjeparts i appläge,
så det är inte längre ett inladdningsproblem — men de är fortfarande *nåbara*, vilket är en
separat fråga om appens innehåll snarare än om datainsamling.

### Kvar efter åtgärdsrundan

Endast YouTube (`youtube-nocookie.com`) på Titta och Spotify (`open.spotify.com`,
`embed-cdn.spotifycdn.com`) plus podd-RSS (`anchor.fm`) på Sagor. Alla bakom åldersgrinden och
användarinitierade — en annan bedömning än passiv besöksmätning, men behöver fortfarande
bedömas separat inför Data Safety-formuläret.

---

## Engelska sajten är ur sync

`luvbugscollection.com` (repo `Leeela/luvbugscollection`) har **inte** fått den här
åtgärdsrundan. Den laddar fortfarande Google Fonts och Cloudflare-beaconen som förut.

Den behöver en egen runda i sitt eget repo, och **font-filerna måste läggas på plats där
först** — `/fonts/Fredoka-VariableFont.ttf`, `/fonts/Nunito-VariableFont.ttf` och
`/fonts/Baloo2-VariableFont.ttf` finns bara i bacillen-spel-repot. Att kopiera HTML-ändringen
utan filerna skulle bryta typografin på hela engelska sajten.

---

## Öppna punkter (ej compliance)

- [ ] Integritetspolicysidans text och cookie-samtycke behöver stämmas av mot att sidan nu
      får GA4 i webbläsarläge (se åtgärdsrundan ovan). Detta ÄR compliance-nära och bör
      göras innan formuläret skickas in.
- [ ] Subsetta Baloo 2 (683 kB → ca 30 kB) när `fonttools` finns tillgängligt.
- [ ] Kör åtgärdsrundan på engelska sajten, med font-filerna på plats först.
- [ ] **Layoutbugg i `kla-om-bacillen.html`:** sex `.char-btn`-knappar à 99 px ligger i en
      flex-rad med `overflow-x: visible` — totalt 485 px på en 390 px skärm, alltså 95 px
      horisontell överspillning. Befintlig bugg, inte orsakad av font-bytet: diffen rör bara
      `<link>`-raderna, html2canvas och beacon-taggen, och med systemfont blir raden bredare
      (500 px) än med Fredoka. Inte åtgärdad — rör den inte utan eget beslut.
- [ ] `harma-dansbacillen.html` (Härma Dansbacillen) länkas inte från `spel.html` och går
      därmed inte att nå i appen. Avsiktligt eller förbiseende?
- [ ] Karaktärsbilden i Kärleksbacillen-spelet ser inte ut att matcha karaktärsbibeln —
      brun/beige kropp, grön ring, långa ögonfransar. Verifiera mot `karleksbacillen_NY_9_16.jpg`.
      (Filen hittades inte i `bacillerna/` eller projektmappen på skrivbordet vid sökning
      2026-08-20 — ligger troligen i karaktärsbibeln utanför repot.)

---

## Blockering
**Data Safety-formuläret är blockerat** tills Android-testerna (1–7 ovan) är genomförda och loggade med godkänt resultat.

---

## Återstående
- [ ] **Ta bort /app/diagnostik.html före produktionsansökan** — ligger kvar tills åtgärdsrundan är verifierad på plattan. Gäller både sidan `app/diagnostik.html` och den tillfälliga textlänken "Diagnostik" längst ner i `app/index.html` (markerad med kommentaren `TILLFÄLLIG diagnostiklänk`). Sidan finns enbart för att verifiera på enheten vad TWA:ns WebView laddar (USB-felsökning fungerar inte), och är inte länkad från appens navigation i övrigt.
- [ ] Android-testprotokoll: test 2 och 4 genomförda på enhet 2026-08-20 (se ovan). Kvar: test 1, 3, 5, 6, 7.
- [ ] Verifiera åtgärdsrundan på enhet med samma metod (skanna app-sidorna + spelen igen — förväntat: noll Cloudflare, noll Google Fonts)
- [ ] Skanna de fyra sidor som inte hanns med: aktivitetsbok + Rikedomsbacillen ×3
- [ ] Data Safety-formuläret fylls i och skickas in i Google Play Console

---

## Android Developer Verification

**Uppdaterad:** 2026-06-18 | 12:02 | CET | Stockholm

Android developer verification genomförd och bekräftad direkt i Play Console per 2026-06-18.

**Identitetsverifiering**
- Verifierad 2026-06-13. Kontotyp: Personal account, ej organisation.
- Search Console-webbplats och D-U-N-S gäller inte för personkonton.

**Paketnamn**
- `se.bacillerna.app` (visningsnamn "Bacillerna, Svenska, Barnapp"). Status: Registered, 1 nyckel, registrerat 2026-06-14.
- Ingen ownership-snippet genererades. Ingen repo-ändring krävdes för verifieringen.

**Mejlet 2026-06-18 ("1 app requires registration")**
Speglade endast auto-registrering och låg efter den manuella registreringen 06-14. Konsolen är auktoritativ.

**Geografi**
- Enforcement 2026-09-30 gäller endast Brasilien, Indonesien, Singapore och Thailand.
- EU och Sverige utanför 2026-vågen. Global utrullning 2027 och framåt.
- Bevaka inför EN-appen.
- Källa: Googles publicerade dokumentation, ej konsolen.

**TODO (ej verifiering)**
- [ ] Appen står som Draft/Internal testing, "Not yet sent for review". Closed testing, 12 testare, deadline ca 2026-06-30. Detta är det brådskande spåret.
