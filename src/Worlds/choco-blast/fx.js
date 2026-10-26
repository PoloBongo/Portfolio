import { TAU, clamp, rnd, pick, outBack, outCubic, rgba } from "../shared/fxkit";

const DARK = "#2e1403";
const MILK = "#5a2a12";
const CARAMEL = "#e0903f";
const PINK = "#f0158f";
const YELLOW = "#f5c400";

// Clic dans Choco Blast : le chocolat éclabousse. Une tache en étoile aux contours lissés, des gouttes projetées
// qui retombent, des filets qui coulent et des vermicelles roses et jaunes.
export default function spawn(x, y, { add }) {
  const n = 13;
  const spikes = Array.from({ length: n }, (_, i) => ({ a: (i / n) * TAU, r: i % 2 ? rnd(30, 52) : rnd(62, 118) }));
  const drips = Array.from({ length: 5 }, () => ({ dx: rnd(-46, 46), w: rnd(7, 15), len: rnd(70, 190) }));

  add({
    dur: 2.3,
    draw(ctx, t) {
      const grow = outBack(clamp(t / 0.22));
      const fade = 1 - clamp((t - 0.72) / 0.28);
      ctx.globalAlpha = fade;
      const pts = spikes.map((s) => [x + Math.cos(s.a) * s.r * grow, y + Math.sin(s.a) * s.r * grow]);
      // contour lissé par des courbes passant par les milieux
      ctx.beginPath();
      const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
      const first = mid(pts[n - 1], pts[0]);
      ctx.moveTo(first[0], first[1]);
      pts.forEach((p, i) => {
        const m = mid(p, pts[(i + 1) % n]);
        ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
      });
      ctx.closePath();
      const g = ctx.createRadialGradient(x - 20, y - 24, 4, x, y, 130);
      g.addColorStop(0, "#7a3b1d");
      g.addColorStop(0.6, MILK);
      g.addColorStop(1, DARK);
      ctx.fillStyle = g;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 24;
      ctx.shadowOffsetY = 8;
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = rgba(CARAMEL, 0.9);
      ctx.stroke();
      // reflet brillant
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.beginPath();
      ctx.ellipse(x - 26 * grow, y - 30 * grow, 22 * grow, 9 * grow, -0.6, 0, TAU);
      ctx.fill();
      // filets qui coulent
      drips.forEach((d) => {
        const len = d.len * outCubic(clamp((t - 0.12) / 0.7));
        const dx = x + d.dx;
        ctx.fillStyle = MILK;
        ctx.beginPath();
        ctx.moveTo(dx - d.w / 2, y + 20);
        ctx.lineTo(dx - d.w / 2, y + 20 + len);
        ctx.arc(dx, y + 20 + len, d.w / 2, Math.PI, 0, true);
        ctx.lineTo(dx + d.w / 2, y + 20);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = rgba(CARAMEL, 0.8);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(dx - d.w / 2 + 1, y + 20 + len * 0.2);
        ctx.lineTo(dx - d.w / 2 + 1, y + 20 + len);
        ctx.stroke();
      });
    },
  });

  const drops = Array.from({ length: 16 }, () => ({ a: rnd(-Math.PI * 0.95, -Math.PI * 0.05), v: rnd(160, 470), r: rnd(3, 9) }));
  add({
    dur: 1.2,
    draw(ctx, t) {
      const tau = t * 1.2;
      drops.forEach((d) => {
        const px = x + Math.cos(d.a) * d.v * tau;
        const py = y + Math.sin(d.a) * d.v * tau + 760 * tau * tau;
        ctx.fillStyle = rgba(MILK, 1 - t * t);
        ctx.beginPath();
        ctx.ellipse(px, py, d.r * 0.85, d.r * (1 + 0.5 * (1 - t)), Math.atan2(2 * 760 * tau + Math.sin(d.a) * d.v, Math.cos(d.a) * d.v) - Math.PI / 2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(CARAMEL, (1 - t) * 0.8);
        ctx.beginPath();
        ctx.arc(px - d.r * 0.3, py - d.r * 0.3, d.r * 0.25, 0, TAU);
        ctx.fill();
      });
    },
  });

  const sprinkles = Array.from({ length: 24 }, () => ({ a: rnd(0, TAU), v: rnd(120, 360), rot: rnd(0, TAU), spin: rnd(-8, 8), color: pick([PINK, YELLOW, "#fff3cf"]) }));
  add({
    dur: 1.4,
    draw(ctx, t) {
      const tau = t * 1.4;
      sprinkles.forEach((s) => {
        const px = x + Math.cos(s.a) * s.v * outCubic(t) * 0.8;
        const py = y + Math.sin(s.a) * s.v * outCubic(t) * 0.8 + 380 * tau * tau;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(s.rot + s.spin * tau);
        ctx.fillStyle = rgba(s.color, 1 - t);
        ctx.fillRect(-7, -2, 14, 4);
        ctx.restore();
      });
    },
  });
}
