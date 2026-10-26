import { lockGate, prefersReducedMotion } from "./motion";

// Calculé une seule fois, avant le premier rendu : l'intro ne se joue qu'une fois par session
const KEY = "introPlayed";
const HOME = /^\/(fr|en|es)?\/?$/;

function decideMode() {
  if (prefersReducedMotion()) return "none";
  try {
    if (sessionStorage.getItem(KEY)) return "none";
    sessionStorage.setItem(KEY, "1");
  } catch (e) {
    // stockage indisponible (navigation privée) : on joue l'intro
  }
  return HOME.test(window.location.pathname) ? "full" : "short";
}

export const introMode = decideMode();

// La porte est fermée avant le premier rendu : aucune page ne démarre sous le préloader
export const releaseIntro = introMode === "none" ? () => {} : lockGate();

// Annonce du moment où le nuage commence à se former : avant l'ouverture du rideau du préloader (sur l'accueil,
// pendant les salutations), pour que le nom soit déjà lisible quand les panneaux s'écartent
let building = introMode === "none";
const buildListeners = new Set();

export function announceBuild() {
  building = true;
  buildListeners.forEach((fn) => fn());
  buildListeners.clear();
}

// Exécute fn à ce moment (tout de suite s'il n'y a pas de préloader, ou s'il est déjà passé)
export function onIntroBuild(fn) {
  if (building) {
    fn();
    return () => {};
  }
  buildListeners.add(fn);
  return () => buildListeners.delete(fn);
}

if (introMode !== "none") {
  document.documentElement.classList.add("is-intro");
  // Garde-fou : si le préloader ne se termine pas (erreur JS), la page ne reste pas bloquée
  setTimeout(() => {
    announceBuild();
    releaseIntro();
    document.documentElement.classList.remove("is-intro");
  }, 8000);
}
