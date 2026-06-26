# Glädjebacillen — "Sprid glädjen!" (känslospel)

*Skapad: 26 juni 2026*
*Status: Designutkast — väntar på Leilas godkännande*

## Mål

Ett lärorikt känslospel där barnet (1) **känner igen en känsla** och (2) **svarar med empati** genom att låta Glädjebacillen sprida glädje. Lär ut känslo-ordförråd och empati — unikt jämfört med övriga Bacillerna-spel (som handlar om godis, pengar, labyrint, memory).

## Målgrupp

3–8 år, auto-anpassat:
- **Inga texter krävs** — allt går att förstå via bilder, ansikten och ljud.
- Känslans ord **visas diskret + sägs högt** som stöd för tidig läsning (4–8 år).
- Inga förluster, ingen timer, ingen "game over" — bara positiv feedback (Bacillerna-kärnprincip).

## Spelloop (en runda ≈ 10 sek)

1. En rund **känslokompis** kommer fram med ett ansikte (en av 6 känslor).
2. **"Hur känner den sig?"** — 2–3 stora ansiktsknappar (rätt svar + 1–2 distraktorer).
   Barnet trycker.
3. **Rätt** → känslans namn sägs/visas kort (t.ex. LEDSEN), liten pling.
   **Fel** → mjuk "försök igen"-feedback, knappen studsar, aldrig bestraffning.
4. **Steg 2 — svara med empati:** barnet trycker på Glädjebacillen.
   - Hon **hoppar (glädjeskutt)**, `skratt.mp3` spelar.
   - **Gula glädjevågor** (ringar) sprider sig ut från henne.
   - Negativ känsla (ledsen/arg/rädd/sur) → kompisens ansikte **förvandlas mjukt till ett leende**.
   - Positiv känsla (glad/kär) → ingen förvandling behövs; de **firar tillsammans** (båda hoppar).
5. Kort jubel (`wow.mp3` / `YaaaaY.mp3`) → ny kompis. Oändligt loopbart.

## De 6 känslorna (ritade SVG-ansikten — alternativ A)

Alla ansikten ritas i kod (SVG): rund färgad cirkel + ögon, ögonbryn, mun. Inga foton, inga emoji. Förvandling till leende sker genom att animera mun/ögonbryn.

| Känsla | Visuell signatur |
|---|---|
| **Glad** | Stort leende uppåt, runda ögon, rosiga kinder |
| **Ledsen** | Nedåtböjd mun, en tår, ögonbryn upp i mitten |
| **Arg** | Ögonbryn ihop i ett V, öppen/spänd mun, rödare ton (aktiv ilska) |
| **Rädd** | Stora vidöppna ögon, liten oval mun, ögonbryn upp, lätt darr |
| **Sur** | Hopknipen pout-mun åt sidan, halvslutna ögon, bortvänd blick (tjurig/passiv) |
| **Kär** | Hjärt-/glitterögon, leende, rosa kinder, små hjärtan runt huvudet |

*Arg och sur hålls medvetet visuellt åtskilda: arg = aktiv/utåtriktad, sur = passiv/tjurig.*

## Adaptiv svårighet

- Runda 1–3: **2 ansiktsknappar** (rätt + 1 distraktor), bara de tydligaste känslorna (glad/ledsen).
- Därefter: **3 knappar**, fler känslor i rotationen, upp till alla 6.
- Ingen poäng som kan sjunka; en mjuk "stjärnräknare" kan visa hur många kompisar man glatt (uppmuntrande, aldrig negativ).

## Grafik

- **Hjälte:** befintlig `bilder/gladjebacillen.png` (leende, stående).
- **Känslokompisar:** SVG-ritade i kod (se tabell). Återanvändbara, skalbara, ingen ny ritning krävs av Leila.
- **Glädjevågor:** gula/orangea ringar (CSS/SVG-animation) — Glädjebacillens signaturvisuella ("glädjesmitta som ringar på vatten").
- Färger: Glädjebacillens grön (#7BC142) för henne/krona, gult/orange för glädjevågorna och accenter.

## Ljud & musik

- Befintliga: `ljud/skratt.mp3` (glädjeskutt), `ljud/wow.mp3`, `ljud/YaaaaY.mp3`, `ljud/smart.mp3` (rätt svar).
- Bakgrundsmusik via `bg-musik.js`, `data-volume="0.15"`, `data-pos="bottom-left-up"` (Leilas standard). Egen kreditfri Pixabay-låt (`ljud/musik-gladjebacillen.mp3`) läggs till senare.
- (Framtid) Inspelade svenska känslo-ord för uppläsning; tills dess visas ordet som text + spelas ett positivt pling.

## Teknik & filplacering

- **En enda fil:** `/Users/leila/bacillerna/Spel/gladjebacillen-spelet.html` — vanilla HTML/CSS/JS, samma mönster som `retbacillen-spelet.html` och `rikedomsbacillen-spelet.html`.
- Länkas in från `spel.html` (samma kortlayout som övriga spel) och från karaktärssidan `gladjebacillen.html`.
- Service worker: bumpa `CACHE_NAME` när spelet läggs till så det cachas.
- **Repo:** detta ligger i `Spel/`-repot (bacillen-spel → bacillerna.se). Committa/pusha separat — aldrig `git add -A` i Spel.
- **Engelsk syster-sajt:** en engelsk version (Joy Bug — "Spread the Joy!") ska senare också finnas på luvbugscollection.com (eget repo). Inte del av denna MVP.

## Barnsäkerhet & tillgänglighet

- Inga köp, ingen reklam, inga externa länkar i spelet (COPPA/GDPR-K).
- Stora tryckytor, hög kontrast, funkar offline (PWA/cache).
- Funkar i app-WebView: använd direkt `scrollIntoView` utan `behavior:smooth` om scroll behövs.

## MVP-scope (vad som byggs nu)

**Ingår:**
- Tvåstegs-loopen, 6 känslor som SVG-ansikten, adaptiv 2→3 knappar.
- Positiv feedback, ingen game over, glädjevågs-animation, ljud + bg-musik.
- Länk från `spel.html`.

**Senare (ej nu):**
- Inspelad svensk uppläsning av känslo-orden.
- Egen Pixabay-musiklåt.
- Engelsk version på luvbugscollection.com.
- Ev. fler känslor/nivåer.
