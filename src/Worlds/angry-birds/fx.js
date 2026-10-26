import { TAU, clamp, rnd, pick, outCubic, rgba } from "../shared/fxkit";

const RED = "#e0242e";
const FEATHERS = ["#e0242e", "#b81c25", "#f6d9b0", "#ffffff"];
const WOOD = "#b9803f";
const STAR = "#ffd23f";

// Clic dans Angry Birds : l'oiseau percute le point cliqué. Une pluie de plumes rouges, un nuage de poussière,
// des planches qui volent en éclats et trois étoiles qui tournent comme sur un oiseau assommé.
export default function spawn(x, y, { add }) {
  const feathers = Array.from({ length: 22 }, () => ({ a: rnd(0, TAU), v: rnd(120, 380), spin: rnd(-8, 8), color: pick(FEATHERS), len: rnd(14, 26) }));
  add({
    dur: 1.6,
    draw(ctx, t) {
      feathers.forEach((f) => {
        const tau = t * 1.6;
        const d = f.v * outCubic(clamp(t / 0.6)) * 0.7;
        const px = x + Math.cos(f.a) * d + Math.sin(tau * 5 + f.spin) * 10;
        const py = y + Math.sin(f.a) * d + tau * tau * 70;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(f.spin * tau);
        ctx.fillStyle = rgba(f.color, 1 - clamp((t - 0.55) / 0.45));
        ctx.beginPath();
        ctx.ellipse(0, 0, f.len / 2, 4, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      });
    },
  });

  add({
    dur: 0.9,
    draw(ctx, t) {
      [[-1, 0], [1, 0], [0, -1]].forEach(([dx, dy], i) => {
        const r = 14 + outCubic(t) * (50 + i * 10);
        ctx.fillStyle = rgba("#e6ecef", (1 - t) * 0.7);
        ctx.beginPath();
        ctx.arc(x + dx * outCubic(t) * 52, y + dy * outCubic(t) * 40 + 10, r * 0.7, 0, TAU);
        ctx.fill();
      });
    },
  });

  const planks = Array.from({ length: 8 }, () => ({ a: rnd(-Math.PI * 0.95, -Math.PI * 0.05), v: rnd(220, 480), spin: rnd(-9, 9), w: rnd(14, 30) }));
  add({
    dur: 1.4,
    draw(ctx, t) {
      const tau = t * 1.4;
      planks.forEach((p) => {
        const px = x + Math.cos(p.a) * p.v * tau;
        const py = y + Math.sin(p.a) * p.v * tau + 700 * tau * tau;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(p.spin * tau);
        ctx.globalAlpha = 1 - clamp((t - 0.6) / 0.4);
        ctx.fillStyle = WOOD;
        ctx.strokeStyle = "#2a1d12";
        ctx.lineWidth = 1.5;
        ctx.fillRect(-p.w / 2, -5, p.w, 10);
        ctx.strokeRect(-p.w / 2, -5, p.w, 10);
        ctx.restore();
      });
    },
  });

  add({
    dur: 1.5,
    draw(ctx, t) {
      const fade = 1 - clamp((t - 0.7) / 0.3);
      for (let i = 0; i < 3; i++) {
        const a = t * 7 + (i / 3) * TAU;
        const sx = x + Math.cos(a) * 34;
        const sy = y - 54 + Math.sin(a) * 9;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(t * 6);
        ctx.globalAlpha = fade;
        ctx.fillStyle = STAR;
        ctx.strokeStyle = "#a8760b";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let j = 0; j < 10; j++) {
          const r = j % 2 ? 4.5 : 10;
          const b = (j / 10) * TAU - Math.PI / 2;
          ctx.lineTo(Math.cos(b) * r, Math.sin(b) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      ctx.strokeStyle = rgba(RED, (1 - t) * 0.9);
      ctx.lineWidth = 4 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(x, y, 8 + outCubic(t) * 70, 0, TAU);
      ctx.stroke();
    },
  });
}
