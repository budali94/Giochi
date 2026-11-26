const CACHE = 'giochi-v6';
const FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "pictures.js",
  "duel.js",
  "quiz.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "quiz/foto/alvarez.jpg",
  "quiz/foto/barella.jpg",
  "quiz/foto/bellingham.jpg",
  "quiz/foto/bouaddi.jpg",
  "quiz/foto/courtois.jpg",
  "quiz/foto/cunha.jpg",
  "quiz/foto/dembele.jpg",
  "quiz/foto/diomande.jpg",
  "quiz/foto/donnarumma.jpg",
  "quiz/foto/estevao.jpg",
  "quiz/foto/ferran.jpg",
  "quiz/foto/foden.jpg",
  "quiz/foto/gyokeres.jpg",
  "quiz/foto/haaland.jpg",
  "quiz/foto/hakimi.jpg",
  "quiz/foto/isak.jpg",
  "quiz/foto/kane.jpg",
  "quiz/foto/kvara.jpg",
  "quiz/foto/lautaro.jpg",
  "quiz/foto/maignan.jpg",
  "quiz/foto/mbappe.jpg",
  "quiz/foto/modric.jpg",
  "quiz/foto/musiala.jpg",
  "quiz/foto/neuer.jpg",
  "quiz/foto/oblak.jpg",
  "quiz/foto/odegaard.jpg",
  "quiz/foto/olise.jpg",
  "quiz/foto/palmer.jpg",
  "quiz/foto/pedri.jpg",
  "quiz/foto/pulisic.jpg",
  "quiz/foto/ramos.jpg",
  "quiz/foto/raphinha.jpg",
  "quiz/foto/rashford.jpg",
  "quiz/foto/rice.jpg",
  "quiz/foto/rodri.jpg",
  "quiz/foto/saka.jpg",
  "quiz/foto/thuram.jpg",
  "quiz/foto/vandijk.jpg",
  "quiz/foto/vinicius.jpg",
  "quiz/foto/wirtz.jpg",
  "quiz/foto/woltemade.jpg",
  "quiz/foto/yamal.jpg",
  "quiz/foto/yildiz.jpg",
  "quiz/stemmi/arsenal.png",
  "quiz/stemmi/atletico.png",
  "quiz/stemmi/barca.png",
  "quiz/stemmi/bayern.png",
  "quiz/stemmi/chelsea.png",
  "quiz/stemmi/city.png",
  "quiz/stemmi/galatasaray.png",
  "quiz/stemmi/inter.png",
  "quiz/stemmi/juve.png",
  "quiz/stemmi/liverpool.png",
  "quiz/stemmi/miami.png",
  "quiz/stemmi/milan.png",
  "quiz/stemmi/napoli.png",
  "quiz/stemmi/psg.png",
  "quiz/stemmi/real.png",
  "quiz/stemmi/roma.png",
  "quiz/stemmi/trabzonspor.png",
  "quiz/stemmi/united.png",
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('index.html')))
  );
});
