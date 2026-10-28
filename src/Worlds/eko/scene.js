// Scène d'Eko : la marketplace en Memphis, comme le site d'origine (dégradé pêche-rose, formes plates et ombres
// dures). Les formes fuient le curseur et reviennent à leur place (ressorts), les trois abonnements pendent d'un
// fil et se balancent quand le curseur les frôle, la fenêtre sombre est celle de « Vendre sur Eko ».
const INK = "#1b1b1f";
const GREEN = "#5cc552";
const CORAL = "#ec4e3a";
const BLUE = "#3369d0";
const GOLD = "#ffd23f";

// Étoile à n pointes dans un repère 100 × 100
const star = (n, outer, inner) =>
  Array.from({ length: n * 2 }, (_, i) => {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const r = i % 2 ? inner : outer;
    return `${(50 + Math.cos(a) * r).toFixed(1)},${(50 + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");

const SVG = {
  disc: `<circle cx="50" cy="50" r="46" fill="${GREEN}"/><circle cx="56" cy="55" r="46" fill="none" stroke="${INK}" stroke-width="3"/>`,
  dot: `<circle cx="50" cy="50" r="46" fill="${INK}"/>`,
  sun: `<circle cx="50" cy="50" r="46" fill="${GOLD}"/>`,
  ring: `<circle cx="50" cy="50" r="40" fill="none" stroke="${CORAL}" stroke-width="12"/>`,
  burst: `<polygon points="${star(8, 48, 24)}" fill="${CORAL}"/>`,
  flower: `<polygon points="${star(12, 48, 30)}" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`,
  tri: `<polygon points="50,6 96,92 4,92" fill="${INK}"/>`,
  plus: `<path d="M38 4h24v34h34v24H62v34H38V62H4V38h34z" fill="${BLUE}"/>`,
  zig: `<polyline points="2,70 18,30 34,70 50,30 66,70 82,30 98,70" fill="none" stroke="${INK}" stroke-width="9" stroke-linejoin="round" stroke-linecap="round"/>`,
  grid: Array.from({ length: 12 }, (_, i) => `<circle cx="${18 + (i % 4) * 21}" cy="${24 + Math.floor(i / 4) * 26}" r="5.5" fill="${INK}"/>`).join(""),
};

// x, y, s : coin haut-gauche et taille en cqw ; rot : angle de départ ; spin : rotation lente ; ratio : hauteur / largeur
const SHAPES = [
  { k: "disc", x: 41, y: 40, s: 13, spin: 0.05 },
  { k: "dot", x: 38, y: 55, s: 4.4 },
  { k: "burst", x: 88, y: 39, s: 11, spin: -0.12 },
  { k: "flower", x: 60, y: 41, s: 15, spin: 0.08 },
  { k: "tri", x: 78, y: 49, s: 8, rot: 14, spin: 0.1 },
  { k: "plus", x: 92, y: 2.5, s: 5.6, spin: 0.14 },
  { k: "zig", x: 42, y: 0.6, s: 8, ratio: 0.5 },
  { k: "grid", x: 93, y: 51, s: 6 },
  { k: "ring", x: 2.5, y: 56, s: 6.4, spin: -0.1 },
  { k: "sun", x: 50, y: 55.5, s: 4.8 },
];

const PLANS = [
  { tier: "Bronze", price: "4,99", color: "#ffd9bf", x: 55 },
  { tier: "Gold", price: "9,99", color: "#ffe7a3", x: 70 },
  { tier: "Diamant", price: "19,99", color: "#cfe3ff", x: 85 },
];
const PLAN_W = 12.4;
const PLAN_H = 18.5;
const STRING_Y = 9.2;

export default function build(stage, { frame, pointer }) {
  const shapes = SHAPES.map(
    ({ k, x, y, s, rot = 0, ratio = 0.5 }, i) =>
      `<i class="w-ek__sh w-ek__sh--${k}" style="left:${x}cqw;top:${y}cqw;width:${s}cqw;height:${k === "zig" ? s * ratio : s}cqw;--r:${rot}deg;--d:${(i * 0.7).toFixed(1)}s"><svg viewBox="0 0 100 100" preserveAspectRatio="none" overflow="visible">${SVG[k]}</svg></i>`
  ).join("");

  const string = `<svg class="w-ek__string" viewBox="0 0 100 62.5" preserveAspectRatio="none"><path d="M46 ${STRING_Y - 1.4} Q70 ${STRING_Y + 2.2} 96 ${STRING_Y - 1.4}" fill="none" stroke="${INK}" stroke-width="0.35" stroke-linecap="round"/></svg>`;

  const plans = PLANS.map(
    ({ tier, price, color, x }, i) => `
    <div class="w-ek__plan" style="left:${x - PLAN_W / 2}cqw;top:${STRING_Y - 0.4}cqw;--c:${color};--i:${i}">
      <i class="w-ek__peg"></i>
      <div class="w-ek__card">
        <b class="w-ek__tier">${tier}</b>
        <span class="w-ek__price">${price}<small> €/mois</small></span>
        <i class="w-ek__bar"></i><i class="w-ek__bar w-ek__bar--s"></i><i class="w-ek__bar"></i>
        <u class="w-ek__cta">S'abonner</u>
      </div>
    </div>`
  ).join("");

  const win = `
    <div class="w-ek__win">
      <span class="w-ek__dots"><i></i><i></i><i></i></span>
      <b class="w-ek__wtitle">VENDRE SUR EKO</b>
      <i class="w-ek__field"></i><i class="w-ek__field w-ek__field--s"></i><i class="w-ek__field"></i>
      <u class="w-ek__login">SE CONNECTER</u>
    </div>`;

  stage.innerHTML = `<i class="w-ek__glow"></i>${shapes}${string}${plans}${win}`;

  const parts = Array.from(stage.querySelectorAll(".w-ek__sh")).map((el, i) => {
    const s = SHAPES[i];
    const h = s.k === "zig" ? s.s * (s.ratio || 0.5) : s.s;
    return { el, hx: s.x + s.s / 2, hy: s.y + h / 2, ox: 0, oy: 0, vx: 0, vy: 0, rot: s.rot || 0, spin: s.spin || 0 };
  });
  const hung = Array.from(stage.querySelectorAll(".w-ek__plan")).map((el, i) => ({ el, cx: PLANS[i].x, a: 0, w: 0, i }));

  let last = 0;
  let prevX = 0;
  frame((t) => {
    const dt = last ? Math.min(2.5, (t - last) / 16.67) : 1;
    last = t;
    const p = pointer(t);
    const k = 100 / p.w;
    const mx = p.x * k;
    const my = p.y * k;
    const vx = (mx - prevX) / dt;
    prevX = mx;

    // Les formes fuient le curseur, puis un ressort les ramène
    const R = 11;
    parts.forEach((q) => {
      const dx = q.hx + q.ox - mx;
      const dy = q.hy + q.oy - my;
      const d = Math.hypot(dx, dy) || 1;
      if (d < R) {
        const f = (1 - d / R) * (1 - d / R) * 2.4 * dt;
        q.vx += (dx / d) * f;
        q.vy += (dy / d) * f;
      }
      q.vx -= q.ox * 0.035 * dt;
      q.vy -= q.oy * 0.035 * dt;
      q.vx *= 0.9;
      q.vy *= 0.9;
      q.ox += q.vx * dt;
      q.oy += q.vy * dt;
      q.rot += (q.spin + q.vx * 1.4) * dt;
      q.el.style.transform = `translate3d(${q.ox.toFixed(2)}cqw,${q.oy.toFixed(2)}cqw,0) rotate(${q.rot.toFixed(1)}deg)`;
    });

    // Les cartes pendent de leur pince : un pendule que le passage du curseur pousse
    hung.forEach((h) => {
      const near = Math.max(0, 1 - Math.abs(mx - h.cx) / 9) * (my > STRING_Y && my < STRING_Y + PLAN_H + 4 ? 1 : 0.12);
      const rest = Math.sin(t * 0.0011 + h.i * 2.1) * 2.2;
      h.w += (-0.02 * (h.a - rest) - 0.035 * h.w + vx * near * 0.16) * dt;
      h.a = Math.max(-26, Math.min(26, h.a + h.w * dt));
      h.el.style.transform = `rotate(${h.a.toFixed(2)}deg)`;
    });
  });
}
