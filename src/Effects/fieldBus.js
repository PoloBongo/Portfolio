// Pont entre l'interface et la scène 3D (stage3d/createScene.js). Quatre canaux :
//  - focus : indice de la ligne de l'index des projets survolée (-1 = aucune)
//  - hero  : objet du hero (browser = page web | network = attention | pad = manette ; sphere = aucun), changé à chaque acte
//  - warp  : « saut » de navigation, le fond accélère et la caméra s'élargit le temps d'un changement de page
//  - tint  : couleur du monde en cours (rgb 0-1 + dose) : les isolignes, les lumières et l'aurore virent vers elle
const channels = { focus: new Set(), hero: new Set(), warp: new Set(), tint: new Set() };

export const fieldState = { focus: -1, hero: "sphere", tint: { rgb: [0.62, 0.34, 0.98], mix: 0 } };

const subscribe = (name) => (fn) => {
  channels[name].add(fn);
  return () => channels[name].delete(fn);
};

export const subscribeField = subscribe("focus");
export const subscribeHero = subscribe("hero");
export const subscribeWarp = subscribe("warp");
export const subscribeTint = subscribe("tint");

export function setFieldFocus(focus) {
  if (fieldState.focus === focus) return;
  fieldState.focus = focus;
  channels.focus.forEach((fn) => fn(focus));
}

export function setHeroShape(shape) {
  if (fieldState.hero === shape) return;
  fieldState.hero = shape;
  channels.hero.forEach((fn) => fn(shape));
}

// amount : intensité (1 = saut complet)
export function triggerWarp(amount = 1) {
  channels.warp.forEach((fn) => fn(amount));
}

// rgb : couleur du monde (0-1) ; mix : 0 = violet d'origine, 1 = teinte pleine
export function setFieldTint(rgb, mix = 1) {
  fieldState.tint = { rgb, mix };
  channels.tint.forEach((fn) => fn(fieldState.tint));
}
