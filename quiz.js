'use strict';
/* =========================================================
   5. QUIZ CALCIATORI — si vede la faccia di un campione,
   il bambino tocca lo stemma della sua squadra (3 scelte).
   Pensato per chi non sa ancora leggere: parla la voce, niente scritte.
   Rose aggiornate a novembre 2026.
   ========================================================= */
// art = "il/la/l'" (Quello è il Milan), prep = "nel/nella/nell'" (gioca nel Milan)
const QUIZ_TEAMS = {
  real: { name: 'Real Madrid', art: 'il ', prep: 'nel ' },
  barca: { name: 'Barcellona', art: 'il ', prep: 'nel ' },
  atletico: { name: 'Atlético Madrid', art: "l'", prep: "nell'" },
  city: { name: 'Manchester City', art: 'il ', prep: 'nel ' },
  liverpool: { name: 'Liverpool', art: 'il ', prep: 'nel ' },
  arsenal: { name: 'Arsenal', art: "l'", prep: "nell'" },
  chelsea: { name: 'Chelsea', art: 'il ', prep: 'nel ' },
  united: { name: 'Manchester United', art: 'il ', prep: 'nel ' },
  bayern: { name: 'Bayern Monaco', art: 'il ', prep: 'nel ' },
  psg: { name: 'Paris Saint-Germain', art: 'il ', prep: 'nel ' },
  inter: { name: 'Inter', art: "l'", prep: "nell'" },
  milan: { name: 'Milan', art: 'il ', prep: 'nel ' },
  juve: { name: 'Juventus', art: 'la ', prep: 'nella ' },
  napoli: { name: 'Napoli', art: 'il ', prep: 'nel ' },
  roma: { name: 'Roma', art: 'la ', prep: 'nella ' },
  galatasaray: { name: 'Galatasaray', art: 'il ', prep: 'nel ' },
  trabzonspor: { name: 'Trabzonspor', art: 'il ', prep: 'nel ' },
  miami: { name: 'Inter Miami', art: "l'", prep: "nell'" },
  // alnassr: { name: 'Al Nassr', art: "l'", prep: "nell'" }, // stemma in arrivo
};

// [id foto, nome detto dalla voce, squadra]
const QUIZ_PLAYERS = [
  ['mbappe', 'Mbappé', 'real'], ['vinicius', 'Vinícius', 'real'], ['bellingham', 'Bellingham', 'real'], ['diomande', 'Diomande', 'real'], ['courtois', 'Courtois', 'real'],
  ['yamal', 'Lamine Yamal', 'barca'], ['raphinha', 'Raphinha', 'barca'], ['pedri', 'Pedri', 'barca'], ['rodri', 'Rodri', 'barca'],
  ['alvarez', 'Julián Álvarez', 'atletico'], ['oblak', 'Oblak', 'atletico'],
  ['haaland', 'Haaland', 'city'], ['foden', 'Foden', 'city'], ['donnarumma', 'Donnarumma', 'city'], ['bouaddi', 'Bouaddi', 'city'],
  ['wirtz', 'Wirtz', 'liverpool'], ['isak', 'Isak', 'liverpool'], ['vandijk', 'Van Dijk', 'liverpool'],
  ['saka', 'Saka', 'arsenal'], ['odegaard', 'Ødegaard', 'arsenal'], ['rice', 'Rice', 'arsenal'], ['gyokeres', 'Gyökeres', 'arsenal'],
  ['palmer', 'Palmer', 'chelsea'], ['estevao', 'Estêvão', 'chelsea'], ['caicedo', 'Caicedo', 'chelsea'],
  ['rashford', 'Rashford', 'united'], ['cunha', 'Cunha', 'united'], ['bruno', 'Bruno Fernandes', 'united'],
  ['kane', 'Kane', 'bayern'], ['musiala', 'Musiala', 'bayern'], ['olise', 'Olise', 'bayern'], ['neuer', 'Neuer', 'bayern'],
  ['dembele', 'Dembélé', 'psg'], ['kvara', 'Kvaratskhelia', 'psg'], ['hakimi', 'Hakimi', 'psg'], ['ferran', 'Ferran Torres', 'psg'],
  ['lautaro', 'Lautaro', 'inter'], ['thuram', 'Thuram', 'inter'], ['barella', 'Barella', 'inter'],
  ['modric', 'Modric', 'milan'], ['pulisic', 'Pulisic', 'milan'], ['maignan', 'Maignan', 'milan'], ['ramos', 'Gonçalo Ramos', 'milan'],
  ['yildiz', 'Yildiz', 'juve'], ['woltemade', 'Woltemade', 'juve'],
  ['debruyne', 'De Bruyne', 'napoli'], ['mctominay', 'McTominay', 'napoli'],
  ['dybala', 'Dybala', 'roma'],
  ['leao', 'Leão', 'galatasaray'],
  ['salah', 'Salah', 'trabzonspor'],
  ['messi', 'Messi', 'miami'],
  // foto in arrivo: ['kolomuani', 'Kolo Muani', 'juve'], ['vicario', 'Vicario', 'juve'], ['suarez', 'Suárez', 'miami'], ['ronaldo', 'Cristiano Ronaldo', 'alnassr']
].map(([id, name, team]) => ({ id, name, team }));

const quizPhoto = id => `quiz/foto/${id}.jpg`;
const quizCrest = id => `quiz/stemmi/${id}.png`;

function shuffled(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function quiz() {
  let score = 0, deck = [], timer = null;
  const showScore = () => { scoreEl.textContent = '⭐ ' + score; };
  showScore();

  const wrap = el('div', 'quiz');
  const face = el('div', 'quiz-face');
  const img = el('img'); img.alt = ''; img.draggable = false;
  face.appendChild(img);
  const row = el('div', 'quiz-crests');
  wrap.append(face, row);
  app.appendChild(wrap);
  cleanup = () => clearTimeout(timer);

  function nextPlayer() {
    if (!deck.length) deck = shuffled(QUIZ_PLAYERS);
    const p = deck.pop();
    // due squadre sbagliate, diverse da quella giusta
    const others = shuffled(Object.keys(QUIZ_TEAMS).filter(t => t !== p.team)).slice(0, 2);
    const options = shuffled([p.team, ...others]);
    const t = QUIZ_TEAMS[p.team];
    let done = false;

    img.src = quizPhoto(p.id);
    face.classList.remove('pop'); void face.offsetWidth; face.classList.add('pop');
    row.innerHTML = '';
    options.forEach(id => {
      const b = el('button', 'quiz-crest');
      b.setAttribute('aria-label', QUIZ_TEAMS[id].name);
      b.style.backgroundImage = `url(${quizCrest(id)})`;
      b.onclick = () => {
        if (done || b.classList.contains('no')) return;
        if (id === p.team) {
          done = true;
          b.classList.add('yes');
          score++; showScore(); sfx.win(); confetti(30, ['⚽', '⭐', '🎉', '🏆']);
          say(`Sì! Bravissimo! ${p.name} gioca ${t.prep}${t.name}!`);
          if (score % 5 === 0) setTimeout(() => { bigText('🏆'); confetti(50); }, 900);
          timer = setTimeout(nextPlayer, 3200);
        } else {
          b.classList.add('no'); sfx.oh();
          const w = QUIZ_TEAMS[id];
          say(`No, quello è ${w.art}${w.name}. Riprova!`);
        }
      };
      row.appendChild(b);
    });
    repeatFn = () => say(`Questo è ${p.name}! In che squadra gioca?`);
    repeatFn();
  }
  nextPlayer();
}
