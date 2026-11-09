import { gsap, EASE } from "./motion";

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

  gsap.to(card, {
    scale: 1.045,
    filter: "brightness(1.1)",
    boxShadow: `0 0 0 2px ${accent}, 0 40px 90px -24px rgba(0, 0, 0, 0.8)`,
    zIndex: 3,
    duration: 0.5,
    ease: EASE.out,
    overwrite: "auto",
  });

  others.forEach((el) => {
    const r = el.getBoundingClientRect();
    const dist = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy);
    gsap.to(el, {
      opacity: 0.1,
      scale: 0.94,
      y: 14,
      duration: 0.32,
      delay: Math.min(0.1, dist / 5000),
      ease: "power2.out",
      overwrite: "auto",
    });
  });
}

// Remet tout en place (la navigation est finie ou annulée) ; sans effet sur des éléments déjà démontés
export function clearLift() {
  if (!touched.length) return;
  gsap.set(touched, { clearProps: "opacity,scale,y,filter,boxShadow,zIndex,transform" });
  touched = [];
}
