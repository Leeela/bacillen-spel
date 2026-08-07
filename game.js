// ==========================================
//  MATA GODISBACILLEN! 🍬
//  Med nivåer, highscore och snabbare tempo!
// ==========================================

// ── roundRect-polyfill (iOS < 16, Chrome/Android WebView < 99) ───────────────
// Utan denna kastar ctx.roundRect() ett fel varje frame på äldre motorer, och
// eftersom requestAnimationFrame(loop) ligger EFTER anropet dör hela loopen →
// spelet fryser vid start. Polyfillen ritar samma rundade rektangel manuellt.
if (window.CanvasRenderingContext2D &&
    !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (typeof r !== 'number') r = (Array.isArray(r) && r.length) ? r[0] : 0;
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    this.moveTo(x + r, y);
    this.lineTo(x + w - r, y);
    this.arcTo(x + w, y, x + w, y + r, r);
    this.lineTo(x + w, y + h - r);
    this.arcTo(x + w, y + h, x + w - r, y + h, r);
    this.lineTo(x + r, y + h);
    this.arcTo(x, y + h, x, y + h - r, r);
    this.lineTo(x, y + r);
    this.arcTo(x, y, x + r, y, r);
    return this;
  };
}

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const bubble    = document.getElementById('reaction-bubble');     // liten reaktion i hörnet
const video     = document.getElementById('reaction-video');
const fsOverlay = document.getElementById('reaction-fullscreen'); // helskärm (krasch/vinst)
const videoFs   = document.getElementById('reaction-video-fs');
const bugLoop    = document.getElementById('bug-loop');
const crashVideo = document.getElementById('crash-video');
const startScreen = document.getElementById('start-screen');

let W = canvas.width  = window.innerWidth;
let H = canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
});

// ==========================================
//  NIVÅ-SYSTEM
// ==========================================
let level = 1;
const LEVELS = {
  1: {
    candySpeed:    [1.3, 1.7],   // min + random range
    spawnInterval: 75,
    maxCandy:      7,
    chanceYucky:   0.15,
    chanceSalim:   0.10,
    chanceSelma:   0.10,
    chanceGold:    0.10,
    bgTop:    '#fff2c2',   // Godislandet — varm godisäng
    bgBottom: '#ffd4ee',
    grassColor: '#8fd66f',
    bpm: 160,
  },
  2: {
    candySpeed:    [1.8, 2.2],
    spawnInterval: 55,
    maxCandy:      8,
    chanceYucky:   0.25,
    chanceSalim:   0.10,
    chanceSelma:   0.10,
    chanceGold:    0.10,
    bgTop:    '#8fccff',   // Godishimlen — klarblå himmel
    bgBottom: '#dff3ff',
    grassColor: '#cdeeff',
    bpm: 190,
  },
  3: {
    candySpeed:    [2.3, 2.7],
    spawnInterval: 40,
    maxCandy:      9,
    chanceYucky:   0.20,
    chanceSalim:   0.10,
    chanceSelma:   0.10,
    chanceGold:    0.12,
    bgTop:    '#ff9e5e',   // Godisvulkanen — glödande orange himmel
    bgBottom: '#ffd6a3',
    grassColor: '#a9663f',
    bpm: 220,
  },
};

function getLevelConfig() { return LEVELS[level] || LEVELS[3]; }

// ==========================================
//  TÄNDER (poäng = konsekvens)
//  Godis spräcker en tand 🦷 — grönsaker lagar en.
// ==========================================
const MAX_TEETH = 8;
let brokenTeeth = 0;
let teethPulse  = 0; // kort puls-animation när en tand ändras

function crackTooth() { brokenTeeth = Math.min(MAX_TEETH, brokenTeeth + 1); teethPulse = 14; }
function healTooth()  { brokenTeeth = Math.max(0, brokenTeeth - 1);          teethPulse = 14; }

// ==========================================
//  STJÄRNSAMLING — sparas mellan besök (localStorage)
//  Man får en stjärna varje gång man klarar en värld. Samlingen växer över
//  tid → en anledning att komma tillbaka. Ingen inloggning, ingen server.
// ==========================================
const STARS_KEY = 'bacillerna-godis-stjarnor';
function loadStars() { const n = parseInt(localStorage.getItem(STARS_KEY) || '0', 10); return isNaN(n) ? 0 : n; }
function saveStars(n) { try { localStorage.setItem(STARS_KEY, String(n)); } catch (e) {} }
let totalStars = loadStars();
let starPulse  = 0;   // puls på räknaren när en stjärna tjänas
let starGain   = 0;   // "+1"-flyt-animation

function earnStar() {
  totalStars++;
  saveStars(totalStars);
  starPulse = 40;
  starGain  = 90;
  spawnStarBurst();
}

// ==========================================
//  VIDEOFILER — lazy loading
// ==========================================
const VIDEOS = {
  chomp:   'Mmm_Godis!.mp4',
  merMore: 'Mer_godis!.mp4',
  namnam:  'Godisbacillen_nam_nam.mp4',
  wow:     'Wow!_Tack!.mp4',
  win:     'Win_star_Perfekt!.mp4',
  yuck:    'NEj_jag_vill_ha_godis.mp4',
  salim:   'Nej jag kan inte äta Salim.mp4'
};

// Förladda videor i bakgrunden efter att spelet startat
function preloadVideos() {
  Object.values(VIDEOS).concat(['Somnar.mp4']).forEach(src => {
    const v = document.createElement('video');
    v.preload = 'auto';
    v.src = src;
    v.load();
  });
}

let isShowingVideo = false;
let candyEaten = 0;

// ==========================================
//  BAKGRUNDSMUSIK (MP3-loop)
// --------------------------------------------------------------------------
//  Lägg en gratis, loopbar instrumentallåt i ljud/spelmusik.mp3
//  (t.ex. från pixabay.com/music — ingen kreditering krävs).
//  Saknas filen händer inget — spelet funkar precis som vanligt.
// ==========================================
const MUSIC_KEY = 'bacillerna-musik';        // 'on' (standard) eller 'off'
let bgMusic = null;
let musicPlaying = false;
let musicBtn = null;

function wantsMusic() { return localStorage.getItem(MUSIC_KEY) !== 'off'; }

function buildMusicButton() {
  if (musicBtn) return;
  musicBtn = document.createElement('button');
  musicBtn.type = 'button';
  musicBtn.setAttribute('aria-label', 'Slå på eller av musik');
  musicBtn.style.cssText =
    'position:fixed;z-index:99999;bottom:80px;left:16px;' +   // ovanför "Se mer!"-knappen
    'width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;' +
    'font-size:26px;line-height:54px;text-align:center;padding:0;' +
    'background:rgba(255,255,255,0.9);color:#2D8659;' +
    'box-shadow:0 3px 10px rgba(0,0,0,0.2);' +
    '-webkit-tap-highlight-color:transparent;transition:transform .1s;';
  musicBtn.onpointerdown = () => { musicBtn.style.transform = 'scale(0.9)'; };
  musicBtn.onpointerup   = () => { musicBtn.style.transform = 'scale(1)'; };
  musicBtn.addEventListener('click', e => { e.stopPropagation(); toggleMusic(); });
  document.body.appendChild(musicBtn);
  renderMusicButton();
}

function renderMusicButton() {
  if (!musicBtn) return;
  musicBtn.textContent = wantsMusic() ? '🎵' : '🔇';
  musicBtn.style.opacity = wantsMusic() ? '1' : '0.6';
}

function startMusic() {
  buildMusicButton();
  if (!bgMusic) {
    bgMusic = new Audio('ljud/musik-godisbacillen.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.15;
    bgMusic.preload = 'auto';
  }
  updateMusicTempo();
  if (!wantsMusic()) return;
  musicPlaying = true;
  const p = bgMusic.play();
  if (p) p.catch(() => {});   // blockeras tills nästa touch — spelaren tappar inte
}

function toggleMusic() {
  if (wantsMusic()) {
    localStorage.setItem(MUSIC_KEY, 'off');
    if (bgMusic) bgMusic.pause();
    musicPlaying = false;
  } else {
    localStorage.setItem(MUSIC_KEY, 'on');
    startMusic();
  }
  renderMusicButton();
}

// Snäppa tempot uppåt en gnutta per nivå — håller energin uppe utan ny låt.
function updateMusicTempo() {
  if (!bgMusic) return;
  const lvl = (typeof level === 'number') ? level : 1;
  bgMusic.playbackRate = Math.min(1 + (lvl - 1) * 0.05, 1.2);
}

// Pausa när fliken/appen göms, återuppta när man kommer tillbaka.
document.addEventListener('visibilitychange', () => {
  if (!bgMusic) return;
  if (document.hidden) { bgMusic.pause(); }
  else if (musicPlaying && wantsMusic()) { bgMusic.play().catch(() => {}); }
});

// ── Auto-resume av bakgrundsmusik efter en reaktions-/krasch-video ──────────
// iOS Safari avbryter <audio>-musiken när en röstvideo tar över ljudsessionen
// och återupptar den inte själv. Vi schemalägger ett återupptagningsförsök
// 1200 ms efter att videoaktiviteten lugnat sig (debounce — så att täta
// reaktioner inte triggar en massa försök mitt i nästa video).
//
// VIKTIGT (iOS): ett programmatiskt play() härifrån sker UTAN färsk
// användargest. iOS kan avvisa det (NotAllowedError). Då fångas felet tyst,
// musik-state lämnas orört och den manuella musikknappen fungerar precis som
// förut. Console-loggen visar utfallet vid telefontest (ingen synlig debug-UI).
let musicResumeTimer = null;

function cancelMusicResume() {
  if (musicResumeTimer) { clearTimeout(musicResumeTimer); musicResumeTimer = null; }
}
function scheduleMusicResume() {
  cancelMusicResume();
  musicResumeTimer = setTimeout(() => { musicResumeTimer = null; resumeMusic(); }, 1200);
}
function resumeMusic() {
  if (!bgMusic) return;
  if (!wantsMusic() || !musicPlaying) return;   // användaren har musik avstängd
  if (document.hidden) return;                  // dold flik sköts av visibilitychange
  if (!bgMusic.paused) return;                  // spelar redan, inget att göra
  const p = bgMusic.play();
  if (p && p.then) p.then(
    () => console.log('[musik] auto-resume efter video: OK'),
    (err) => console.log('[musik] auto-resume avvisad:', err && err.name,
                         '— manuell musikknapp fungerar fortfarande')
  );
}

// ==========================================
//  INSTRUKTIONSTEXT (visas i 4 sek vid start)
// ==========================================
let instrTimer = 180;

function drawInstruction() {
  if (instrTimer <= 0) return;
  instrTimer--;
  const alpha = instrTimer < 60 ? instrTimer / 60 : 1;
  ctx.save();
  ctx.globalAlpha = alpha * 0.92;
  ctx.font = `bold ${Math.min(W * 0.055, 36)}px Arial Rounded MT Bold, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillText('🥕 Grönsaker lagar tänder! 🦷', W/2 + 2, H * 0.18 + 2);
  ctx.fillStyle = '#2e7d32';
  ctx.fillText('🥕 Grönsaker lagar tänder! 🦷', W/2, H * 0.18);
  ctx.restore();
}

// ==========================================
//  NIVÅ-ÖVERGÅNG
// ==========================================
let levelTransition = 0; // 0 = ingen, >0 = countdown frames
let levelTransitionText = '';

// Varje nivå är en egen "värld" med eget namn och egna godisar.
const WORLD_NAMES = { 1: 'Godislandet', 2: 'Godishimlen', 3: 'Godisvulkanen' };

function showLevelTransition(newLevel) {
  levelTransitionText = newLevel <= 3
    ? `🌍 ${WORLD_NAMES[newLevel]}`
    : '🏆 MÄSTARE! 🏆';
  levelTransition = 150; // 2.5 sekunder
}

function drawLevelTransition() {
  if (levelTransition <= 0) return;
  levelTransition--;
  const alpha = levelTransition < 30 ? levelTransition / 30
              : levelTransition > 120 ? (150 - levelTransition) / 30
              : 1;
  ctx.save();
  ctx.globalAlpha = alpha * 0.95;

  // Bakgrund
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, 0, W, H);

  // Text
  const scale = 1 + Math.sin(levelTransition * 0.1) * 0.05;
  ctx.translate(W/2, H/2);
  ctx.scale(scale, scale);
  ctx.font = `bold ${Math.min(W * 0.1, 64)}px Arial Rounded MT Bold, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Skugga
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(levelTransitionText, 3, 3);

  // Huvudtext
  ctx.fillStyle = '#fff';
  ctx.fillText(levelTransitionText, 0, 0);

  // Undertitel
  if (level <= 3) {
    ctx.font = `bold ${Math.min(W * 0.045, 28)}px Arial Rounded MT Bold, Arial`;
    ctx.fillStyle = '#ffeb3b';
    const subText = level === 2 ? 'Nya godisar! 🍬 Snabbare 💨'
                  : level === 3 ? 'Nya godisar! 🍬 Snabbast 🔥' : '';
    ctx.fillText(subText, 0, 50);
  }

  ctx.restore();
}

// ==========================================
//  STARTSKÄRM
// ==========================================
const startBtn  = document.querySelector('.start-btn');
const startBug  = document.getElementById('start-bug');
let gameStarted = false;
let loopStarted = false;

bugLoop.addEventListener('canplay', () => {
  if (!startBug.src && !startBug.currentSrc) {
    startBug.src = 'bug_loop.mp4';
    startBug.play().catch(() => {});
  }
}, { once: true });
// bug-loop har <source>-taggar i HTML — anropa bara load() för att starta
bugLoop.load();
function handleStart() {
  if (gameStarted) return;
  gameStarted = true;

  startScreen.style.display = 'none';

  // Starta den tunga spel-loopen FÖRST när spelet startar — annars ritar den
  // (med dyr getImageData per frame) bakom startskärmen och gör START-knappen trög.
  if (!loopStarted) { loopStarted = true; requestAnimationFrame(loop); }

  // Värm BÅDA reaktionselementen under start-gesten — annars fastnar
  // helskärmsvideon (Somnar/Win) på iOS som kräver en användargest.
  const warm = (el) => {
    const reset = () => { el.muted = false; el.removeAttribute('src'); el.load(); };
    el.muted = true;
    el.src = VIDEOS.chomp;
    el.play().then(() => { el.pause(); reset(); }).catch(reset);
  };
  setTimeout(() => {
    warm(video);
    warm(videoFs);

    bugLoop.play().catch(() => {});
    startMusic();
    setTimeout(preloadVideos, 1000);
  }, 0);
}
startBtn?.addEventListener('click', e => {
  e.stopPropagation();
  requestAnimationFrame(() => requestAnimationFrame(handleStart));
});
startScreen.addEventListener('click', () => {
  requestAnimationFrame(() => requestAnimationFrame(handleStart));
});

// ==========================================
//  BAKGRUNDSRADERING (schackruta + vit)
// ==========================================
const offCanvas = document.createElement('canvas');
const offCtx    = offCanvas.getContext('2d', { willReadFrequently: true });

function processImage(srcImg) {
  const w = srcImg.naturalWidth, h = srcImg.naturalHeight;
  if (!w || !h) return null;
  // Skala ner till max 300px för snabbare bearbetning på mobil
  const scale = Math.min(1, 300 / Math.max(w, h));
  const pw = Math.round(w * scale), ph = Math.round(h * scale);
  const c = document.createElement('canvas');
  c.width = pw; c.height = ph;
  const cx = c.getContext('2d');
  cx.drawImage(srcImg, 0, 0, pw, ph);
  try {
    const id = cx.getImageData(0, 0, pw, ph);
    const d  = id.data;
    // Snabb tröskelbaserad bakgrundsradering: grå/vit bakgrund → transparent
    // Använder flood-fill men med flat Int32Array-kö (snabbt på iOS)
    const visited = new Uint8Array(pw * ph);
    const queue   = new Int32Array(pw * ph);
    let head = 0, tail = 0;
    const seeds = [0, pw-1, pw*(ph-1), pw*ph-1]; // hörn
    for (const s of seeds) {
      if (!visited[s]) { visited[s] = 1; queue[tail++] = s; }
    }
    while (head < tail) {
      const idx = queue[head++];
      const x = idx % pw, y = (idx / pw) | 0;
      const p = idx * 4;
      if (d[p+3] === 0) continue;
      const r = d[p], g = d[p+1], b = d[p+2];
      const avg = (r + g + b) / 3;
      if (Math.max(Math.abs(r-avg), Math.abs(g-avg), Math.abs(b-avg)) >= 30) continue;
      d[p] = d[p+1] = d[p+2] = d[p+3] = 0;
      const neighbors = [idx-1, idx+1, idx-pw, idx+pw];
      for (const n of neighbors) {
        if (n >= 0 && n < pw*ph && !visited[n]) {
          visited[n] = 1; queue[tail++] = n;
        }
      }
    }
    cx.putImageData(id, 0, 0);
  } catch(e) {}
  return c;
}

// Offscreen canvas för bakgrundsborttagning (fallback för MP4)
let vidFrameCount = 0;
let lastVidW = 0, lastVidH = 0;

function drawVideoFrameClean(src, dx, dy, dw, dh, tilt = 0) {
  if (!src || src.readyState < 2) return;

  const px = dx + dw/2, py = dy + dh;
  ctx.save();
  ctx.translate(px, py); ctx.rotate(tilt); ctx.translate(-px, -py);

  // Alpha-video (WebM/MOV) har inbyggd transparens — rita direkt, ingen getImageData
  const cs = src.currentSrc || '';
  const hasNativeAlpha = cs.endsWith('.webm') || cs.endsWith('.mov');

  if (hasNativeAlpha) {
    ctx.drawImage(src, dx, dy, dw, dh);
  } else {
    // Fallback: ta bort vit bakgrund via getImageData (för MP4)
    const w = Math.round(dw), h = Math.round(dh);
    vidFrameCount++;
    if (vidFrameCount % 3 === 0 || lastVidW !== w || lastVidH !== h) {
      lastVidW = w; lastVidH = h;
      offCanvas.width  = w;
      offCanvas.height = h;
      offCtx.clearRect(0, 0, w, h);
      offCtx.drawImage(src, 0, 0, w, h);
      try {
        const id = offCtx.getImageData(0, 0, w, h);
        const d  = id.data;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i] > 230 && d[i+1] > 230 && d[i+2] > 230) d[i+3] = 0;
        }
        offCtx.putImageData(id, 0, 0);
      } catch(e) {}
    }
    ctx.drawImage(offCanvas, dx, dy, dw, dh);
  }

  ctx.restore();
}

// ==========================================
//  GODISBACILLEN — position & mun
// ==========================================
const bug = {
  get imgW()    { return Math.min(W * 0.32, 260); },
  get imgH()    { return this.imgW * (1200 / 900); },
  get x()       { return W / 2; },
  get imgLeft() { return this.x - this.imgW / 2; },
  get imgTop()  { return H - 20 - this.imgH; },

  getMouthPos()    { return { x: this.x, y: this.imgTop + this.imgH * 0.52 }; },
  getMouthRadius() { return 50; },

  draw(nearbyYummy, nearbyYucky) {
    drawVideoFrameClean(bugLoop, this.imgLeft, this.imgTop, this.imgW, this.imgH, 0);

    if ((nearbyYummy || nearbyYucky) && !crash.isActive) {
      const m = this.getMouthPos();
      ctx.save();
      ctx.beginPath();
      ctx.arc(m.x, m.y, this.getMouthRadius() + 12, 0, Math.PI * 2);
      ctx.fillStyle = nearbyYucky ? 'rgba(255,60,0,0.22)' : 'rgba(80,240,80,0.22)';
      ctx.fill();
      ctx.restore();
    }
  }
};

// ==========================================
//  SOCKERKRASCH — nu med nivå-övergång
// ==========================================
const crash = {
  phase: 'idle', // idle | pending | playing

  get isActive() { return this.phase !== 'idle'; },

  start() {
    if (this.phase === 'playing') return;
    this.phase = 'playing';
    const levelAtStart = level; // spara vilken nivå kraschen tillhör

    // Spela Somnar-videon (helskärm — pausar medvetet inför ny nivå)
    playVideo('Somnar.mp4', () => {
      // Kolla att vi fortfarande är på samma nivå (förhindra dubbel level-up)
      if (level !== levelAtStart) { this.phase = 'idle'; isShowingVideo = false; return; }

      earnStar(); // klarade en värld → en stjärna till samlingen

      if (level < 3) {
        level++;
        updateMusicTempo();
        candyEaten = 0;
        candies = [];
        for (let i = 0; i < 5; i++) candies.push(new Candy(true));
        this.phase = 'idle';
        isShowingVideo = false;
        showLevelTransition(level);
      } else {
        candyEaten = 0;
        candies = candies.filter(c => !c.eaten);
        playVideo(VIDEOS.win, () => {
          this.phase = 'idle';
          document.getElementById('yt-cta').style.display = 'flex';
          isShowingVideo = true;
        });
      }
    });
  },

  update()      { },
  getTilt()     { return 0; },
  drawEffects() { }
};

window.restartGame = function() {
  [video, videoFs].forEach(v => {
    v.oncanplay = null; v.onerror = null; v.onended = null;
    v.removeAttribute('src'); v.load();
  });
  bubble.classList.remove('active');
  fsOverlay.classList.remove('active');
  isShowingVideo = false;
  crash.phase = 'idle';
  candyEaten = 0;
  candies = [];
  particles = [];
  brokenTeeth = 0;
  level = 1;
  updateMusicTempo();
  for (let i = 0; i < 5; i++) candies.push(new Candy(true));
};

// ==========================================
//  GODIS-BILDER
// ==========================================
const DIR = 'Godisar och veggies/';

function deferProcess(fn) {
  'requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 50);
}

function loadImg(file) {
  const obj = { raw: new Image(), processed: null };
  obj.raw.onload = () => { deferProcess(() => { obj.processed = processImage(obj.raw); }); };
  obj.raw.src = DIR + file;
  return obj;
}
function getImg(obj) {
  return obj.processed || (obj.raw.complete ? obj.raw : null);
}

// Ladda varje godisbild för sig så vi kan blanda olika uppsättningar per värld.
const IMG_G2  = loadImg('Godis2.png');
const IMG_G3  = loadImg('Godis3.png');
const IMG_G4  = loadImg('Godis4.png');
const IMG_G5  = loadImg('Godis5.png');
const IMG_G6  = loadImg('Godis6.png');
const IMG_G4B = loadImg('Godis 4.png');

// Nya godisar (skapade av Leila) — temade per värld.
const IMG_KLUBBSTAV = loadImg('klubbstav.png');            // regnbågsklubba på stjälk
const IMG_SLOTT     = loadImg('slottsklubba.png');          // slottsklubba
const IMG_MONSTER_B = loadImg('glad monster godis.png');     // blå glad monster
const IMG_MONSTER_R = loadImg('rosa glad monster godis.png'); // rosa glad monster
const IMG_STJARNA   = loadImg('stjarnagodis.png');          // galaxstjärna
const IMG_SWIRL     = loadImg('swirlgodis.png');            // kosmisk swirl
const IMG_MOLN      = loadImg('molngodis.png');             // molngodis
const IMG_MARANG    = loadImg('maranggodis.png');           // marängsvirvel
const IMG_SVAMP     = loadImg('flugsvamp.png');             // förtrollad svamp
const IMG_PRALIN    = loadImg('chokladpralin.png');         // chokladpralin
const IMG_SKATT     = loadImg('skattgodis.png');            // skattkista med ädelstenar

// ── Varje värld har sin EGNA uppsättning godis som faller ────────────────────
// Så fort barnet klarar en nivå byts godisen ut → "nya godisar!"-känsla.
// (Guldgodiset Godis1 hålls likadant i alla världar — det är den speciella.)
const LEVEL_YUMMY = {
  1: [IMG_KLUBBSTAV, IMG_SLOTT, IMG_MONSTER_B, IMG_MONSTER_R], // Godislandet
  2: [IMG_STJARNA, IMG_SWIRL, IMG_MOLN, IMG_MARANG],           // Godishimlen
  3: [IMG_SVAMP, IMG_PRALIN, IMG_SKATT, IMG_G3],               // Godisvulkanen
};
function getYummyPool() { return LEVEL_YUMMY[level] || LEVEL_YUMMY[3]; }

const GOLD_IMG   = loadImg('Godis1.png');
const YUCKY_IMGS = [
  loadImg('Morot.png'),
  loadImg('Broccoli.png'),
  loadImg('Morot.png'),
  loadImg('Broccoli.png'),
];
const SALIM_IMG  = loadImg('Salim.png');
// Selma.png ligger i rotmappen, inte i Godisar och veggies/
const SELMA_IMG  = { raw: new Image(), processed: null };
SELMA_IMG.raw.onload = () => { deferProcess(() => { SELMA_IMG.processed = processImage(SELMA_IMG.raw); }); };
SELMA_IMG.raw.src = 'Selma.png';

class Candy {
  constructor(startOnScreen = false) { this.init(startOnScreen); }
  init(startOnScreen = false) {
    const cfg = getLevelConfig();
    this.x = 70 + Math.random() * (W - 140);
    this.y = startOnScreen ? 80 + Math.random() * (H * 0.45) : -60;
    this.size = 80 + Math.random() * 30;
    this.speed = cfg.candySpeed[0] + Math.random() * cfg.candySpeed[1];
    this.dragging = this.eaten = false;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleDir = (Math.random() - 0.5) * 0.7;

    const r = Math.random();
    const { chanceSalim, chanceSelma, chanceGold, chanceYucky } = cfg;

    if (r < chanceSalim) {
      this.kind = 'salim';
      this.imgObj = SALIM_IMG;
      this.size = 90 + Math.random() * 20;
    } else if (r < chanceSalim + chanceSelma) {
      this.kind = 'selma';
      this.imgObj = SELMA_IMG;
      this.size = 90 + Math.random() * 20;
    } else if (r < chanceSalim + chanceSelma + chanceGold) {
      this.kind = 'gold';
      this.imgObj = GOLD_IMG;
    } else if (r < chanceSalim + chanceSelma + chanceGold + chanceYucky) {
      this.kind = 'yucky';
      this.imgObj = YUCKY_IMGS[Math.floor(Math.random() * YUCKY_IMGS.length)];
    } else {
      this.kind = 'yummy';
      const pool = getYummyPool();
      this.imgObj = pool[Math.floor(Math.random() * pool.length)];
    }
  }
  update() {
    if (this.eaten || this.dragging) return;
    this.y += this.speed;
    this.wobble += 0.022;
    this.x += Math.sin(this.wobble) * this.wobbleDir;
    this.x = Math.max(40, Math.min(W - 40, this.x));
    if (this.y > H + 80) this.init();
  }
  draw() {
    if (this.eaten) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    if (this.kind === 'gold')  { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 30; }
    if (this.kind === 'yucky') { ctx.shadowColor = '#88cc44'; ctx.shadowBlur = 16; }
    if (this.kind === 'salim' || this.kind === 'selma') { ctx.shadowColor = '#ff4444'; ctx.shadowBlur = 24; }

    const s = this.size;
    const drawable = getImg(this.imgObj);
    if (drawable) {
      try {
        // Behåll bildens proportioner — passa längsta sidan till s (annars blir
        // avlånga godisar som klubbstaven hoptryckta till en fyrkant).
        const iw = drawable.naturalWidth  || drawable.width  || s;
        const ih = drawable.naturalHeight || drawable.height || s;
        let dw = s, dh = s;
        if (iw >= ih) { dh = s * ih / iw; } else { dw = s * iw / ih; }
        ctx.drawImage(drawable, -dw / 2, -dh / 2, dw, dh);
      } catch(e) {
        ctx.beginPath();
        ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
        ctx.fillStyle = (this.kind === 'salim' || this.kind === 'selma') ? '#ff4444' : this.kind === 'yucky' ? '#88cc44' : '#ffaacc';
        ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.fillStyle = (this.kind === 'salim' || this.kind === 'selma') ? '#ff4444' : this.kind === 'yucky' ? '#88cc44' : '#ffaacc';
      ctx.fill();
    }

    ctx.restore();
  }
  contains(px, py) { return Math.hypot(px - this.x, py - this.y) < this.size / 2 + 14; }
}

// ==========================================
//  PARTIKLAR
// ==========================================
class Particle {
  constructor(x, y, kind) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 10;
    this.vy = -(Math.random() * 9 + 3);
    this.life = 1;
    this.size = 22 + Math.random() * 16;
    const arr = kind === 'star' ? ['⭐','🌟','✨','💫']
              : kind === 'heal' ? ['🦷','✨','💚','🥕','😄','💪']
                                 : ['🦷','💥','⚡','😣','🍬'];
    this.emoji = arr[Math.floor(Math.random() * arr.length)];
  }
  update() { this.x += this.vx; this.y += this.vy; this.vy += 0.38; this.life -= 0.032; }
  draw() {
    if (this.life <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.font = `${this.size}px serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(this.emoji, this.x, this.y);
    ctx.restore();
  }
}

let particles = [];
function spawnParticles(x, y, kind) {
  for (let i = 0; i < 9; i++) particles.push(new Particle(x, y, kind));
}

// Stjärnregn när man tjänar en stjärna — större och glesare för festkänsla.
function spawnStarBurst() {
  for (let i = 0; i < 18; i++) {
    const p = new Particle(W / 2, H * 0.42, 'star');
    p.size = 28 + Math.random() * 22;
    p.vx *= 1.4; p.vy *= 1.15;
    particles.push(p);
  }
}

// ==========================================
//  GODIS-POOL
// ==========================================
let candies = [];
let spawnTimer = 0;
for (let i = 0; i < 5; i++) candies.push(new Candy(true));
function spawnCandy() {
  const cfg = getLevelConfig();
  if (candies.filter(c => !c.eaten).length < cfg.maxCandy) candies.push(new Candy());
}

// ==========================================
//  UI
// ==========================================
// ── Regnbåge (Godishimlen) ───────────────────────────────────────────────────
// En mjuk regnbågsbåge över himlen. Ritas FÖRE molnen så de ligger framför →
// regnbågen tittar fram "bland molnen".
function drawRainbow() {
  const cx = W * 0.5, cy = H * 0.52;
  const baseR = Math.min(W * 0.52, H * 0.46);
  const band  = Math.max(8, baseR * 0.055);
  const colors = ['#ff5a5a','#ff9f43','#ffe14d','#5ed86f','#4aa8ff','#5a6bd8','#b163d8'];
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = band;
  ctx.lineCap = 'butt';
  colors.forEach((col, i) => {
    ctx.strokeStyle = col;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR - i * band, Math.PI, Math.PI * 2); // övre halvan = båge
    ctx.stroke();
  });
  ctx.restore();
}

// ── Vulkan (Godisvulkanen) ───────────────────────────────────────────────────
let volcanoTick = 0; // för att lågorna ska flimra glatt

// En mjuk tecknad låga (droppform) med spetsen uppåt.
function drawFlame(cx, baseY, w, h, color) {
  ctx.beginPath();
  ctx.moveTo(cx, baseY);
  ctx.bezierCurveTo(cx - w, baseY - h*0.35, cx - w*0.55, baseY - h*0.85, cx, baseY - h);
  ctx.bezierCurveTo(cx + w*0.55, baseY - h*0.85, cx + w, baseY - h*0.35, cx, baseY);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Glad eldbukett ovanpå kratern (röd → orange → gul, med liten flimmer).
function drawFlames(cx, baseY, size, tick) {
  const flick = 1 + Math.sin(tick * 0.25 + cx) * 0.14;
  ctx.save();
  // värmeglöd bakom
  ctx.globalAlpha = 0.45;
  const rg = ctx.createRadialGradient(cx, baseY - size, 2, cx, baseY - size, size*2.4);
  rg.addColorStop(0, 'rgba(255,170,40,0.85)'); rg.addColorStop(1, 'rgba(255,170,40,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(cx - size*2.4, baseY - size*3.4, size*4.8, size*4.8);
  ctx.globalAlpha = 1;
  // yttre röd/orange lågor (mitten hög, två kortare på sidorna)
  drawFlame(cx,             baseY, size*0.95, size*2.1*flick, '#ff5722');
  drawFlame(cx - size*0.85, baseY, size*0.62, size*1.25*flick, '#ff8a1e');
  drawFlame(cx + size*0.85, baseY, size*0.62, size*1.35*flick, '#ff8a1e');
  // inre gul kärna
  drawFlame(cx,             baseY, size*0.5,  size*1.25*flick, '#ffd23e');
  ctx.restore();
}

function drawOneVolcano(peakX, baseY, height, halfBase) {
  const topY    = baseY - height;
  const craterW = halfBase * 0.30;
  const lipY    = topY + height * 0.05;
  ctx.save();
  // berget
  ctx.beginPath();
  ctx.moveTo(peakX - halfBase, baseY);
  ctx.lineTo(peakX - craterW,  topY);
  ctx.lineTo(peakX - craterW*0.5, lipY);
  ctx.lineTo(peakX + craterW*0.5, lipY);
  ctx.lineTo(peakX + craterW,  topY);
  ctx.lineTo(peakX + halfBase, baseY);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, topY, 0, baseY);
  g.addColorStop(0, '#6d4c41'); g.addColorStop(1, '#3e2723');
  ctx.fillStyle = g; ctx.fill();
  // lava i kratern
  ctx.fillStyle = '#ff7a33';
  ctx.beginPath();
  ctx.ellipse(peakX, lipY, craterW*0.85, height*0.028, 0, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
  // glad eld ovanpå kratern
  drawFlames(peakX, lipY, Math.max(14, height * 0.10), volcanoTick);
}

function drawVolcano() {
  volcanoTick++;
  const baseY = H * 0.9;
  // Två vulkaner ute vid sidorna så de inte krockar med Godisbacillen i mitten.
  drawOneVolcano(W * 0.20, baseY, H * 0.38, W * 0.22);
  drawOneVolcano(W * 0.82, baseY, H * 0.26, W * 0.16);
}

function drawBackground() {
  const cfg = getLevelConfig();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, cfg.bgTop); g.addColorStop(1, cfg.bgBottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

  if (level === 2) drawRainbow();     // regnbåge bakom molnen

  [
    [W*0.14, H*0.10, 60],
    [W*0.76, H*0.07, 80],
    [W*0.50, H*0.17, 50]
  ].forEach(([x,y,r]) => {
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.80)'; ctx.beginPath();
    [[x,y,r],[x+r,y+8,r*.8],[x-r,y+8,r*.75],[x+r*.5,y-12,r*.7]]
      .forEach(([bx,by,br]) => ctx.arc(bx,by,br,0,Math.PI*2));
    ctx.fill(); ctx.restore();
  });

  if (level >= 3) drawVolcano();      // vulkaner reser sig ur marken

  ctx.beginPath();
  ctx.ellipse(W/2, H+15, W*0.65, 55, 0, 0, Math.PI*2);
  ctx.fillStyle = cfg.grassColor; ctx.fill();
}

function drawTeeth() {
  const n = MAX_TEETH;
  const size = Math.min(W * 0.068, 30);
  const gap  = size * 0.18;
  const totalW = n * size + (n - 1) * gap;
  let x = W / 2 - totalW / 2 + size / 2;
  const y = 74;

  ctx.save();
  ctx.font = `${size}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const pulse = teethPulse > 0
    ? 1 + Math.sin(teethPulse * 0.5) * 0.18 * (teethPulse / 14)
    : 1;

  for (let i = 0; i < n; i++) {
    const broken = i < brokenTeeth;
    const isLatest = i === brokenTeeth - 1;
    ctx.save();
    ctx.translate(x, y);
    if (isLatest && teethPulse > 0) ctx.scale(pulse, pulse);

    // tanden — trasiga tänder hålls SYNLIGA (inte genomskinliga) men ser skadade ut
    ctx.globalAlpha = broken ? 0.95 : 1;
    ctx.fillText('🦷', 0, 0);

    if (broken) {
      ctx.globalAlpha = 1;
      // mörk hålighet (karies) — visar tydligt att tanden är trasig
      ctx.fillStyle = '#5d4037';
      ctx.beginPath();
      ctx.arc(size * 0.10, size * 0.05, size * 0.17, 0, Math.PI * 2);
      ctx.fill();
      // kraftig röd spricka tvärs över tanden
      ctx.strokeStyle = '#c62828';
      ctx.lineWidth = Math.max(2.5, size * 0.12);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-size * 0.18, -size * 0.32);
      ctx.lineTo( size * 0.02, -size * 0.04);
      ctx.lineTo(-size * 0.12,  size * 0.12);
      ctx.lineTo( size * 0.18,  size * 0.34);
      ctx.stroke();
    }
    ctx.restore();
    x += size + gap;
  }
  ctx.restore();
}

function drawLevelIndicator() {
  ctx.save();
  ctx.font = `bold ${Math.min(W * 0.04, 22)}px Arial Rounded MT Bold, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.globalAlpha = 0.85;

  // Nivå-badge
  const colors = { 1: '#66bb6a', 2: '#ffa726', 3: '#ef5350' };
  const labels = { 1: '🟢 Nivå 1', 2: '🟡 Nivå 2', 3: '🔴 Nivå 3' };

  const text = labels[level] || '🔴 Nivå 3';
  const metrics = ctx.measureText(text);
  const px = W / 2;
  const py = 14;

  // Bakgrund
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.roundRect(px - metrics.width/2 - 14, py - 4, metrics.width + 28, 34, 17);
  ctx.fill();

  // Text
  ctx.fillStyle = colors[level] || '#ef5350';
  ctx.fillText(text, px, py);

  ctx.restore();
}

// Stjärnräknare uppe till vänster (under Hem-knappen).
function drawStarCounter() {
  const size = Math.min(W * 0.052, 26);
  const x = 18, y = 104;   // en bit under Hem-knappen så de inte krockar
  const text = '⭐ ' + totalStars;
  ctx.save();
  ctx.font = `bold ${size}px Arial Rounded MT Bold, Arial`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const tw = ctx.measureText(text).width;

  const scale = starPulse > 0 ? 1 + Math.sin(starPulse * 0.35) * 0.22 * (starPulse / 40) : 1;
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.roundRect(-8, -size * 0.85, tw + 22, size * 1.7, size * 0.85);
  ctx.fill();
  ctx.fillStyle = '#f9a825';
  ctx.fillText(text, 4, 1);
  ctx.restore();
  if (starPulse > 0) starPulse--;

  // "+1 ⭐" flyter uppåt precis när man fått en stjärna
  if (starGain > 0) {
    const t = 1 - starGain / 90;
    ctx.save();
    ctx.globalAlpha = starGain < 30 ? starGain / 30 : 1;
    ctx.font = `bold ${size * 1.15}px Arial Rounded MT Bold, Arial`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#f9a825';
    ctx.fillText('+1 ⭐', x + 4, y - 26 - t * 34);
    ctx.restore();
    starGain--;
  }
}

// Visa samlingen på startskärmen så barnet ser den växa mellan besök.
(function showStartStars() {
  const el = document.getElementById('star-collection');
  if (el && totalStars > 0) el.textContent = '⭐ Din samling: ' + totalStars;
})();


// ==========================================
//  DRAG & DROP
// ==========================================
let draggingCandy = null, dragOffX = 0, dragOffY = 0;

function getPos(e) {
  return e.touches?.length ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
                           : { x: e.clientX, y: e.clientY };
}
function onDown(e) {
  e.preventDefault();
  const p = getPos(e);
  requestAnimationFrame(() => {
    if (isShowingVideo || crash.isActive || levelTransition > 0) return;
    for (let i = candies.length - 1; i >= 0; i--) {
      const c = candies[i];
      if (!c.eaten && c.contains(p.x, p.y)) {
        draggingCandy = c; c.dragging = true;
        dragOffX = c.x - p.x; dragOffY = c.y - p.y;
        break;
      }
    }
  });
}
function onMove(e) {
  e.preventDefault();
  if (!draggingCandy) return;
  const p = getPos(e);
  draggingCandy.x = p.x + dragOffX;
  draggingCandy.y = p.y + dragOffY;
}
function onUp() {
  if (!draggingCandy) return;
  const m = bug.getMouthPos();
  if (Math.hypot(draggingCandy.x - m.x, draggingCandy.y - m.y) < bug.getMouthRadius() + 20) {
    eatCandy(draggingCandy);
  } else {
    draggingCandy.dragging = false;
  }
  draggingCandy = null;
}
canvas.addEventListener('mousedown',  onDown);
canvas.addEventListener('mousemove',  onMove);
canvas.addEventListener('mouseup',    onUp);
canvas.addEventListener('touchstart', onDown, { passive: false });
canvas.addEventListener('touchmove',  onMove, { passive: false });
canvas.addEventListener('touchend',   onUp,   { passive: false });

// ==========================================
//  ÄT GODIS
// ==========================================
function eatCandy(candy) {
  candy.dragging = false;

  // Salim & Selma är kompisar — Godisbacillen vägrar äta dem.
  // Godiset ligger kvar och faller vidare.
  if (candy.kind === 'salim' || candy.kind === 'selma') {
    playReaction(VIDEOS.salim);
    return;
  }

  candy.eaten = true; // äts upp → försvinner direkt, ingen väntan på video

  // Grönsak → lagar en tand (det bra valet!)
  if (candy.kind === 'yucky') {
    healTooth();
    spawnParticles(candy.x, candy.y, 'heal');
    playReaction(VIDEOS.yuck);   // "Nej, jag vill ha godis!"
    return;
  }

  // Godis (vanlig + guld) → spräcker en tand
  crackTooth();
  spawnParticles(candy.x, candy.y, 'crack');
  candyEaten++;

  if (candyEaten >= 5 && !crash.isActive) {
    crash.phase = 'pending'; // blockera nya krascher direkt
    playReaction(candy.kind === 'gold' ? VIDEOS.wow : VIDEOS.chomp);
    setTimeout(() => { if (crash.phase === 'pending') crash.start(); }, 650);
    return;
  }

  playReaction(
    candy.kind === 'gold' ? VIDEOS.wow     :
    candyEaten % 3 === 0   ? VIDEOS.merMore :
    candyEaten % 2 === 0   ? VIDEOS.namnam  :  // "Nam nam!" för varannan godis
                             VIDEOS.chomp
  );
}

// ==========================================
//  SPELA REAKTIONSVIDEO
// ==========================================
// Liten reaktion uppe i hörnet — STOPPAR INTE spelet (man kan fortsätta dra godis)
function playReaction(filename) {
  if (!filename) return;
  cancelMusicResume();            // videon tar över ljudet — avbryt ev. pending resume
  video.onended = () => hideReaction();
  video.onerror = () => hideReaction();
  video.src = filename;
  bubble.classList.add('active');
  const p = video.play();
  if (p) p.catch(() => { video.oncanplay = () => video.play().catch(hideReaction); });
}
function hideReaction() {
  bubble.classList.remove('active');
  video.onended = video.onerror = video.oncanplay = null;
  video.removeAttribute('src');
  video.load();
  scheduleMusicResume();          // reaktionen klar — planera att ta tillbaka musiken
}

// Helskärmsvideo (sockerkrasch / vinst) — pausar spelet medvetet inför ny nivå
function playVideo(filename, onDone = null) {
  isShowingVideo = true;
  hideReaction();                 // dölj ev. bubbla så helskärmen tar över rent
  cancelMusicResume();            // helskärmsvideon tar över ljudet — avbryt resume
  videoFs.onended = () => finishVideo(onDone);
  videoFs.onerror = () => finishVideo(onDone);
  videoFs.src = filename;
  fsOverlay.classList.add('active');
  videoFs.play().catch(() => {
    videoFs.oncanplay = () => { videoFs.play().catch(() => finishVideo(onDone)); };
  });
}
function finishVideo(onDone = null) {
  fsOverlay.classList.remove('active');
  // Nolla handlers FÖRST — annars loopar onerror in i finishVideo igen
  videoFs.onended  = null;
  videoFs.onerror  = null;
  videoFs.oncanplay = null;
  videoFs.removeAttribute('src');
  videoFs.load();
  scheduleMusicResume();          // helskärmsvideo klar — planera att ta tillbaka musiken
  if (onDone) {
    onDone();
  } else if (!crash.isActive) {
    isShowingVideo = false;
    candies = candies.filter(c => !c.eaten);
  }
}

function draggingNear(kind) {
  if (!draggingCandy || draggingCandy.kind !== kind) return false;
  const m = bug.getMouthPos();
  return Math.hypot(draggingCandy.x - m.x, draggingCandy.y - m.y) < 110;
}

// ==========================================
//  GAME LOOP
// ==========================================
function loop() {
  ctx.clearRect(0, 0, W, H);
  drawBackground();

  const cfg = getLevelConfig();
  if (++spawnTimer >= cfg.spawnInterval) { spawnCandy(); spawnTimer = 0; }

  candies.forEach(c => c.update());
  candies = candies.filter(c => !c.eaten); // plocka bort uppätet godis direkt
  candies.forEach(c => c.draw());

  if (teethPulse > 0) teethPulse--;

  bug.draw(
    draggingNear('yummy') || draggingNear('gold') || draggingNear('yucky'),
    draggingNear('salim') || draggingNear('selma')
  );

  crash.update();
  crash.drawEffects();

  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => { p.update(); p.draw(); });

  drawTeeth();
  drawLevelIndicator();
  drawStarCounter();
  drawInstruction();
  drawLevelTransition();

  requestAnimationFrame(loop);
}

// Loopen startas i handleStart() — inte direkt vid sidladdning — så att den tunga
// per-frame-bearbetningen inte blockerar första trycket (INP) bakom startskärmen.
