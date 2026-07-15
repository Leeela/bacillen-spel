# Härma Dansbacillen — dans-jukebox (design-spec)

**Datum:** 2026-07-15
**Karaktär:** Dansbacillen (turkos #40E0D0)
**Målgrupp:** barn 3–8 år (kärnan funkar utan att kunna läsa)
**Filnamn:** `harma-dansbacillen.html` (SV) + engelsk spegel i `luvbugscollection/`

## Koncept
En dans-jukebox där barnet trycker på plattor som får Dansbacillen att dansa
olika stilar (balett, disco, breakdance m.fl.). Barnet härmar med kroppen.
Ingen poäng, ingen förlust, ingen timer — oändlig, positiv lek. Följer
Bacillernas barn-principer: en handling, aldrig "game over", massor av feedback,
funkar offline.

Detta är ett **nytt, fristående spel**, skilt från de två befintliga
Dansbacillen-spelen (`dansbacillen-spelet.html` = Trumman,
`dansa-med-dansbacillen.html` = frys-dansen). Nytt värde: här **demonstrerar**
Dansbacillen faktiskt danserna via riktiga videoklipp — det gör inget av de
andra spelen.

## Kärnloop
1. 6 färgglada plattor visas i ett rutnät. Varje platta = en dans.
2. Barnet trycker på en platta.
3. Röst säger **"Härma mig!"** precis vid trycket (medan klippet tonar in).
4. Dansbacillen dansar den dansen stort i mitten (~6 s videoklipp, spelar med
   klippets **egna** ljud/musik).
5. När klippet tar slut säger rösten **"Tryck på nästa dans!"** och plattorna
   pulserar inbjudande.
6. Glitter/stjärnor + glad ljudeffekt som positiv feedback efter varje dans.
7. Upprepas oändligt — barnet väljer fritt, ingen ordning krävs.

## Plattor
- 6 stycken, färg + liten emoji-hint per stil (t.ex. 🩰 🕺 🤸 ✨ 🪩 💫).
- **Inga ord** — igenkänning via färg/bild (för-läsare).
- Tryck → tänds/pulsar → triggar sitt klipp.

## Video / "scen"
- Varje klipp visas i en rundad "scen"-ram **med sin egen bakgrund**
  (ingen transparens → undviker iOS Safari vit-ruta-buggen med
  `mix-blend-mode` på `<video>`).
- Klippen är ~6 s var, Grok-genererade, spelar med sin egen musik.
- Ett `<video>`-element i scenen; källan byts till vald dans vid tryck.
- Komprimeras med `ffmpeg -crf 28` innan de läggs i repot (H.264/mp4).
- Klippen läggs i t.ex. `bilder/danser/` eller `ljud/`-nära mapp (gemener,
  GitHub Pages är skiftlägeskänsligt).

## Ljud & röst
- **Danser:** klippets eget ljud (inget separat musikval i v1).
- **Röstprompter (inspelade mp3):**
  - "Härma mig!" (vid tryck)
  - "Tryck på nästa dans!" (efter klipp)
  - (valfritt) 1–2 beröm: "Vilken dans!", "Bra härmat!"
- Röst-mp3 i gemen mapp `ljud/harma/`. Warmas på första användargest
  (iOS/Android-gest-gotcha) + `speechSynthesis`-fallback (men förlita oss inte
  på den — Android kan vara tyst).
- **Timing:** röst och klippmusik krockar inte — "Härma mig!" ligger i
  intoningen, klippmusiken bär dansen, "Tryck på nästa dans!" efter klippet.
- Bakgrundsmusik behövs troligen inte (varje klipp har egen musik); ev.
  låg-mixad `bg-musik.js` mellan danser kan läggas till senare.

## Skärmar
1. **Meny:** Dansbacillen-bild, titel, "Starta ▶".
2. **Spel:** stor dans-scen i mitten + 6 plattor + ljud på/av-knapp
   (bottom-left-up enligt standard).
3. Ingen slut-skärm behövs (oändlig lek); "◀ Tillbaka"-knapp till meny/spel.html.

## Två-sajt-sync
- SV: `harma-dansbacillen.html` + kort/länk på `spel.html`.
- EN-spegel i `luvbugscollection/` (namn t.ex. "Copy Me, Disco Bug!") + kort på
  engelska spel-sidan. EN-röstklipp kan vara pending → EN kör textbubbla/TTS
  tills EN-mp3 spelats in (samma mönster som dans-challenge).

## Icke-mål (v1)
- Ingen poäng, inga nivåer, ingen sekvens/Simon-logik (klippen är olika stilar,
  ingen rutin).
- Ingen upplåsning. (Framtida v2-idé: lås upp en ny dans efter varje lyckat
  trumspel.)

## Vad som behövs från Leila för att bygga klart
- De 6 dansklippen tillgängliga i projektet (idag i Downloads, sandbox blockerar
  läsning). Antingen flyttar Leila in dem, eller så bearbetar jag dem med
  sandbox av.
- Inspelning av 2 (–4) svenska röstfraser (kan göras via ElevenLabs-mönstret
  som i räknespelet).

## Test
- Manuellt i browser-preview: tryck platta → rätt klipp spelar med ljud →
  "Härma mig!" → klippslut → "Tryck på nästa dans!" → plattor pulsar.
- Verifiera på mobil-bredd + att inget klipp visar vit ruta (iOS).
