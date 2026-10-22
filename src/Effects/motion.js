import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(ScrollTrigger, Flip, ScrambleTextPlugin);

// Courbes communes : toutes les animations du site passent par ces valeurs
export const EASE = {
  out: "expo.out",
  inOut: "expo.inOut",
  soft: "power3.out",
  softInOut: "power3.inOut",
};

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const hasFinePointer = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// "Porte" de démarrage : le préloader et le rideau de transition la verrouillent,
// chaque page attend qu'elle s'ouvre avant de lancer son animation d'entrée.
let locks = 0;
let gate = Promise.resolve();
let resolveGate = null;

export function lockGate() {
  if (locks === 0) {
    gate = new Promise((resolve) => {
      resolveGate = resolve;
    });
  }
  locks += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0 && resolveGate) {
      resolveGate();
      resolveGate = null;
    }
  };
}

export const whenReady = () => gate;

// Exécute fn dès que la porte est ouverte. Renvoie la fonction d'annulation.
export function onReady(fn) {
  let alive = true;
  whenReady().then(() => {
    if (alive) fn();
  });
  return () => {
    alive = false;
  };
}

// Aide au debug : window.gsap.globalTimeline.timeScale(0.1) ralentit tout le site
if (process.env.NODE_ENV === "development") {
  window.gsap = gsap;
}

export { gsap, ScrollTrigger, Flip };
