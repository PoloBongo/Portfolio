// Le ballon d'Unity RL, tel qu'il est dans le jeu : gris clair, gros pentagones noirs, vu de face (un pentagone au centre,
// cinq coutures vers cinq pentagones en bordure, écrasés par la perspective), éclairage plat. Un dessin partagé par la scène
// du monde (SVG) et par l'effet de clic (canvas), pour que les deux ressemblent à l'image du projet.
// Repère : rayon 50, centre en (0, 0).
const DEG = Math.PI / 180;
const FILL = "#c6c6c3";
const BLACK = "#161616";
const SEAM = "#8c8c89";

const ring = (n, r, start) => Array.from({ length: n }, (_, i) => [Math.cos((start + (360 / n) * i) * DEG) * r, Math.sin((start + (360 / n) * i) * DEG) * r]);
const CENTER = ring(5, 17, -90); // pentagone central
const SPOKE_START = ring(5, 17, -90);
const SPOKE_END = ring(5, 31, -90);
// pentagones de bordure : centre à 43 (entre deux coutures), un sommet vers le centre, écrasés dans le sens radial
const RIM = Array.from({ length: 5 }, (_, j) => {
  const a = -54 + 72 * j;
  return { a, pts: ring(5, 12, 180).map(([x, y]) => [x * 0.6, y]) };
});
const seamTargets = (k) => [(k + 4) % 5, k].map((j) => [Math.cos((-54 + 72 * j) * DEG) * 35.8, Math.sin((-54 + 72 * j) * DEG) * 35.8]);

const poly = (pts) => pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`).join("") + "Z";

// SVG du ballon (à mettre dans un élément carré)
export const ballSvg = () => {
  const rim = RIM.map((p) => `<path transform="rotate(${p.a}) translate(43 0)" d="${poly(p.pts)}" fill="${BLACK}" stroke="${BLACK}" stroke-width="1.2" stroke-linejoin="round"/>`).join("");
  const seams = SPOKE_START.map((s, k) => {
    const e = SPOKE_END[k];
    return `<path d="M${s[0].toFixed(2)} ${s[1].toFixed(2)}L${e[0].toFixed(2)} ${e[1].toFixed(2)}${seamTargets(k)
      .map((t) => `M${e[0].toFixed(2)} ${e[1].toFixed(2)}L${t[0].toFixed(2)} ${t[1].toFixed(2)}`)
      .join("")}" fill="none" stroke="${SEAM}" stroke-width="1.1" stroke-linecap="round"/>`;
  }).join("");
  return `<svg class="rl-ball" viewBox="-50 -50 100 100" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="rl-ball-clip"><circle r="49"/></clipPath>
      <radialGradient id="rl-ball-shade" cx="-0.3" cy="-0.35" r="1.15">
        <stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".2"/>
      </radialGradient>
    </defs>
    <g clip-path="url(#rl-ball-clip)">
      <circle r="50" fill="${FILL}"/>
      ${seams}
      <path d="${poly(CENTER)}" fill="${BLACK}" stroke="${BLACK}" stroke-width="1.4" stroke-linejoin="round"/>
      ${rim}
      <circle r="50" fill="url(#rl-ball-shade)"/>
    </g>
    <circle r="49" fill="none" stroke="#2a2a2a" stroke-opacity=".55" stroke-width="1.2"/>
  </svg>`;
};

// Le même ballon en canvas, centré sur (0, 0), de rayon r
export function drawBall(ctx, r) {
  const k = r / 50;
  ctx.save();
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.arc(0, 0, 49, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = FILL;
  ctx.fillRect(-50, -50, 100, 100);
  ctx.strokeStyle = SEAM;
  ctx.lineWidth = 1.1;
  ctx.lineCap = "round";
  SPOKE_START.forEach((s, i) => {
    const e = SPOKE_END[i];
    ctx.beginPath();
    ctx.moveTo(s[0], s[1]);
    ctx.lineTo(e[0], e[1]);
    seamTargets(i).forEach((t) => {
      ctx.moveTo(e[0], e[1]);
      ctx.lineTo(t[0], t[1]);
    });
    ctx.stroke();
  });
  ctx.fillStyle = BLACK;
  ctx.strokeStyle = BLACK;
  ctx.lineJoin = "round";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  CENTER.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  RIM.forEach((p) => {
    ctx.save();
    ctx.rotate(p.a * DEG);
    ctx.translate(43, 0);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    p.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  const g = ctx.createRadialGradient(-15, -17.5, 0, -15, -17.5, 57);
  g.addColorStop(0, "rgba(255,255,255,0.28)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  g.addColorStop(0.75, "rgba(0,0,0,0.05)");
  g.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = g;
  ctx.fillRect(-50, -50, 100, 100);
  ctx.restore();
  ctx.save();
  ctx.scale(k, k);
  ctx.strokeStyle = "rgba(42,42,42,0.55)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, 49, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
