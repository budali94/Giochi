'use strict';
/* Altre schede da colorare. Ogni disegno: zone colorabili (r), dalla più lontana alla più vicina, + linee decorative. */
(() => {
  const star = (cx, cy, R, r = R * 0.45, n = 5) => {
    const p = [];
    for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, k = i % 2 ? r : R; p.push((cx + Math.cos(a) * k).toFixed(1) + ',' + (cy + Math.sin(a) * k).toFixed(1)); }
    return `<polygon points="${p.join(' ')}"/>`;
  };
  const pent = (cx, cy, r, rot = 0) => {
    const p = [];
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + rot + i * 2 * Math.PI / 5; p.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1)); }
    return `<polygon points="${p.join(' ')}"/>`;
  };
  // criniera / nuvola "a petali"
  const scallop = (cx, cy, r, n, bump) => {
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = i * 2 * Math.PI / n, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
      if (i === 0) d += `M${x.toFixed(1)} ${y.toFixed(1)}`;
      else d += `A${bump} ${bump} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
    }
    return `<path d="${d}Z"/>`;
  };
  const cloud = (x, y, s = 1) => `<path d="M${x} ${y} a${18 * s} ${18 * s} 0 0 1 ${16 * s}-${28 * s} a${24 * s} ${24 * s} 0 0 1 ${44 * s}-${8 * s} a${20 * s} ${20 * s} 0 0 1 ${28 * s} ${36 * s} z"/>`;
  const BG = '<rect x="0" y="0" width="400" height="400"/>';

  window.EXTRA_PICTURES = [
    /* ---------------- SPORT ---------------- */
    { id: 'pallone', r: [
      BG,
      '<rect x="0" y="300" width="400" height="100"/>',
      '<circle cx="200" cy="215" r="125"/>',
      pent(200, 215, 34),
      pent(200, 120, 26, Math.PI), pent(290, 185, 26, Math.PI), pent(256, 292, 26, Math.PI), pent(144, 292, 26, Math.PI), pent(110, 185, 26, Math.PI),
    ], lines: '<path d="M200 181V146M232 204L265 193M220 243L241 270M180 243L159 270M168 204L135 193"/><path d="M30 330q10-20 20 0M350 340q10-20 20 0"/>' },

    { id: 'basket', r: [
      BG,
      '<rect x="0" y="330" width="400" height="70"/>',
      '<rect x="300" y="60" width="18" height="280"/>',
      '<rect x="190" y="40" width="130" height="95" rx="6"/>',
      '<rect x="225" y="70" width="60" height="45"/>',
      '<rect x="160" y="125" width="110" height="12" rx="6"/>',
      '<circle cx="120" cy="260" r="70"/>',
    ], lines: '<path d="M168 137l14 55M200 137v55M232 137v55M262 137l-14 55M178 160h76M184 185h64"/><path d="M50 260h140M120 190v140M70 210q30 50 0 100M170 210q-30 50 0 100"/>' },

    { id: 'coppa', r: [
      BG,
      star(60, 70, 22), star(340, 60, 18), star(330, 300, 22), star(70, 290, 16),
      '<path d="M120 110 Q 60 110 70 170 Q 80 210 140 215 L 142 195 Q 95 190 92 165 Q 88 130 122 132 Z"/>',
      '<path d="M280 110 Q 340 110 330 170 Q 320 210 260 215 L 258 195 Q 305 190 308 165 Q 312 130 278 132 Z"/>',
      '<path d="M115 90 H 285 Q 285 230 200 250 Q 115 230 115 90 Z"/>',
      '<rect x="105" y="78" width="190" height="20" rx="6"/>',
      star(200, 160, 34),
      '<rect x="185" y="247" width="30" height="42"/>',
      '<rect x="150" y="285" width="100" height="25" rx="6"/>',
      '<rect x="120" y="308" width="160" height="50" rx="8"/>',
    ], lines: '' },

    { id: 'maglia', r: [
      BG,
      '<path d="M140 60 L 100 75 L 40 130 L 80 185 L 115 160 L 115 350 L 285 350 L 285 160 L 320 185 L 360 130 L 300 75 L 260 60 Q 200 100 140 60 Z"/>',
      '<path d="M140 60 Q 200 108 260 60 L 246 55 Q 200 90 154 55 Z"/>',
      '<polygon points="40,130 80,185 93,175 53,120"/>',
      '<polygon points="360,130 320,185 307,175 347,120"/>',
      '<rect x="115" y="320" width="170" height="30"/>',
      '<path d="M150 175 L 175 160 H 185 V 280 H 165 V 185 Z"/>',
      '<path fill-rule="evenodd" clip-rule="evenodd" d="M240 160 a40 60 0 1 0 0.1 0 Z M240 182 a18 38 0 1 0 0.1 0 Z"/>',
    ], lines: '' },

    { id: 'porta', r: [
      BG,
      '<rect x="0" y="250" width="400" height="150"/>',
      '<rect x="60" y="90" width="280" height="160"/>',
      '<rect x="48" y="80" width="304" height="14" rx="6"/>',
      '<rect x="48" y="80" width="14" height="172" rx="6"/>',
      '<rect x="338" y="80" width="14" height="172" rx="6"/>',
      '<circle cx="230" cy="320" r="45"/>',
      pent(230, 320, 15),
    ], lines: '<path d="M100 94v156M140 94v156M180 94v156M220 94v156M260 94v156M300 94v156M62 130h276M62 170h276M62 210h276"/><path d="M20 300h360"/>' },

    /* ---------------- ANIMALI ---------------- */
    { id: 'cane', r: [
      BG,
      '<rect x="0" y="330" width="400" height="70"/>',
      '<circle cx="70" cy="320" r="24"/>',
      '<path d="M290 280 Q 345 250 335 200 Q 360 250 300 302 Z"/>',
      '<ellipse cx="240" cy="285" rx="78" ry="55"/>',
      '<ellipse cx="258" cy="268" rx="24" ry="17"/>',
      '<ellipse cx="290" cy="322" rx="34" ry="18"/>',
      '<rect x="172" y="285" width="30" height="62" rx="13"/>',
      '<rect x="210" y="292" width="30" height="55" rx="13"/>',
      '<circle cx="175" cy="185" r="62"/>',
      '<path d="M130 145 Q 92 165 106 238 Q 132 232 142 190 Z"/>',
      '<path d="M220 145 Q 258 165 244 238 Q 218 232 208 190 Z"/>',
      '<ellipse cx="175" cy="217" rx="32" ry="23"/>',
      '<ellipse cx="175" cy="203" rx="12" ry="9"/>',
      '<circle cx="152" cy="172" r="8"/>',
      '<circle cx="198" cy="172" r="8"/>',
      '<path d="M138 240 Q 175 258 212 240 L 212 254 Q 175 272 138 254 Z"/>',
      '<circle cx="175" cy="272" r="9"/>',
    ], lines: '<path d="M175 212v10M163 226q12 8 24 0"/>' },

    { id: 'leone', r: [
      BG,
      '<rect x="0" y="340" width="400" height="60"/>',
      scallop(200, 195, 128, 16, 26),
      '<circle cx="138" cy="128" r="24"/>', '<circle cx="262" cy="128" r="24"/>',
      '<circle cx="138" cy="128" r="11"/>', '<circle cx="262" cy="128" r="11"/>',
      '<circle cx="200" cy="200" r="80"/>',
      '<ellipse cx="200" cy="238" rx="42" ry="30"/>',
      '<path d="M184 214 h32 l-16 17 z"/>',
      '<circle cx="171" cy="186" r="10"/>', '<circle cx="229" cy="186" r="10"/>',
    ], lines: '<path d="M200 231v12M184 251q16 11 32 0"/><circle cx="182" cy="240" r="2"/><circle cx="218" cy="240" r="2"/><path d="M60 360q10-20 20 0M320 365q10-20 20 0"/>' },

    { id: 'elefante', r: [
      BG,
      '<rect x="0" y="335" width="400" height="65"/>',
      '<circle cx="345" cy="60" r="30"/>',
      '<rect x="150" y="265" width="40" height="82" rx="10"/>',
      '<rect x="292" y="265" width="40" height="82" rx="10"/>',
      '<ellipse cx="240" cy="235" rx="112" ry="78"/>',
      '<rect x="198" y="282" width="38" height="65" rx="10"/>',
      '<rect x="250" y="282" width="38" height="65" rx="10"/>',
      '<circle cx="356" cy="290" r="9"/>',
      '<circle cx="125" cy="190" r="62"/>',
      '<path d="M78 205 Q 52 262 66 325 Q 80 342 96 324 Q 90 272 110 230 Z"/>',
      '<path d="M150 135 Q 222 125 220 200 Q 215 260 150 250 Q 132 195 150 135 Z"/>',
      '<path d="M96 236 Q 66 258 52 248 Q 74 238 88 222 Z"/>',
      '<circle cx="105" cy="175" r="8"/>',
    ], lines: '<path d="M350 230 q 12 30 6 55M160 345v-8M175 345v-8M208 345v-8M222 345v-8"/>' },

    { id: 'dinosauro', r: [
      BG,
      '<rect x="0" y="335" width="400" height="65"/>',
      '<polygon points="250,140 300,60 330,60 390,140"/>',
      '<path d="M300 60 Q 305 40 315 55 Q 322 35 330 60 Z"/>',
      '<rect x="148" y="270" width="36" height="75" rx="12"/>',
      '<rect x="282" y="270" width="36" height="75" rx="12"/>',
      '<path d="M305 245 Q 380 255 398 325 Q 360 292 300 292 Z"/>',
      '<ellipse cx="225" cy="255" rx="105" ry="62"/>',
      '<rect x="188" y="285" width="32" height="60" rx="12"/>',
      '<rect x="248" y="285" width="32" height="60" rx="12"/>',
      '<path d="M150 240 Q 118 160 132 92 L 172 94 Q 166 160 194 222 Z"/>',
      '<ellipse cx="160" cy="86" rx="40" ry="26"/>',
      '<circle cx="204" cy="226" r="15"/>', '<circle cx="250" cy="218" r="12"/>', '<circle cx="288" cy="236" r="10"/>',
      '<circle cx="172" cy="78" r="6"/>',
    ], lines: '<path d="M130 92 q14 10 30 2"/>' },

    { id: 'squalo', r: [
      BG,
      '<rect x="0" y="350" width="400" height="50"/>',
      '<path d="M40 400 C 22 365 58 345 42 305 C 72 335 56 372 70 400 Z"/>',
      '<ellipse cx="330" cy="70" rx="22" ry="13"/>', '<polygon points="350,70 372,56 372,84"/>',
      '<polygon points="318,200 385,140 372,205 385,268"/>',
      '<polygon points="195,145 228,82 262,148"/>',
      '<path d="M55 210 Q 115 138 240 138 Q 322 148 338 205 Q 322 258 240 266 Q 115 272 55 210 Z"/>',
      '<path d="M70 222 Q 140 256 240 256 Q 302 252 328 216 Q 262 242 160 237 Q 110 234 70 222 Z"/>',
      '<polygon points="188,246 228,305 242,250"/>',
      '<circle cx="118" cy="190" r="9"/>',
    ], lines: '<path d="M70 222l10 8l10-8l10 8l10-8M160 175q-8 20 0 40M175 175q-8 20 0 40M190 175q-8 20 0 40"/><circle cx="335" cy="68" r="2"/>' },

    { id: 'tartaruga', r: [
      BG,
      '<rect x="0" y="320" width="400" height="80"/>',
      '<circle cx="60" cy="60" r="32"/>',
      '<ellipse cx="130" cy="300" rx="24" ry="32"/>', '<ellipse cx="270" cy="300" rx="24" ry="32"/>',
      '<polygon points="80,265 50,285 82,285"/>',
      '<rect x="300" y="225" width="40" height="30" rx="12"/>',
      '<circle cx="345" cy="225" r="32"/>',
      '<path d="M80 272 Q 88 145 200 140 Q 312 145 320 272 Z"/>',
      '<polygon points="168,178 232,178 254,220 232,258 168,258 146,220"/>',
      '<path d="M100 255 Q 105 205 140 178 L 158 212 L 140 258 Z"/>',
      '<path d="M300 255 Q 295 205 260 178 L 242 212 L 260 258 Z"/>',
      '<path d="M72 266 H 328 Q 334 282 322 290 H 78 Q 66 282 72 266 Z"/>',
      '<circle cx="356" cy="215" r="7"/>',
    ], lines: '<path d="M340 240q10 6 20 0"/>' },

    { id: 'gufo', r: [
      BG,
      '<circle cx="330" cy="70" r="40"/>',
      star(70, 60, 16), star(120, 110, 10),
      '<path d="M0 318 Q 200 296 400 330 L 400 348 Q 200 314 0 336 Z"/>',
      '<polygon points="122,152 134,92 168,140"/>', '<polygon points="278,152 266,92 232,140"/>',
      '<ellipse cx="200" cy="225" rx="88" ry="102"/>',
      '<ellipse cx="200" cy="260" rx="56" ry="64"/>',
      '<path d="M116 205 Q 86 265 128 318 Q 142 258 132 205 Z"/>',
      '<path d="M284 205 Q 314 265 272 318 Q 258 258 268 205 Z"/>',
      '<circle cx="164" cy="190" r="33"/>', '<circle cx="236" cy="190" r="33"/>',
      '<circle cx="164" cy="190" r="14"/>', '<circle cx="236" cy="190" r="14"/>',
      '<polygon points="188,218 212,218 200,244"/>',
      '<ellipse cx="176" cy="326" rx="16" ry="9"/>', '<ellipse cx="224" cy="326" rx="16" ry="9"/>',
    ], lines: '<path d="M180 262q10 8 20 0q10 8 20 0M180 285q10 8 20 0q10 8 20 0"/>' },

    { id: 'pinguino', r: [
      BG,
      '<path d="M0 340 Q 100 320 200 338 T 400 335 V 400 H 0 Z"/>',
      cloud(50, 80), cloud(280, 60, 0.8),
      '<ellipse cx="200" cy="215" rx="88" ry="122"/>',
      '<ellipse cx="200" cy="245" rx="62" ry="92"/>',
      '<path d="M116 185 Q 72 250 96 305 Q 124 260 128 195 Z"/>',
      '<path d="M284 185 Q 328 250 304 305 Q 276 260 272 195 Z"/>',
      '<path d="M128 196 Q 200 224 272 196 L 272 216 Q 200 244 128 216 Z"/>',
      '<rect x="230" y="210" width="22" height="60" rx="6"/>',
      '<circle cx="174" cy="148" r="11"/>', '<circle cx="226" cy="148" r="11"/>',
      '<polygon points="184,166 216,166 200,188"/>',
      '<ellipse cx="170" cy="338" rx="28" ry="11"/>', '<ellipse cx="230" cy="338" rx="28" ry="11"/>',
    ], lines: '' },

    /* ---------------- MEZZI ---------------- */
    { id: 'camion', r: [
      BG,
      '<rect x="0" y="290" width="400" height="110"/>',
      '<circle cx="60" cy="60" r="30"/>',
      '<rect x="30" y="120" width="225" height="150" rx="8"/>',
      '<path d="M258 165 H 330 L 368 220 V 272 H 258 Z"/>',
      '<path d="M273 178 H 325 L 352 216 H 273 Z"/>',
      '<rect x="252" y="262" width="126" height="18" rx="6"/>',
      '<circle cx="360" cy="244" r="8"/>',
      '<circle cx="90" cy="282" r="32"/>', '<circle cx="195" cy="282" r="32"/>', '<circle cx="318" cy="282" r="32"/>',
      '<circle cx="90" cy="282" r="12"/>', '<circle cx="195" cy="282" r="12"/>', '<circle cx="318" cy="282" r="12"/>',
    ], lines: '<path d="M300 225v35M285 232h10M20 350h50M130 350h50M240 350h50M350 350h40"/>' },

    { id: 'pompieri', r: [
      BG,
      '<rect x="0" y="290" width="400" height="110"/>',
      '<rect x="20" y="150" width="250" height="120" rx="8"/>',
      '<rect x="40" y="120" width="230" height="16" rx="6"/>',
      '<path d="M272 160 H 330 L 372 215 V 272 H 272 Z"/>',
      '<path d="M285 172 H 323 L 354 210 H 285 Z"/>',
      '<rect x="292" y="140" width="30" height="20" rx="6"/>',
      '<rect x="40" y="170" width="70" height="60" rx="6"/>',
      '<rect x="125" y="170" width="70" height="60" rx="6"/>',
      '<rect x="262" y="262" width="118" height="18" rx="6"/>',
      '<circle cx="85" cy="282" r="32"/>', '<circle cx="200" cy="282" r="32"/>', '<circle cx="320" cy="282" r="32"/>',
      '<circle cx="85" cy="282" r="12"/>', '<circle cx="200" cy="282" r="12"/>', '<circle cx="320" cy="282" r="12"/>',
    ], lines: '<path d="M40 128H270M70 120v16M100 120v16M130 120v16M160 120v16M190 120v16M220 120v16M250 120v16M215 175v50M240 175v50M299 132l-8-10M315 132l8-10"/>' },

    { id: 'trattore', r: [
      BG,
      '<rect x="0" y="300" width="400" height="100"/>',
      '<circle cx="335" cy="60" r="30"/>',
      '<rect x="78" y="100" width="118" height="125" rx="8"/>',
      '<rect x="96" y="118" width="82" height="62" rx="4"/>',
      '<rect x="285" y="140" width="15" height="72" rx="4"/>',
      '<rect x="170" y="200" width="180" height="70" rx="12"/>',
      '<rect x="340" y="215" width="22" height="45" rx="4"/>',
      '<circle cx="128" cy="262" r="78"/>', '<circle cx="128" cy="262" r="32"/>',
      '<circle cx="310" cy="290" r="42"/>', '<circle cx="310" cy="290" r="16"/>',
    ], lines: '<path d="M200 220h120M200 240h120"/>' },

    { id: 'treno', r: [
      BG,
      '<rect x="0" y="300" width="400" height="100"/>',
      '<circle cx="210" cy="95" r="20"/>', '<circle cx="240" cy="62" r="26"/>', '<circle cx="285" cy="38" r="20"/>',
      '<rect x="20" y="190" width="135" height="90" rx="6"/>',
      '<rect x="38" y="205" width="98" height="36" rx="4"/>',
      '<rect x="172" y="182" width="175" height="100" rx="6"/>',
      '<rect x="268" y="120" width="82" height="72" rx="4"/>',
      '<rect x="284" y="135" width="50" height="40" rx="4"/>',
      '<rect x="195" y="132" width="30" height="52"/>',
      '<rect x="187" y="118" width="46" height="16" rx="4"/>',
      '<polygon points="347,250 382,290 347,290"/>',
      '<circle cx="55" cy="290" r="22"/>', '<circle cx="120" cy="290" r="22"/>',
      '<circle cx="205" cy="290" r="22"/>', '<circle cx="258" cy="290" r="22"/>', '<circle cx="312" cy="290" r="22"/>',
    ], lines: '<path d="M155 260h17M0 318h400M20 318v14M60 318v14M100 318v14M140 318v14M180 318v14M220 318v14M260 318v14M300 318v14M340 318v14M380 318v14"/>' },

    { id: 'aereo', r: [
      BG,
      cloud(30, 330, 1.2), cloud(260, 90, 1),
      '<polygon points="58,190 102,190 72,118 44,118"/>',
      '<polygon points="190,188 240,188 212,118 186,118"/>',
      '<path d="M38 212 Q 38 182 90 182 H 318 Q 370 186 376 208 Q 370 230 318 234 H 90 Q 38 234 38 212 Z"/>',
      '<polygon points="165,210 250,210 205,305 168,305"/>',
      '<path d="M326 192 Q 355 194 364 208 H 326 Z"/>',
      '<circle cx="135" cy="202" r="9"/>', '<circle cx="170" cy="202" r="9"/>', '<circle cx="270" cy="202" r="9"/>', '<circle cx="300" cy="202" r="9"/>',
    ], lines: '<path d="M60 222h270"/>' },

    { id: 'elicottero', r: [
      BG,
      cloud(40, 330, 1.1), cloud(290, 330, 0.9),
      '<polygon points="110,198 28,184 28,206 110,232"/>',
      '<circle cx="30" cy="190" r="20"/>',
      '<rect x="185" y="135" width="14" height="30"/>',
      '<rect x="60" y="124" width="265" height="12" rx="6"/>',
      '<rect x="150" y="262" width="10" height="30"/>', '<rect x="250" y="262" width="10" height="30"/>',
      '<rect x="110" y="288" width="190" height="12" rx="6"/>',
      '<ellipse cx="195" cy="212" rx="98" ry="62"/>',
      '<path d="M195 160 Q 268 160 285 212 H 195 Z"/>',
      '<rect x="120" y="190" width="45" height="30" rx="6"/>',
    ], lines: '<path d="M22 190h16M30 182v16"/>' },

    { id: 'corsa', r: [
      BG,
      '<rect x="0" y="295" width="400" height="105"/>',
      '<rect x="28" y="182" width="48" height="12" rx="4"/>',
      '<rect x="46" y="194" width="10" height="26"/>',
      '<path d="M30 252 Q 40 216 110 210 L 160 180 H 242 L 292 210 Q 368 216 376 252 L 370 272 H 36 Z"/>',
      '<circle cx="205" cy="190" r="24"/>',
      '<rect x="190" y="182" width="32" height="12" rx="4"/>',
      '<rect x="220" y="225" width="120" height="14" rx="4"/>',
      '<circle cx="155" cy="238" r="22"/>',
      '<circle cx="105" cy="276" r="34"/>', '<circle cx="300" cy="276" r="34"/>',
      '<circle cx="105" cy="276" r="13"/>', '<circle cx="300" cy="276" r="13"/>',
    ], lines: '<path d="M155 228v20M0 340h400M30 355h40M110 355h40M190 355h40M270 355h40M350 355h40"/>' },

    { id: 'barca', r: [
      BG,
      '<circle cx="70" cy="70" r="34"/>',
      '<path d="M0 290 Q 50 270 100 290 T 200 290 T 300 290 T 400 290 V 400 H 0 Z"/>',
      '<rect x="195" y="60" width="10" height="205"/>',
      '<polygon points="190,72 190,245 78,245"/>',
      '<polygon points="210,92 210,245 302,245"/>',
      '<polygon points="205,58 248,70 205,84"/>',
      '<path d="M66 252 H 334 L 292 318 H 108 Z"/>',
      '<circle cx="150" cy="282" r="9"/>', '<circle cx="200" cy="282" r="9"/>', '<circle cx="250" cy="282" r="9"/>',
    ], lines: '<path d="M300 90q10-10 20 0q10-10 20 0M330 130q8-8 16 0q8-8 16 0M30 340q20-12 40 0M300 360q20-12 40 0"/>' },

    { id: 'robot', r: [
      BG,
      '<circle cx="200" cy="40" r="13"/>',
      '<rect x="140" y="60" width="120" height="90" rx="14"/>',
      '<circle cx="175" cy="100" r="15"/>', '<circle cx="225" cy="100" r="15"/>',
      '<rect x="170" y="125" width="60" height="13" rx="4"/>',
      '<rect x="185" y="150" width="30" height="16"/>',
      '<rect x="78" y="175" width="38" height="100" rx="16"/>', '<rect x="284" y="175" width="38" height="100" rx="16"/>',
      '<circle cx="97" cy="288" r="21"/>', '<circle cx="303" cy="288" r="21"/>',
      '<rect x="145" y="292" width="40" height="66"/>', '<rect x="215" y="292" width="40" height="66"/>',
      '<rect x="120" y="164" width="160" height="132" rx="14"/>',
      '<rect x="158" y="188" width="84" height="52" rx="6"/>',
      '<circle cx="178" cy="268" r="11"/>', '<circle cx="222" cy="268" r="11"/>',
      '<rect x="128" y="352" width="68" height="28" rx="8"/>', '<rect x="204" y="352" width="68" height="28" rx="8"/>',
    ], lines: '<path d="M200 53v7M170 205h60M170 222h40"/>' },
  ];
})();
