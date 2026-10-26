import { TAU, clamp, rnd, outCubic, rgba } from "../shared/fxkit";

const CORAL = "#ff7a59";
const VIOLET = "#6b3fb5";
const SUN = "#ffc65c";
const AUBERGINE = "#2b1650";

// Clic dans Au fil des images : l'aiguille tire un fil de corail qui ondule jusqu'au bord de l'écran, pendant
// qu'un petit cadre photo, accroché au point de départ, se détache et tombe en se balançant.
export default function spawn(x, y, { add, W }) {
  const dir = x < W / 2 ? 1 : -1;
  const len = Math.min(560, dir > 0 ? W - x : x);
  const wave = rnd(8, 15);
  const point = (u, t) => [x + dir * u * len, y + Math.sin(u * 9 + t * 7) * wave * (1 - u * 0.5) + u * u * 24];

  add({
    dur: 1.8,
    draw(ctx, t) {
      const head = outCubic(clamp(t / 0.55));
      const fade = 1 - clamp((t - 0.7) / 0.3);
      ctx.lineCap = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = rgba(CORAL, fade);
      ctx.beginPath();
      for (let i = 0; i <= 48; i++) {
        const [px, py] = point((i / 48) * head, t);
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
      // points de couture le long du fil
      ctx.fillStyle = rgba(AUBERGINE, 0.5 * fade);
      for (let i = 1; i < 14; i++) {
        const u = (i / 14) * head;
        const [px, py] = point(u, t);
        ctx.fillRect(px - 1, py + 6, 2, 6);
      }
      // l'aiguille en tête
      if (head < 1) {
        const [px, py] = point(head, t);
        const [qx, qy] = point(Math.max(0, head - 0.02), t);
        const a = Math.atan2(py - qy, px - qx);
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(a);
        ctx.fillStyle = AUBERGINE;
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(-10, -3);
        ctx.lineTo(-10, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    },
  });

  const tilt = rnd(-0.3, 0.3);
  const grad = [[VIOLET, CORAL], [SUN, CORAL], [AUBERGINE, VIOLET]][Math.floor(rnd(0, 3))];
  add({
    dur: 1.7,
    draw(ctx, t) {
      const drop = t * t * 260;
      const sway = Math.sin(t * 7) * 0.35 * (1 - t);
      const fade = 1 - clamp((t - 0.6) / 0.4);
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(x + Math.sin(t * 5) * 14 * dir, y + drop);
      ctx.rotate(tilt + sway);
      ctx.shadowColor = rgba(AUBERGINE, 0.4);
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "#fffaf2";
      ctx.fillRect(-30, 6, 60, 76);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      const g = ctx.createLinearGradient(-26, 10, 26, 64);
      g.addColorStop(0, grad[0]);
      g.addColorStop(1, grad[1]);
      ctx.fillStyle = g;
      ctx.fillRect(-26, 10, 52, 52);
      ctx.fillStyle = rgba(AUBERGINE, 0.45);
      ctx.fillRect(-26, 68, 28, 4);
      ctx.fillStyle = AUBERGINE;
      ctx.fillRect(-3, -10, 6, 26);
      ctx.restore();
    },
  });

  add({
    dur: 0.7,
    draw(ctx, t) {
      ctx.strokeStyle = rgba(SUN, (1 - t) * 0.9);
      ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.2;
        const r0 = 8 + outCubic(t) * 14;
        const r1 = r0 + 12 * (1 - t);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0);
        ctx.lineTo(x + Math.cos(a) * r1, y + Math.sin(a) * r1);
        ctx.stroke();
      }
    },
  });
}
