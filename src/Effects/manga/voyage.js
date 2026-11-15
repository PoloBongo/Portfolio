// Refonte « manga » · le voyage : quand le visiteur clique un lien de l'accueil, l'avatar plonge dans la case. Sur la
// page d'arrivée (où le modèle 3D n'est pas chargé), il réapparaît un instant en image, d'une incision, salue et repart.
// Ce module vit hors du composant : il survit au changement de page.
import { gsap, whenReady } from "../motion";
import { incision } from "./incision";

let attente = 0;

export function arriverAilleurs() {
  const depart = window.location.pathname;
  window.clearInterval(attente);
  let essais = 0;
  attente = window.setInterval(() => {
    essais += 1;
    if (essais > 80) window.clearInterval(attente); // la navigation n'a pas eu lieu
    if (window.location.pathname === depart) return;
    window.clearInterval(attente);
    // On attend que le rideau de page soit rouvert, puis un court instant pour laisser la page se poser
    whenReady().then(() => window.setTimeout(montrer, 500));
  }, 100);
}

function montrer() {
  if (window.matchMedia("(max-width: 899px), (pointer: coarse), (prefers-reduced-motion: reduce)").matches) return;
  if (document.querySelector(".manga")) return; // retour sur l'accueil : le vrai avatar s'en charge
  const boite = document.createElement("div");
  boite.className = "mg-visite";
  boite.setAttribute("aria-hidden", "true");
  const img = new Image();
  img.src = `${process.env.PUBLIC_URL || ""}/avatar/pose-salut.webp`;
  img.alt = "";
  boite.appendChild(img);
  document.body.appendChild(boite);
  const r = boite.getBoundingClientRect();
  const ici = { x: r.left + r.width / 2, y: r.top + r.height * 0.45 };
  const dehors = { x: window.innerWidth + 80, y: ici.y };
  const tl = gsap.timeline({ onComplete: () => boite.remove() });
  // Arrivée : une incision depuis le bord, il se « déplie » d'un trait vertical
  tl.add(() => incision(dehors, ici, { eclair: false }), 0)
    .fromTo(img, { scaleX: 0.04, scaleY: 1.45, autoAlpha: 0 }, { scaleX: 1, scaleY: 1, autoAlpha: 1, duration: 0.34, ease: "back.out(2.4)" }, 0.12);
  // Deux petits sauts : écrasé avant de partir, étiré en l'air, écrasé à la réception
  [0.62, 1.02].forEach((t) => {
    tl.to(img, { scaleX: 1.12, scaleY: 0.86, duration: 0.07, ease: "power2.out" }, t)
      .to(img, { y: -26, scaleX: 0.92, scaleY: 1.1, duration: 0.15, ease: "power2.out" }, t + 0.07)
      .to(img, { y: 0, scaleX: 1, scaleY: 1, duration: 0.14, ease: "power2.in" }, t + 0.22)
      .to(img, { scaleX: 1.08, scaleY: 0.92, duration: 0.05, yoyo: true, repeat: 1, ease: "power1.out" }, t + 0.36);
  });
  // Départ : il s'écrase en un trait et file d'une incision
  tl.to(img, { scaleX: 0.04, scaleY: 1.4, autoAlpha: 0, duration: 0.1, ease: "power2.in" }, 1.85)
    .add(() => incision(ici, dehors, { eclair: false }), 1.88);
}
