import { TAU, clamp, lerp, rnd, pick, outCubic, outBack, rgba } from "../shared/fxkit";

const CYAN = "#00f0f0";
const RED = "#ff1744";
const GRASS = "#86b872";

// Clic dans Unity RL : un tir. Le ballon part du point cliqué, trace une courbe vers le haut de l'écran en tournant
// (traînée de lumière), « BUT ! » s'affiche en grand sur un éclat cyan et rouge, et des confettis de tribune retombent.
export default function spawn(x, y, { add, W }) {
  const side = x < W / 2 ? 1 : -1;
  const tx = clamp(x + side * 340, 80, W - 80);
  const ty = Math.max(70, y - 260);
  add({
    dur: 1.3,
    draw(ctx, t) {
      const pos = (u) => [lerp(x, tx, u), lerp(y, ty, u) - Math.sin(u * Math.PI) * 120];
      const u = outCubic(clamp(t / 0.62));
      for (let i = 9; i >= 0; i--) {
        const [px, py] = pos(Math.max(0, u - i * 0.03));
        ctx.fillStyle = rgba("#ffffff", (1 - i / 10) * 0.35 * (1 - t));
        ctx.beginPath();
        ctx.arc(px, py, 16 - i, 0, TAU);
        ctx.fill();
      }
      const [bx, by] = pos(u);
      const r = lerp(24, 14, u);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(t * 16);
      ctx.globalAlpha = 1 - clamp((t - 0.72) / 0.28);
      const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 2, 0, 0, r);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.7, "#bdbdb8");
      g.addColorStop(1, "#8e8e88");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = "#151515";
      [[-0.4, -0.3], [0.45, -0.35], [0.1, 0.5]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.arc(dx * r, dy * r, r * 0.26, 0, TAU);
        ctx.fill();
      });
      ctx.restore();
    },
  });

  add({
    dur: 1.5,
    draw(ctx, t) {
      if (t < 0.4) return;
      const k = (t - 0.4) / 0.6;
      const s = outBack(clamp(k / 0.3));
      ctx.globalAlpha = 1 - clamp((k - 0.6) / 0.4);
      ctx.translate(tx, ty);
      ctx.rotate(-0.06);
      ctx.scale(s, s);
      ctx.font = "700 76px 'Barlow Condensed', Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 9;
      ctx.strokeStyle = "#0b1a2a";
      ctx.strokeText("BUT !", 0, 0);
      const g = ctx.createLinearGradient(-90, 0, 90, 0);
      g.addColorStop(0, CYAN);
      g.addColorStop(1, RED);
      ctx.fillStyle = g;
      ctx.fillText("BUT !", 0, 0);
    },
  });

  const bits = Array.from({ length: 42 }, () => ({ a: rnd(-Math.PI * 0.95, -Math.PI * 0.05), v: rnd(200, 520), color: pick([CYAN, RED, "#ffffff", "#f5b400", GRASS]), spin: rnd(-10, 10), w: rnd(6, 12) }));
  add({
    dur: 1.8,
    draw(ctx, t) {
      if (t < 0.38) return;
      const tau = (t - 0.38) * 1.8;
      bits.forEach((b) => {
        const px = tx + Math.cos(b.a) * b.v * tau;
        const py = ty + Math.sin(b.a) * b.v * tau + 640 * tau * tau;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(b.spin * tau);
        ctx.fillStyle = rgba(b.color, 1 - clamp((t - 0.6) / 0.4));
        ctx.fillRect(-b.w / 2, -2.5, b.w, 5);
        ctx.restore();
      });
    },
  });

  add({
    dur: 0.7,
    draw(ctx, t) {
      ctx.strokeStyle = rgba("#ffffff", (1 - t) * 0.9);
      ctx.lineWidth = 3 * (1 - t) + 1;
      ctx.beginPath();
      ctx.ellipse(x, y + 12, 12 + outCubic(t) * 90, (12 + outCubic(t) * 90) * 0.3, 0, 0, TAU);
      ctx.stroke();
    },
  });
}
