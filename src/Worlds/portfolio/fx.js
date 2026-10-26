import { TAU, clamp, lerp, rnd, outCubic, smooth, rgba } from "../shared/fxkit";

const VIOLET = "#bc63ff";
const MINT = "#63e6be";

// Clic dans Portfolio : le nuage de points du site réagit. Un anneau violet, une couronne de points qui se
// disposent en spirale puis se resserrent sur le curseur, un réticule et les coordonnées du clic en mono.
export default function spawn(x, y, { add, W, H }) {
  add({
    dur: 1.3,
    draw(ctx, t) {
      [[VIOLET, 0], [MINT, 0.16]].forEach(([color, delay]) => {
        const k = clamp((t - delay) / (1 - delay));
        if (k <= 0) return;
        ctx.strokeStyle = rgba(color, (1 - k) * 0.9);
        ctx.lineWidth = 2 + (1 - k) * 3;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, lerp(8, Math.min(W, H) * 0.24, outCubic(k)), 0, TAU);
        ctx.stroke();
      });
    },
  });

  const arms = 3;
  add({
    dur: 1.7,
    draw(ctx, t) {
      ctx.globalCompositeOperation = "lighter";
      const back = t > 0.55 ? smooth((t - 0.55) / 0.45) : 0;
      for (let i = 0; i < 90; i++) {
        const u = i / 90;
        const a = (i % arms) * (TAU / arms) + u * 7 + t * 2.4;
        const r = outCubic(clamp(t * 1.5)) * (30 + u * 190) * (1 - back * 0.92);
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        ctx.fillStyle = rgba(i % 7 ? VIOLET : MINT, (1 - t) * 0.95);
        ctx.beginPath();
        ctx.arc(px, py, 1.6 + (1 - u) * 1.8, 0, TAU);
        ctx.fill();
      }
    },
  });

  const coords = `x ${Math.round(x)} · y ${Math.round(y)} · z ${(rnd(-1, 1)).toFixed(2)}`;
  add({
    dur: 1.6,
    draw(ctx, t) {
      const a = (1 - t) * 0.9;
      ctx.strokeStyle = rgba(MINT, a);
      ctx.lineWidth = 1;
      ctx.strokeRect(x - 13, y - 13, 26, 26);
      ctx.beginPath();
      ctx.moveTo(x - 30, y);
      ctx.lineTo(x - 8, y);
      ctx.moveTo(x + 8, y);
      ctx.lineTo(x + 30, y);
      ctx.moveTo(x, y - 30);
      ctx.lineTo(x, y - 8);
      ctx.moveTo(x, y + 8);
      ctx.lineTo(x, y + 30);
      ctx.stroke();
      ctx.font = "500 12px ui-monospace, Menlo, Consolas, monospace";
      ctx.fillStyle = rgba(MINT, a);
      ctx.fillText(coords, x + 22, y - 22 - t * 16);
    },
  });
}
