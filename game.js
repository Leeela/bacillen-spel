// ==========================================
//  MATA GODISBACILLEN! 🍬
//  Med nivåer, highscore och snabbare tempo!
// ==========================================

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');
const overlay = document.getElementById('video-overlay');
const video   = document.getElementById('reaction-video');
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
    chanceSalim:   0.12,
    chanceSelma:   0.12,
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
    chanceSalim:   0.18,
    chanceSelma:   0.18,
    chanceGold:    0.12,
    bgTop:    '#fff3e0',
    bgBottom: '#ffebee',
    grassColor: '#ffcc80',
    bpm: 220,
  },
};

function getLevelConfig() { return LEVELS[level] || LEVELS[3]; }

// ==========================================
//  HIGHSCORE (localStorage)
// ==========================================
let totalStars = 0;
let bestStars  = parseInt(localStorage.getItem('godisbacillen-best') || '0', 10);
let isNewRecord = false;
let newRecordTimer = 0;

function saveBest() {
  if (totalStars > bestStars) {
    bestStars = totalStars;
    localStorage.setItem('godisbacillen-best', bestStars.toString());
    isNewRecord = true;
    newRecordTimer = 180; // visa i 3 sekunder
  }
}

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
let stars      = 0;

// ==========================================
//  BAKGRUNDSMUSIK (Web Audio API)
// ==========================================
let audioCtx = null;
let musicPlaying = false;
let currentBPM = 160;
let musicTimeout = null;

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  currentBPM = getLevelConfig().bpm;
  playMelodyLoop();
}

function updateMusicTempo() {
  currentBPM = getLevelConfig().bpm;
}

function playMelodyLoop() {
  if (!musicPlaying || !audioCtx) return;
  const BPM  = currentBPM;
  const BEAT = 60 / BPM;
  const notes = [
    [523, 1],[659,1],[784,1],[659,1],[698,1],[880,1],[784,2],
    [659,1],[784,1],[1047,2],[784,1],[698,1],[659,1],[587,1],[523,2],
    [523,1],[659,1],[784,1],[659,1],[698,1],[880,1],[784,2],
    [659,1],[784,1],[1047,2],[784,1],[698,1],[659,1],[587,1],[523,3],
  ];

  let t = audioCtx.currentTime + 0.1;
  notes.forEach(([freq, beats]) => {
    const dur = beats * BEAT * 0.85;
    const osc = audioCtx.createOscillator();
    const env = audioCtx.createGain();
    osc.connect(env); env.connect(audioCtx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(0.05, t + 0.02);
    env.gain.linearRampToValueAtTime(0.03, t + dur * 0.6);
    env.gain.linearRampToValueAtTime(0, t + dur);
    osc.start(t); osc.stop(t + dur);
    t += beats * BEAT;
  });
  const totalTime = notes.reduce((s, [, b]) => s + b * BEAT, 0);
  if (musicTimeout) clearTimeout(musicTimeout);
  musicTimeout = setTimeout(() => { if (musicPlaying) playMelodyLoop(); },
    (totalTime - 0.3) * 1000);
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
  ctx.fillText('🍬 Dra godis till munnen! 🍬', W/2 + 2, H * 0.18 + 2);
  ctx.fillStyle = '#c62828';
  ctx.fillText('🍬 Dra godis till munnen! 🍬', W/2, H * 0.18);
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

bugLoop.addEventListener('canplay', () => {
  if (!startBug.src) {
    startBug.src = 'bug_loop.mp4';
    startBug.play().catch(() => {});
  }
}, { once: true });
bugLoop.src = 'bug_loop.mp4';
function handleStart() {
  if (gameStarted) return;
  gameStarted = true;

  video.muted = true;
  video.src = VIDEOS.chomp;
  video.play().then(() => {
    video.pause();
    video.muted = false;
    video.src = '';
  }).catch(() => {
    video.muted = false;
    video.src = '';
  });

  bugLoop.play().catch(() => {});
  startMusic();
  startScreen.style.display = 'none';
  setTimeout(preloadVideos, 1000);
}
startBtn?.addEventListener('click', e => { e.stopPropagation(); handleStart(); });
startScreen.addEventListener('click', handleStart);

// ==========================================
//  BAKGRUNDSRADERING (schackruta + vit)
// ==========================================
const offCanvas = document.createElement('canvas');
const offCtx    = offCanvas.getContext('2d', { willReadFrequently: true });

function processImage(srcImg) {
  const w = srcImg.naturalWidth, h = srcImg.naturalHeight;
  if (!w || !h) return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const cx = c.getContext('2d');
  cx.drawImage(srcImg, 0, 0);
  try {
    const id = cx.getImageData(0, 0, w, h);
    const d  = id.data;
    const visited = new Uint8Array(w * h);
    function isBackground(x, y) {
      const i = (y * w + x) * 4;
      if (d[i+3] === 0) return false;
      const r = d[i], g = d[i+1], b = d[i+2];
      const avg = (r + g + b) / 3;
      return Math.max(Math.abs(r-avg), Math.abs(g-avg), Math.abs(b-avg)) < 30;
    }
    function erase(x, y) {
      const i = (y * w + x) * 4;
      d[i] = d[i+1] = d[i+2] = d[i+3] = 0;
    }
    const q = [[0,0],[w-1,0],[0,h-1],[w-1,h-1]];
    while (q.length) {
      const [x, y] = q.pop();
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const vi = y * w + x;
      if (visited[vi]) continue;
      visited[vi] = 1;
      if (!isBackground(x, y)) continue;
      erase(x, y);
      q.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
    }
    cx.putImageData(id, 0, 0);
  } catch(e) {}
  return c;
}

function drawVideoFrameClean(src, dx, dy, dw, dh, tilt = 0) {
  if (!src || src.readyState < 2) return;
  const px = dx + dw/2, py = dy + dh;
  ctx.save();
  ctx.translate(px, py); ctx.rotate(tilt); ctx.translate(-px, -py);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(src, dx, dy, dw, dh);
  ctx.globalCompositeOperation = 'source-over';
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

    // Spela Somnar-videon
    playVideo('Somnar.mp4', false, () => {
      // Kolla att vi fortfarande är på samma nivå (förhindra dubbel level-up)
      if (level !== levelAtStart) { this.phase = 'idle'; isShowingVideo = false; return; }

      saveBest();

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
        playVideo(VIDEOS.win, false, () => {
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
  video.oncanplay = null;
  video.onerror   = null;
  video.onended   = null;
  video.src = '';
  overlay.classList.remove('active');
  isShowingVideo = false;
  crash.phase = 'idle';
  candyEaten = 0;
  candies = [];
  particles = [];
  stars = 0;
  totalStars = 0;
  level = 1;
  isNewRecord = false;
  newRecordTimer = 0;
  updateMusicTempo();
  for (let i = 0; i < 5; i++) candies.push(new Candy(true));
};

// ==========================================
//  GODIS-BILDER
// ==========================================
const DIR = 'Godisar och veggies/';

function loadImg(file) {
  const obj = { raw: new Image(), processed: null };
  obj.raw.onload = () => { obj.processed = processImage(obj.raw); };
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
SELMA_IMG.raw.onload = () => { SELMA_IMG.processed = processImage(SELMA_IMG.raw); };
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
    this.size = kind === 'gold' ? 32 + Math.random() * 22 : 18 + Math.random() * 14;
    const arr = kind === 'gold'  ? ['🌟','💛','✨','🎊','🌈','⭐']
              : kind === 'yucky' ? ['🤢','💚','😝','🥴','❌']
              : ['⭐','✨','🌟','💫','🎉','🍬'];
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
  const n = kind === 'gold' ? 16 : kind === 'yucky' ? 8 : 7;
  for (let i = 0; i < n; i++) particles.push(new Particle(x, y, kind));
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

function drawScore() {
  // Visa totala stjärnor uppe till vänster
  if (!totalStars && !bestStars) return;
  ctx.save();
  ctx.font = 'bold 28px serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.globalAlpha = 0.88;

  // Nuvarande stjärnor
  const starCount = Math.min(totalStars, 30);
  const starText = '⭐'.repeat(Math.min(starCount, 10));
  ctx.fillText(starText, 16, 60);

  // Visa rader om fler än 10
  if (starCount > 10) {
    ctx.fillText('⭐'.repeat(Math.min(starCount - 10, 10)), 16, 94);
  }
  if (starCount > 20) {
    ctx.fillText('⭐'.repeat(Math.min(starCount - 20, 10)), 16, 128);
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

function drawHighscore() {
  if (!bestStars) return;
  ctx.save();
  ctx.font = `bold ${Math.min(W * 0.035, 18)}px Arial Rounded MT Bold, Arial`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#5d4037';
  ctx.fillText(`🏆 Bäst: ${bestStars}⭐`, W - 16, 14);
  ctx.restore();
}

function drawNewRecord() {
  if (newRecordTimer <= 0) return;
  newRecordTimer--;
  const alpha = newRecordTimer < 30 ? newRecordTimer / 30 : 1;
  const scale = 1 + Math.sin(newRecordTimer * 0.15) * 0.08;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(W/2, H * 0.35);
  ctx.scale(scale, scale);
  ctx.font = `bold ${Math.min(W * 0.08, 48)}px Arial Rounded MT Bold, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillText('🏆 NYTT REKORD! 🏆', 3, 3);
  ctx.fillStyle = '#ffd700';
  ctx.fillText('🏆 NYTT REKORD! 🏆', 0, 0);
  ctx.restore();
}

function drawCandyCounter() {
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.font = '34px serif'; ctx.textAlign = 'center';
    ctx.textBaseline = 'top'; ctx.globalAlpha = i < candyEaten ? 1.0 : 0.22;
    ctx.fillText('🍬', W - 20 - (4-i) * 40, 56);
    ctx.restore();
  }
}

// ==========================================
//  YUCK-FALLBACK
// ==========================================
let yuckAnim = 0;
function drawYuckOverlay() {
  if (yuckAnim <= 0) return;
  yuckAnim -= 0.03;
  if (yuckAnim <= 0) { isShowingVideo = false; candies = candies.filter(c => !c.eaten); }
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
  if (isShowingVideo || crash.isActive || levelTransition > 0) return;
  const p = getPos(e);
  for (let i = candies.length - 1; i >= 0; i--) {
    const c = candies[i];
    if (!c.eaten && c.contains(p.x, p.y)) {
      draggingCandy = c; c.dragging = true;
      dragOffX = c.x - p.x; dragOffY = c.y - p.y;
      break;
    }
  }
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
  candy.eaten = candy.dragging = false;
  spawnParticles(candy.x, candy.y, candy.kind);

  if (candy.kind === 'salim' || candy.kind === 'selma') { playVideo(VIDEOS.salim, true); return; }
  if (candy.kind === 'yucky') { playVideo(VIDEOS.yuck, true); return; }

  candyEaten++;
  stars = Math.min(stars + 1, 99);
  totalStars++;

  if (candyEaten >= 5 && !crash.isActive) {
    crash.phase = 'pending'; // blockera nya krascher direkt
    playVideo(candy.kind === 'gold' ? VIDEOS.wow : VIDEOS.chomp, false, () => {
      crash.start();
    });
    return;
  }

  playVideo(
    candy.kind === 'gold'     ? VIDEOS.wow     :
    candyEaten % 3 === 0      ? VIDEOS.merMore :
                                VIDEOS.chomp,
    false
  );
}

// ==========================================
//  SPELA REAKTIONSVIDEO
// ==========================================
function playVideo(filename, isYuck, onDone = null) {
  isShowingVideo = true;
  video.onended = () => finishVideo(onDone);
  video.onerror = () => {
    overlay.classList.remove('active');
    if (isYuck) { yuckAnim = 3.5; isShowingVideo = false; }
    else        { finishVideo(onDone); }
  };
  video.src = filename;
  overlay.classList.add('active');
  video.play().catch(() => {
    video.oncanplay = () => { video.play().catch(() => finishVideo(onDone)); };
  });
}
function finishVideo(onDone = null) {
  overlay.classList.remove('active');
  video.src = '';
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
  candies.forEach(c => c.draw());

  bug.draw(draggingNear('yummy') || draggingNear('gold'), draggingNear('yucky') || draggingNear('salim') || draggingNear('selma'));

  crash.update();
  crash.drawEffects();

  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => { p.update(); p.draw(); });

  drawScore();
  drawCandyCounter();
  drawLevelIndicator();
  drawHighscore();
  drawNewRecord();
  drawInstruction();
  drawYuckOverlay();
  drawLevelTransition();

  requestAnimationFrame(loop);
}

loop();
