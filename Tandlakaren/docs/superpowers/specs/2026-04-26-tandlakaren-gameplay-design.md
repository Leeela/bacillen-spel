# Design: Godisbacillen rymmer från tandläkaren — Gameplay-förbättringar
**Datum:** 2026-04-26  
**Status:** Godkänd

---

## Bakgrund & Problemformulering

Spelet är ett endless runner där Godisbacillen hoppar över tandborstar och samlar godis. Två tydliga svagheter identifierades:

1. **Monotont gameplay** — spelaren gör bara EN sak (hoppa) hela tiden, ingenting varierar
2. **Passiv poängsamling** — godis flödar förbi utan att kräva aktiv ansträngning eller tajming

Målgrupp: barn 6–10 år (primär), med stöd för yngre 3–6 år via Lätt-nivån.

---

## Designmål

- Skapa **"en gång till"-känslan** — varje omgång ska ta 60–90 sek och sluta med direkt lust att spela igen
- Göra godisinsamling **aktivt utmanande** via rörelse och tajming
- Belöna **streak** (godis i rad) med synlig och kännbar bonus
- Tydliga **milstolpar** per omgång som ger variation och puls
- Balanserad **tandborstning** — ska ta 5–8 sekunder, inte 15+

---

## Svårighetsgrader

Tre nivåer ersätter nuvarande två (Medel + Svår):

| Nivå | Ålder | Liv | Hastighet | Godisstudsar | Höjdnivåer |
|------|-------|-----|-----------|--------------|------------|
| 🟢 Lätt | 3–6 år | ∞ | Konstant låg, ökar aldrig | Mjuk, långsam sinuskurva | 2–3 |
| 🟡 Medel | 6–8 år | 3 | Ökar gradvis | Medelhastighet | 5 |
| 🔴 Svår | 8–10 år | 1 | Snabb från start | Snabb, ojämn | 5 |

Lätt-nivån visar aldrig negativ text (aldrig "försök igen") — alltid uppmuntrande.

---

## Omgångsstruktur — 5 milstolpar (~60–90 sek)

Varje omgång har ett tydligt förlopp:

1. **Start** — lugnt tempo, enkla hinder, grundläggande godisstudsar
2. **Milstolpe 1** (efter 10 klarade hinder) — farten ökar, "🔥 Bra!" animation
3. **Milstolpe 2** (efter 20 klarade hinder) — rörligt godis ökar i intensitet
4. **Varning** — "TANDLÄKAREN KOMMER! 🦷" (befintlig boss-sekvens)
5. **Vinst/förlust** — WOW-video eller tandborstnings-minispel → poängskärm

---

## Streak-system

En streak-räknare visas i HUD bredvid poängen.

**Regler:**
- Plocka godis i rad → räknaren ökar
- Missat godis (scrollar förbi utan att plockas) → räknaren nollställs
- Att krocka med hinder nollställer **inte** streaken

**Bonusar:**

| Streak | Poängmultiplikator | Visuell feedback |
|--------|-------------------|-----------------|
| 3 i rad | x1.5 | "+3 i rad! 🔥" poppar upp |
| 5 i rad | x2.0 | Godisbacillen lyser gult |
| 10 i rad | x3.0 + extraliv | "STREAKMASTER! 🌟" + skärmblink |

Poängskärmen efter omgången visar "Bästa streak: N 🔥".

---

## Godisets rörelse — 2 nya beteenden

### A. Fem höjdnivåer (utökat från befintligt)
Godis placeras på 5 distinkta höjder från marknivå till max hopphöjd:
- Nivå 1 (mark): kräver att man *inte* hoppar
- Nivå 2–4 (mitten): kräver varierande hopptajming
- Nivå 5 (topp): kräver fullt hopp i rätt ögonblick

På Lätt-nivån används bara nivå 1–3.

### B. Studsande rörelse (ny)
Godis rör sig i en sinuskurva upp och ned medan det scrollar:
- Amplitud och hastighet skalas efter svårighetsgrad
- Lätt: långsam, förutsägbar kurva (3 sek per cykel)
- Medel: medelhastighet (2 sek per cykel)
- Svår: snabb, ojämn (1–1.5 sek per cykel, varierad amplitud)

Implementation: `c.y = c.baseY + Math.sin(state.frame * speed + c.wobble) * amplitude`

---

## Visuell feedback

- **Godis plockat:** poängsiffra poppar upp vid Godisbacillens huvud (`+5`, `+15 🔥`)
- **Streak-ökning:** liten animation i HUD
- **Missat godis:** liten grå ✗ vid godisplatsen (inte straffande, bara tydligt)
- **Hinder hoppad:** befintlig `+50`-konfetti behålls
- **Hög streak (5+):** Godisbacillen får gul glöd-effekt

---

## Tandborstnings-minispel — balansfix

**Problem:** Rengöringen tar för lång tid (15+ sekunder).  
**Lösning:** Dubbla rengöringshastigheten och begränsa antal tänder.

```js
// Nuvarande (för långsam):
t.dirty = Math.max(0, t.dirty - dist * 0.45 - 0.4);

// Ny (5–8 sekunder):
t.dirty = Math.max(0, t.dirty - dist * 0.9 - 0.8);
```

Max 4 tänder oavsett skärmstorlek (ta bort `VW < 500 ? 4 : 6`-logiken, sätt alltid `NUM = 4`).

---

## Vinst-/förlust-skärm

- Visar **bästa streak** denna omgång: "Bästa streak: 7 🔥"
- "Spela igen"-knappen är störst och grönast
- Lätt-nivån visar alltid positiv text

---

## Vad som inte förändras

- Tandläkarens boss-sekvens och WOW-video
- Specialgodis-typer (regnbåge, glitter, superpåse etc.)
- Highscore-systemet (localStorage)
- Tandborstnings-minispelets grundmekanik (gnugga med finger)
- Spelvärldens grafik (bakgrund, träd, fågel)
