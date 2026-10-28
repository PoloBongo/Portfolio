// Retour à l'accueil sans rejouer l'entrée du hero : on retient où l'on se trouvait (défilement) quand on le quitte,
// et on y revient directement (précédent du navigateur, lien « Projets » d'une page de catégorie ou de projet).
// Le hero lit `peekLanding()` à son montage pour partir du bon acte, sans visite ni écriture du nom.

import { ScrollTrigger } from "./motion";

const HOME = /^\/(?:fr|en|es)\/?$/;

export const isHome = (pathname) => HOME.test(pathname);

let saved = null; // défilement de l'accueil au moment où on l'a quitté
let landing = null; // défilement où la prochaine page va se poser (lu par le hero à son montage)

export const rememberHome = (y) => {
  saved = Math.max(0, Math.round(y));
};

export const setLanding = (y) => {
  landing = y;
};

export const peekLanding = () => landing;

// Avant le montage de la page : de quoi choisir l'acte du hero (une ancre de l'accueil est sous le hero)
export function expectLanding(target, { back = false } = {}) {
  if (!isHome(target.pathname)) return null;
  if (back && saved !== null) return saved;
  return target.hash ? 1e6 : 0;
}

// Une fois la page montée, où elle se pose : l'ancre de l'accueil (#work) ou la position où on l'avait laissé
export function landingFor(target, { back = false } = {}) {
  if (!isHome(target.pathname)) return 0;
  if (back && saved !== null) return saved;
  if (target.hash) {
    const el = document.getElementById(decodeURIComponent(target.hash.slice(1)));
    if (el) return Math.max(0, Math.round(el.getBoundingClientRect().top + window.scrollY));
  }
  return 0;
}

// Précédent / suivant du navigateur : l'écouteur est posé avant celui du routeur, la position est donc prête
// quand l'accueil se monte
if (typeof window !== "undefined") {
  // La position est posée ici (jumpTo) : sans cela, le navigateur restaure en plus celle de l'entrée d'historique,
  // une fois l'accueil monté, et ramène le défilement sur l'ancre (#work) au lieu de l'endroit où l'on était.
  // Par ScrollTrigger : il remet « auto » à chaque refresh si on écrit history.scrollRestoration soi-même.
  ScrollTrigger.clearScrollMemory("manual");

  window.addEventListener("popstate", () => {
    landing = isHome(window.location.pathname) && saved !== null ? saved : null;
  });
}
