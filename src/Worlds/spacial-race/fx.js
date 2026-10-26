import { TAU, clamp, lerp, rnd, pick, outCubic, rgba } from "../shared/fxkit";

const YELLOW = "#f2b521";
const FLAME = "#ff7a1a";
const INK = "#1b1d20"; // monde clair : les traits sont sombres, du blanc ne se verrait pas

// Clic dans Spacial Race : on passe en vitesse lumière. Des traits partent en étoile du point cliqué (tunnel
// d'accélération), la flamme de la voiture gonfle, un halo orange éclaire l'asphalte et un anneau de choc balaie la route.
export default function spawn(x, y, { add, W, H }) {
  const far = Math.hypot(W, H);
  const streaks = Array.from({ length: 70 }, () => ({ a: rnd(0, TAU), d: rnd(0.05, 0.4), len: rnd(0.12, 0.55), w: rnd(1, 3.4), color: pick([INK, INK, FLAME, YELLOW]) }));
  add({
    dur: 1.05,
    draw(ctx, t) {
      const k = outCubic(clamp(t / 1.1));
      const fade = 1 - clamp((t - 0.55) / 0.45);
      streaks.forEach((s) => {
        const head = lerp(s.d * 0.3, 0.85, k) * far * 0.62;
        const tail = Math.max(0, head - s.len * far * (0.16 + 0.22 * k));
        ctx.strokeStyle = rgba(s.color, fade * 0.85);
        ctx.lineWidth = s.w * (0.4 + k);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(s.a) * tail, y + Math.sin(s.a) * tail);
        ctx.lineTo(x + Math.cos(s.a) * head, y + Math.sin(s.a) * head);
        ctx.stroke();
      });
    },
  });

  add({
    dur: 0.8,
    draw(ctx, t) {
      const r = 40 + outCubic(t) * 230;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba("#ffb347", 0.75 * (1 - t)));
      g.addColorStop(0.45, rgba(FLAME, 0.4 * (1 - t)));
      g.addColorStop(1, rgba(FLAME, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    },
  });

  add({
    dur: 0.9,
    draw(ctx, t) {
      ctx.strokeStyle = rgba(INK, (1 - t) * 0.85);
      ctx.lineWidth = 5 * (1 - t) + 1;
      ctx.beginPath();
      ctx.ellipse(x, y, 12 + outCubic(t) * 260, (12 + outCubic(t) * 260) * 0.34, 0, 0, TAU);
      ctx.stroke();
    },
  });
}
