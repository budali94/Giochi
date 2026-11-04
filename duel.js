'use strict';
/* =========================================================
   4. UNO CONTRO UNO — due porte, ognuno nella sua metà campo.
   Il bambino muove il suo campione con il dito, il computer comanda l'altro.
   ========================================================= */
const STARS = {
  messi: { name: 'Messi', h: 0.95, skin: '#ebb68c', hair: '#5a3a22', num: '10', kit: 'stripes', c1: '#7cc6ff', c2: '#ffffff', shorts: '#1b1b2a', socks: '#ffffff', numCol: '#1b1b2a' },
  ronaldo: { name: 'Ronaldo', h: 1.07, skin: '#d9a074', hair: '#141414', num: '7', kit: 'plain', c1: '#d6202a', c2: '#0b8a3e', shorts: '#0b8a3e', socks: '#d6202a', numCol: '#ffffff' },
};

function duel() {
  app.innerHTML = ''; scoreEl.textContent = '';
  const wrap = el('div', 'pick');
  ['messi', 'ronaldo'].forEach(id => {
    const b = el('button', 'pick-card');
    const cv = el('canvas'); b.appendChild(cv);
    b.appendChild(el('div', 'pick-name', STARS[id].name.toUpperCase()));
    b.onclick = () => { sfx.pop(); say(`Hai scelto ${STARS[id].name}! Fai gol nella porta a destra!`); show(() => { bar.hidden = false; duelMatch(id, id === 'messi' ? 'ronaldo' : 'messi'); }); };
    wrap.appendChild(b);
    requestAnimationFrame(() => {
      const d = Math.min(devicePixelRatio || 1, 2), w = cv.clientWidth, h = cv.clientHeight;
      cv.width = w * d; cv.height = h * d; const c = cv.getContext('2d'); c.scale(d, d);
      const g = c.createRadialGradient(w / 2, h * 0.45, 10, w / 2, h * 0.45, h * 0.7); g.addColorStop(0, '#ffffff'); g.addColorStop(1, id === 'messi' ? '#bfe5ff' : '#ffc9c9');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(0,0,0,.15)'; c.beginPath(); c.ellipse(w / 2, h * 0.92, w * 0.22, h * 0.03, 0, 0, 7); c.fill();
      drawStar(c, id, w / 2, h * 0.92, h * 0.82 / STARS[id].h, 0, id === 'messi' ? 1 : -1, false, 0);
    });
  });
  app.appendChild(wrap);
  repeatFn = () => say('Scegli il tuo campione! Messi o Ronaldo?');
  repeatFn();
}

function duelMatch(meId, cpuId) {
  const GOALS_TO_WIN = 5;
  let my = 0, cpu = 0;
  canvasGame({
    init(S) { S.state = 'play'; S.stateT = 0; S.moved = false; S.idle = 0; window.__duel = S; window.__score = () => [my, cpu]; },
    resize(S) {
      const { W, H } = S;
      const gd = Math.max(30, W * 0.05);
      const fw = W - gd * 2 - 16;
      const fh = Math.min(H - 110, fw * 0.55);
      const y1 = W > H ? H - 14 : Math.min(H - 14, (H + fh) / 2 + 60);
      S.F = { x0: (W - fw) / 2, x1: (W + fw) / 2, y1, y0: y1 - fh, w: fw, h: fh, gd };
      S.F.mid = (S.F.x0 + S.F.x1) / 2; S.F.cy = (S.F.y0 + S.F.y1) / 2; S.F.mouth = fh * 0.22;
      S.br = fh * 0.045; S.pr = fh * 0.085; S.ch = fh * 0.4;
      buildDuelBg(S);
      if (!S.ball) kickoff(S);
    },
    update(S, dt) {
      const F = S.F;
      S.stateT += dt;
      if (S.state === 'goal') { if (S.stateT > 2) { S.state = 'play'; kickoff(S); } animate(S, dt); return; }
      if (S.state === 'end') { if (S.stateT > 5) { my = 0; cpu = 0; S.state = 'play'; kickoff(S); } animate(S, dt); return; }
      // giocatore: va verso il dito
      moveTo(S.me, S.target || S.me, F.w * 0.6, dt);
      clampHalf(S, S.me, true);
      // computer: facile, lento, ogni tanto ci pensa su
      S.aiT -= dt;
      if (S.aiT <= 0) {
        S.aiT = 0.25 + Math.random() * 0.2;
        const b = S.ball;
        if (b.x > F.mid - S.pr * 0.5) S.aiTarget = { x: b.x + S.pr * 0.9, y: b.y + (Math.random() - 0.5) * S.pr * 0.6 };
        else S.aiTarget = { x: F.x1 - F.w * 0.12, y: lerp(F.cy, b.y, 0.55) };
      }
      moveTo(S.cpu, S.aiTarget, F.w * 0.3, dt);
      clampHalf(S, S.cpu, false);
      // pallone
      const b = S.ball;
      b.x += b.vx * dt; b.y += b.vy * dt;
      const fr = Math.exp(-0.9 * dt); b.vx *= fr; b.vy *= fr;
      b.rot += Math.hypot(b.vx, b.vy) * dt / S.br * (b.vx >= 0 ? 1 : -1);
      if (b.y - S.br < F.y0) { b.y = F.y0 + S.br; b.vy = Math.abs(b.vy) * 0.8; sfx.bounce(); }
      if (b.y + S.br > F.y1) { b.y = F.y1 - S.br; b.vy = -Math.abs(b.vy) * 0.8; sfx.bounce(); }
      const inMouth = Math.abs(b.y - F.cy) < F.mouth - S.br * 0.5;
      if (b.x - S.br < F.x0 && !inMouth) { b.x = F.x0 + S.br; b.vx = Math.abs(b.vx) * 0.8; sfx.bounce(); }
      if (b.x + S.br > F.x1 && !inMouth) { b.x = F.x1 - S.br; b.vx = -Math.abs(b.vx) * 0.8; sfx.bounce(); }
      if (b.x < F.x0 - S.br) return goal(S, false);
      if (b.x > F.x1 + S.br) return goal(S, true);
      kick(S, S.me, true); kick(S, S.cpu, false);
      // se il bambino non tocca niente per un po', un piccolo aiuto
      const sp = Math.hypot(b.vx, b.vy);
      S.idle = sp < 20 && b.x < F.mid ? S.idle + dt : 0;
      if (S.idle > 6) { S.idle = 0; say('Vai verso la palla!'); }
      animate(S, dt);
    },
    draw(S, c) {
      const F = S.F;
      c.drawImage(S.bg, 0, 0, S.W, S.H);
      // giocatori e palla in ordine di profondità
      const items = [
        { y: S.me.y, f: () => drawPlayer(c, S, S.me) },
        { y: S.cpu.y, f: () => drawPlayer(c, S, S.cpu) },
        { y: S.ball.y, f: () => drawBall(c, { R: S.br, H: S.H }, { x: S.ball.x, y: S.ball.y - S.br * 0.6, gy: S.ball.y - S.br * 0.6, s: 1, rot: S.ball.rot, trail: [] }) },
      ].sort((a, b) => a.y - b.y);
      items.forEach(i => i.f());
      // pali davanti (porte)
      drawDuelPosts(c, S);
      // tabellone
      drawScoreboard(c, S, my, cpu);
      if (!S.moved && S.state === 'play') drawHint(c, S.me.x + S.pr, S.me.y, S.ball.x - S.br, S.ball.y, S.t, S.pr * 2.2);
      if (S.state === 'end') {
        c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, 0, S.W, S.H);
        const win = my > cpu ? S.me : S.cpu;
        drawStar(c, win.id, S.W / 2, S.H * 0.82, S.H * 0.55 / STARS[win.id].h, S.t, 1, false, 0, Math.abs(Math.sin(S.t * 6)) * S.H * 0.04);
        c.font = `${S.H * 0.18}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('🏆', S.W / 2 + S.H * 0.25, S.H * 0.45);
      }
    },
    down(S, p) { S.target = p; S.moved = true; },
    move(S, p) { S.target = p; },
  });

  function kickoff(S) {
    const F = S.F;
    S.ball = { x: F.mid, y: F.cy, vx: 0, vy: 0, rot: 0 };
    S.me = { id: meId, x: F.x0 + F.w * 0.22, y: F.cy, vx: 0, vy: 0, cool: 0, kickT: 0, run: 0, face: 1, jump: 0 };
    S.cpu = { id: cpuId, x: F.x1 - F.w * 0.22, y: F.cy, vx: 0, vy: 0, cool: 0, kickT: 0, run: 0, face: -1, jump: 0 };
    S.target = null; S.aiT = 0.6; S.aiTarget = { x: S.cpu.x, y: S.cpu.y };
  }
  function moveTo(p, t, speed, dt) {
    const dx = t.x - p.x, dy = t.y - p.y, d = Math.hypot(dx, dy);
    const step = Math.min(d, speed * dt);
    p.vx = d > 1 ? dx / d * step / dt : 0; p.vy = d > 1 ? dy / d * step / dt : 0;
    if (d > 1) { p.x += dx / d * step; p.y += dy / d * step; }
  }
  function clampHalf(S, p, left) {
    const F = S.F;
    p.x = left ? clamp(p.x, F.x0 + S.pr * 0.5, F.mid - S.pr * 0.15) : clamp(p.x, F.mid + S.pr * 0.15, F.x1 - S.pr * 0.5);
    p.y = clamp(p.y, F.y0 + S.pr * 0.4, F.y1 - S.pr * 0.3);
  }
  function kick(S, p, isMe) {
    const b = S.ball, F = S.F;
    p.cool -= 1 / 60;
    const dx = b.x - p.x, dy = b.y - p.y, d = Math.hypot(dx, dy), min = S.pr + S.br;
    if (d >= min || d === 0) return;
    const nx = dx / d, ny = dy / d;
    b.x = p.x + nx * min; b.y = p.y + ny * min;
    if (p.cool > 0) return;
    p.cool = 0.25; p.kickT = 0.25;
    // direzione: verso la porta avversaria, con un aiutino per il bambino
    const gx = isMe ? F.x1 + F.gd : F.x0 - F.gd;
    const gy = isMe ? F.cy + (Math.random() - 0.5) * F.mouth * 0.8 : F.cy + (S.me.y < F.cy ? 1 : -1) * F.mouth * (0.35 + Math.random() * 0.4);
    let tx = gx - b.x, ty = gy - b.y; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
    const mix = isMe ? 0.7 : 0.6;
    let dx2 = lerp(nx, tx, mix), dy2 = lerp(ny, ty, mix);
    if (isMe && dx2 < 0.35) dx2 = 0.35;
    if (!isMe && dx2 > -0.25) dx2 = -0.25;
    const l = Math.hypot(dx2, dy2);
    const sp = (isMe ? F.w * 0.95 : F.w * 0.8) * (0.85 + Math.random() * 0.3);
    b.vx = dx2 / l * sp + p.vx * 0.3; b.vy = dy2 / l * sp + p.vy * 0.3;
    sfx.kick();
  }
  function goal(S, mine) {
    S.state = 'goal'; S.stateT = 0;
    const scorer = mine ? S.me : S.cpu;
    scorer.jump = 2;
    if (mine) { my++; sfx.crowd(); sfx.win(); confetti(30, ['⚽', '⭐', '🎉']); bigText('GOL!'); }
    else { cpu++; sfx.oh(); }
    const n = STARS[scorer.id].name;
    if (my >= GOALS_TO_WIN || cpu >= GOALS_TO_WIN) {
      S.state = 'end'; S.stateT = 0;
      if (my > cpu) { setTimeout(() => { sfx.win(); confetti(60); }, 300); say(`Gol! Hai vinto! ${n} campione!`); }
      else say(`Gol di ${n}. Ha vinto ${n}! Dai, la rivincita!`);
      return;
    }
    say(mine ? ['Gol di ' + n + '!', 'Che gol! ' + n + '!', 'Gooool!'][rand(3)] : `Gol di ${n}! Dai, rispondi!`);
  }
  function animate(S, dt) {
    for (const p of [S.me, S.cpu]) {
      const sp = Math.hypot(p.vx, p.vy);
      if (sp > 15) p.run += dt * 12;
      p.kickT = Math.max(0, p.kickT - dt);
      p.jump = Math.max(0, p.jump - dt);
      p.moving = sp > 15;
    }
  }
  function drawPlayer(c, S, p) {
    const lift = p.jump > 0 ? Math.abs(Math.sin(p.jump * 9)) * S.ch * 0.18 : 0;
    c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(p.x, p.y, S.pr * 1.05, S.pr * 0.35, 0, 0, 7); c.fill();
    drawStar(c, p.id, p.x, p.y, S.ch, p.run, p.face, p.moving, p.kickT, lift, S.ball.x, S.ball.y);
  }
  repeatFn = () => say(`Porta la palla nella porta a destra! Muovi ${STARS[meId].name} con il dito.`);
}

/* ---- campo, pubblico e porte (disegnati una volta) ---- */
function buildDuelBg(S) {
  const d = Math.min(devicePixelRatio || 1, 2), W = S.W, H = S.H, F = S.F;
  const cv = document.createElement('canvas'); cv.width = W * d; cv.height = H * d;
  const c = cv.getContext('2d'); c.scale(d, d);
  // cielo e tribune
  let g = c.createLinearGradient(0, 0, 0, F.y0); g.addColorStop(0, '#1b2a5c'); g.addColorStop(1, '#46526b');
  c.fillStyle = g; c.fillRect(0, 0, W, F.y0);
  const rows = Math.max(3, Math.floor((F.y0 - 10) / 16));
  for (let r = 0; r < rows; r++) {
    const y = F.y0 - 10 - r * 16, sz = Math.max(3, 6.5 - r * 0.25);
    for (let x = sz; x < W; x += sz * 2.4) {
      c.fillStyle = ['#e63946', '#f1faee', '#ffd166', '#06d6a0', '#118ab2', '#ef476f', '#7cc6ff', '#d6202a'][rand(8)];
      c.fillRect(x - sz * 0.8, y - sz * 0.5, sz * 1.6, sz * 1.5);
      c.fillStyle = ['#f5c9a0', '#d9a273', '#8d5524', '#ffdbac'][rand(4)];
      c.beginPath(); c.arc(x, y - sz * 1.1, sz * 0.6, 0, 7); c.fill();
    }
  }
  // cartelloni
  const bh = Math.min(26, F.h * 0.06), cols = ['#ff3b3b', '#2f5bff', '#ffd60a', '#2ecc40', '#9b4dff', '#ff8c1a'];
  for (let i = 0; i < 6; i++) { c.fillStyle = cols[i]; c.fillRect(i * W / 6, F.y0 - bh - 4, W / 6, bh); }
  // prato a strisce verticali
  c.fillStyle = '#2f8f3a'; c.fillRect(0, F.y0 - 4, W, H - F.y0 + 4);
  const n = 12;
  for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#3aa845' : '#45b851'; c.fillRect(F.x0 + F.w * i / n, F.y0, F.w / n + 1, F.h); }
  // linee
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 3;
  c.strokeRect(F.x0, F.y0, F.w, F.h);
  c.beginPath(); c.moveTo(F.mid, F.y0); c.lineTo(F.mid, F.y1); c.stroke();
  c.beginPath(); c.arc(F.mid, F.cy, F.h * 0.18, 0, 7); c.stroke();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(F.mid, F.cy, 4, 0, 7); c.fill();
  for (const s of [-1, 1]) {
    const gx = s < 0 ? F.x0 : F.x1, bw = F.w * 0.13, bh2 = F.h * 0.62;
    c.strokeRect(s < 0 ? gx : gx - bw, F.cy - bh2 / 2, bw, bh2);
    c.beginPath(); c.arc(gx - s * bw, F.cy, F.h * 0.12, s < 0 ? -Math.PI / 2 : Math.PI / 2, s < 0 ? Math.PI / 2 : Math.PI * 1.5); c.stroke();
  }
  // reti delle porte
  for (const s of [-1, 1]) {
    const gx = s < 0 ? F.x0 - F.gd : F.x1, top = F.cy - F.mouth, h = F.mouth * 2;
    c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(gx, top, F.gd, h);
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2;
    for (let x = 0; x <= F.gd; x += F.gd / 5) { c.beginPath(); c.moveTo(gx + x, top); c.lineTo(gx + x, top + h); c.stroke(); }
    for (let y = 0; y <= h; y += h / 10) { c.beginPath(); c.moveTo(gx, top + y); c.lineTo(gx + F.gd, top + y); c.stroke(); }
  }
  S.bg = cv;
}
function drawDuelPosts(c, S) {
  const F = S.F, t = Math.max(6, F.h * 0.018);
  c.lineCap = 'round';
  for (const s of [-1, 1]) {
    const gx = s < 0 ? F.x0 : F.x1, back = gx + s * F.gd;
    c.strokeStyle = '#e8edf2'; c.lineWidth = t;
    c.beginPath(); c.moveTo(gx, F.cy - F.mouth); c.lineTo(back, F.cy - F.mouth); c.lineTo(back, F.cy + F.mouth); c.lineTo(gx, F.cy + F.mouth); c.stroke();
    c.fillStyle = '#fff'; for (const y of [F.cy - F.mouth, F.cy + F.mouth]) { c.beginPath(); c.arc(gx, y, t * 0.9, 0, 7); c.fill(); }
  }
}
function drawScoreboard(c, S, a, b) {
  const w = Math.min(360, S.W * 0.42), h = 54, x = (S.W - w) / 2, y = 86;
  c.fillStyle = 'rgba(10,15,30,.85)'; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 14) : c.rect(x, y, w, h); c.fill();
  c.strokeStyle = '#ffd60a'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#fff'; c.font = `bold ${h * 0.62}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(`${a} - ${b}`, S.W / 2, y + h / 2 + 2);
  // mini facce dei due campioni
  drawHead(c, S.me.id, x + h * 0.6, y + h / 2, h * 0.36);
  drawHead(c, S.cpu.id, x + w - h * 0.6, y + h / 2, h * 0.36);
}

/* ---- caricature ---- */
function drawHead(c, id, x, y, r, lookX = 0) {
  const P = STARS[id];
  c.save(); c.translate(x, y);
  const sk = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r * 1.1); sk.addColorStop(0, shade(P.skin, 30)); sk.addColorStop(1, P.skin);
  // orecchie
  c.fillStyle = P.skin; c.beginPath(); c.ellipse(-r * 0.98, r * 0.05, r * 0.2, r * 0.28, 0, 0, 7); c.ellipse(r * 0.98, r * 0.05, r * 0.2, r * 0.28, 0, 0, 7); c.fill();
  c.fillStyle = sk; c.beginPath(); c.ellipse(0, 0, r, r * 1.05, 0, 0, 7); c.fill();
  if (id === 'messi') {
    // barba piena
    c.fillStyle = P.hair; c.beginPath();
    c.moveTo(-r * 0.97, -r * 0.05); c.quadraticCurveTo(-r * 0.95, r * 1.0, 0, r * 1.12); c.quadraticCurveTo(r * 0.95, r * 1.0, r * 0.97, -r * 0.05);
    c.lineTo(r * 0.8, r * 0.1); c.quadraticCurveTo(r * 0.55, r * 0.45, r * 0.3, r * 0.38); c.quadraticCurveTo(0, r * 0.28, -r * 0.3, r * 0.38); c.quadraticCurveTo(-r * 0.55, r * 0.45, -r * 0.8, r * 0.1); c.closePath(); c.fill();
    // capelli corti con riga
    c.beginPath(); c.moveTo(-r * 1.0, -r * 0.1); c.quadraticCurveTo(-r * 1.05, -r * 1.05, -r * 0.1, -r * 1.12); c.quadraticCurveTo(r * 1.0, -r * 1.15, r * 1.0, -r * 0.15);
    c.quadraticCurveTo(r * 0.8, -r * 0.65, r * 0.1, -r * 0.6); c.quadraticCurveTo(-r * 0.6, -r * 0.62, -r * 0.82, -r * 0.3); c.closePath(); c.fill();
    // bocca sorridente nella barba
    c.fillStyle = '#c45a4a'; c.beginPath(); c.ellipse(0, r * 0.5, r * 0.22, r * 0.12, 0, 0, Math.PI); c.fill();
  } else {
    // capelli neri con ciuffo alzato
    c.fillStyle = P.hair; c.beginPath();
    c.moveTo(-r * 0.98, -r * 0.15); c.quadraticCurveTo(-r * 1.05, -r * 0.95, -r * 0.4, -r * 1.12);
    c.quadraticCurveTo(-r * 0.1, -r * 1.55, r * 0.45, -r * 1.42); c.quadraticCurveTo(r * 0.3, -r * 1.25, r * 0.6, -r * 1.05);
    c.quadraticCurveTo(r * 1.05, -r * 0.85, r * 0.98, -r * 0.15);
    c.quadraticCurveTo(r * 0.85, -r * 0.6, r * 0.2, -r * 0.62); c.quadraticCurveTo(-r * 0.6, -r * 0.6, -r * 0.85, -r * 0.35); c.closePath(); c.fill();
    // mento deciso e sorrisone con i denti
    c.strokeStyle = shade(P.skin, -35); c.lineWidth = r * 0.05; c.beginPath(); c.arc(0, r * 0.85, r * 0.18, 0.4, Math.PI - 0.4); c.stroke();
    c.fillStyle = '#fff'; c.strokeStyle = '#7a2b1e'; c.lineWidth = r * 0.06;
    c.beginPath(); c.moveTo(-r * 0.38, r * 0.38); c.quadraticCurveTo(0, r * 0.82, r * 0.38, r * 0.38); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(-r * 0.34, r * 0.46); c.lineTo(r * 0.34, r * 0.46); c.stroke();
  }
  // occhi e sopracciglia
  const lx = clamp(lookX, -1, 1) * r * 0.08;
  for (const s of [-1, 1]) {
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(s * r * 0.36, -r * 0.12, r * 0.17, r * 0.21, 0, 0, 7); c.fill();
    c.fillStyle = '#3b2412'; c.beginPath(); c.arc(s * r * 0.36 + lx, -r * 0.1, r * 0.1, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(s * r * 0.36 + lx + r * 0.03, -r * 0.14, r * 0.035, 0, 7); c.fill();
    c.strokeStyle = P.hair; c.lineWidth = r * (id === 'ronaldo' ? 0.11 : 0.08); c.lineCap = 'round';
    c.beginPath(); c.moveTo(s * r * 0.18, -r * 0.4); c.quadraticCurveTo(s * r * 0.38, -r * (id === 'ronaldo' ? 0.55 : 0.47), s * r * 0.56, -r * 0.4); c.stroke();
  }
  // naso
  c.strokeStyle = shade(P.skin, -45); c.lineWidth = r * 0.06; c.beginPath(); c.moveTo(0, -r * 0.02); c.quadraticCurveTo(r * 0.12, r * 0.18, -r * 0.04, r * 0.22); c.stroke();
  c.restore();
}
function drawStar(c, id, x, footY, h, phase, face, moving, kickT, lift = 0, ballX, ballY) {
  const P = STARS[id], H = h * P.h, u = H / 10;
  c.save(); c.translate(x, footY - lift);
  c.lineCap = 'round'; c.lineJoin = 'round';
  const sw = moving ? Math.sin(phase) : 0;
  // gambe
  for (const s of [-1, 1]) {
    let fx = s * u * 0.9 + sw * s * u * 0.7, fy = -(moving ? Math.max(0, sw * s) * u * 0.5 : 0);
    if (kickT > 0 && s === face) { fx = face * u * 2.2; fy = -u * 1.1; }
    const hx = s * u * 0.75, hy = -u * 2.5;
    c.strokeStyle = P.skin; c.lineWidth = u * 0.95; c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx * 0.9, fy - u * 0.4); c.stroke();
    c.strokeStyle = P.socks; c.lineWidth = u * 1.0; c.beginPath(); c.moveTo(lerp(hx, fx, 0.55), lerp(hy, fy, 0.55)); c.lineTo(fx * 0.95, fy - u * 0.35); c.stroke();
    c.fillStyle = '#151515'; c.beginPath(); c.ellipse(fx + face * u * 0.25, fy - u * 0.15, u * 0.75, u * 0.35, 0, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.fillRect(fx + face * u * 0.25 - u * 0.6, fy - u * 0.02, u * 1.2, u * 0.12);
  }
  // pantaloncini
  c.fillStyle = P.shorts; c.beginPath(); c.moveTo(-u * 1.55, -u * 3.3); c.lineTo(u * 1.55, -u * 3.3); c.lineTo(u * 1.8, -u * 1.9); c.lineTo(u * 0.2, -u * 1.9); c.lineTo(0, -u * 2.4); c.lineTo(-u * 0.2, -u * 1.9); c.lineTo(-u * 1.8, -u * 1.9); c.closePath(); c.fill();
  // braccia (oscillano correndo)
  for (const s of [-1, 1]) {
    const hx = s * u * 2.3 - sw * s * u * 0.5, hy = -u * 3.6;
    c.strokeStyle = P.kit === 'stripes' ? P.c1 : P.c1; c.lineWidth = u * 0.95; c.beginPath(); c.moveTo(s * u * 1.5, -u * 5.4); c.lineTo(s * u * 2.0, -u * 4.6); c.stroke();
    c.strokeStyle = P.skin; c.lineWidth = u * 0.8; c.beginPath(); c.moveTo(s * u * 2.0, -u * 4.6); c.lineTo(hx, hy); c.stroke();
  }
  // maglia
  c.save();
  c.beginPath(); c.moveTo(-u * 1.75, -u * 5.7); c.quadraticCurveTo(0, -u * 6.0, u * 1.75, -u * 5.7); c.lineTo(u * 1.6, -u * 3.1); c.lineTo(-u * 1.6, -u * 3.1); c.closePath();
  c.fillStyle = P.c1; c.fill(); c.clip();
  if (P.kit === 'stripes') { c.fillStyle = P.c2; for (let i = -2; i <= 2; i += 2) c.fillRect(i * u * 0.45 - u * 0.22 + u * 0.45, -u * 6, u * 0.45, u * 3); }
  else { c.fillStyle = P.c2; c.fillRect(-u * 1.8, -u * 5.75, u * 3.6, u * 0.35); }
  const sh = c.createLinearGradient(-u * 1.7, 0, u * 1.7, 0); sh.addColorStop(0, 'rgba(0,0,0,.18)'); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)');
  c.fillStyle = sh; c.fillRect(-u * 2, -u * 6, u * 4, u * 3);
  c.restore();
  c.fillStyle = P.numCol; c.strokeStyle = P.kit === 'stripes' ? '#fff' : 'rgba(0,0,0,.3)'; c.lineWidth = u * 0.12;
  c.font = `900 ${u * 1.5}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.strokeText(P.num, 0, -u * 4.3); c.fillText(P.num, 0, -u * 4.3);
  // testa grande (caricatura)
  const look = ballX != null ? (ballX - x) / (h * 3) : face * 0.6;
  drawHead(c, id, 0, -u * 7.7, u * 2.15, look);
  c.restore();
}
