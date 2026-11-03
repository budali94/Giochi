'use strict';
/* Giochi per bambini: nessuna pubblicità, nessun tracciamento, nessun link esterno. Funziona offline. */

const $ = (s, el = document) => el.querySelector(s);
const app = $('#app');
const bar = $('#bar');
const scoreEl = $('#stars');
const rand = n => Math.floor(Math.random() * n);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
};

/* ---------- Voce (italiano) ---------- */
let itVoice = null;
function loadVoice() {
  const vs = speechSynthesis.getVoices();
  itVoice = vs.find(v => v.lang === 'it-IT' && /google/i.test(v.name)) || vs.find(v => v.lang && v.lang.replace('_', '-').startsWith('it')) || null;
}
if ('speechSynthesis' in window) { loadVoice(); speechSynthesis.onvoiceschanged = loadVoice; }
function say(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'it-IT'; u.rate = 0.95; u.pitch = 1.15;
  if (itVoice) u.voice = itVoice;
  speechSynthesis.speak(u);
}

/* ---------- Suoni (generati, nessun file) ---------- */
let ac = null;
const audio = () => (ac = ac || new (window.AudioContext || window.webkitAudioContext)());
function tone(freq, dur = 0.15, type = 'sine', when = 0, vol = 0.25, slide = 0) {
  try {
    const a = audio(), t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur);
  } catch (e) {}
}
function noise(dur = 1.2, freq = 900, vol = 0.35) {
  try {
    const a = audio(), n = a.sampleRate * dur, buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(), t = a.currentTime;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.7;
    g.gain.setValueAtTime(0.001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.15); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.buffer = buf; s.connect(f).connect(g).connect(a.destination); s.start();
  } catch (e) {}
}
const sfx = {
  pop: () => tone(660, 0.08, 'triangle'),
  fill: () => tone(520 + rand(300), 0.12, 'sine', 0, 0.2, 900),
  kick: () => { tone(140, 0.15, 'sine', 0, 0.5, 60); noise(0.08, 2000, 0.2); },
  bounce: () => tone(180, 0.1, 'sine', 0, 0.35, 90),
  rim: () => tone(900, 0.2, 'triangle', 0, 0.15, 700),
  swish: () => noise(0.35, 3000, 0.25),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', i * 0.11)),
  crowd: () => { noise(1.8, 800, 0.4); noise(1.6, 1500, 0.2); },
  oh: () => { tone(420, 0.25, 'sine', 0, 0.2, 300); },
};

/* ---------- Feste ---------- */
function confetti(n = 30, bits = ['⭐', '🎉', '🎈', '💛', '🌈', '✨']) {
  const party = $('#party');
  for (let i = 0; i < n; i++) {
    const c = el('div', 'conf', bits[rand(bits.length)]);
    c.style.left = rand(100) + 'vw'; c.style.animationDelay = (Math.random() * 0.5) + 's';
    party.appendChild(c); setTimeout(() => c.remove(), 2300);
  }
}
function bigText(t) { const s = el('div', 'big', t); document.body.appendChild(s); setTimeout(() => s.remove(), 1500); }

/* ---------- Navigazione ---------- */
let cleanup = null, repeatFn = null;
function show(screen) {
  if (cleanup) { cleanup(); cleanup = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  app.innerHTML = ''; repeatFn = null; scoreEl.textContent = '';
  screen();
}
$('#home').onclick = () => { sfx.pop(); show(home); };
$('#again').onclick = () => { if (repeatFn) repeatFn(); };

const GAMES = [
  { icon: '🎨', bg: '#ff9ec0', run: coloring, name: 'Colora' },
  { icon: '🏀', bg: '#ffb366', run: basket, name: 'Basket' },
  { icon: '⚽', bg: '#8fe08f', run: soccer, name: 'Calcio' },
];

function home() {
  bar.hidden = true;
  const m = el('div', 'menu');
  GAMES.forEach(g => {
    const b = el('button', 'tile', g.icon); b.style.background = g.bg; b.setAttribute('aria-label', g.name);
    b.onclick = () => { sfx.pop(); show(() => { bar.hidden = false; g.run(); }); };
    m.appendChild(b);
  });
  app.appendChild(m);
}

/* =========================================================
   1. COLORA
   ========================================================= */
const PALETTE = [
  { n: 'rosso', c: '#ff3b3b' }, { n: 'arancione', c: '#ff8c1a' }, { n: 'giallo', c: '#ffd60a' },
  { n: 'verde', c: '#2ecc40' }, { n: 'azzurro', c: '#4cc9f0' }, { n: 'blu', c: '#2f5bff' },
  { n: 'viola', c: '#9b4dff' }, { n: 'rosa', c: '#ff7ac3' }, { n: 'marrone', c: '#a0522d' },
  { n: 'grigio', c: '#9aa0a6' }, { n: 'nero', c: '#222222' }, { n: 'bianco', c: '#ffffff' },
];
// Ogni disegno: elenco di zone colorabili (in ordine, dalla più lontana) + linee decorative.
const petals = [0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="200" cy="105" rx="30" ry="48" transform="rotate(${a} 200 150)"/>`);
const PICTURES = [
  { id: 'casa', r: [
    '<rect x="0" y="0" width="400" height="400"/>',
    '<rect x="0" y="305" width="400" height="95"/>',
    '<circle cx="70" cy="70" r="40"/>',
    '<path d="M235 120 a24 24 0 0 1 22-38 a30 30 0 0 1 56-8 a26 26 0 0 1 35 46 z"/>',
    '<rect x="245" y="105" width="32" height="70"/>',
    '<polygon points="85,195 200,100 315,195"/>',
    '<rect x="105" y="195" width="190" height="125"/>',
    '<path d="M178 320 v-55 a22 22 0 0 1 44 0 v55 z"/>',
    '<rect x="122" y="215" width="42" height="42"/>',
    '<rect x="236" y="215" width="42" height="42"/>',
    '<path d="M20 330 q10-25 20 0 q10-25 20 0 z"/>',
    '<path d="M330 335 q10-25 20 0 q10-25 20 0 z"/>',
  ], lines: '<path d="M143 215v42M122 236h42M257 215v42M236 236h42"/><circle cx="212" cy="295" r="3"/>' },
  { id: 'fiore', r: [
    '<rect x="0" y="0" width="400" height="400"/>',
    '<circle cx="345" cy="55" r="32"/>',
    '<rect x="193" y="170" width="14" height="140"/>',
    '<path d="M200 262 C 240 222 282 228 295 240 C 272 272 230 278 200 262 Z"/>',
    '<path d="M200 238 C 160 198 118 204 105 216 C 128 248 170 254 200 238 Z"/>',
    ...petals,
    '<circle cx="200" cy="150" r="32"/>',
    '<rect x="135" y="300" width="130" height="24" rx="6"/>',
    '<polygon points="148,324 252,324 236,392 164,392"/>',
  ], lines: '' },
  { id: 'pesce', r: [
    '<rect x="0" y="0" width="400" height="400"/>',
    '<rect x="0" y="355" width="400" height="45"/>',
    '<path d="M50 400 C 30 360 70 340 52 300 C 85 330 66 370 82 400 Z"/>',
    '<path d="M330 400 C 315 370 345 350 330 320 C 360 345 345 375 360 400 Z"/>',
    '<polygon points="100,200 35,135 35,265"/>',
    '<path d="M165 128 Q 205 65 250 130 Z"/>',
    '<path d="M175 270 Q 198 315 232 268 Z"/>',
    '<ellipse cx="200" cy="200" rx="120" ry="78"/>',
    '<path d="M160 133 Q 140 200 160 267 L 188 276 Q 168 200 188 124 Z"/>',
    '<path d="M215 123 Q 195 200 215 277 L 240 272 Q 220 200 240 128 Z"/>',
    '<circle cx="272" cy="182" r="18"/>',
    '<circle cx="277" cy="182" r="8"/>',
    '<circle cx="345" cy="120" r="12"/>',
    '<circle cx="362" cy="82" r="9"/>',
    '<circle cx="348" cy="50" r="6"/>',
  ], lines: '<path d="M300 222 q12 8 20 -2"/>' },
  { id: 'macchina', r: [
    '<rect x="0" y="0" width="400" height="285"/>',
    '<rect x="0" y="285" width="400" height="115"/>',
    '<circle cx="335" cy="60" r="32"/>',
    '<path d="M115 172 L 150 108 L 262 108 L 305 172 Z"/>',
    '<polygon points="132,168 158,120 202,120 202,168"/>',
    '<polygon points="212,120 254,120 284,168 212,168"/>',
    '<rect x="55" y="165" width="300" height="78" rx="22"/>',
    '<circle cx="338" cy="192" r="11"/>',
    '<rect x="55" y="205" width="22" height="16" rx="4"/>',
    '<circle cx="122" cy="248" r="36"/>',
    '<circle cx="290" cy="248" r="36"/>',
    '<circle cx="122" cy="248" r="14"/>',
    '<circle cx="290" cy="248" r="14"/>',
  ], lines: '<path d="M20 345h50M120 345h50M220 345h50M320 345h50M207 120v45M195 185h20"/>' },
  { id: 'farfalla', r: [
    '<rect x="0" y="0" width="400" height="400"/>',
    '<rect x="0" y="355" width="400" height="45"/>',
    '<path d="M195 180 C 120 55 35 80 58 162 C 70 205 150 202 195 192 Z"/>',
    '<path d="M205 180 C 280 55 365 80 342 162 C 330 205 250 202 205 192 Z"/>',
    '<path d="M195 202 C 140 210 76 262 118 304 C 150 334 190 272 197 216 Z"/>',
    '<path d="M205 202 C 260 210 324 262 282 304 C 250 334 210 272 203 216 Z"/>',
    '<circle cx="112" cy="140" r="22"/>',
    '<circle cx="288" cy="140" r="22"/>',
    '<circle cx="142" cy="272" r="15"/>',
    '<circle cx="258" cy="272" r="15"/>',
    '<ellipse cx="200" cy="215" rx="13" ry="78"/>',
    '<circle cx="200" cy="128" r="19"/>',
    '<circle cx="165" cy="68" r="9"/>',
    '<circle cx="235" cy="68" r="9"/>',
  ], lines: '<path d="M192 112 Q 180 85 168 74M208 112 Q 220 85 232 74"/>' },
  { id: 'gelato', r: [
    '<rect x="0" y="0" width="400" height="400"/>',
    '<polygon points="138,222 262,222 200,385"/>',
    '<circle cx="160" cy="200" r="48"/>',
    '<circle cx="240" cy="200" r="48"/>',
    '<circle cx="200" cy="138" r="52"/>',
    '<circle cx="200" cy="80" r="16"/>',
  ], lines: '<path d="M160 245 L 235 300M185 228 L 245 270M215 225 L 252 245M240 228 L 165 282M215 225 L 158 262M185 228 L 150 248M200 64 q4 -20 18 -26"/>' },
  { id: 'razzo', r: [
    '<rect x="0" y="0" width="400" height="400"/>',
    '<circle cx="335" cy="320" r="42"/>',
    '<polygon points="50,40 56,56 72,58 60,68 64,84 50,75 36,84 40,68 28,58 44,56"/>',
    '<polygon points="340,70 345,82 358,83 348,91 351,104 340,97 329,104 332,91 322,83 335,82"/>',
    '<circle cx="80" cy="300" r="7"/>',
    '<path d="M163 312 Q 200 400 237 312 Z"/>',
    '<polygon points="157,245 108,322 162,312"/>',
    '<polygon points="243,245 292,322 238,312"/>',
    '<path d="M200 38 C 262 98 258 200 246 312 L 154 312 C 142 200 138 98 200 38 Z"/>',
    '<path d="M200 38 C 226 60 240 84 248 112 L 152 112 C 160 84 174 60 200 38 Z"/>',
    '<circle cx="200" cy="172" r="30"/>',
    '<circle cx="200" cy="172" r="19"/>',
  ], lines: '<ellipse cx="335" cy="320" rx="62" ry="14"/><path d="M200 312v-50"/>' },
  { id: 'forme', r: [
    '<rect x="0" y="0" width="400" height="400"/>',
    '<circle cx="100" cy="100" r="72"/>',
    '<rect x="228" y="30" width="140" height="140" rx="8"/>',
    '<polygon points="100,212 172,360 28,360"/>',
    '<polygon points="295,205 316,256 370,260 328,294 342,348 295,318 248,348 262,294 220,260 274,256"/>',
  ], lines: '' },
];
const picSVG = (p, fills, interactive) => {
  const regions = p.r.map((s, i) => s.replace(/^<(\w+)/, `<$1 class="r" data-i="${i}" fill="${fills[i] || '#fff'}"`)).join('');
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" stroke="#222" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">
    <clipPath id="rc"><rect width="400" height="400" rx="26"/></clipPath>
    <g clip-path="url(#rc)">${regions}<g fill="none" pointer-events="none">${p.lines}</g></g>
    <rect x="2" y="2" width="396" height="396" rx="25" fill="none" stroke-width="4"/></svg>`;
};

function coloring() {
  const picker = () => {
    app.innerHTML = '';
    const grid = el('div', 'pics');
    PICTURES.forEach(p => {
      const b = el('button', 'pic', picSVG(p, store.get('col-' + p.id) || [], false));
      b.onclick = () => { sfx.pop(); paint(p); };
      grid.appendChild(b);
    });
    app.appendChild(grid);
    repeatFn = () => say('Scegli un disegno da colorare!');
    repeatFn();
  };
  const paint = p => {
    app.innerHTML = '';
    const fills = store.get('col-' + p.id) || [];
    let color = PALETTE[rand(8)].c, celebrated = false;
    const wrap = el('div', 'colorer');
    const sheet = el('div', 'sheet', picSVG(p, fills, true));
    const cols = el('div', 'colors');
    const btns = PALETTE.map(c => {
      const b = el('button', 'c'); b.style.background = c.c; b.setAttribute('aria-label', c.n);
      if (c.c === color) b.classList.add('sel');
      b.onclick = () => { color = c.c; btns.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sfx.pop(); say(c.n); };
      cols.appendChild(b); return b;
    });
    const back = el('button', 'c pics-btn', '🖼️'); back.setAttribute('aria-label', 'Altri disegni');
    back.onclick = () => { sfx.pop(); picker(); };
    cols.appendChild(back);
    wrap.append(sheet, cols); app.appendChild(wrap);
    const svg = $('svg', sheet);
    svg.addEventListener('pointerdown', e => {
      const r = e.target.closest('.r'); if (!r) return;
      r.setAttribute('fill', color); fills[+r.dataset.i] = color; store.set('col-' + p.id, fills);
      sfx.fill();
      const done = p.r.every((_, i) => fills[i] && fills[i] !== '#ffffff');
      if (done && !celebrated) { celebrated = true; setTimeout(() => { sfx.win(); confetti(40); say('Che bel disegno! Bravissimo!'); }, 300); }
    });
    repeatFn = () => say('Scegli un colore e tocca il disegno!');
    repeatFn();
  };
  picker();
}

/* =========================================================
   Base comune per i giochi su canvas
   ========================================================= */
function canvasGame({ init, resize, update, draw, down, up }) {
  const cv = el('canvas', 'game'); app.appendChild(cv);
  const ctx = cv.getContext('2d');
  const S = { W: 0, H: 0, ctx, t: 0 };
  function fit() {
    const d = Math.min(devicePixelRatio || 1, 2);
    S.W = cv.clientWidth; S.H = cv.clientHeight;
    cv.width = S.W * d; cv.height = S.H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    resize(S);
  }
  S.resize = fit; init(S); fit();
  let raf, last = performance.now(), ptr = null;
  const loop = now => {
    const dt = Math.min(0.033, (now - last) / 1000); last = now; S.t += dt;
    update(S, dt); draw(S, ctx);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  const pos = e => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, time: performance.now() }; };
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); ptr = { start: pos(e), id: e.pointerId }; down && down(S, ptr.start); });
  cv.addEventListener('pointerup', e => { if (!ptr || ptr.id !== e.pointerId) return; const end = pos(e); up(S, ptr.start, end); ptr = null; });
  cv.addEventListener('pointercancel', () => { ptr = null; });
  addEventListener('resize', fit);
  cleanup = () => { cancelAnimationFrame(raf); removeEventListener('resize', fit); };
  return S;
}
function drawHint(ctx, x0, y0, x1, y1, t, size) {
  const k = (t % 1.6) / 1.2; if (k > 1) return;
  ctx.save(); ctx.globalAlpha = Math.sin(k * Math.PI);
  ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('👆', lerp(x0, x1, ease(k)), lerp(y0, y1, ease(k)));
  ctx.restore();
}

/* =========================================================
   2. BASKET
   ========================================================= */
function basket() {
  let score = 0;
  const showScore = () => { scoreEl.textContent = '🏀 ' + score; };
  showScore();
  canvasGame({
    init(S) { S.state = 'ready'; S.shots = 0; S.hoopK = { x: 0.72, y: 0.4 }; },
    resize(S) {
      const { W, H } = S;
      S.floor = H - Math.max(24, H * 0.06);
      S.R = clamp(Math.min(W, H) * 0.055, 20, 46);
      S.start = { x: W * 0.2, y: S.floor - S.R - H * 0.1 };
      S.hx = W * S.hoopK.x; S.hy = H * S.hoopK.y; S.rimR = S.R * 1.75;
      S.bx = S.hx + S.rimR + 6;
      if (S.state === 'ready') resetBall(S);
    },
    update(S, dt) {
      const b = S.ball;
      if (S.state === 'ready') { b.y = S.start.y + Math.sin(S.t * 3) * 4; return; }
      if (S.state !== 'fly') return;
      S.flyT += dt;
      const g = S.H * 2.2, steps = 4, h = dt / steps;
      for (let i = 0; i < steps; i++) {
        const py = b.y;
        b.vy += g * h; b.x += b.vx * h; b.y += b.vy * h; b.rot += b.vx * h / S.R;
        // canestro: passa dall'alto verso il basso dentro il ferro
        if (!S.scored && py < S.hy && b.y >= S.hy && b.x > S.hx - S.rimR + S.R * 0.35 && b.x < S.hx + S.rimR - S.R * 0.35 && b.vy > 0) {
          S.scored = true; S.netT = 0; scoreIt(S);
        }
        // ferro (due punti)
        for (const rx of [S.hx - S.rimR, S.hx + S.rimR]) {
          const dx = b.x - rx, dy = b.y - S.hy, d = Math.hypot(dx, dy), min = S.R + 5;
          if (d < min && d > 0) {
            const nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
            if (vn < 0) { b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; if (S.t - (S.lastRim || 0) > 0.15) { sfx.rim(); S.lastRim = S.t; } }
            b.x = rx + nx * min; b.y = S.hy + ny * min;
          }
        }
        // tabellone
        const top = S.hy - S.R * 3.4, bot = S.hy + S.R * 0.8;
        if (b.vx > 0 && b.x + S.R > S.bx && b.x < S.bx + 10 && b.y > top && b.y < bot) { b.x = S.bx - S.R; b.vx = -b.vx * 0.55; sfx.bounce(); }
        // pavimento
        if (b.y + S.R > S.floor) {
          b.y = S.floor - S.R;
          if (b.vy > 80) sfx.bounce();
          b.vy = -b.vy * 0.55; b.vx *= 0.85;
        }
      }
      if (S.netT != null) S.netT += dt;
      const out = b.x < -S.R * 3 || b.x > S.W + S.R * 3;
      const still = Math.abs(b.vy) < 40 && b.y + S.R >= S.floor - 1 && Math.abs(b.vx) < 60;
      if (out || still || S.flyT > 4) {
        if (!S.scored && Math.random() < 0.6) say(['Quasi! Riprova!', 'Ancora una volta!', 'Dai, riprova!'][rand(3)]);
        if (S.scored) { S.hoopK = { x: 0.62 + Math.random() * 0.2, y: 0.3 + Math.random() * 0.2 }; S.resize(); }
        S.state = 'ready'; resetBall(S);
      }
    },
    draw(S, c) {
      const { W, H, R } = S;
      // parete e parquet
      let gr = c.createLinearGradient(0, 0, 0, S.floor); gr.addColorStop(0, '#7ec8ff'); gr.addColorStop(1, '#dff1ff');
      c.fillStyle = gr; c.fillRect(0, 0, W, S.floor);
      c.fillStyle = '#e0a060'; c.fillRect(0, S.floor, W, H - S.floor);
      c.strokeStyle = '#c98a4a'; c.lineWidth = 2;
      for (let x = 0; x < W; x += 60) { c.beginPath(); c.moveTo(x, S.floor); c.lineTo(x - 20, H); c.stroke(); }
      // palo + tabellone
      const top = S.hy - R * 3.4, bot = S.hy + R * 0.8;
      c.fillStyle = '#666'; c.fillRect(S.bx + 10, top + 20, 12, S.floor - top - 20);
      c.fillStyle = '#fff'; c.strokeStyle = '#333'; c.lineWidth = 4;
      c.fillRect(S.bx, top, 10, bot - top); c.strokeRect(S.bx, top, 10, bot - top);
      c.strokeStyle = '#ff3b3b'; c.strokeRect(S.bx - 1, S.hy - R * 1.6, 12, R * 1.5);
      // rete
      const sw = S.netT != null && S.netT < 0.6 ? Math.sin(S.netT * 25) * 6 * (1 - S.netT / 0.6) : 0;
      c.strokeStyle = '#fff'; c.lineWidth = 2.5;
      const netH = R * 2, n = 6;
      for (let i = 0; i <= n; i++) {
        const xt = S.hx - S.rimR + (2 * S.rimR) * i / n, xb = S.hx - S.rimR * 0.6 + (1.2 * S.rimR) * i / n + sw;
        c.beginPath(); c.moveTo(xt, S.hy); c.lineTo(xb, S.hy + netH); c.stroke();
      }
      for (let j = 1; j <= 3; j++) {
        const y = S.hy + netH * j / 3, hw = S.rimR * (1 - 0.4 * j / 3);
        c.beginPath(); c.moveTo(S.hx - hw + sw * j / 3, y); c.lineTo(S.hx + hw + sw * j / 3, y); c.stroke();
      }
      // palla
      drawBasketball(c, S.ball.x, S.ball.y, R, S.ball.rot);
      // ferro davanti
      c.strokeStyle = '#ff5a1f'; c.lineWidth = 7; c.lineCap = 'round';
      c.beginPath(); c.moveTo(S.hx - S.rimR, S.hy); c.lineTo(S.bx, S.hy); c.stroke();
      if (S.shots === 0 && S.state === 'ready') drawHint(c, S.start.x + R, S.start.y + R * 2, S.hx - S.rimR, S.hy - R * 3, S.t, R * 2.2);
    },
    up(S, a, b) {
      if (S.state !== 'ready') return;
      const ideal = idealShot(S);
      let dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy), v;
      if (len < 20 || dy > -10) {
        const err = 1 + (Math.random() - 0.5) * 0.12; v = { x: ideal.x * err, y: ideal.y * err };
      } else {
        const sp = Math.hypot(ideal.x, ideal.y) * clamp(len / (S.H * 0.35), 0.8, 1.15);
        const ux = dx / len * sp, uy = dy / len * sp;
        v = { x: lerp(ux, ideal.x, 0.7), y: lerp(uy, ideal.y, 0.7) }; // aiutino per i piccoli
      }
      S.ball.vx = v.x; S.ball.vy = v.y; S.state = 'fly'; S.flyT = 0; S.scored = false; S.netT = null; S.shots++;
      sfx.pop();
    },
  });
  function resetBall(S) { S.ball = { x: S.start.x, y: S.start.y, vx: 0, vy: 0, rot: (S.ball && S.ball.rot) || 0 }; S.scored = false; }
  function idealShot(S) {
    const g = S.H * 2.2, b = S.ball, apex = S.hy - S.R * 4.5;
    const vy = Math.sqrt(2 * g * Math.max(10, b.y - apex));
    const t = vy / g + Math.sqrt(2 * (S.hy - apex) / g);
    return { x: (S.hx - b.x) / t, y: -vy };
  }
  function scoreIt(S) {
    score++; showScore(); sfx.swish(); setTimeout(sfx.win, 150); confetti(20, ['🏀', '⭐', '🎉']);
    say(['Canestro!', 'Bravissimo! Canestro!', 'Che tiro!', 'Evviva!'][rand(4)]);
    if (score % 5 === 0) { bigText('🏆'); confetti(50); }
  }
  repeatFn = () => say('Tira la palla nel canestro! Striscia il dito verso il canestro.');
  repeatFn();
}
function drawBasketball(c, x, y, R, rot) {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.fillStyle = '#ff8c1a'; c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill();
  c.strokeStyle = '#3a1d00'; c.lineWidth = Math.max(2, R * 0.07);
  c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke();
  c.beginPath(); c.moveTo(-R, 0); c.lineTo(R, 0); c.moveTo(0, -R); c.lineTo(0, R); c.stroke();
  c.beginPath(); c.arc(-R * 1.25, 0, R * 0.95, -0.85, 0.85); c.stroke();
  c.beginPath(); c.arc(R * 1.25, 0, R * 0.95, Math.PI - 0.85, Math.PI + 0.85); c.stroke();
  c.restore();
}

/* =========================================================
   3. CALCIO (rigori con il portiere)
   ========================================================= */
function soccer() {
  let score = 0, lastSave = false, streak = 0;
  const showScore = () => { scoreEl.textContent = '⚽ ' + score; };
  showScore();
  canvasGame({
    init(S) { S.state = 'ready'; S.shots = 0; S.kx = 0; },
    resize(S) {
      const { W, H } = S;
      S.gw = Math.min(W * 0.78, H * 1.15); S.gh = S.gw * 0.36;
      S.gx = (W - S.gw) / 2; S.gy = Math.max(100, H * 0.17);
      S.R = clamp(Math.min(W, H) * 0.06, 22, 54);
      S.spot = { x: W / 2, y: H * 0.84 };
      S.kh = S.gh * 0.82;
      if (S.state === 'ready') resetBall(S);
    },
    update(S, dt) {
      const cx = S.W / 2;
      if (S.state === 'ready') { S.kx = cx + Math.sin(S.t * 1.6) * S.gw * 0.14; S.kAng = 0; S.kLift = 0; return; }
      const b = S.ball;
      if (S.state === 'fly') {
        S.ft += dt; const k = clamp(S.ft / S.dur, 0, 1);
        b.x = lerp(S.from.x, S.tx, k); b.y = lerp(S.from.y, S.ty, k) - Math.sin(Math.PI * k) * S.H * 0.06;
        b.s = lerp(1, 0.5, k); b.rot += dt * 14;
        // tuffo del portiere
        const dk = ease((S.ft - 0.1) / (S.dur - 0.05));
        S.kx = lerp(S.kx0, S.diveX, dk); S.kAng = lerp(0, S.diveAng, dk); S.kLift = lerp(0, S.diveLift, dk);
        if (k >= 1) {
          if (S.save) {
            S.state = 'saved'; S.rt = 0; sfx.bounce(); sfx.oh();
            b.vx = (b.x < cx ? -1 : 1) * S.W * (0.3 + Math.random() * 0.3); b.vy = S.H * 0.5;
            say(['Parata! Riprova!', 'Il portiere l\'ha presa! Ancora!', 'Parata! Dai, tira ancora!'][rand(3)]);
          } else {
            S.state = 'goal'; S.rt = 0; score++; showScore(); sfx.crowd(); sfx.win();
            confetti(30, ['⚽', '⭐', '🎉', '🏆']); bigText('GOL!');
            say(['Gol!', 'Che gol!', 'Goool! Bravissimo!'][rand(3)]);
            if (score % 5 === 0) setTimeout(() => { bigText('🏆'); confetti(50); }, 1200);
          }
        }
      } else if (S.state === 'saved') {
        S.rt += dt; b.vy += S.H * 1.5 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.s = Math.min(1, b.s + dt * 0.6); b.rot += dt * 10;
        if (S.rt > 1.6) next(S);
      } else if (S.state === 'goal') {
        S.rt += dt; if (S.rt < 0.25) { b.y -= dt * S.gh * 0.25; b.s = Math.max(0.45, b.s - dt * 0.2); }
        if (S.rt > 1.9) next(S);
      }
    },
    draw(S, c) {
      const { W, H, gx, gy, gw, gh } = S;
      // cielo, tribuna, prato a strisce
      let gr = c.createLinearGradient(0, 0, 0, gy + gh); gr.addColorStop(0, '#6cc6ff'); gr.addColorStop(1, '#bfe6ff');
      c.fillStyle = gr; c.fillRect(0, 0, W, gy + gh);
      c.fillStyle = '#5a6b8c'; c.fillRect(0, gy - gh * 0.55, W, gh * 0.5);
      for (let i = 0; i < W; i += 22) { c.fillStyle = ['#ff6b6b', '#ffd166', '#4cc9f0', '#fff', '#9b4dff'][(i / 22) % 5 | 0]; c.beginPath(); c.arc(i + 11, gy - gh * 0.38 + ((i / 22) % 2) * 12, 7, 0, 7); c.fill(); }
      const fy = gy + gh;
      for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#3fb94a' : '#4cc957'; c.fillRect(0, fy + (H - fy) * i / 8, W, (H - fy) / 8 + 1); }
      c.strokeStyle = '#ffffffcc'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(0, fy); c.lineTo(W, fy); c.stroke();
      c.strokeRect(gx - gw * 0.12, fy, gw * 1.24, (H - fy) * 0.3);
      c.fillStyle = '#fff'; c.beginPath(); c.ellipse(S.spot.x, S.spot.y + S.R * 0.9, 10, 5, 0, 0, 7); c.fill();
      // rete
      c.fillStyle = '#ffffff22'; c.fillRect(gx, gy, gw, gh);
      const inGoal = S.state === 'goal';
      if (inGoal) drawSoccerBall(c, S.ball.x, S.ball.y, S.R * S.ball.s, S.ball.rot);
      const bulge = inGoal && S.rt < 0.6 ? Math.sin(S.rt * 20) * 5 * (1 - S.rt / 0.6) : 0;
      c.strokeStyle = '#ffffffaa'; c.lineWidth = 1.5;
      for (let x = gx; x <= gx + gw; x += gw / 18) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x + bulge, gy + gh); c.stroke(); }
      for (let y = gy; y <= gy + gh; y += gh / 7) { c.beginPath(); c.moveTo(gx, y + bulge * 0.5); c.lineTo(gx + gw, y + bulge * 0.5); c.stroke(); }
      // pali
      c.strokeStyle = '#fff'; c.lineWidth = Math.max(8, gw * 0.018); c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(gx, gy + gh); c.lineTo(gx, gy); c.lineTo(gx + gw, gy); c.lineTo(gx + gw, gy + gh); c.stroke();
      drawKeeper(c, S.kx, gy + gh, S.kh, S.kAng || 0, S.kLift || 0);
      if (!inGoal) drawSoccerBall(c, S.ball.x, S.ball.y, S.R * S.ball.s, S.ball.rot);
      if (S.shots === 0 && S.state === 'ready') drawHint(c, S.spot.x + S.R * 1.5, S.spot.y + S.R, S.W / 2 + gw * 0.3, gy + gh * 0.4, S.t, S.R * 2);
    },
    up(S, a, b) {
      if (S.state !== 'ready') return;
      const { gx, gy, gw, gh } = S, r = S.R * 0.5;
      let tx, ty;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      if (len < 20) {            // tocco: tira dove ha toccato
        tx = b.x; ty = b.y < gy + gh * 1.6 ? b.y : gy + gh * (0.3 + Math.random() * 0.5);
      } else if (dy < 0) {       // strisciata verso l'alto: segue la direzione
        const lineY = gy + gh * 0.6, k = (S.spot.y - lineY) / -dy;
        tx = S.spot.x + dx * k;
        ty = gy + gh - clamp(len / (S.H * 0.45), 0.25, 0.95) * gh;
      } else return;
      // aiutino: la palla va sempre verso la porta
      S.tx = clamp(tx, gx + r + 6, gx + gw - r - 6); S.ty = clamp(ty, gy + r + 6, gy + gh - r - 2);
      // decide se il portiere para (mai due parate di fila)
      let p = streak >= 3 ? 0.45 : 0.3;
      if (lastSave) p = 0;
      S.save = Math.random() < p; lastSave = S.save; streak = S.save ? 0 : streak + 1;
      const side = S.tx < S.kx ? -1 : 1, reach = S.kh * 0.75;
      S.kx0 = S.kx;
      if (S.save) {
        S.diveX = clamp(S.tx - side * reach * 0.35, gx + S.kh * 0.2, gx + gw - S.kh * 0.2);
      } else if (Math.abs(S.tx - S.kx) < reach) {
        S.diveX = clamp(S.kx - side * gw * 0.3, gx + S.kh * 0.2, gx + gw - S.kh * 0.2); // si tuffa dalla parte sbagliata
      } else {
        S.diveX = S.kx + (S.tx - S.kx) * 0.35; // non ci arriva
      }
      const dir = Math.sign(S.diveX - S.kx0) || side;
      const far = Math.abs(S.diveX - S.kx0) > S.kh * 0.25;
      S.diveAng = far ? dir * 1.1 : 0;
      S.diveLift = S.save ? clamp((gy + gh - S.ty) - S.kh * (far ? 0.25 : 0.85), 0, gh * 0.5) : (far ? gh * 0.1 : gh * 0.25);
      S.state = 'fly'; S.ft = 0; S.dur = 0.6; S.from = { x: S.ball.x, y: S.ball.y }; S.shots++;
      sfx.kick();
    },
  });
  function resetBall(S) { S.ball = { x: S.spot.x, y: S.spot.y, s: 1, rot: 0 }; }
  function next(S) { S.state = 'ready'; resetBall(S); }
  repeatFn = () => say('Tira in porta! Striscia il dito verso la porta. Attento al portiere!');
  repeatFn();
}
function drawSoccerBall(c, x, y, R, rot) {
  c.save(); c.translate(x, y);
  c.fillStyle = '#0003'; c.beginPath(); c.ellipse(0, R * 0.95, R * 0.8, R * 0.2, 0, 0, 7); c.fill();
  c.rotate(rot);
  c.fillStyle = '#fff'; c.strokeStyle = '#222'; c.lineWidth = Math.max(1.5, R * 0.06);
  c.beginPath(); c.arc(0, 0, R, 0, 7); c.fill(); c.stroke();
  const pent = (px, py, s) => { c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; c.lineTo(px + Math.cos(a) * s, py + Math.sin(a) * s); } c.closePath(); c.fillStyle = '#222'; c.fill(); };
  pent(0, 0, R * 0.32);
  c.save(); c.beginPath(); c.arc(0, 0, R, 0, 7); c.clip();
  for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; pent(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9, R * 0.26); }
  c.restore(); c.restore();
}
function drawKeeper(c, x, footY, h, ang, lift) {
  const u = h / 10;
  c.save(); c.translate(x, footY - lift - u * 4); c.rotate(ang);
  // gambe
  c.fillStyle = '#222'; c.fillRect(-u * 1.6, u * 1.2, u * 1.3, u * 2.8); c.fillRect(u * 0.3, u * 1.2, u * 1.3, u * 2.8);
  c.fillStyle = '#ff8c1a'; c.fillRect(-u * 1.8, u * 3.6, u * 1.6, u * 0.6); c.fillRect(u * 0.2, u * 3.6, u * 1.6, u * 0.6);
  // braccia alzate
  c.strokeStyle = '#2ecc40'; c.lineWidth = u * 1.1; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-u * 1.5, -u * 2.5); c.lineTo(-u * 3.6, -u * 4.8); c.moveTo(u * 1.5, -u * 2.5); c.lineTo(u * 3.6, -u * 4.8); c.stroke();
  c.fillStyle = '#ffd60a'; c.strokeStyle = '#333'; c.lineWidth = 2;
  for (const s of [-1, 1]) { c.beginPath(); c.arc(s * u * 3.8, -u * 5.1, u * 0.9, 0, 7); c.fill(); c.stroke(); }
  // corpo
  c.fillStyle = '#2ecc40'; c.beginPath(); c.roundRect ? c.roundRect(-u * 2, -u * 3.2, u * 4, u * 4.6, u) : c.rect(-u * 2, -u * 3.2, u * 4, u * 4.6); c.fill();
  c.fillStyle = '#fff'; c.font = `bold ${u * 2}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1', 0, -u * 0.9);
  // testa
  c.fillStyle = '#f5c9a0'; c.beginPath(); c.arc(0, -u * 4.6, u * 1.4, 0, 7); c.fill();
  c.fillStyle = '#5a3a1a'; c.beginPath(); c.arc(0, -u * 5, u * 1.4, Math.PI, 0); c.fill();
  c.fillStyle = '#222'; c.beginPath(); c.arc(-u * 0.5, -u * 4.5, u * 0.18, 0, 7); c.arc(u * 0.5, -u * 4.5, u * 0.18, 0, 7); c.fill();
  c.strokeStyle = '#222'; c.lineWidth = 2; c.beginPath(); c.arc(0, -u * 4.2, u * 0.5, 0.2, Math.PI - 0.2); c.stroke();
  c.restore();
}

/* ---------- Avvio ---------- */
document.addEventListener('contextmenu', e => e.preventDefault());
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
show(home);
