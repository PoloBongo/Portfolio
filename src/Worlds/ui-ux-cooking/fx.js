import { TAU, clamp, rnd, pick, outCubic, outBack, rgba } from "../shared/fxkit";

const FLAME = "#ffa31a";
const TABLE = "#e0782f";
const FRIDGE = "#4ab8d8";

// Clic dans UI UX Cooking : la poêle flambe. Un jet de flammes s'élève du point cliqué, des ingrédients (tomate,
// fromage, champignon) sont lancés en l'air et retombent en tournant, une fumée chaude monte et un « ding » de
// cuisson (anneau de table) se propage.
export default function spawn(x, y, { add }) {
  add({
    dur: 1.1,
    draw(ctx, t) {
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 9; i++) {
        const k = clamp(t * 1.2 - i * 0.06);
        if (k <= 0) continue;
        const h = Math.sin(k * Math.PI) * (70 + (i % 3) * 36);
        const w = 22 - i * 1.3;
        const px = x + (i - 4) * 5 + Math.sin(t * 22 + i) * 5;
        const g = ctx.createRadialGradient(px, y - h * 0.4, 0, px, y - h * 0.4, w + h * 0.45);
        g.addColorStop(0, rgba("#fff3b0", 0.85 * (1 - k)));
        g.addColorStop(0.5, rgba(FLAME, 0.55 * (1 - k)));
        g.addColorStop(1, rgba(FLAME, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(px, y - h * 0.5, w, h * 0.7 + 8, 0, 0, TAU);
        ctx.fill();
      }
    },
  });

  const items = Array.from({ length: 6 }, () => ({
    kind: pick(["tomato", "cheese", "mushroom"]),
    vx: rnd(-170, 170),
    vy: rnd(-640, -420),
    spin: rnd(-9, 9),
  }));
  add({
    dur: 1.6,
    draw(ctx, t) {
      const tau = t * 1.6;
      items.forEach((it) => {
        const px = x + it.vx * tau;
        const py = y + it.vy * tau + 900 * tau * tau;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(it.spin * tau);
        ctx.globalAlpha = 1 - clamp((t - 0.7) / 0.3);
        if (it.kind === "tomato") {
          ctx.fillStyle = "#d6362d";
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, TAU);
          ctx.fill();
          ctx.fillStyle = "#3f9b4a";
          ctx.fillRect(-5, -14, 10, 4);
        } else if (it.kind === "cheese") {
          ctx.fillStyle = "#f6c542";
          ctx.beginPath();
          ctx.moveTo(-14, 9);
          ctx.lineTo(14, 9);
          ctx.lineTo(14, -9);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = "#e0a921";
          ctx.beginPath();
          ctx.arc(5, 3, 2.4, 0, TAU);
          ctx.fill();
        } else {
          ctx.fillStyle = "#f3e4c8";
          ctx.beginPath();
          ctx.arc(0, -3, 12, Math.PI, 0);
          ctx.fill();
          ctx.fillRect(-4, -3, 8, 12);
        }
        ctx.restore();
      });
    },
  });

  add({
    dur: 1.7,
    draw(ctx, t) {
      for (let i = 0; i < 4; i++) {
        const k = clamp(t * 1.15 - i * 0.12);
        if (k <= 0) continue;
        ctx.fillStyle = rgba("#7a4a2a", (1 - k) * 0.4);
        ctx.beginPath();
        ctx.arc(x + Math.sin(k * 5 + i) * 22, y - 30 - outCubic(k) * (80 + i * 22), 14 + k * 30, 0, TAU);
        ctx.fill();
      }
    },
  });

  add({
    dur: 0.8,
    draw(ctx, t) {
      const s = outBack(clamp(t / 0.25));
      ctx.strokeStyle = rgba(FRIDGE, (1 - t) * 0.9);
      ctx.lineWidth = 3 * (1 - t) + 1;
      ctx.beginPath();
      ctx.ellipse(x, y + 8, (16 + outCubic(t) * 120) * s, (16 + outCubic(t) * 120) * 0.35 * s, 0, 0, TAU);
      ctx.stroke();
      ctx.strokeStyle = rgba(TABLE, (1 - t) * 0.8);
      ctx.beginPath();
      ctx.ellipse(x, y + 8, 10 + outCubic(t) * 70, (10 + outCubic(t) * 70) * 0.35, 0, 0, TAU);
      ctx.stroke();
    },
  });
}
