// Refonte « manga » · l'incision : le déplacement éclair des animés. Entre deux points de l'écran, une gerbe de traits
// de vitesse file, un éclair blanchit la page le temps d'une image, deux anneaux de poussière marquent le départ et
// l'arrivée. Tout est en HTML par-dessus la page (calque fixe créé à la demande, retiré à la fin).
import { gsap } from "../motion";

export function incision(a, b, { eclair = true } = {}) {
  const calque = document.createElement("div");
  calque.className = "mg-slash";
  calque.setAttribute("aria-hidden", "true");
  document.body.appendChild(calque);
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const longueur = Math.max(60, Math.hypot(dx, dy));
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  const tl = gsap.timeline({ onComplete: () => calque.remove() });

  // Les traits : ils jaillissent du départ, puis se résorbent vers l'arrivée. Chaque trait = une enveloppe tournée
  // une fois pour toutes (elle ne bouge plus) + une barre intérieure qui s'étire puis se résorbe. Changer le point
  // d'origine d'un élément déjà tourné le ferait sauter de plusieurs centaines de pixels (GSAP ne compense pas).
  const rad = Math.atan2(dy, dx);
  const nx = -Math.sin(rad);
  const ny = Math.cos(rad);
  for (let i = 0; i < 9; i += 1) {
    const trait = document.createElement("i");
    const barre = document.createElement("s");
    trait.appendChild(barre);
    const ecart = (i - 4) * 11 + (Math.random() - 0.5) * 10; // de part et d'autre du trajet
    const avance = Math.random() * longueur * 0.18; // départ un peu décalé le long du trajet
    const l = longueur * (0.55 + Math.random() * 0.5);
    const h = 1.5 + Math.random() * (i % 3 === 0 ? 7 : 3);
    Object.assign(trait.style, {
      left: `${a.x + nx * ecart + Math.cos(rad) * avance}px`,
      top: `${a.y + ny * ecart + Math.sin(rad) * avance - h / 2}px`,
      width: `${Math.min(l, longueur - avance + 40)}px`,
      height: `${h}px`,
      transform: `rotate(${angle}deg)`,
    });
    calque.appendChild(trait);
    const retard = Math.random() * 0.03;
    tl.fromTo(barre, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.09, ease: "power4.out" }, retard)
      .set(barre, { transformOrigin: "100% 50%" }, retard + 0.1)
      .to(barre, { scaleX: 0, duration: 0.17, ease: "power2.in" }, retard + 0.1);
  }

  // Les anneaux de poussière : départ, puis arrivée
  [a, b].forEach((pt, i) => {
    const anneau = document.createElement("b");
    Object.assign(anneau.style, { left: `${pt.x}px`, top: `${pt.y}px` });
    calque.appendChild(anneau);
    tl.fromTo(anneau, { scale: 0.15, opacity: 0.95 }, { scale: 1.5, opacity: 0, duration: 0.38, ease: "power2.out" }, i * 0.1);
  });

  // L'éclair : une bande en négatif le long du trajet, le temps de deux images (jamais tout l'écran : il éblouirait)
  if (eclair) {
    const flash = document.createElement("em");
    Object.assign(flash.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${longueur}px` });
    calque.appendChild(flash);
    tl.fromTo(flash, { rotate: angle, scaleY: 1, opacity: 1, transformOrigin: "0% 50%" }, { scaleY: 0.05, opacity: 0, duration: 0.09, ease: "power3.out" }, 0.03);
  }
  return tl;
}
