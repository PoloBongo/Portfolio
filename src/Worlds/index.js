import lazyPreload from "../Effects/lazyPreload";

// Modules de monde sur mesure, chargés à la demande (un chunk chacun : le hero du projet et ses styles).
// Un projet sans module garde la mise en page commune, avec les couleurs de son monde (config.js).
const MODULES = {
  cerebro: () => import("./cerebro"),
  "seo-autopilot": () => import("./seo-autopilot"),
  "au-fil-des-images": () => import("./au-fil-des-images"),
  "depths-of-hue": () => import("./depths-of-hue"),
  "shadow-scholar": () => import("./shadow-scholar"),
  funfair: () => import("./funfair"),
  "stay-soul": () => import("./stay-soul"),
  "choco-blast": () => import("./choco-blast"),
  "celtic-la-riche-basket": () => import("./celtic-la-riche-basket"),
  "meteo-dashboard": () => import("./meteo-dashboard"),
  "articles-manager": () => import("./articles-manager"),
  eko: () => import("./eko"),
  "ba-immobilier": () => import("./ba-immobilier"),
  ratp: () => import("./ratp"),
  "angry-birds": () => import("./angry-birds"),
  "navy-bongo": () => import("./navy-bongo"),
  "spacial-race": () => import("./spacial-race"),
  "payment-page": () => import("./payment-page"),
  portfolio: () => import("./portfolio"),
  "ui-ux-cooking": () => import("./ui-ux-cooking"),
  "unity-rl": () => import("./unity-rl"),
  inventory: () => import("./inventory"),
  "attraction-flow": () => import("./attraction-flow"),
};

const HEROES = {};

// Composant hero du monde (null s'il n'a pas de module). Stable d'un appel à l'autre.
export function worldHero(id) {
  if (!MODULES[id]) return null;
  if (!HEROES[id]) HEROES[id] = lazyPreload(() => MODULES[id]().then((module) => ({ default: module.Hero })));
  return HEROES[id];
}

// Effet de clic du monde (null s'il n'en a pas) : fonction spawn(x, y, outils), voir Effects/ClickFx.js
export function worldFx(id) {
  if (!MODULES[id]) return Promise.resolve(null);
  return MODULES[id]().then((module) => module.fx || null);
}

// Charge le module à l'avance (survol d'un lien, début d'une transition)
export function preloadWorld(id) {
  const hero = worldHero(id);
  return hero ? hero.preload() : Promise.resolve();
}
