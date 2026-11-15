// Le compagnon sur téléphone : le modèle 3D n'y est pas chargé (trop lourd, et rien ne s'y survole), alors Arthur y
// passe en image détourée. À chaque section de l'accueil, il surgit dans le coin (écrasé puis étiré, avec des traits de
// vitesse), dit son mot (les mêmes textes que le compagnon 3D, lus dans le DOM), puis redescend. Un toucher : il saute
// et salue. Absent en mouvement réduit (le kit n'est pas chargé) et si le visiteur a masqué le compagnon.
import { gsap } from "../motion";

const ZONES = [
  ["c1", ".mg-chap:not(.mg-chap--worlds)", "marche"],
  ["c2", ".mg-chap--worlds", "salut"],
  ["work", "#work", "course"],
  ["fil", ".fil", "salut"],
  ["skills", "#skills", "marche"],
  ["certs", ".certs", "salut"],
  ["footer", ".footer", "salut"],
];
const POSES = { marche: "pose-marche", salut: "pose-salut", course: "pose-course" };
const petit = () => window.matchMedia("(max-width: 899px), (pointer: coarse)").matches;

let actif = null;

function monter() {
  const base = `${process.env.PUBLIC_URL || ""}/avatar/`;
  const el = document.createElement("div");
  el.className = "ax-mini";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<p class="ax-mini__tip"></p><i class="ax-mini__vitesse"></i><img alt="" width="90" height="173" />';
  document.body.appendChild(el);
  const img = el.querySelector("img");
  const tip = el.querySelector(".ax-mini__tip");
  // Les images sont préchargées pour qu'il ne surgisse jamais à moitié affiché
  Object.values(POSES).forEach((nom) => {
    const i = new Image();
    i.src = `${base}${nom}.webp`;
  });

  let zone = "";
  let sortie = null;
  const montrer = (nom, pose) => {
    // (au doigt, « Survole une catégorie » n'a pas de sens : pas de bulle pour l'index des projets)
    const texte = nom === "work" ? null : document.querySelector(`.mg-buddy__tip [data-tip="${nom}"]`);
    tip.textContent = texte ? texte.textContent : "";
    img.src = `${base}${POSES[pose]}.webp`;
    gsap.killTweensOf([el, img, tip]);
    if (sortie) sortie.kill();
    el.classList.add("is-on");
    gsap
      .timeline()
      .fromTo(el, { yPercent: 130 }, { yPercent: 0, duration: 0.42, ease: "back.out(1.7)" }, 0)
      .fromTo(img, { scaleX: 0.7, scaleY: 1.3 }, { scaleX: 1, scaleY: 1, duration: 0.5, ease: "elastic.out(1.2, 0.4)" }, 0.12)
      .fromTo(el.querySelector(".ax-mini__vitesse"), { autoAlpha: 1, scaleY: 1 }, { autoAlpha: 0, scaleY: 1.6, duration: 0.45 }, 0)
      .fromTo(tip, { scale: 0, autoAlpha: 1 }, { scale: 1, duration: 0.3, ease: "back.out(2)" }, 0.35);
    sortie = gsap
      .timeline({ delay: 3.6 })
      .to(tip, { scale: 0, duration: 0.18, ease: "power2.in" }, 0)
      .to(el, { yPercent: 130, duration: 0.35, ease: "power2.in" }, 0.1)
      .add(() => el.classList.remove("is-on"));
  };

  // Un toucher : il saute et salue
  const sauter = () => {
    img.src = `${base}${POSES.salut}.webp`;
    gsap
      .timeline()
      .to(img, { scaleX: 1.15, scaleY: 0.85, duration: 0.08 })
      .to(img, { y: -28, scaleX: 0.9, scaleY: 1.12, duration: 0.18, ease: "power2.out" })
      .to(img, { y: 0, scaleX: 1, scaleY: 1, duration: 0.2, ease: "power2.in" })
      .to(img, { scaleX: 1.1, scaleY: 0.9, duration: 0.06, yoyo: true, repeat: 1 });
  };
  el.addEventListener("pointerdown", sauter);

  let raf = 0;
  const verifier = () => {
    raf = 0;
    const y = window.innerHeight * 0.55;
    const trouvee = ZONES.find(([, sel]) => {
      const z = document.querySelector(sel);
      if (!z) return false;
      const r = z.getBoundingClientRect();
      return r.top <= y && r.bottom > y;
    });
    const nom = trouvee ? trouvee[0] : "";
    if (nom && nom !== zone) montrer(nom, trouvee[2]);
    zone = nom;
  };
  const surDefile = () => {
    if (!raf) raf = requestAnimationFrame(verifier);
  };
  window.addEventListener("scroll", surDefile, { passive: true });

  return () => {
    window.removeEventListener("scroll", surDefile);
    if (raf) cancelAnimationFrame(raf);
    gsap.killTweensOf([el, img, tip]);
    if (sortie) sortie.kill();
    el.remove();
  };
}

// Appelé à chaque changement de page : le petit compagnon n'existe que sur l'accueil, sur téléphone
export function verifierMini() {
  let masque = false;
  try {
    masque = window.sessionStorage.getItem("mgBuddyOff") === "1";
  } catch (e) {
    masque = false;
  }
  const veut = !!document.querySelector(".manga") && petit() && !masque;
  if (veut && !actif) actif = monter();
  else if (!veut && actif) {
    actif();
    actif = null;
  }
}
