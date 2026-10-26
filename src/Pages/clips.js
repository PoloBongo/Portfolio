// Extraits vidéo muets de 8 s (public/clips) : un par projet, nommé comme l'id du projet.
// Boucles 960×540 sans fond de navigateur ni éditeur, avec un fondu fin → début pour boucler sans à-coup.
const BASE = `${process.env.PUBLIC_URL || ""}/clips`;

const IDS = new Set([
  "depths-of-hue",
  "shadow-scholar",
  "navy-bongo",
  "funfair",
  "spacial-race",
  "inventory",
  "attraction-flow",
  "stay-soul",
  "au-fil-des-images",
  "celtic-la-riche-basket",
  "meteo-dashboard",
  "articles-manager",
  "payment-page",
  "eko",
  "ba-immobilier",
  "seo-autopilot",
]);

export const hasClip = (id) => IDS.has(id);
export const clipSrc = (id) => `${BASE}/${id}.mp4`;
export const clipPoster = (id) => `${BASE}/${id}.webp`;

// Économie de données : pas de vidéo en arrière-plan (la vignette suffit)
export const canAutoplayClips = () => {
  const connection = typeof navigator !== "undefined" ? navigator.connection : null;
  return !(connection && connection.saveData);
};
