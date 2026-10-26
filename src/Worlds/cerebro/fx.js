import { TAU, clamp, lerp, rnd, outCubic, smooth, rgba } from "../shared/fxkit";

const MINT = "#63e6be";
const LAVENDER = "#b79bff";

// Clic dans Cerebro : une requête est lancée dans l'espace latent. Deux ondes néon, une mire qui traverse l'écran,
// des voisins sortent, puis sont aimantés vers la requête, et l'étiquette de la recherche monte.
export default function spawn(x, y, { add, W, H }) {
  add({
    dur: 1.25,
    draw(ctx, t) {
      [[MINT, 1, 0], [LAVENDER, 0.7, 0.14]].forEach(([color, weight, delay]) => {
        const k = clamp((t - delay) / (1 - delay));
        if (k <= 0) return;
        ctx.strokeStyle = rgba(color, (1 - k) * 0.95);
        ctx.lineWidth = 1.5 * weight + (1 - k) * 4;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(x, y, lerp(6, Math.min(W, H) * 0.3, outCubic(k)), 0, TAU);
        ctx.stroke();
      });
    },
  });

  const mire = Math.max(W, H);
  add({
    dur: 0.8,
    draw(ctx, t) {
      const len = outCubic(t) * mire;
      ctx.strokeStyle = rgba(MINT, (1 - t) * 0.55);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - len, y);
      ctx.lineTo(x + len, y);
      ctx.moveTo(x, y - len);
      ctx.lineTo(x, y + len);
      ctx.stroke();
      ctx.strokeStyle = rgba(MINT, (1 - t) * 0.8);
      ctx.strokeRect(x - 11, y - 11, 22, 22);
    },
  });

  const neighbours = Array.from({ length: 18 }, () => ({ a: rnd(0, TAU), d: rnd(50, 200), s: rnd(0.6, 1.2), spin: rnd(-2, 2) }));
  add({
    dur: 1.5,
    draw(ctx, t) {
      neighbours.forEach((p) => {
        const out = outCubic(clamp(t * 1.7));
        const back = t > 0.5 ? smooth((t - 0.5) / 0.5) : 0;
        const r = p.d * out * (1 - back * 0.9);
        const px = x + Math.cos(p.a + t * p.spin) * r;
        const py = y + Math.sin(p.a + t * p.spin) * r;
        ctx.strokeStyle = rgba(MINT, (1 - t) * 0.28);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.fillStyle = rgba(back > 0.3 ? LAVENDER : MINT, (1 - t) * 0.95);
        ctx.shadowColor = back > 0.3 ? LAVENDER : MINT;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(px, py, 2.6 * p.s, 0, TAU);
        ctx.fill();
      });
    },
  });

  const hex = Math.floor(rnd(0x1000, 0xffff)).toString(16).toUpperCase();
  add({
    dur: 1.5,
    draw(ctx, t) {
      ctx.font = "500 12px ui-monospace, Menlo, Consolas, monospace";
      ctx.fillStyle = rgba(MINT, 1 - t * t);
      ctx.fillText(`requête → k=8 · 0x${hex}`, x + 18, y - 16 - t * 26);
      if (t > 0.35) {
        ctx.fillStyle = rgba(LAVENDER, 1 - t);
        ctx.fillText(`${Math.round(lerp(0, 8, clamp((t - 0.35) / 0.4)))} voisins`, x + 18, y + 2 - t * 26);
      }
    },
  });
}
