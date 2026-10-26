import { TAU, clamp, rnd, outCubic, outBack, rgba } from "../shared/fxkit";

const MOSS = "#7fb08a";
const SUN = "#f2c36b";
const MIST = "#d9e6d3";

// Clic dans Eko : des pousses surgissent du point cliqué, s'élèvent en se courbant et déplient leurs feuilles,
// pendant que des lucioles dorées s'élèvent et qu'un voile de brume passe.
export default function spawn(x, y, { add }) {
  const stems = Array.from({ length: 5 }, (_, i) => ({
    dx: (i - 2) * 22 + rnd(-8, 8),
    h: rnd(70, 150),
    bend: rnd(-46, 46),
    delay: i * 0.05,
    leaf: rnd(12, 24),
  }));

  add({
    dur: 2.4,
    draw(ctx, t) {
      const fade = 1 - clamp((t - 0.72) / 0.28);
      ctx.globalAlpha = fade;
      stems.forEach((s) => {
        const k = outCubic(clamp((t - s.delay) / 0.4));
        if (k <= 0) return;
        const tipX = x + s.dx + s.bend * k;
        const tipY = y - s.h * k;
        ctx.strokeStyle = MOSS;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.shadowColor = MOSS;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(x + s.dx, y);
        ctx.quadraticCurveTo(x + s.dx, y - s.h * 0.6 * k, tipX, tipY);
        ctx.stroke();
        ctx.shadowBlur = 0;
        // deux feuilles qui se déplient au sommet
        const open = outBack(clamp((t - s.delay - 0.22) / 0.3));
        [-1, 1].forEach((side) => {
          ctx.save();
          ctx.translate(tipX, tipY);
          ctx.rotate(side * (0.35 + open * 0.7) - 0.4 * (s.bend > 0 ? -1 : 1) * 0.2);
          ctx.fillStyle = side > 0 ? MOSS : "#9cc7a6";
          ctx.beginPath();
          ctx.ellipse(0, -s.leaf * open * 0.55, s.leaf * 0.34 * open, s.leaf * 0.7 * open, 0, 0, TAU);
          ctx.fill();
          ctx.restore();
        });
      });
    },
  });

  const flies = Array.from({ length: 14 }, () => ({ dx: rnd(-90, 90), v: rnd(50, 140), ph: rnd(0, TAU), d: rnd(0, 0.4) }));
  add({
    dur: 2.6,
    draw(ctx, t) {
      ctx.globalCompositeOperation = "lighter";
      flies.forEach((f) => {
        const k = clamp((t - f.d) / (1 - f.d));
        if (k <= 0) return;
        const px = x + f.dx + Math.sin(k * 9 + f.ph) * 18;
        const py = y - 20 - k * f.v * 1.8;
        const a = Math.sin(k * Math.PI) * (0.6 + 0.4 * Math.sin(k * 30 + f.ph));
        const g = ctx.createRadialGradient(px, py, 0, px, py, 10);
        g.addColorStop(0, rgba(SUN, a));
        g.addColorStop(1, rgba(SUN, 0));
        ctx.fillStyle = g;
        ctx.fillRect(px - 10, py - 10, 20, 20);
      });
    },
  });

  add({
    dur: 1.6,
    draw(ctx, t) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, 70 + outCubic(t) * 170);
      g.addColorStop(0, rgba(MIST, 0.35 * (1 - t)));
      g.addColorStop(1, rgba(MIST, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, 70 + outCubic(t) * 170, 0, TAU);
      ctx.fill();
    },
  });
}
