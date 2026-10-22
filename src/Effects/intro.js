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

if (introMode !== "none") {
  document.documentElement.classList.add("is-intro");
  // Garde-fou : si le préloader ne se termine pas (erreur JS), la page ne reste pas bloquée
  setTimeout(() => {
    releaseIntro();
    document.documentElement.classList.remove("is-intro");
  }, 8000);
}
