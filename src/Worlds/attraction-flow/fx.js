import { TAU, clamp, rnd, pick, outCubic, outBack, rgba, roundRect } from "../shared/fxkit";

const COLORS = ["#f2994a", "#e04a5f", "#3c8dde", "#f2c14e", "#2f9e6e", "#e84fa8"];
const GOLD = "#f2c14e";
const INK = "#1e2a24";

// Clic dans Attraction Flow : une pièce de plus dans la caisse du parc. Une pluie de pièces d'or jaillit du clic et
// retombe en tournant, un « +10 » monte sur un petit panneau, et des ballons de toutes les couleurs s'envolent.
export default function spawn(x, y, { add }) {
  const coins = Array.from({ length: 14 }, () => ({ vx: rnd(-190, 190), vy: rnd(-560, -340), spin: rnd(6, 14), r: rnd(9, 14) }));
  add({
    dur: 1.5,
    draw(ctx, t) {
      const tau = t * 1.5;
      coins.forEach((c) => {
        const px = x + c.vx * tau;
        const py = y + c.vy * tau + 960 * tau * tau;
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(Math.abs(Math.cos(tau * c.spin)) * 0.85 + 0.15, 1);
        ctx.globalAlpha = 1 - clamp((t - 0.7) / 0.3);
        const g = ctx.createRadialGradient(-c.r * 0.3, -c.r * 0.3, 1, 0, 0, c.r);
        g.addColorStop(0, "#fff6bd");
        g.addColorStop(0.6, GOLD);
        g.addColorStop(1, "#b88a14");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, c.r, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = "#b88a14";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      });
    },
  });

  add({
    dur: 1.3,
    draw(ctx, t) {
      const s = outBack(clamp(t / 0.2));
      ctx.globalAlpha = 1 - clamp((t - 0.65) / 0.35);
      ctx.translate(x, y - 56 - outCubic(t) * 46);
      ctx.scale(s, s);
      ctx.fillStyle = "#fffaf0";
      ctx.shadowColor = "rgba(30,42,36,0.35)";
      ctx.shadowBlur = 14;
      ctx.shadowOffsetY = 5;
      roundRect(ctx, -40, -20, 80, 40, 12);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#3c8dde";
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = "800 22px 'Baloo 2', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("+10", 0, 2);
    },
  });

  const balloons = Array.from({ length: 7 }, (_, i) => ({ dx: (i - 3) * 26 + rnd(-8, 8), v: rnd(120, 230), color: pick(COLORS), sway: rnd(0, TAU), r: rnd(13, 19) }));
  add({
    dur: 2.3,
    draw(ctx, t) {
      balloons.forEach((b) => {
        const k = outCubic(t);
        const px = x + b.dx + Math.sin(t * 5 + b.sway) * 14;
        const py = y - 10 - k * b.v * 2.6;
        ctx.globalAlpha = 1 - clamp((t - 0.7) / 0.3);
        ctx.strokeStyle = rgba(INK, 0.55);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(px, py + b.r);
        ctx.quadraticCurveTo(px + 6, py + b.r + 22, x + b.dx * 0.3, y);
        ctx.stroke();
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.ellipse(px, py, b.r * 0.86, b.r, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.4)";
        ctx.beginPath();
        ctx.ellipse(px - b.r * 0.3, py - b.r * 0.35, b.r * 0.2, b.r * 0.32, -0.5, 0, TAU);
        ctx.fill();
      });
    },
  });
}
