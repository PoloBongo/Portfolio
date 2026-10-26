import { TAU, clamp, rnd, outCubic, rgba } from "../shared/fxkit";

const STEEL = "#4a86d6";
const CORAL = "#e5566d";
const WHITE = "#f4f6ff";

// Clic dans Shadow Scholar : une double entaille (acier et corail) traverse le point cliqué, un éclair blanc
// éclaire la pièce un instant, des éclats sont projetés et un cadre carré se détache.
export default function spawn(x, y, { add }) {
  const slashes = [
    { angle: rnd(-0.75, -0.45), color: STEEL, len: 560, w: 17, shift: 0 },
    { angle: rnd(0.35, 0.65) + Math.PI, color: CORAL, len: 470, w: 12, shift: 46 },
  ];

  slashes.forEach((s) => {
    const cos = Math.cos(s.angle);
    const sin = Math.sin(s.angle);
    add({
      dur: 0.8,
      draw(ctx, t) {
        const grow = outCubic(clamp(t / 0.26));
        const fade = 1 - clamp((t - 0.3) / 0.7);
        const a = -s.len * 0.5 * grow + s.shift;
        const b = s.len * 0.5 * grow + s.shift;
        const mid = (a + b) / 2;
        const nx = -sin;
        const ny = cos;
        // lame effilée : épaisse au centre, pointue aux deux bouts
        ctx.fillStyle = rgba(s.color, 0.95 * fade);
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 26;
        ctx.beginPath();
        ctx.moveTo(x + cos * a, y + sin * a);
        ctx.lineTo(x + cos * mid + nx * s.w * fade, y + sin * mid + ny * s.w * fade);
        ctx.lineTo(x + cos * b, y + sin * b);
        ctx.lineTo(x + cos * mid - nx * s.w * 0.4 * fade, y + sin * mid - ny * s.w * 0.4 * fade);
        ctx.closePath();
        ctx.fill();
        // fil blanc tranchant
        ctx.shadowBlur = 0;
        ctx.strokeStyle = rgba(WHITE, 0.95 * fade);
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x + cos * a, y + sin * a);
        ctx.lineTo(x + cos * b, y + sin * b);
        ctx.stroke();
      },
    });
  });

  add({
    dur: 0.45,
    draw(ctx, t) {
      const r = 80 + outCubic(t) * 320;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(WHITE, 0.55 * (1 - t) * (1 - t)));
      g.addColorStop(0.5, rgba(STEEL, 0.22 * (1 - t)));
      g.addColorStop(1, rgba(STEEL, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    },
  });

  const shards = Array.from({ length: 16 }, (_, i) => ({
    a: rnd(0, TAU),
    v: rnd(160, 480),
    size: rnd(5, 15),
    spin: rnd(-9, 9),
    color: i % 3 ? STEEL : CORAL,
  }));
  add({
    dur: 0.95,
    draw(ctx, t) {
      shards.forEach((s) => {
        const d = s.v * outCubic(t) * 0.55;
        const px = x + Math.cos(s.a) * d;
        const py = y + Math.sin(s.a) * d + t * t * 90;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(s.spin * t);
        ctx.fillStyle = rgba(s.color, 1 - t);
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.7, s.size * 0.6);
        ctx.lineTo(-s.size * 0.5, s.size * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    },
  });

  add({
    dur: 0.7,
    draw(ctx, t) {
      const r = 14 + outCubic(t) * 96;
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4 + t * 0.4);
      ctx.strokeStyle = rgba(CORAL, (1 - t) * 0.9);
      ctx.lineWidth = 2;
      ctx.strokeRect(-r / 2, -r / 2, r, r);
    },
  });
}
