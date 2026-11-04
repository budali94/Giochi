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
  { icon: '🥅', bg: '#7fc8ff', run: () => duel(), name: 'Uno contro uno' },
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
const PICTURES = [...(window.EXTRA_PICTURES || []),
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
// Disegno: ogni zona ha il suo "strato di pittura" ritagliato sulla sua forma,
// così il colore steso col dito non esce dai bordi. I contorni stanno sopra.
let svgUid = 0;
const BRUSH = 26;
const strokeSVG = s => `<path d="${s.d}" fill="none" stroke="${s.c}" stroke-width="${BRUSH}" stroke-linecap="round" stroke-linejoin="round"/>`;
const picSVG = (p, strokes) => {
  const u = 'p' + (++svgUid);
  const byRegion = p.r.map(() => []);
  (strokes || []).forEach(s => { if (byRegion[s.i]) byRegion[s.i].push(strokeSVG(s)); });
  const clips = p.r.map((s, i) => `<clipPath id="${u}c${i}">${s}</clipPath>`).join('');
  // ogni zona: fondo bianco + pittura (ritagliati) e poi il suo contorno; le zone dopo coprono quelle prima
  const layers = p.r.map((s, i) =>
    `<g clip-path="url(#${u}c${i})">${s.replace(/^<(\w+)/, `<$1 class="r" data-i="${i}" fill="#fff" stroke="none"`)}<g class="paint" data-i="${i}">${byRegion[i].join('')}</g></g>` +
    s.replace(/^<(\w+)/, '<$1 fill="none" stroke="#222" stroke-width="4" pointer-events="none"')).join('');
  return `<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg" stroke-linejoin="round" stroke-linecap="round">
    <defs><clipPath id="${u}rc"><rect width="400" height="400" rx="26"/></clipPath>${clips}</defs>
    <g clip-path="url(#${u}rc)">${layers}<g stroke="#222" stroke-width="4" fill="none" pointer-events="none">${p.lines}</g></g>
    <rect x="2" y="2" width="396" height="396" rx="25" fill="none" stroke="#222" stroke-width="4" pointer-events="none"/></svg>`;
};

function coloring() {
  const picker = () => {
    app.innerHTML = '';
    const grid = el('div', 'pics');
    PICTURES.forEach(p => {
      const b = el('button', 'pic', picSVG(p, store.get('paint-' + p.id) || []));
      b.onclick = () => { sfx.pop(); paint(p); };
      grid.appendChild(b);
    });
    app.appendChild(grid);
    repeatFn = () => say('Scegli un disegno da colorare!');
    repeatFn();
  };
  const paint = p => {
    app.innerHTML = '';
    let strokes = store.get('paint-' + p.id) || [];
    let color = PALETTE[rand(8)].c;
    const wrap = el('div', 'colorer');
    const sheet = el('div', 'sheet', picSVG(p, strokes));
    const cols = el('div', 'colors');
    const btns = PALETTE.map(c => {
      const b = el('button', 'c'); b.style.background = c.c; b.setAttribute('aria-label', c.n);
      if (c.c === color) b.classList.add('sel');
      b.onclick = () => { color = c.c; btns.forEach(x => x.classList.remove('sel')); b.classList.add('sel'); sfx.pop(); say(c.n); };
      cols.appendChild(b); return b;
    });
    const back = el('button', 'c pics-btn', '🖼️'); back.setAttribute('aria-label', 'Altri disegni');
    back.onclick = () => { sfx.pop(); picker(); };
    const clear = el('button', 'c pics-btn', '🗑️'); clear.setAttribute('aria-label', 'Ricomincia');
    clear.onclick = () => { sfx.pop(); strokes = []; store.set('paint-' + p.id, strokes); sheet.querySelectorAll('.paint').forEach(g => g.innerHTML = ''); };
    cols.append(back, clear);
    wrap.append(sheet, cols); app.appendChild(wrap);

    const svg = $('svg', sheet);
    const regions = [...svg.querySelectorAll('.r')];
    const layers = [...svg.querySelectorAll('.paint')];
    const toSVG = e => { const m = svg.getScreenCTM().inverse(); return { x: Math.round((e.clientX * m.a + e.clientY * m.c + m.e) * 10) / 10, y: Math.round((e.clientX * m.b + e.clientY * m.d + m.f) * 10) / 10 }; };
    const regionAt = pt => {
      for (let i = regions.length - 1; i >= 0; i--) {
        try { if (regions[i].isPointInFill(new DOMPoint(pt.x, pt.y))) return i; } catch (e) {}
      }
      return -1;
    };
    const live = new Map();
    const save = () => { if (strokes.length > 800) strokes = strokes.slice(-800); store.set('paint-' + p.id, strokes); };
    svg.addEventListener('pointerdown', e => {
      const pt = toSVG(e), i = regionAt(pt); if (i < 0) return;
      svg.setPointerCapture(e.pointerId);
      const s = { i, c: color, d: `M${pt.x} ${pt.y}l0 0.1` };
      layers[i].insertAdjacentHTML('beforeend', strokeSVG(s));
      live.set(e.pointerId, { s, node: layers[i].lastChild, last: pt });
      sfx.fill();
    });
    svg.addEventListener('pointermove', e => {
      const L = live.get(e.pointerId); if (!L) return;
      const pt = toSVG(e);
      if (Math.hypot(pt.x - L.last.x, pt.y - L.last.y) < 2) return;
      L.s.d += `L${pt.x} ${pt.y}`; L.last = pt; L.node.setAttribute('d', L.s.d);
    });
    const end = e => { const L = live.get(e.pointerId); if (!L) return; live.delete(e.pointerId); strokes.push(L.s); save(); };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    repeatFn = () => say('Scegli un colore e colora con il dito!');
    repeatFn();
  };
  picker();
}

/* =========================================================
   Base comune per i giochi su canvas
   ========================================================= */
function canvasGame({ init, resize, update, draw, down, up, move }) {
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
  cv.addEventListener('pointermove', e => { if (move && ptr && ptr.id === e.pointerId) move(S, pos(e)); });
  cv.addEventListener('pointerup', e => { if (!ptr || ptr.id !== e.pointerId) return; const end = pos(e); up && up(S, ptr.start, end); ptr = null; });
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
   3. CALCIO (rigori con il portiere) — grafica "stadio"
   ========================================================= */
function soccer() {
  let score = 0, lastSave = false, streak = 0;
  const showScore = () => { scoreEl.textContent = '⚽ ' + score; };
  showScore();
  canvasGame({
    init(S) { S.state = 'ready'; S.shots = 0; S.kx = 0; S.cheer = 0; S.kick = 0; S.flashes = []; },
    resize(S) {
      const { W, H } = S;
      S.gw = Math.min(W * 0.74, H * 1.1); S.gh = S.gw * 0.34;
      S.fy = H * (W > H ? 0.57 : 0.5); S.gy = S.fy - S.gh; S.gx = (W - S.gw) / 2;
      S.R = clamp(Math.min(W, H) * 0.065, 24, 60);
      S.spot = { x: W / 2, y: H * 0.86 };
      S.kh = S.gh * 0.86;
      S.boardB = S.fy - S.gh * 0.14; S.boardT = S.boardB - S.gh * 0.17;
      buildBackground(S);
      if (S.state === 'ready') resetBall(S);
    },
    update(S, dt) {
      const cx = S.W / 2;
      S.cheer = Math.max(0, S.cheer - dt); S.kick = Math.max(0, S.kick - dt);
      S.flashes = S.flashes.filter(f => (f.t -= dt) > 0);
      if (S.cheer > 0 && Math.random() < 0.5) S.flashes.push({ x: Math.random() * S.W, y: Math.random() * S.boardT, t: 0.12 });
      if (S.state === 'ready') { S.kx = cx + Math.sin(S.t * 1.6) * S.gw * 0.14; S.kAng = 0; S.kLift = 0; return; }
      const b = S.ball;
      if (S.state === 'fly') {
        S.ft += dt; const k = clamp(S.ft / S.dur, 0, 1);
        b.x = lerp(S.from.x, S.tx, k); b.gy = lerp(S.from.y, S.fy, k); // punto a terra sotto la palla
        b.y = lerp(S.from.y, S.ty, k) - Math.sin(Math.PI * k) * S.H * 0.05;
        b.s = lerp(1, 0.42, k); b.rot += dt * 16;
        b.trail.push({ x: b.x, y: b.y, s: b.s }); if (b.trail.length > 6) b.trail.shift();
        const dk = ease((S.ft - 0.1) / (S.dur - 0.05));
        S.kx = lerp(S.kx0, S.diveX, dk); S.kAng = lerp(0, S.diveAng, dk); S.kLift = lerp(0, S.diveLift, dk);
        if (k >= 1) {
          b.trail = [];
          if (S.save) {
            S.state = 'saved'; S.rt = 0; sfx.bounce(); sfx.oh();
            b.vx = (b.x < cx ? -1 : 1) * S.W * (0.3 + Math.random() * 0.3); b.vy = S.H * 0.45;
            say(['Parata! Riprova!', 'Il portiere l\'ha presa! Ancora!', 'Parata! Dai, tira ancora!'][rand(3)]);
          } else {
            S.state = 'goal'; S.rt = 0; S.cheer = 2.2; score++; showScore(); sfx.crowd(); sfx.win();
            confetti(30, ['⚽', '⭐', '🎉', '🏆']); bigText('GOL!');
            say(['Gol!', 'Che gol!', 'Goool! Bravissimo!'][rand(3)]);
            if (score % 5 === 0) setTimeout(() => { bigText('🏆'); confetti(50); }, 1200);
          }
        }
      } else if (S.state === 'saved') {
        S.rt += dt; b.vy += S.H * 1.5 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.gy = Math.max(b.gy, Math.min(b.y + S.R * b.s, S.H));
        b.s = Math.min(1, b.s + dt * 0.6); b.rot += dt * 10;
        if (S.rt > 1.6) next(S);
      } else if (S.state === 'goal') {
        S.rt += dt; if (S.rt < 0.25) { b.y -= dt * S.gh * 0.2; b.s = Math.max(0.38, b.s - dt * 0.2); }
        if (S.rt > 2) next(S);
      }
    },
    draw(S, c) {
      const { W, gx, gy, gw, gh, fy } = S;
      // sfondo pre-disegnato (tribune, cartelloni, prato)
      c.drawImage(S.bg, 0, 0, W, S.H);
      if (S.cheer > 0) {
        const jump = Math.floor(S.t * 9) % 2 ? S.crowdB : S.crowdA;
        c.drawImage(jump, 0, 0, W, S.H);
        c.fillStyle = '#fff';
        S.flashes.forEach(f => { c.globalAlpha = f.t / 0.12; c.beginPath(); c.arc(f.x, f.y, 3, 0, 7); c.fill(); });
        c.globalAlpha = 1;
      }
      const inGoal = S.state === 'goal';
      drawGoalNet(c, S, inGoal && S.rt < 0.7 ? Math.sin(S.rt * 18) * (1 - S.rt / 0.7) : 0);
      if (inGoal) drawBall(c, S, S.ball);
      drawGoalFrame(c, S);
      // portiere + ombra
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(S.kx, fy + 4, S.kh * 0.32, S.kh * 0.05, 0, 0, 7); c.fill();
      drawKeeperHD(c, S.kx, fy + 2, S.kh, S.kAng || 0, S.kLift || 0, S.t, S.ball.x, S.state);
      if (!inGoal) drawBall(c, S, S.ball);
      drawKickerLeg(c, S);
      if (S.shots === 0 && S.state === 'ready') drawHint(c, S.spot.x + S.R * 1.5, S.spot.y + S.R, S.W / 2 + gw * 0.3, gy + gh * 0.4, S.t, S.R * 2);
    },
    up(S, a, b) {
      if (S.state !== 'ready') return;
      const { gx, gy, gw, gh } = S, r = S.R * 0.45;
      let tx, ty;
      const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
      if (len < 20) {
        tx = b.x; ty = b.y < gy + gh * 1.6 ? b.y : gy + gh * (0.3 + Math.random() * 0.5);
      } else if (dy < 0) {
        const lineY = gy + gh * 0.6, k = (S.spot.y - lineY) / -dy;
        tx = S.spot.x + dx * k;
        ty = gy + gh - clamp(len / (S.H * 0.45), 0.25, 0.95) * gh;
      } else return;
      S.tx = clamp(tx, gx + r + 8, gx + gw - r - 8); S.ty = clamp(ty, gy + r + 8, gy + gh - r - 2);
      let p = streak >= 3 ? 0.45 : 0.3;
      if (lastSave) p = 0;
      S.save = Math.random() < p; lastSave = S.save; streak = S.save ? 0 : streak + 1;
      const side = S.tx < S.kx ? -1 : 1, reach = S.kh * 0.75;
      S.kx0 = S.kx;
      if (S.save) S.diveX = clamp(S.tx - side * reach * 0.35, gx + S.kh * 0.2, gx + gw - S.kh * 0.2);
      else if (Math.abs(S.tx - S.kx) < reach) S.diveX = clamp(S.kx - side * gw * 0.3, gx + S.kh * 0.2, gx + gw - S.kh * 0.2);
      else S.diveX = S.kx + (S.tx - S.kx) * 0.35;
      const dir = Math.sign(S.diveX - S.kx0) || side, far = Math.abs(S.diveX - S.kx0) > S.kh * 0.25;
      S.diveAng = far ? dir * 1.1 : 0;
      S.diveLift = S.save ? clamp((S.fy - S.ty) - S.kh * (far ? 0.25 : 0.85), 0, gh * 0.5) : (far ? gh * 0.1 : gh * 0.25);
      S.state = 'fly'; S.ft = 0; S.dur = 0.6; S.from = { x: S.ball.x, y: S.ball.y }; S.shots++; S.kick = 0.35;
      sfx.kick();
    },
  });
  function resetBall(S) { S.ball = { x: S.spot.x, y: S.spot.y, gy: S.spot.y, s: 1, rot: 0, trail: [] }; }
  function next(S) { S.state = 'ready'; resetBall(S); }
  repeatFn = () => say('Tira in porta! Striscia il dito verso la porta. Attento al portiere!');
  repeatFn();
}

/* ---- sfondo dello stadio, disegnato una volta sola ---- */
function buildBackground(S) {
  const d = Math.min(devicePixelRatio || 1, 2), W = S.W, H = S.H;
  const mk = () => { const cv = document.createElement('canvas'); cv.width = W * d; cv.height = H * d; const c = cv.getContext('2d'); c.scale(d, d); return [cv, c]; };
  const [bg, c] = mk();
  const { fy, boardT, boardB, gh } = S;
  // cielo serale
  let g = c.createLinearGradient(0, 0, 0, boardT); g.addColorStop(0, '#1b2a5c'); g.addColorStop(1, '#3b5bb5');
  c.fillStyle = g; c.fillRect(0, 0, W, boardT);
  // tribune: gradoni
  const top = Math.max(0, boardT - gh * 2.2);
  g = c.createLinearGradient(0, top, 0, boardT); g.addColorStop(0, '#2a3346'); g.addColorStop(1, '#46526b');
  c.fillStyle = g; c.fillRect(0, top, W, boardT - top);
  // tetto
  c.fillStyle = '#11151f'; c.fillRect(0, top - 14, W, 16);
  // fari
  for (const fx of [W * 0.08, W * 0.92]) {
    const ly = Math.max(10, top - 70);
    c.fillStyle = '#555'; c.fillRect(fx - 3, ly + 20, 6, top - ly - 20);
    c.fillStyle = '#eee'; c.fillRect(fx - 26, ly, 52, 24);
    const lg = c.createRadialGradient(fx, ly + 12, 2, fx, ly + 12, 90); lg.addColorStop(0, 'rgba(255,255,220,.9)'); lg.addColorStop(1, 'rgba(255,255,220,0)');
    c.fillStyle = lg; c.fillRect(fx - 90, ly - 80, 180, 180);
  }
  // pubblico (due versioni: seduto e in piedi che salta)
  const people = [];
  const rows = 9;
  for (let r = 0; r < rows; r++) {
    const y = lerp(top + 14, boardT - 8, (r + 0.5) / rows), sz = lerp(4, 8, r / rows);
    for (let x = sz; x < W; x += sz * 2.3) people.push({ x: x + (Math.random() - 0.5) * sz, y, sz, col: ['#e63946', '#f1faee', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#ff8c1a', '#2ecc40'][rand(8)], skin: ['#f5c9a0', '#d9a273', '#8d5524', '#ffdbac'][rand(4)] });
  }
  const crowd = (ctx, jump) => people.forEach((p, i) => {
    const up = jump && (i % 3 !== 0) ? p.sz * 0.9 : 0;
    ctx.fillStyle = p.col; ctx.fillRect(p.x - p.sz * 0.8, p.y - p.sz * 0.6 - up, p.sz * 1.6, p.sz * 1.6);
    ctx.fillStyle = p.skin; ctx.beginPath(); ctx.arc(p.x, p.y - p.sz * 1.2 - up, p.sz * 0.6, 0, 7); ctx.fill();
    if (jump && i % 2) { ctx.strokeStyle = p.skin; ctx.lineWidth = p.sz * 0.35; ctx.beginPath(); ctx.moveTo(p.x - p.sz * 0.7, p.y - p.sz * 0.5 - up); ctx.lineTo(p.x - p.sz, p.y - p.sz * 2 - up); ctx.moveTo(p.x + p.sz * 0.7, p.y - p.sz * 0.5 - up); ctx.lineTo(p.x + p.sz, p.y - p.sz * 2 - up); ctx.stroke(); }
  });
  crowd(c, false);
  // cartelloni a bordo campo (senza marche)
  const panels = ['#ff3b3b', '#2f5bff', '#ffd60a', '#2ecc40', '#9b4dff', '#ff8c1a'];
  const pw = W / 6;
  for (let i = 0; i < 6; i++) {
    g = c.createLinearGradient(0, boardT, 0, boardB); g.addColorStop(0, panels[i]); g.addColorStop(1, shade(panels[i], -40));
    c.fillStyle = g; c.fillRect(i * pw, boardT, pw, boardB - boardT);
    c.fillStyle = 'rgba(255,255,255,.9)'; c.font = `bold ${(boardB - boardT) * 0.6}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(['⚽', '★', 'GOL', '★', '⚽', '★'][i], i * pw + pw / 2, (boardT + boardB) / 2 + 1);
  }
  c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, boardB - 3, W, 3);
  // prato dietro la porta
  c.fillStyle = '#2f8f3a'; c.fillRect(0, boardB, W, fy - boardB);
  // prato in prospettiva a strisce
  const n = 10, f = i => fy + (H - fy) * Math.pow(i / n, 1.35);
  for (let i = 0; i < n; i++) {
    g = c.createLinearGradient(0, f(i), 0, f(i + 1));
    g.addColorStop(0, i % 2 ? '#3aa845' : '#45b851'); g.addColorStop(1, i % 2 ? '#37a141' : '#41b04c');
    c.fillStyle = g; c.fillRect(0, f(i), W, f(i + 1) - f(i) + 1);
  }
  // linee del campo in prospettiva
  const X = (xw, y) => W / 2 + xw * (1 + (y - fy) / (H - fy) * 1.7);
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 4; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(0, fy); c.lineTo(W, fy); c.stroke();
  const box = (half, depth) => { const y2 = fy + (H - fy) * depth; c.beginPath(); c.moveTo(X(-half, fy), fy); c.lineTo(X(-half, y2), y2); c.lineTo(X(half, y2), y2); c.lineTo(X(half, fy), fy); c.stroke(); };
  box(S.gw * 0.62, 0.14); box(S.gw * 0.98, 0.45);
  // dischetto
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(S.spot.x, S.spot.y + S.R * 0.95, 11, 5, 0, 0, 7); c.fill();
  // vignettatura leggera
  g = c.createRadialGradient(W / 2, H * 0.6, Math.min(W, H) * 0.3, W / 2, H * 0.6, Math.max(W, H) * 0.8);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.25)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  S.bg = bg;
  // livelli del pubblico che esulta
  const [a, ca] = mk(); ca.fillStyle = '#46526b'; ca.fillRect(0, top, W, boardT - top); crowd(ca, true); S.crowdA = a;
  const [b, cb] = mk(); cb.fillStyle = '#46526b'; cb.fillRect(0, top, W, boardT - top); crowd(cb, false); S.crowdB = b;
}
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16), f = v => clamp(v + amt, 0, 255);
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
}

/* ---- porta in 3D ---- */
function goalGeom(S) {
  const { gx, gy, gw, gh, fy } = S, inset = gw * 0.06;
  return { fl: gx, fr: gx + gw, ft: gy, fb: fy, bl: gx + inset, br: gx + gw - inset, bt: gy + gh * 0.1, bb: fy - gh * 0.16 };
}
function drawGoalNet(c, S, bulge) {
  const G = goalGeom(S);
  // ombra della porta sul prato
  c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(G.fl, G.fb - 2, G.fr - G.fl, 8);
  // fondo rete leggermente scuro
  c.fillStyle = 'rgba(255,255,255,.08)';
  c.beginPath(); c.moveTo(G.bl, G.bt); c.lineTo(G.br, G.bt); c.lineTo(G.br, G.bb); c.lineTo(G.bl, G.bb); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 1.3;
  const bx = (S.ball && S.ball.x) || S.W / 2, push = bulge * S.gh * 0.06;
  // rete di fondo (con rigonfiamento dove entra la palla)
  const cols = 22, rows = 9;
  for (let i = 0; i <= cols; i++) {
    const x = lerp(G.bl, G.br, i / cols), w = Math.exp(-Math.pow((x - bx) / (S.gw * 0.15), 2));
    c.beginPath(); c.moveTo(x, G.bt); c.quadraticCurveTo(x, (G.bt + G.bb) / 2 - push * w * 3, x, G.bb); c.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    const y = lerp(G.bt, G.bb, j / rows);
    c.beginPath(); c.moveTo(G.bl, y);
    for (let i = 1; i <= cols; i++) { const x = lerp(G.bl, G.br, i / cols), w = Math.exp(-Math.pow((x - bx) / (S.gw * 0.15), 2)); c.lineTo(x, y - push * w * 3 * Math.sin(Math.PI * j / rows)); }
    c.stroke();
  }
  // reti laterali e superiore
  c.strokeStyle = 'rgba(255,255,255,.55)';
  for (let k = 0; k <= 6; k++) {
    const t = k / 6;
    c.beginPath(); c.moveTo(G.fl, lerp(G.ft, G.fb, t)); c.lineTo(G.bl, lerp(G.bt, G.bb, t)); c.stroke();
    c.beginPath(); c.moveTo(G.fr, lerp(G.ft, G.fb, t)); c.lineTo(G.br, lerp(G.bt, G.bb, t)); c.stroke();
    c.beginPath(); c.moveTo(lerp(G.fl, G.bl, t), lerp(G.ft, G.bt, t)); c.lineTo(lerp(G.fl, G.bl, t), lerp(G.fb, G.bb, t)); c.stroke();
    c.beginPath(); c.moveTo(lerp(G.fr, G.br, t), lerp(G.ft, G.bt, t)); c.lineTo(lerp(G.fr, G.br, t), lerp(G.fb, G.bb, t)); c.stroke();
  }
  for (let i = 0; i <= 22; i++) { const x1 = lerp(G.fl, G.fr, i / 22), x2 = lerp(G.bl, G.br, i / 22); c.beginPath(); c.moveTo(x1, G.ft); c.lineTo(x2, G.bt); c.stroke(); }
  // pali posteriori
  c.strokeStyle = '#cfd6dd'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(G.fl, G.ft); c.lineTo(G.bl, G.bt); c.lineTo(G.bl, G.bb); c.lineTo(G.fl, G.fb);
  c.moveTo(G.fr, G.ft); c.lineTo(G.br, G.bt); c.lineTo(G.br, G.bb); c.lineTo(G.fr, G.fb); c.moveTo(G.bl, G.bt); c.lineTo(G.br, G.bt); c.stroke();
}
function drawGoalFrame(c, S) {
  const G = goalGeom(S), t = Math.max(9, S.gw * 0.02);
  const post = (x0, y0, x1, y1, vertical) => {
    const g = vertical ? c.createLinearGradient(x0 - t / 2, 0, x0 + t / 2, 0) : c.createLinearGradient(0, y0 - t / 2, 0, y0 + t / 2);
    g.addColorStop(0, '#b8c2cc'); g.addColorStop(0.35, '#ffffff'); g.addColorStop(1, '#9aa5b1');
    c.strokeStyle = g; c.lineWidth = t; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
  };
  post(G.fl, G.fb, G.fl, G.ft, true); post(G.fr, G.fb, G.fr, G.ft, true); post(G.fl, G.ft, G.fr, G.ft, false);
}

/* ---- pallone con ombreggiatura ---- */
function drawBall(c, S, b) {
  const R = S.R * b.s;
  // ombra a terra
  const gy = b.gy != null ? b.gy : b.y, hgt = Math.max(0, gy - b.y);
  c.fillStyle = `rgba(0,0,0,${0.3 * clamp(1 - hgt / S.H, 0.3, 1)})`;
  c.beginPath(); c.ellipse(b.x, gy + R * 0.9, R * 0.9, R * 0.25, 0, 0, 7); c.fill();
  // scia
  (b.trail || []).forEach((p, i) => { c.fillStyle = `rgba(255,255,255,${0.08 * (i + 1)})`; c.beginPath(); c.arc(p.x, p.y, S.R * p.s, 0, 7); c.fill(); });
  c.save(); c.translate(b.x, b.y);
  c.beginPath(); c.arc(0, 0, R, 0, 7); c.fillStyle = '#fff'; c.fill(); c.save(); c.clip();
  // pannelli che girano
  c.fillStyle = '#1d1d1d';
  const pent = (px, py, s, a) => { c.beginPath(); for (let i = 0; i < 5; i++) { const q = a + i * 2 * Math.PI / 5; c.lineTo(px + Math.cos(q) * s, py + Math.sin(q) * s); } c.closePath(); c.fill(); };
  const r0 = b.rot % (Math.PI * 2);
  const ox = Math.sin(r0) * R * 0.5;
  pent(ox, -Math.cos(r0 * 0.7) * R * 0.15, R * 0.34, r0);
  for (let i = 0; i < 5; i++) { const a = r0 + i * 2 * Math.PI / 5; pent(ox + Math.cos(a) * R * 0.95, Math.sin(a) * R * 0.95, R * 0.3, a + Math.PI); }
  // luce e ombra 3D
  const sh = c.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R);
  sh.addColorStop(0, 'rgba(255,255,255,.55)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.45)');
  c.fillStyle = sh; c.fillRect(-R, -R, R * 2, R * 2);
  c.restore();
  c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke();
  c.restore();
}

/* ---- piede di chi tira (dietro la palla) ---- */
function drawKickerLeg(c, S) {
  const R = S.R, k = S.kick > 0 ? Math.sin((1 - S.kick / 0.35) * Math.PI) : 0;
  const bx = S.spot.x - R * 1.75 + k * R * 1.3, by = S.spot.y + R * 0.6 - k * R * 0.7;
  const hx = bx - R * 1.6, hy = S.H + R * 0.4;
  // calzettone a righe
  c.lineCap = 'round'; c.strokeStyle = '#2f5bff'; c.lineWidth = R * 0.85;
  c.beginPath(); c.moveTo(hx, hy); c.lineTo(bx - R * 0.2, by - R * 0.35); c.stroke();
  c.strokeStyle = '#fff'; c.lineWidth = R * 0.18;
  for (const t of [0.35, 0.5]) {
    const px = lerp(hx, bx - R * 0.2, t), py = lerp(hy, by - R * 0.35, t), nx = (by - hy), ny = -(bx - hx), nl = Math.hypot(nx, ny);
    c.beginPath(); c.moveTo(px - nx / nl * R * 0.42, py - ny / nl * R * 0.42); c.lineTo(px + nx / nl * R * 0.42, py + ny / nl * R * 0.42); c.stroke();
  }
  // scarpa vista di lato, punta verso la palla
  c.save(); c.translate(bx, by); c.rotate(-0.15 - k * 0.3);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, R * 0.45, R * 0.9, R * 0.15, 0, 0, 7); c.fill();
  const sg = c.createLinearGradient(0, -R * 0.5, 0, R * 0.35); sg.addColorStop(0, '#ff6a4a'); sg.addColorStop(1, '#c0281a');
  c.fillStyle = sg; c.beginPath();
  c.moveTo(-R * 0.75, R * 0.3); c.lineTo(-R * 0.75, -R * 0.45); c.quadraticCurveTo(-R * 0.2, -R * 0.55, R * 0.2, -R * 0.2);
  c.quadraticCurveTo(R * 0.85, -R * 0.15, R * 0.9, R * 0.15); c.lineTo(R * 0.85, R * 0.3); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.fillRect(-R * 0.78, R * 0.22, R * 1.68, R * 0.14);
  c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(-R * 0.1, -R * 0.35); c.lineTo(R * 0.25, -R * 0.1); c.stroke();
  c.restore();
}

/* ---- portiere ---- */
function drawKeeperHD(c, x, footY, h, ang, lift, t, ballX, state) {
  const u = h / 10, bob = state === 'ready' ? Math.sin(t * 6) * u * 0.12 : 0;
  const jersey = '#ff8c1a', jersey2 = '#e0620b', stripe = '#222', glove = '#f5f5f5', skin = '#f2c29b';
  c.save(); c.translate(x, footY - lift - u * 3.6 + bob); c.rotate(ang);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const limb = (pts, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.stroke(); };
  // gambe (cosce nere, calzettoni arancioni, scarpe)
  for (const s of [-1, 1]) {
    limb([s * u * 0.7, u * 0.4, s * u * 1.3, u * 1.9], u * 1.25, '#1e1e1e');
    limb([s * u * 1.3, u * 1.9, s * u * 1.55, u * 3.3], u * 1.0, jersey);
    c.fillStyle = '#111'; c.beginPath(); c.ellipse(s * u * 1.75, u * 3.55, u * 0.75, u * 0.35, 0, 0, 7); c.fill();
  }
  // pantaloncini
  c.fillStyle = '#1e1e1e'; c.beginPath(); c.moveTo(-u * 1.5, -u * 0.2); c.lineTo(u * 1.5, -u * 0.2); c.lineTo(u * 1.9, u * 1.2); c.lineTo(u * 0.2, u * 1.2); c.lineTo(0, u * 0.6); c.lineTo(-u * 0.2, u * 1.2); c.lineTo(-u * 1.9, u * 1.2); c.closePath(); c.fill();
  // braccia (aperte, pronte a parare)
  const wave = state === 'ready' ? Math.sin(t * 3) * 0.15 : 0;
  for (const s of [-1, 1]) {
    const ex = s * u * 3.0, ey = -u * (4.1 + wave * s), hx = s * u * 3.6, hy = -u * (5.9 + wave * s);
    limb([s * u * 1.4, -u * 3.4, ex, ey], u * 1.05, jersey);
    limb([ex, ey, hx, hy], u * 0.95, jersey2);
    // guantone
    c.fillStyle = glove; c.strokeStyle = '#333'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(hx, hy - u * 0.25, u * 0.75, u * 0.9, s * 0.3, 0, 7); c.fill(); c.stroke();
    c.fillStyle = '#ff8c1a'; c.fillRect(hx - u * 0.6, hy + u * 0.35, u * 1.2, u * 0.3);
  }
  // maglia con sfumatura
  const jg = c.createLinearGradient(-u * 2, 0, u * 2, 0); jg.addColorStop(0, jersey2); jg.addColorStop(0.45, jersey); jg.addColorStop(1, jersey2);
  c.fillStyle = jg; c.beginPath();
  c.moveTo(-u * 1.9, -u * 3.7); c.quadraticCurveTo(0, -u * 4.1, u * 1.9, -u * 3.7);
  c.lineTo(u * 1.55, 0); c.lineTo(-u * 1.55, 0); c.closePath(); c.fill();
  c.fillStyle = stripe; c.fillRect(-u * 1.65, -u * 2.3, u * 3.3, u * 0.35);
  c.fillStyle = '#fff'; c.font = `bold ${u * 1.4}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1', 0, -u * 1.15);
  // collo e testa
  c.fillStyle = skin; c.fillRect(-u * 0.4, -u * 4.4, u * 0.8, u * 0.7);
  const hg = c.createRadialGradient(-u * 0.4, -u * 5.4, u * 0.2, 0, -u * 5.1, u * 1.4); hg.addColorStop(0, '#ffe0c4'); hg.addColorStop(1, skin);
  c.fillStyle = hg; c.beginPath(); c.arc(0, -u * 5.1, u * 1.25, 0, 7); c.fill();
  c.beginPath(); c.arc(-u * 1.2, -u * 5.0, u * 0.3, 0, 7); c.arc(u * 1.2, -u * 5.0, u * 0.3, 0, 7); c.fill();
  // capelli
  c.fillStyle = '#4a2c14'; c.beginPath(); c.arc(0, -u * 5.35, u * 1.3, Math.PI * 1.05, Math.PI * 1.95); c.quadraticCurveTo(u * 0.4, -u * 5.6, -u * 1.2, -u * 5.25); c.fill();
  // occhi che guardano la palla
  const look = clamp((ballX - x) / (u * 20), -1, 1) * u * 0.12;
  for (const s of [-1, 1]) {
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(s * u * 0.45, -u * 5.1, u * 0.26, u * 0.32, 0, 0, 7); c.fill();
    c.fillStyle = '#222'; c.beginPath(); c.arc(s * u * 0.45 + look, -u * 5.05, u * 0.15, 0, 7); c.fill();
    c.strokeStyle = '#4a2c14'; c.lineWidth = u * 0.12; c.beginPath(); c.moveTo(s * u * 0.2, -u * 5.55); c.lineTo(s * u * 0.7, -u * 5.5 + (s < 0 ? -u * 0.05 : -u * 0.05)); c.stroke();
  }
  // bocca
  c.strokeStyle = '#8a3b1d'; c.lineWidth = u * 0.13;
  if (state === 'fly' || state === 'saved') { c.fillStyle = '#8a3b1d'; c.beginPath(); c.ellipse(0, -u * 4.55, u * 0.25, u * 0.18, 0, 0, 7); c.fill(); }
  else { c.beginPath(); c.arc(0, -u * 4.75, u * 0.38, 0.3, Math.PI - 0.3); c.stroke(); }
  c.restore();
}

/* ---------- Avvio ---------- */
document.addEventListener('contextmenu', e => e.preventDefault());
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
show(home);
