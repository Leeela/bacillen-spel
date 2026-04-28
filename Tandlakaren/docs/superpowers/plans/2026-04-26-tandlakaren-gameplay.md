# Tandlakaren Gameplay-förbättringar — Implementationsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Förbättra "Godisbacillen rymmer från tandläkaren" med Lätt-nivå, streak-system, studsande godis, milstolpar och snabbare tandborstning.

**Architecture:** Alla ändringar sker i `game.js` (befintlig IIFE-struktur bevaras) och `index.html`. Godis-objektet utökas med `baseY` för sinusrörelse. State utökas med `streak`, `bestStreak` och `milestonesReached`. En ny `easy`-svårighet läggs till i `DIFFICULTIES`-objektet.

**Tech Stack:** Vanilla JavaScript, HTML5 Canvas, Web Audio API. Inga externa bibliotek. Testning sker manuellt i webbläsaren (öppna `index.html` via lokal server eller direkt).

---

## Filer som berörs

| Fil | Åtgärd |
|-----|--------|
| `Tandlakaren/game.js` | Modifiera — lägg till easy-nivå, streak, studsande godis, milstolpar, fix borstning |
| `Tandlakaren/index.html` | Modifiera — lägg till Lätt-knapp i menyn, streak-pill i HUD |

---

## Task 1: Lägg till Lätt-svårighet i DIFFICULTIES

**Filer:**
- Modifiera: `Tandlakaren/game.js:43-72` (DIFFICULTIES-objektet)
- Modifiera: `Tandlakaren/index.html:294-305` (diff-buttons i menyn)

- [ ] **Steg 1: Öppna game.js och hitta DIFFICULTIES-objektet (rad 43)**

Det ser ut så här idag:
```js
const DIFFICULTIES = {
  medium: { ... },
  hard: { ... },
};
```

- [ ] **Steg 2: Lägg till `easy` som första nyckel i DIFFICULTIES**

Lägg till detta INNAN `medium:`-blocket:
```js
easy: {
  label: 'LÄTT',
  startSpeed: () => VW * 0.003,
  maxSpeed:   () => VW * 0.003,   // ökar aldrig — konstant hastighet
  speedGrowth:() => 0,
  obstacleGap: [180, 300],
  candyGap:    [70, 130],
  dentistGap:      [4000, 5000],
  dentistChaseGap: [4000, 5000],
  maxDentists: 1,
  lives: Infinity,
  jumpForgiveness: 12,
  starThresholds: [50, 150, 300],
  candyHeightLevels: 3,
  candyBounceSpeed: 0.025,
  candyBounceAmplitude: () => PR * 0.4,
},
```

Behåll `medium` och `hard` oförändrade — lägg sedan till dessa två nya nycklar på dem också (i slutet av varje objekt, före avslutande `}`):
```js
// I medium:
candyHeightLevels: 5,
candyBounceSpeed: 0.055,
candyBounceAmplitude: () => PR * 0.9,

// I hard:
candyHeightLevels: 5,
candyBounceSpeed: 0.095,
candyBounceAmplitude: () => PR * 1.4,
```

- [ ] **Steg 3: Lägg till Lätt-knapp i index.html**

Hitta `<div class="diff-buttons">` (rad ~294). Lägg till denna knapp FÖRE den befintliga `medium`-knappen:
```html
<button class="diff-btn easy" data-diff="easy">
  <img class="char-img" src="sprites/Godisbacillen springer.png" alt="">
  <span class="labels">
    LÄTT
    <span class="meta">För de allra yngsta 🌟</span>
  </span>
</button>
```

- [ ] **Steg 4: Lägg till CSS för easy-knappen i index.html**

I `<style>`-blocket, hitta raden:
```css
.diff-btn.medium { background: linear-gradient(135deg, #66bb6a, #43a047); box-shadow: 0 6px 0 #2e7d32; }
```
Den är redan grön — `easy` ska ha samma färg (grön), medium kan bli blå för att skilja sig:
```css
.diff-btn.easy   { background: linear-gradient(135deg, #66bb6a, #43a047); box-shadow: 0 6px 0 #2e7d32; }
.diff-btn.medium { background: linear-gradient(135deg, #42a5f5, #1e88e5); box-shadow: 0 6px 0 #1565c0; }
```

- [ ] **Steg 5: Testa manuellt**

Öppna `Tandlakaren/index.html` i webbläsaren. Kontrollera:
- Tre knappar syns i menyn: LÄTT (grön), MEDEL (blå), SVÅR (röd)
- Klicka LÄTT → spelet startar med oändliga liv (hjärtat visar 💖)
- Hastigheten är låg och ökar inte

- [ ] **Steg 6: Commit**

```bash
git add Tandlakaren/game.js Tandlakaren/index.html
git commit -m "feat: lägg till Lätt-svårighet för yngre barn"
```

---

## Task 2: Studsande godis med baseY

**Filer:**
- Modifiera: `Tandlakaren/game.js` — `spawnCandy()`-funktionen (rad ~382-392) och candy-uppdateringen i `update()` (rad ~487-493)

- [ ] **Steg 1: Uppdatera spawnCandy() för att lagra baseY och använda candyHeightLevels**

Hitta `spawnCandy()`-funktionen. Byt ut dessa rader:
```js
// GAMLA rader att ta bort:
const heights = [GY - PR*1.2, GY - PR*2.2, GY - PR*3.2, GY - PR*4.2, GY - PR*5];
const y = heights[Math.floor(Math.random()*heights.length)];
state.candies.push({ type, x: VW+20, y, w: cs, h: cs, wobble: Math.random()*Math.PI*2 });
```

Ersätt med:
```js
const allHeights = [GY - PR*1.2, GY - PR*2.2, GY - PR*3.2, GY - PR*4.2, GY - PR*5];
const numLevels = state.config.candyHeightLevels || 5;
const heights = allHeights.slice(0, numLevels);
const baseY = heights[Math.floor(Math.random() * heights.length)];
state.candies.push({ type, x: VW+20, baseY, y: baseY, w: cs, h: cs, wobble: Math.random()*Math.PI*2 });
```

- [ ] **Steg 2: Uppdatera candy-loopen i update() för sinusrörelse**

Hitta candy-loopen i `update()`:
```js
for (let i=state.candies.length-1;i>=0;i--) {
  const c = state.candies[i];
  c.x -= state.speed;
  if (c.x+c.w<0) { state.candies.splice(i,1); continue; }
```

Lägg till sinusuppdatering EFTER `c.x -= state.speed;`:
```js
const amplitude = state.config.candyBounceAmplitude ? state.config.candyBounceAmplitude() : PR * 0.9;
const bounceSpeed = state.config.candyBounceSpeed || 0.055;
c.y = c.baseY + Math.sin(state.frame * bounceSpeed + c.wobble) * amplitude;
```

- [ ] **Steg 3: Testa manuellt**

Öppna spelet. Kontrollera:
- På LÄTT: godis gungar mjukt och långsamt
- På MEDEL/SVÅR: godis studsar tydligare och snabbare
- Godiset rör sig upp och ned medan det scrollar mot spelaren

- [ ] **Steg 4: Commit**

```bash
git add Tandlakaren/game.js
git commit -m "feat: studsande godis med sinusrörelse per svårighet"
```

---

## Task 3: Streak-system — state och insamlingslogik

**Filer:**
- Modifiera: `Tandlakaren/game.js` — `startGame()`, `collectCandy()`, candy-miss-detektion i `update()`

- [ ] **Steg 1: Lägg till streak i startGame()**

Hitta `startGame()`-funktionen. Efter `state.brushCount = 0;` lägg till:
```js
state.streak = 0;
state.bestStreak = 0;
```

- [ ] **Steg 2: Uppdatera collectCandy() med streak-logik**

Hitta `collectCandy()`-funktionen. Den börjar med:
```js
function collectCandy(c) {
  const vals = {candy:5,lollipop:15,rainbow:25,glitter:20,cake:30,superbag:50};
```

Byt ut `state.score += vals[c.type]||5;` mot:
```js
state.streak++;
if (state.streak > state.bestStreak) state.bestStreak = state.streak;

const baseVal = vals[c.type] || 5;
const multiplier = state.streak >= 10 ? 3 : state.streak >= 5 ? 2 : state.streak >= 3 ? 1.5 : 1;
state.score += Math.round(baseVal * multiplier);
```

- [ ] **Steg 3: Lägg till streak-miss-detektion i candy-loopen**

Candy-loopen i `update()` ser ut så här:
```js
for (let i=state.candies.length-1;i>=0;i--) {
  const c = state.candies[i];
  c.x -= state.speed;
  // ... sinusuppdatering ...
  if (c.x+c.w<0) { state.candies.splice(i,1); continue; }
  const cr = { x:c.x-c.w/2, y:c.y-c.h/2, w:c.w, h:c.h };
  if (rectsOverlap(playerRect, cr)) { collectCandy(c); state.candies.splice(i,1); }
}
```

Lägg till miss-detektion EFTER sinusuppdateringen men FÖRE `if (c.x+c.w<0)`:
```js
// Godis har passerat spelaren utan att plockas
if (!c.missed && c.x + c.w < player.x - PR) {
  c.missed = true;
  state.streak = 0;
  updateHUD();
}
```

- [ ] **Steg 4: Testa manuellt**

Öppna spelet. Kontrollera:
- Samla 3 godis i rad → poängen ökar snabbare (x1.5)
- Missa ett godis → streak nollställs
- Streak nollställs inte av att krocka med hinder

- [ ] **Steg 5: Commit**

```bash
git add Tandlakaren/game.js
git commit -m "feat: streak-system med poängmultiplikator"
```

---

## Task 4: Streak — HUD-display och visuell feedback

**Filer:**
- Modifiera: `Tandlakaren/index.html` — lägg till streak-pill i HUD
- Modifiera: `Tandlakaren/game.js` — `updateHUD()`, popup-text vid streaks

- [ ] **Steg 1: Lägg till streak-pill i HUD (index.html)**

Hitta HUD-blocket:
```html
<div class="hud" id="hud" style="display:none;">
  <div>
    <div class="pill">🍬 <span id="score">0</span></div>
    <div class="pill" id="brushCount">🪥 0/10</div>
  </div>
```

Lägg till streak-pill under brushCount:
```html
    <div class="pill" id="streakPill" style="display:none;">🔥 <span id="streakCount">0</span></div>
```

- [ ] **Steg 2: Hämta streak-elementet i game.js**

Hitta DOM-sektionen i toppen av game.js (rad ~10-25). Lägg till:
```js
const streakPillEl  = document.getElementById('streakPill');
const streakCountEl = document.getElementById('streakCount');
```

- [ ] **Steg 3: Uppdatera updateHUD() med streak**

Hitta `updateHUD()`-funktionen och lägg till i slutet:
```js
if (streakCountEl) streakCountEl.textContent = state.streak;
if (streakPillEl) {
  streakPillEl.style.display = state.streak >= 3 ? 'block' : 'none';
  streakPillEl.style.background = state.streak >= 10
    ? 'rgba(255,215,0,0.95)'   // guld vid 10+
    : state.streak >= 5
    ? 'rgba(255,152,0,0.95)'   // orange vid 5+
    : 'rgba(255,255,255,0.95)'; // vit vid 3-4
}
```

- [ ] **Steg 4: Lägg till popup-text-funktion i game.js**

Lägg till denna funktion efter `spawnParticles()`-funktionen (~rad 410):
```js
const popups = [];
function spawnPopup(text, x, y) {
  popups.push({ text, x, y, life: 55, vy: -1.5 });
}
```

- [ ] **Steg 5: Rita popups i draw()-funktionen**

Hitta `draw()`-funktionen. Lägg till anrop till `drawPopups()` efter `drawParticles()`:
```js
drawPopups();
```

Lägg till `drawPopups()`-funktionen:
```js
function drawPopups() {
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i];
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) { popups.splice(i, 1); continue; }
    ctx.globalAlpha = Math.min(1, p.life / 20);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#e91e63';
    ctx.lineWidth = 3;
    ctx.font = `bold ${Math.round(VH * 0.04)}px Arial`;
    ctx.textAlign = 'center';
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}
```

- [ ] **Steg 6: Trigga popup i collectCandy() vid streak-milstolpar**

I `collectCandy()`, efter streak-räkningen, lägg till:
```js
if (state.streak === 3)  spawnPopup('3 i rad! 🔥', player.x, player.y - PR * 3);
if (state.streak === 5)  spawnPopup('x2 BONUS! 🔥🔥', player.x, player.y - PR * 3);
if (state.streak === 10) spawnPopup('STREAKMASTER! 🌟', player.x, player.y - PR * 3);
```

- [ ] **Steg 7: Nollställ popups vid startGame()**

I `startGame()`, lägg till:
```js
popups.length = 0;
```

- [ ] **Steg 8: Testa manuellt**

Öppna spelet. Kontrollera:
- Streak-pillret dyker upp vid 3 i rad
- "3 i rad! 🔥" text poppar upp ovanför spelaren
- Vid 5+ streak: orange pill + "x2 BONUS!"-popup
- Vid 10+ streak: guldpill + "STREAKMASTER!"-popup

- [ ] **Steg 9: Commit**

```bash
git add Tandlakaren/game.js Tandlakaren/index.html
git commit -m "feat: streak-display i HUD och popup-feedback"
```

---

## Task 5: Milstolpar — tempo och intensitet

**Filer:**
- Modifiera: `Tandlakaren/game.js` — `startGame()`, hinder-passering i `update()`

- [ ] **Steg 1: Lägg till milestonesReached i startGame()**

I `startGame()`, efter `state.brushCount = 0;`:
```js
state.milestonesReached = 0;
```

- [ ] **Steg 2: Lägg till milestone-funktion**

Lägg till efter `spawnPopup()`-funktionen:
```js
function triggerMilestone(n) {
  if (n === 1) {
    // Hastighetsboost vid milstolpe 1
    state.speed = Math.min(state.speed * 1.4, state.config.maxSpeed());
    spawnPopup('🔥 Snabbare!', VW / 2, VH * 0.3);
  } else if (n === 2) {
    // Öka bounce-amplituden dynamiskt (via state-flagga som spawnCandy läser)
    state.bonusBounce = true;
    spawnPopup('🍬 Vad händer?!', VW / 2, VH * 0.3);
  }
}
```

- [ ] **Steg 3: Lägg till bonusBounce i startGame()**

I `startGame()`:
```js
state.bonusBounce = false;
```

- [ ] **Steg 4: Använd bonusBounce i sinusuppdateringen (Task 2)**

Hitta sinusuppdateringen du lade till i Task 2:
```js
const amplitude = state.config.candyBounceAmplitude ? state.config.candyBounceAmplitude() : PR * 0.9;
```

Byt ut mot:
```js
const baseAmplitude = state.config.candyBounceAmplitude ? state.config.candyBounceAmplitude() : PR * 0.9;
const amplitude = state.bonusBounce ? baseAmplitude * 1.6 : baseAmplitude;
```

- [ ] **Steg 5: Trigga milstolpar i hinder-passeringskoden**

Hitta blocket i `update()` där `brushCount` ökas (runt rad ~466-477):
```js
state.brushCount++;
playJumpSound();
state.score += 50;
```

Lägg till EFTER `state.brushCount++`:
```js
if (state.brushCount === 4 && state.milestonesReached < 1) {
  state.milestonesReached = 1;
  triggerMilestone(1);
}
if (state.brushCount === 7 && state.milestonesReached < 2) {
  state.milestonesReached = 2;
  triggerMilestone(2);
}
```

- [ ] **Steg 6: Testa manuellt**

Spela på MEDEL. Kontrollera:
- Efter 4 klarade hinder: spelet snabbar upp och "🔥 Snabbare!"-popup dyker upp
- Efter 7 klarade hinder: godiset börjar studsa mer och "🍬 Vad händer?!"-popup syns

- [ ] **Steg 7: Commit**

```bash
git add Tandlakaren/game.js
git commit -m "feat: milstolpar vid 4 och 7 klarade hinder"
```

---

## Task 6: Snabba upp tandborstnings-minispelet

**Filer:**
- Modifiera: `Tandlakaren/game.js` — `startBrushing()` och `updateBrushing()`

- [ ] **Steg 1: Minska antal tänder till alltid 4**

Hitta `startBrushing()`-funktionen (rad ~698):
```js
const NUM = VW < 500 ? 4 : 6;
```

Byt ut mot:
```js
const NUM = 4;
```

- [ ] **Steg 2: Fördubbla rengöringshastigheten**

Hitta i `updateBrushing()` (rad ~741):
```js
t.dirty = Math.max(0, t.dirty - dist*0.45 - 0.4);
```

Byt ut mot:
```js
t.dirty = Math.max(0, t.dirty - dist * 0.9 - 0.8);
```

- [ ] **Steg 3: Testa manuellt**

Spela på MEDEL och låt tandläkaren fånga dig. Kontrollera:
- Tandborstnings-minispelet visar 4 tänder
- Det tar 5–8 sekunder att borsta alla rena (inte 15+)
- "BRAVOOOO!"-animationen triggas och spelet fortsätter normalt

- [ ] **Steg 4: Commit**

```bash
git add Tandlakaren/game.js
git commit -m "fix: tandborstning snabbare — 4 tänder, dubbel rengöringshastighet"
```

---

## Task 7: Uppdatera poängskärmen med bästa streak

**Filer:**
- Modifiera: `Tandlakaren/index.html` — lägg till streak-rad i gameover-card
- Modifiera: `Tandlakaren/game.js` — `showWinCard()` och `gameOver()`

- [ ] **Steg 1: Lägg till streak-rad i gameover-card (index.html)**

Hitta `gameover-card` i index.html. Efter `<div class="stars" id="stars">`:
```html
<p id="bestStreakText" style="font-size:16px; font-weight:700; color:#e91e63; margin: 4px 0 12px;">🔥 Bästa streak: 0</p>
```

- [ ] **Steg 2: Hämta elementet i game.js**

I DOM-sektionen i toppen:
```js
const bestStreakEl = document.getElementById('bestStreakText');
```

- [ ] **Steg 3: Uppdatera showWinCard() med streak**

I `showWinCard()`-funktionen, efter `starsEl.textContent = '⭐⭐⭐';`:
```js
if (bestStreakEl) bestStreakEl.textContent = `🔥 Bästa streak: ${state.bestStreak}`;
```

- [ ] **Steg 4: Uppdatera gameOver() med streak**

I `gameOver()`-funktionen, efter `starsEl.textContent = ...`:
```js
if (bestStreakEl) bestStreakEl.textContent = `🔥 Bästa streak: ${state.bestStreak}`;
```

- [ ] **Steg 5: Uppdatera finishBrushing() med streak (game over-väg)**

I `finishBrushing()`, i game-over-blocket efter `starsEl.textContent = ...`:
```js
if (bestStreakEl) bestStreakEl.textContent = `🔥 Bästa streak: ${state.bestStreak}`;
```

- [ ] **Steg 6: Testa manuellt**

Spela en omgång och vinn/förlora. Kontrollera:
- Poängskärmen visar "🔥 Bästa streak: N" med korrekt antal
- Fungerar på alla tre vägarna (vinst, game over, fångad av tandläkare)

- [ ] **Steg 7: Commit**

```bash
git add Tandlakaren/game.js Tandlakaren/index.html
git commit -m "feat: visa bästa streak på poängskärmen"
```

---

## Task 8: Lätt-nivåns positiva text + final polering

**Filer:**
- Modifiera: `Tandlakaren/game.js` — `finishBrushing()`, `gameOver()`

- [ ] **Steg 1: Lätt-nivån visar aldrig negativ text**

I `gameOver()`-funktionen, hitta:
```js
gameoverTitle.textContent = stars===3?'🌟 Toppen!':stars===0?'😊 Försök igen!':'🎉 Bra jobbat!';
```

Byt ut mot:
```js
if (state.difficulty === 'easy') {
  gameoverTitle.textContent = '🌟 Bra jobbat!';
} else {
  gameoverTitle.textContent = stars===3?'🌟 Toppen!':stars===0?'😊 Försök igen!':'🎉 Bra jobbat!';
}
```

I `finishBrushing()`, hitta:
```js
gameoverTitle.textContent = '🎉 Fantastiskt!';
```
och
```js
gameoverTitle.textContent = '😅 Bra försök!';
```

Lägg till guard för easy-nivån runt det negativaste alternativet:
```js
// Byt ut '😅 Bra försök!' mot:
gameoverTitle.textContent = state.difficulty === 'easy' ? '🌟 Fortsätt!' : '😅 Bra försök!';
```

- [ ] **Steg 2: Testa manuellt — hela flödet**

Kontrollera alla tre svårighetsgrader:

**LÄTT:**
- Oändliga liv (💖)
- Konstant låg hastighet
- Godis gungar mjukt
- Game over-skärm visar bara positiv text
- Tandborstning tar 5–8 sek

**MEDEL:**
- 3 liv
- Hastigheten ökar
- Streak-pill dyker upp vid 3+
- Milstolpe-popup vid 4 och 7 hinder
- Poängskärmen visar bästa streak

**SVÅR:**
- 1 liv
- Snabb från start
- Godis studsar aggressivt

- [ ] **Steg 3: Final commit**

```bash
git add Tandlakaren/game.js
git commit -m "feat: lätt-nivån visar alltid positiv text — alla gameplay-förbättringar klara"
```

- [ ] **Steg 4: Push till GitHub**

```bash
git push
```

Spelet är nu live på bacillerna.se/Tandlakaren/
