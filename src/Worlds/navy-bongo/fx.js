import { TAU, clamp, rnd, outCubic, outBack, rgba } from "../shared/fxkit";

const FOAM = "#eaf6ff";
const GOLD = "#f2b134";

// Clic dans Navy Bongo : un boulet frappe l'eau. Une gerbe d'écume jaillit en colonne et retombe en gouttes,
// des ondes s'élargissent à la surface, une fumée de poudre passe, et une pièce d'or « +150 » s'envole.
export default function spawn(x, y, { add }) {
  const drops = Array.from({ length: 40 }, () => ({ a: rnd(-Math.PI * 0.82, -Math.PI * 0.18), v: rnd(220, 620), r: rnd(2, 6.5) }));
  add({
    dur: 1.5,
    draw(ctx, t) {
      const tau = t * 1.5;
      // colonne d'eau
      const col = Math.sin(clamp(t / 0.5) * Math.PI) * 120;
      const g = ctx.createLinearGradient(0, y - col, 0, y);
      g.addColorStop(0, rgba(FOAM, 0));
      g.addColorStop(0.3, rgba(FOAM, 0.85));
      g.addColorStop(1, rgba("#5aaae0", 0.8));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - 26, y);
      ctx.quadraticCurveTo(x - 14, y - col, x, y - col * 1.05);
      ctx.quadraticCurveTo(x + 14, y - col, x + 26, y);
      ctx.closePath();
      ctx.fill();
      drops.forEach((d) => {
        const px = x + Math.cos(d.a) * d.v * tau;
        const py = y + Math.sin(d.a) * d.v * tau + 900 * tau * tau;
        ctx.fillStyle = rgba(FOAM, (1 - t) * 0.95);
        ctx.beginPath();
        ctx.arc(px, py, d.r, 0, TAU);
        ctx.fill();
      });
    },
  });

  add({
    dur: 1.7,
    draw(ctx, t) {
      [0, 0.14, 0.3].forEach((delay, i) => {
        const k = clamp((t - delay) / (1 - delay));
        if (k <= 0) return;
        ctx.strokeStyle = rgba(FOAM, (1 - k) * 0.85);
        ctx.lineWidth = 3 * (1 - k) + 0.8;
        ctx.beginPath();
        const r = 10 + outCubic(k) * (110 + i * 40);
        ctx.ellipse(x, y + 4, r, r * 0.26, 0, 0, TAU);
        ctx.stroke();
      });
    },
  });

  add({
    dur: 1.4,
    draw(ctx, t) {
      for (let i = 0; i < 6; i++) {
        const px = x + (i - 2.5) * 22 + Math.sin(t * 3 + i) * 10;
        const py = y - 20 - outCubic(t) * (60 + i * 8);
        ctx.fillStyle = rgba("#8f98a3", (1 - t) * 0.45);
        ctx.beginPath();
        ctx.arc(px, py, 14 + t * 24, 0, TAU);
        ctx.fill();
      }
    },
  });

  add({
    dur: 1.7,
    draw(ctx, t) {
      const rise = outCubic(clamp(t / 0.7)) * 90;
      const s = outBack(clamp(t / 0.2));
      ctx.globalAlpha = 1 - clamp((t - 0.7) / 0.3);
      ctx.translate(x, y - 40 - rise);
      ctx.scale(s, s);
      ctx.save();
      ctx.scale(Math.abs(Math.cos(t * 12)) * 0.8 + 0.2, 1);
      const g = ctx.createRadialGradient(-5, -5, 2, 0, 0, 16);
      g.addColorStop(0, "#fff1a8");
      g.addColorStop(0.6, GOLD);
      g.addColorStop(1, "#b97c0e");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.font = "700 24px Cinzel, Georgia, serif";
      ctx.textAlign = "left";
      ctx.lineWidth = 4;
      ctx.strokeStyle = "rgba(10,44,77,0.9)";
      ctx.strokeText("+150", 24, 8);
      ctx.fillStyle = GOLD;
      ctx.fillText("+150", 24, 8);
    },
  });
}
