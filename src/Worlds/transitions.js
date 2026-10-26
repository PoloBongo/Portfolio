// Transition signature de chaque monde : le genre d'effet joué quand on entre dans le monde (ou qu'on en sort),
// et ses couleurs [accent, second, encre / fond…]. Données seules : lues par la coque (PageTransition) sans
// charger les mondes. Les genres sont dans Effects/worldTransition.js.
//   scan    : balayage de décodage, ligne néon qui descend (Cerebro)
//   dots    : trame de points qui grossissent et se rejoignent (SEO Autopilot, Attraction Flow)
//   thread  : un fil tendu descend, des cadres photo suspendus (Au fil des images)
//   ink     : goutte d'encre organique, bulles en option (Depths Of Hue, Météo, Eko)
//   blinds  : store vénitien qui se ferme puis s'ouvre (Shadow Scholar)
//   tear    : ticket déchiré, bord perforé (Funfair, Payment)
//   pixels  : mosaïque dissoute dans l'ordre d'une matrice de Bayer (Stay Soul, UI UX Cooking)
//   flood   : liquide qui monte puis s'écoule (Choco Blast, Navy Bongo)
export const TRANSITIONS = {
  cerebro: { genre: "scan", colors: ["#63e6be", "#b79bff", "#05060c"] },
  "seo-autopilot": { genre: "dots", colors: ["#ff5a47", "#4b5bd7", "#1c1c24"] },
  "au-fil-des-images": { genre: "thread", colors: ["#ff7a59", "#6b3fb5", "#ffc65c", "#2b1650", "#f7f0e6"] },
  "depths-of-hue": { genre: "ink", bubbles: true, colors: ["#36e3a1", "#ff7f8a", "#031a1c"] },
  "shadow-scholar": { genre: "blinds", colors: ["#4a86d6", "#e5566d", "#03050f"] },
  funfair: { genre: "tear", colors: ["#f4c430", "#c8202a", "#fff3d1", "#2e9b4a"] },
  "stay-soul": { genre: "pixels", colors: ["#a99ad6", "#f1f0e4", "#07050c"] },
  "choco-blast": { genre: "flood", colors: ["#f0158f", "#f5c400", "#2e1403"] },
  "celtic-la-riche-basket": { genre: "projectile", sprite: "ball", colors: ["#ff7a1a", "#f4efe2", "#101010"] },
  "meteo-dashboard": { genre: "rain", colors: ["#9ec9f0"] },
  "articles-manager": { genre: "doors", skin: "news", colors: ["#c8321e"] },
  eko: { genre: "fog", direction: "side", fogColor: "#d9e6d3", colors: ["#7fb08a"] },
  "ba-immobilier": { genre: "draft", colors: ["#1fb8c4", "#f2b97a", "#232527"] },
  ratp: { genre: "doors", skin: "metro", colors: ["#12d8dc"] },
  "angry-birds": { genre: "projectile", sprite: "bird", colors: ["#e0242e", "#ffd23f", "#2a1d12"] },
  "navy-bongo": { genre: "flood", style: "water", colors: ["#ffffff", "#bfe9ff", "#0a2c4d"] },
  "spacial-race": { genre: "flip", flipAxis: "x", colors: ["#f2b521", "#ffffff"] },
  "payment-page": { genre: "tear", colors: ["#e8ff2e", "#0c0c0c", "#f4f4ef"] },
  portfolio: { genre: "iris", colors: ["#bc63ff", "#63e6be", "#0a0a0f"] },
  "ui-ux-cooking": { genre: "fog", direction: "up", fogColor: "#6b4a35", colors: ["#e0782f"] },
  "unity-rl": { genre: "sweep", colors: ["#fff3b0", "#ffffff"] },
  inventory: { genre: "doors", skin: "chest", colors: ["#ffb04a"] },
  "attraction-flow": { genre: "dots", colors: ["#f2994a", "#3c8dde", "#1e2a24"] },
};

const SLUG = /\/work\/([^/?#]+)/;

// Transition du monde visé par une adresse (ou de celui qu'on quitte)
export function transitionOf(pathname) {
  const match = SLUG.exec(pathname || "");
  return match ? TRANSITIONS[match[1]] || null : null;
}
