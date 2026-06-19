---
name: rikedomsbacillen-spelet-design
description: Speldesign för Rikedomsbacillens Marknad — JA/NEJ-handelsspel med guldtema
metadata:
  type: project
---

# Rikedomsbacillens Marknad — Speldesign

**Datum:** 2026-06-19
**Karaktär:** Rikedomsbacillen (lila, guld, platinakrona)
**Målgrupp:** 3–6 år
**Plattformar:** bacillerna.se/spel, bacillerna.se/app/spel, luvbugscollection.com/games, luvbugscollection.com/app/games

## Kärnmekanik

Rikedomsbacillen håller upp ett föremål och erbjuder ett pris. Barnet trycker JA eller NEJ.

- **JA + värdefullt föremål** → tjänar (värde − pris) mynt
- **JA + värdelöst föremål** → förlorar prisbeloppet i mynt
- **NEJ + värdefullt föremål** → missar en affär (inga mynt förloras)
- **NEJ + värdelöst föremål** → smart val, sparar mynten

## Flöde

1. Startskärm: Rikedomsbacillen bobbar, "Spela"-knapp
2. 8 rundor med slumpmässiga föremål
3. Pratbubbla + föremål + pris visas
4. Barnet väljer JA eller NEJ
5. Direkt feedback + Rikedomsbacillen reagerar (2 sek)
6. Slutskärm med betyg baserat på myntbalans

## Startvärde & ekonomi

- Startar med 15 guldmynt
- Bra affär: köper föremål värt mer än priset
- Dålig affär: köper föremål värt 0 (skräp/leksaker/godis)

## Föremål

**Bra affärer (köp!):**
- 🏠 Hus — pris 12, värd 28
- ⌚ Guldklocka — pris 10, värd 22 (guldfilter på emoji)
- 🏆 Guldpokal — pris 7, värd 15
- 🥕 Morot — pris 2, värd 7
- 📚 Bok — pris 4, värd 11
- 🎁 Mystisk present — pris 6, värd 14

**Dåliga affärer (skippa!):**
- 👟 Gammal sko — pris 5, värd 0
- 🧦 Trasig strumpa — pris 4, värd 0
- 🗑️ Tom soptunna — pris 3, värd 0
- 🌂 Trasigt paraply — pris 4, värd 0
- 🍬 Godispåse — pris 5, värd 0
- 🪙 Silvermynt — pris 5, värd 0
- 🧸 Lyxigt gosedjur — pris 10, värd 0
- 🚗 Dyr leksaksbil — pris 9, värd 0

## Slutskärmar

- 🏆 > 25 mynt: "Mästaraffärare!"
- 🎉 1–25 mynt: "Bra jobbat!"
- 😢 0 mynt: "Inga mynt kvar — försök igen!"

## Tema

Guld-gradient, guldmynt (🟡), varm gul/brun bakgrund (#fef3c7), lila accenter från Rikedomsbacillen.

## Framtida spel (separat)

"Bytarspelet" — barnet har föremål och kan dra ut dem för att byta med Rikedomsbacillen. Ser om det var ett bra byte.

## Filer

- `rikedomsbacillen-spelet.html` — svenska
- `luvbugscollection/wealth-bug-market.html` — engelska
