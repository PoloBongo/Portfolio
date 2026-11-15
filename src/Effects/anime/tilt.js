// Cases en 3D : sous le pointeur, la case d'un projet penche vers lui (vraie perspective), avance un peu, et une trame
// de points suit le pointeur sur l'image ; au départ du pointeur, elle revient avec un ressort (un léger rebond).
// Écrit dans les propriétés CSS « rotate » et « translate » (et non « transform ») : les animations GSAP qui
// déplacent déjà ces cases (soulèvement au clic, vitrine des hubs) continuent de marcher.

const TARGETS = ".sc-stage, .proj__media, .fil__media";
const MAX_X = 6; // degrés, autour de l'axe horizontal
const MAX_Y = 9; // degrés, autour de l'axe vertical
const LIFT = 26; // px vers le lecteur

const springs = new Map();
let raf = 0;

const tick = () => {
  raf = 0;
  springs.forEach((s, el) => {
    // ressort amorti (raide, un rebond visible au retour)
    ["x", "y", "z"].forEach((k) => {
      const a = (s.to[k] - s[k]) * 0.14;
      s.v[k] = (s.v[k] + a) * 0.76;
      s[k] += s.v[k];
    });
    const angle = Math.hypot(s.x, s.y);
    el.style.rotate = angle < 0.01 ? "" : `${s.x.toFixed(3)} ${s.y.toFixed(3)} 0 ${angle.toFixed(2)}deg`;
    el.style.translate = Math.abs(s.z) < 0.05 ? "" : `0 0 ${s.z.toFixed(1)}px`;
    const still = Math.abs(s.to.x - s.x) + Math.abs(s.to.y - s.y) + Math.abs(s.to.z - s.z) < 0.02 &&
      Math.abs(s.v.x) + Math.abs(s.v.y) + Math.abs(s.v.z) < 0.02;
    if (still && !s.on) {
      el.style.rotate = "";
      el.style.translate = "";
      springs.delete(el);
    }
  });
  if (springs.size) raf = requestAnimationFrame(tick);
};

const springOf = (el) => {
  let s = springs.get(el);
  if (!s) {
    s = { x: 0, y: 0, z: 0, v: { x: 0, y: 0, z: 0 }, to: { x: 0, y: 0, z: 0 }, on: false };
    springs.set(el, s);
    if (el.parentElement && !el.parentElement.style.perspective) el.parentElement.style.perspective = "1100px";
  }
  return s;
};

let current = null;

const leave = () => {
  if (!current) return;
  const s = springOf(current);
  s.on = false;
  s.to = { x: 0, y: 0, z: 0 };
  current.classList.remove("ax-tilt");
  current = null;
  if (!raf) raf = requestAnimationFrame(tick);
};

const onMove = (event) => {
  if (event.pointerType !== "mouse") return;
  const el = event.target.closest && event.target.closest(TARGETS);
  if (el !== current) leave();
  if (!el) return;
  current = el;
  const r = el.getBoundingClientRect();
  const nx = Math.max(-1, Math.min(1, ((event.clientX - r.left) / r.width) * 2 - 1));
  const ny = Math.max(-1, Math.min(1, ((event.clientY - r.top) / r.height) * 2 - 1));
  const s = springOf(el);
  s.on = true;
  // axe de rotation : (rx, ry) ; le côté visé s'enfonce
  s.to = { x: -ny * MAX_X, y: nx * MAX_Y, z: LIFT };
  el.classList.add("ax-tilt");
  el.style.setProperty("--gx", `${((nx + 1) * 50).toFixed(1)}%`);
  el.style.setProperty("--gy", `${((ny + 1) * 50).toFixed(1)}%`);
  if (!raf) raf = requestAnimationFrame(tick);
};

export function startTilt() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {};
  document.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerleave", leave);
  window.addEventListener("blur", leave);
  return () => {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerleave", leave);
    window.removeEventListener("blur", leave);
  };
}
