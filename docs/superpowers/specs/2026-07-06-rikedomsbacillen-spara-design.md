# Spara med Rikedomsbacillen — speldesign

**Datum:** 2026-07-06
**Karaktär:** Rikedomsbacillen (lila, #7F77DD / #534AB7)
**Syfte:** Lära barn (3 nivåer, ~5–10 år) att spara pengar mot ett mål istället för att slösa på impulsköp.

## Kärnidé
Barnet får veckopengar och väljer en drömsak att spara till. Under en rullande "runner"-bana
flyger frestelser (billiga impulsköp) emot. Barnet väljer SPARA eller KÖP. Den som sparar når
drömsaken på slutet; den som köpt en massa på vägen har inte råd. Spargrisen visar hela tiden
tydligt hur mycket pengar som finns kvar.

## Spelloop
1. **Start:** Barnet får sina veckopengar (syns i spargrisen) och väljer en drömsak (stor bild + pris).
2. **Bana (hybrid-runner):** Rikedomsbacillen åker framåt. Frestelser flyger emot, **roterar och glittrar**,
   var och en med ett pris.
   - **SPARA** → hoppar förbi, mynten stannar, liten spara-glitter.
   - **KÖP** → varan köps, **mynt hoppar synligt UT ur spargrisen**, siffran räknas ner, "ka-ching",
     grisen blir tydligt tommare.
3. **Spargris (alltid synlig överst):** genomskinlig spargris/burk där myntnivån stiger vid start
   och sjunker vid varje köp. Bredvid: drömsakens pris ("har jag nog kvar?").
4. **Slut — två glada slut:**
   - Sparat nog → köper drömsaken, konfetti + jubel.
   - Sparat för lite → mjukt: "Åh, pengarna tog slut! Nästa gång sparar vi mer 💜" + Spela igen.
     Ingen förlust, ingen skäll.

## Drömsaker (med tydliga priser)
Stort gosedjur (billigast) · rullskridskor · TV-spel · cykel · dator (dyrast).
Exakta priser finjusteras i bygget och skalas per nivå.

## Nivåer
- **Lätt:** få frestelser, låga priser, lugn fart, billig drömsak.
- **Medel:** fler frestelser, snabbare, dyrare drömsak — måste säga nej ibland.
- **Svår:** många frestelser + en "REA!"-lockelse, snabb fart, dyr drömsak — kräver disciplin.

## Coola effekter (för äldre barn)
Roterande varor, glitter/sparkles, mynt-partiklar, ökande fart, och **spara-streak**:
flera nej i rad → spargrisen glittrar + liten stjärnbonus.

## Ljud
Web Audio (ka-ching, pling, spara-glitter, jubel) + korta röstklipp (svenska klart, engelska senare).
`bg-musik.js` med data-volume 0.15, ljudknapp bottom-left-up.

## Teknik & publicering
- En fristående HTML-fil (spelets logik inline, likt övriga bacill-spel).
- Svenska: `rikedomsbacillen-spara.html` på bacillerna.se (repo `Spel/`).
- Engelska: motsvarande fil på luvbugscollection.com (repo `Spel/luvbugscollection/`).
- Självhostade fonter, `.nojekyll` finns redan. Länkas in på spel.html / games.html.
- Bumpa service-worker `CACHE_NAME` vid publicering.

## Ej med (YAGNI)
Ingen inloggning, ingen highscore-server, ingen reklam/köp, ingen timer, inget "game over".
