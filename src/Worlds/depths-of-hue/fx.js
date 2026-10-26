import { TAU, clamp, rnd, outCubic, rgba } from "../shared/fxkit";

const MINT = "#36e3a1";
const CORAL = "#ff7f8a";
const FOAM = "#e4fff4";

// Clic dans Depths Of Hue : la couleur revient. Un halo de lumière, trois ondes de caustique ondulantes et une
// grappe de bulles qui montent en se balançant.
export default function spawn(x, y, { add, H }) {
  add({
    dur: 1.1,
    draw(ctx, t) {
      ctx.globalCompositeOperation = "lighter";
      const r = 190 * outCubic(t);
      const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
      g.addColorStop(0, rgba(MINT, 0.5 * (1 - t)));
      g.addColorStop(0.55, rgba(CORAL, 0.16 * (1 - t)));
      g.addColorStop(1, rgba(MINT, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, r), 0, TAU);
      ctx.fill();
    },
  });

  add({
    dur: 1.6,
    draw(ctx, t) {
      ctx.lineWidth = 2;
      [0, 0.16, 0.32].forEach((delay, ring) => {
        const k = clamp((t - delay) / (1 - delay));
        if (k <= 0) return;
        const r0 = 14 + outCubic(k) * (150 + ring * 36);
        ctx.strokeStyle = rgba(ring === 1 ? CORAL : MINT, (1 - k) * 0.85);
        ctx.shadowColor = MINT;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * TAU;
          const r = r0 * (1 + 0.055 * Math.sin(a * 5 + t * 9 + ring) + 0.03 * Math.sin(a * 9 - t * 7));
          const px = x + Math.cos(a) * r;
          const py = y + Math.sin(a) * r * 0.82;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
      });
    },
  });

  const bubbles = Array.from({ length: 16 }, () => ({ dx: rnd(-46, 46), r: rnd(3, 10), v: rnd(70, 190), ph: rnd(0, TAU), d: rnd(0, 0.25) }));
  add({
    dur: 2.4,
    draw(ctx, t) {
      bubbles.forEach((b) => {
        const k = clamp((t - b.d) / (1 - b.d));
        if (k <= 0) return;
        const by = y - k * Math.min(b.v * 2.4, H * 0.6);
        const bx = x + b.dx + Math.sin(k * 9 + b.ph) * 14;
        ctx.strokeStyle = rgba(FOAM, (1 - k) * 0.9);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.arc(bx, by, b.r * (0.7 + 0.5 * k), 0, TAU);
        ctx.stroke();
        ctx.fillStyle = rgba(FOAM, (1 - k) * 0.12);
        ctx.fill();
        ctx.fillStyle = rgba(FOAM, (1 - k) * 0.8);
        ctx.beginPath();
        ctx.arc(bx - b.r * 0.3, by - b.r * 0.3, Math.max(0.8, b.r * 0.16), 0, TAU);
        ctx.fill();
      });
    },
  });
}
