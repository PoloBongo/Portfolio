import { TAU, clamp, rnd, pick, outCubic, rgba } from "../shared/fxkit";

const RED = "#c8321e";
const INK = "#141414";
const PAPER = "#ece5d6";

// Clic dans Articles Manager : un tampon « PUBLIÉ » s'abat sur la page (grand puis net, un coup sec fait trembler
// l'image), des éclaboussures d'encre jaillissent et des coupures de journal volent.
export default function spawn(x, y, { add }) {
  const tilt = rnd(-0.16, 0.06);
  add({
    dur: 1.9,
    draw(ctx, t) {
      const slam = clamp(t / 0.14);
      const scale = 1 + (1 - outCubic(slam)) * 0.7;
      const fade = 1 - clamp((t - 0.7) / 0.3);
      const shake = t > 0.14 && t < 0.3 ? Math.sin(t * 160) * 4 * (1 - (t - 0.14) / 0.16) : 0;
      ctx.globalAlpha = fade * clamp(slam * 1.6);
      ctx.translate(x + shake, y + shake * 0.6);
      ctx.rotate(tilt);
      ctx.scale(scale, scale);
      ctx.strokeStyle = RED;
      ctx.fillStyle = RED;
      ctx.lineWidth = 6;
      ctx.strokeRect(-104, -30, 208, 60);
      ctx.lineWidth = 2;
      ctx.strokeRect(-97, -23, 194, 46);
      ctx.font = "400 34px 'Abril Fatface', Georgia, serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("PUBLIÉ", 0, 3);
      // grain d'encre : le tampon est irrégulier
      ctx.globalCompositeOperation = "destination-out";
      for (let i = 0; i < 60; i++) {
        const s = Math.sin(i * 91.7) * 43758.5;
        ctx.fillStyle = `rgba(0,0,0,${0.35 + (s - Math.floor(s)) * 0.4})`;
        ctx.fillRect(-104 + ((s * 7.3) % 1 + 1) % 1 * 208, -30 + ((s * 3.1) % 1 + 1) % 1 * 60, 2.2, 2.2);
      }
    },
  });

  const drops = Array.from({ length: 26 }, () => ({ a: rnd(0, TAU), v: rnd(60, 250), r: rnd(2, 6.5), color: pick([INK, INK, RED]) }));
  add({
    dur: 1.2,
    draw(ctx, t) {
      drops.forEach((d) => {
        const dist = d.v * outCubic(clamp(t / 0.35));
        ctx.fillStyle = rgba(d.color, 1 - clamp((t - 0.5) / 0.5));
        ctx.beginPath();
        ctx.arc(x + Math.cos(d.a) * dist, y + Math.sin(d.a) * dist, d.r * (0.6 + 0.4 * (1 - t)), 0, TAU);
        ctx.fill();
      });
    },
  });

  const scraps = Array.from({ length: 9 }, () => ({ a: rnd(-Math.PI * 0.95, -Math.PI * 0.05), v: rnd(180, 420), spin: rnd(-7, 7), w: rnd(26, 52), h: rnd(16, 32) }));
  add({
    dur: 1.7,
    draw(ctx, t) {
      const tau = t * 1.7;
      scraps.forEach((s) => {
        const px = x + Math.cos(s.a) * s.v * tau;
        const py = y + Math.sin(s.a) * s.v * tau + 480 * tau * tau;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(s.spin * tau);
        ctx.globalAlpha = 1 - clamp((t - 0.6) / 0.4);
        ctx.fillStyle = PAPER;
        ctx.strokeStyle = "rgba(20,20,20,0.35)";
        ctx.lineWidth = 1;
        ctx.fillRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.strokeRect(-s.w / 2, -s.h / 2, s.w, s.h);
        ctx.fillStyle = "rgba(20,20,20,0.6)";
        for (let i = 0; i < 3; i++) ctx.fillRect(-s.w / 2 + 4, -s.h / 2 + 4 + i * 5, s.w * (0.8 - i * 0.15), 2);
        ctx.restore();
      });
    },
  });
}
