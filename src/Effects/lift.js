import { gsap } from "./motion";

// T2 « la vignette reste le même objet » : pré-geste avant la transition signature d'un monde. La carte cliquée se
// soulève (grossit, anneau de la couleur du projet) pendant que les autres reculent et s'effacent, décalées selon
// leur distance à la carte choisie. La transition du monde joue ensuite, inchangée.
//
// Balisage : `data-lift` sur la carte (ou la scène) qui se soulève ; `data-lift-scope` sur un conteneur dont un lien
// interne doit soulever son `[data-lift]` (le showcase : le titre est ailleurs que l'image).

export const LIFT_MS = 520;

// La carte à soulever pour un lien : son ancêtre `data-lift`, sinon le `data-lift` du conteneur `data-lift-scope`
export function findLift(link) {
  if (!link || !link.closest) return null;
  const own = link.closest("[data-lift]");
  if (own) return own;
  const scope = link.closest("[data-lift-scope]");
  return scope ? scope.querySelector("[data-lift]") : null;
}

let touched = [];

export function liftCard(card) {
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const accent = getComputedStyle(card).getPropertyValue("--card").trim() || "#d9ff4a";

  // Les autres cartes, et les éléments `data-lift-dim` (rail, texte du showcase) qui s'effacent avec elles
  const others = [...document.querySelectorAll("[data-lift], [data-lift-dim]")].filter(
    // les blocs pas encore révélés (opacité 0) restent cachés
    (el) => el !== card && parseFloat(getComputedStyle(el).opacity) > 0.05
  );
  touched = [card, ...others];

  // Le geste ne s'arrête jamais net : il part vite (0,45 s) puis continue lentement jusqu'à ce que la transition du monde
  // prenne le relais. Quand le monde met du temps à se charger (serveur de dev, réseau lent), une carte immobile
  // ressemblerait à un gel ; ici elle grossit encore, l'anneau s'épaissit, les autres dérivent.
  gsap
    .timeline({ overwrite: "auto" })
    .to(card, {
      scale: 1.05,
      filter: "brightness(1.1)",
      boxShadow: `0 0 0 2px ${accent}, 0 40px 90px -24px rgba(0, 0, 0, 0.8)`,
      zIndex: 3,
      duration: 0.45,
      ease: "power3.out",
    })
    .to(
      card,
      { scale: 1.12, boxShadow: `0 0 0 5px ${accent}, 0 50px 110px -24px rgba(0, 0, 0, 0.85)`, duration: 2.6, ease: "sine.out" },
      0.3
    );

  others.forEach((el) => {
    const r = el.getBoundingClientRect();
    const dist = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
    gsap
      .timeline({ overwrite: "auto", delay: Math.min(0.1, dist / 5000) })
      .to(el, { opacity: 0.1, scale: 0.94, y: 14, duration: 0.32, ease: "power2.out" })
      .to(el, { scale: 0.9, y: 30, opacity: 0.04, duration: 2.4, ease: "sine.out" });
  });
}

// Remet tout en place (la navigation est finie ou annulée) ; sans effet sur des éléments déjà démontés
export function clearLift() {
  if (!touched.length) return;
  gsap.killTweensOf(touched);
  gsap.set(touched, { clearProps: "opacity,scale,y,filter,boxShadow,zIndex,transform" });
  touched = [];
}
