import { TAU, clamp, rnd, pick, outCubic, rgba, roundRect } from "../shared/fxkit";

const COLORS = ["#f4c430", "#e83a3a", "#3ac36b", "#3b82d8", "#e83fb0", "#fff3d1"];
const PAPER = "#fff3d1";
const RED = "#c8202a";

// Clic dans Funfair : un feu d'artifice d'ampoules colorées retombe sous l'effet de la gravité, un ticket
// « ADMIT ONE » est projeté en tournoyant et un anneau de lumière jaune s'étend.
export default function spawn(x, y, { add }) {
  const bulbs = Array.from({ length: 38 }, () => {
    const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05);
    const v = rnd(180, 560);
    return { vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: rnd(2.6, 5.4), color: pick(COLORS), ph: rnd(0, TAU) };
  });
  const DUR = 1.7;
  add({
    dur: DUR,
    draw(ctx, t) {
      ctx.globalCompositeOperation = "lighter";
      const tau = t * DUR;
      bulbs.forEach((b) => {
        for (let k = 5; k >= 0; k--) {
          const tt = Math.max(0, tau - k * 0.028);
          const px = x + b.vx * tt;
          const py = y + b.vy * tt + 560 * tt * tt;
          const a = (1 - t) * (1 - k / 6) * (0.65 + 0.35 * Math.sin(tau * 22 + b.ph));
          ctx.fillStyle = rgba(b.color, a);
          ctx.beginPath();
          ctx.arc(px, py, b.r * (k ? 0.6 : 1), 0, TAU);
          ctx.fill();
          if (!k) {
            ctx.fillStyle = rgba("#ffffff", a * 0.7);
            ctx.beginPath();
            ctx.arc(px, py, b.r * 0.35, 0, TAU);
            ctx.fill();
          }
        }
      });
    },
  });

  const vx = rnd(-120, 120);
  const spin = rnd(-6, 6);
  add({
    dur: 1.9,
    draw(ctx, t) {
      const tau = t * 1.9;
      const px = x + vx * tau;
      const py = y - 470 * tau + 700 * tau * tau;
      ctx.translate(px, py);
      ctx.rotate(spin * tau);
      ctx.globalAlpha = 1 - clamp((t - 0.7) / 0.3);
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = PAPER;
      roundRect(ctx, -44, -19, 88, 38, 5);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = "#0b0d1c";
      ctx.beginPath();
      ctx.arc(-44, 0, 6, 0, TAU);
      ctx.arc(44, 0, 6, 0, TAU);
      ctx.fill();
      ctx.fillStyle = RED;
      ctx.font = "800 11px Rubik, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ADMIT ONE", 0, -2);
      ctx.fillStyle = "#0b0d1c";
      ctx.font = "600 8px Rubik, system-ui, sans-serif";
      ctx.fillText(`N° ${String(Math.floor(rndSeed(x, y) * 9000 + 1000))}`, 0, 11);
    },
  });

  add({
    dur: 0.8,
    draw(ctx, t) {
      ctx.strokeStyle = rgba("#f4c430", (1 - t) * 0.9);
      ctx.lineWidth = 4 * (1 - t) + 1;
      ctx.shadowColor = "#f4c430";
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(x, y, 8 + outCubic(t) * 130, 0, TAU);
      ctx.stroke();
    },
  });
}

// Numéro de ticket stable pendant l'effet (dépend du point de clic)
function rndSeed(x, y) {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}
