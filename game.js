// ==========================================
//  MATA GODISBACILLEN! 🍬
//  Med nivåer, highscore och snabbare tempo!
// ==========================================

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
    bgTop:    '#fffbe8',
    bgBottom: '#ffe6f5',
    grassColor: '#b8eeaa',
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
    bgTop:    '#f3e5f5',
    bgBottom: '#e1f5fe',
    grassColor: '#b2dfdb',
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
    bgTop:    '#fff3e0',
    bgBottom: '#ffebee',
    grassColor: '#ffcc80',
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
//  VIDEOFILER — lazy loading
// ==========================================
const VIDEOS = {
  chomp:   'Mmm_Godis!.mp4',
  merMore: 'Mer_godis!.mp4',
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

function showLevelTransition(newLevel) {
  levelTransitionText = newLevel <= 3
    ? `⭐ Nivå ${newLevel}! ⭐`
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
    const subText = level === 2 ? 'Snabbare! 💨' : level === 3 ? 'Snabbast! 🔥' : '';
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

const YUMMY_IMGS = [
  loadImg('Godis2.png'),
  loadImg('Godis3.png'),
  loadImg('Godis4.png'),
  loadImg('Godis5.png'),
  loadImg('Godis6.png'),
  loadImg('Godis 4.png'),
];
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
      this.imgObj = YUMMY_IMGS[Math.floor(Math.random() * YUMMY_IMGS.length)];
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
        ctx.drawImage(drawable, -s / 2, -s / 2, s, s);
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
    const arr = kind === 'heal' ? ['🦷','✨','💚','🥕','😄','💪']
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
function drawBackground() {
  const cfg = getLevelConfig();
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, cfg.bgTop); g.addColorStop(1, cfg.bgBottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
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

    // tanden
    ctx.globalAlpha = broken ? 0.32 : 1;
    ctx.fillText('🦷', 0, 0);

    // röd sprick-markering på trasiga tänder
    if (broken) {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#e53935';
      ctx.lineWidth = Math.max(2, size * 0.09);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-size * 0.16, -size * 0.30);
      ctx.lineTo( size * 0.04, -size * 0.02);
      ctx.lineTo(-size * 0.10,  size * 0.10);
      ctx.lineTo( size * 0.16,  size * 0.32);
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
  drawInstruction();
  drawLevelTransition();

  requestAnimationFrame(loop);
}

// Loopen startas i handleStart() — inte direkt vid sidladdning — så att den tunga
// per-frame-bearbetningen inte blockerar första trycket (INP) bakom startskärmen.
