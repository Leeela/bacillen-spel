// ==========================================
//  MATA GODISBACILLEN! 🍬
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
//  VIDEOFILER — lazy loading
// ==========================================
const VIDEOS = {
  chomp:   'Mmm_Godis!.mp4',
  merMore: 'Mer_godis!.mp4',
  wow:     'Wow!_Tack!.mp4',
  win:     'Win_star_Perfekt!.mp4',
  yuck:    'NEj_jag_vill_ha_godis.mp4'
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

function startMusic() {
  if (musicPlaying) return;
  musicPlaying = true;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // Glad barnmelodi — "Snart är det Jul" / glad dur-melodi
  const BPM   = 160;
  const BEAT  = 60 / BPM;
  const notes = [
    // C5  E5  G5  E5  F5  A5  G5  _   E5  G5  C6  _   G5  F5  E5  D5  C5
    [523, 1],[659,1],[784,1],[659,1],[698,1],[880,1],[784,2],
    [659,1],[784,1],[1047,2],[784,1],[698,1],[659,1],[587,1],[523,2],
    [523,1],[659,1],[784,1],[659,1],[698,1],[880,1],[784,2],
    [659,1],[784,1],[1047,2],[784,1],[698,1],[659,1],[587,1],[523,3],
  ];

  function playMelody(startTime) {
    let t = startTime;
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
    // Loopa
    const totalTime = notes.reduce((s, [, b]) => s + b * BEAT, 0);
    setTimeout(() => { if (musicPlaying) playMelody(audioCtx.currentTime); },
      (totalTime - 0.3) * 1000);
  }
  playMelody(audioCtx.currentTime + 0.1);
}

// ==========================================
//  INSTRUKTIONSTEXT (visas i 4 sek vid start)
// ==========================================
let instrTimer = 180; // frames

function drawInstruction() {
  if (instrTimer <= 0) return;
  instrTimer--;
  const alpha = instrTimer < 60 ? instrTimer / 60 : 1;
  ctx.save();
  ctx.globalAlpha = alpha * 0.92;
  ctx.font = `bold ${Math.min(W * 0.055, 36)}px Arial Rounded MT Bold, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Skugga
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillText('🍬 Dra godis till munnen! 🍬', W/2 + 2, H * 0.18 + 2);
  // Text
  ctx.fillStyle = '#c62828';
  ctx.fillText('🍬 Dra godis till munnen! 🍬', W/2, H * 0.18);
  ctx.restore();
}

// ==========================================
//  STARTSKÄRM — startar loop-videon
// ==========================================
const startBtn  = document.querySelector('.start-btn');
const startBug  = document.getElementById('start-bug');
let gameStarted = false;

// Dela bug_loop.mp4 mellan startskärm och spel — laddas bara en gång
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

  // 🔑 iOS-trick: lås upp video-elementet direkt i gesture-kontexten
  // Utan detta blockerar Safari alla framtida video.play()-anrop
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

// Ta bort grå schackrute-bakgrund från PNG — flood-fill från hörnen
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
  } catch(e) { /* CORS — returnera obehandlad */ }
  return c;
}

// Tar bort vit bakgrund från videobildruta, med multiply-fallback
function drawVideoFrameClean(src, dx, dy, dw, dh, tilt = 0) {
  if (!src || src.readyState < 2) return;
  offCanvas.width = dw; offCanvas.height = dh;
  offCtx.drawImage(src, 0, 0, dw, dh);
  try {
    const id = offCtx.getImageData(0, 0, dw, dh);
    const d  = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      if (r > 220 && g > 220 && b > 220) { d[i+3] = 0; }
      else if (r > 175 && g > 175 && b > 175) {
        d[i+3] = Math.round(255 * (r + g + b - 525) / (660 - 525));
      }
    }
    offCtx.putImageData(id, 0, 0);
    const px = dx + dw/2, py = dy + dh;
    ctx.save();
    ctx.translate(px, py); ctx.rotate(tilt); ctx.translate(-px, -py);
    ctx.drawImage(offCanvas, dx, dy, dw, dh);
    ctx.restore();
  } catch(e) {
    // Fallback vid file:// — multiply-blend
    const px = dx + dw/2, py = dy + dh;
    ctx.save();
    ctx.translate(px, py); ctx.rotate(tilt); ctx.translate(-px, -py);
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(src, dx, dy, dw, dh);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }
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

    // Munglöd när godis är nära
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
//  SOCKERKRASCH
// ==========================================
const crash = {
  phase: 'idle', // idle | playing

  get isActive() { return this.phase !== 'idle'; },

  start() {
    this.phase = 'playing';
    // Spela Somnar-videon i samma fullskärms-overlay som övriga reaktioner
    playVideo('Somnar.mp4', false, () => {
      this.phase = 'idle';
      candyEaten = 0;
      candies = candies.filter(c => !c.eaten);
      // Efter Win-videon → visa YouTube-CTA
      playVideo(VIDEOS.win, false, () => {
        document.getElementById('yt-cta').style.display = 'flex';
        // isShowingVideo lämnas true tills spelaren trycker "Fortsätt spela"
        isShowingVideo = true;
      });
    });
  },

  update()      { },
  getTilt()     { return 0; },
  drawEffects() { }
};

window.restartGame = function() {
  // Rensa video-handlers så inget gammalt callback kan köras
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
  // Spawna lite godis direkt så det inte är tomt
  for (let i = 0; i < 4; i++) candies.push(new Candy(true));
};

// ==========================================
//  GODIS-BILDER
// ==========================================
const DIR = 'Godisar och veggies/';

// Laddar bild och processar bort schackruta när den är redo
function loadImg(file) {
  const obj = { raw: new Image(), processed: null };
  obj.raw.onload = () => { obj.processed = processImage(obj.raw); };
  obj.raw.src = DIR + file;
  return obj;
}
// Returnerar bästa tillgängliga version av bilden
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
];

const CHANCE_GOLD  = 0.10;
const CHANCE_YUCKY = 0.35;

class Candy {
  constructor(startOnScreen = false) { this.init(startOnScreen); }
  init(startOnScreen = false) {
    this.x = 70 + Math.random() * (W - 140);
    this.y = startOnScreen ? 80 + Math.random() * (H * 0.45) : -60;
    this.size = 80 + Math.random() * 30;
    this.speed = 1.3 + Math.random() * 1.7;
    this.dragging = this.eaten = false;
    this.wobble = Math.random() * Math.PI * 2;
    this.wobbleDir = (Math.random() - 0.5) * 0.7;
    const r = Math.random();
    if (r < CHANCE_GOLD) {
      this.kind = 'gold';
      this.imgObj = GOLD_IMG;
    } else if (r < CHANCE_GOLD + CHANCE_YUCKY) {
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

    // Glöd-effekter
    if (this.kind === 'gold')  { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 30; }
    if (this.kind === 'yucky') { ctx.shadowColor = '#88cc44'; ctx.shadowBlur = 16; }

    const s = this.size;
    const drawable = getImg(this.imgObj);
    if (drawable) {
      ctx.drawImage(drawable, -s / 2, -s / 2, s, s);
    } else {
      // Laddas fortfarande — visa färgad cirkel
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.kind === 'yucky' ? '#88cc44' : '#ffaacc';
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
const SPAWN_INTERVAL = 95, MAX_CANDY = 6;
for (let i = 0; i < 4; i++) candies.push(new Candy(true));
function spawnCandy() {
  if (candies.filter(c => !c.eaten).length < MAX_CANDY) candies.push(new Candy());
}

// ==========================================
//  UI
// ==========================================
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#fffbe8'); g.addColorStop(1, '#ffe6f5');
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
  ctx.fillStyle = '#b8eeaa'; ctx.fill();
}

function drawScore() {
  if (!stars) return;
  ctx.save(); ctx.font = 'bold 34px serif'; ctx.textAlign = 'left';
  ctx.textBaseline = 'top'; ctx.globalAlpha = 0.88;
  ctx.fillText('⭐'.repeat(Math.min((stars-1)%10+1,10)), 16, 60);
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
  ctx.save();
  ctx.globalAlpha = Math.min(yuckAnim, 1) * 0.88;
  ctx.fillStyle = '#dfffdf'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = Math.min(yuckAnim, 1);
  ctx.font = `bold ${70 + Math.sin(yuckAnim*10)*8}px serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2e7d32';
  ctx.fillText('🥕 Nej! Det är inte godis! 🥦', W/2, H/2);
  ctx.restore();
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
  if (isShowingVideo || crash.isActive) return;
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

  if (candy.kind === 'yucky') { playVideo(VIDEOS.yuck, true); return; }

  candyEaten++; stars = Math.min(stars + 1, 99);

  if (candyEaten >= 5) {
    setTimeout(() => crash.start(), 400);
    playVideo(candy.kind === 'gold' ? VIDEOS.wow : VIDEOS.chomp, false);
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
  // Spela direkt (iOS kräver play() inom user gesture-kontexten)
  overlay.classList.add('active');
  video.play().catch(() => {
    // Fallback: vänta på canplay om direkt play misslyckades
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

  if (++spawnTimer >= SPAWN_INTERVAL) { spawnCandy(); spawnTimer = 0; }

  candies.forEach(c => c.update());
  candies.forEach(c => c.draw());

  bug.draw(draggingNear('yummy') || draggingNear('gold'), draggingNear('yucky'));

  crash.update();
  crash.drawEffects();

  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => { p.update(); p.draw(); });

  drawScore();
  drawCandyCounter();
  drawInstruction();
  drawYuckOverlay();

  requestAnimationFrame(loop);
}

loop();
