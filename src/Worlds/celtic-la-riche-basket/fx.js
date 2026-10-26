import { TAU, clamp, rnd, pick, outBack, outCubic, rgba } from "../shared/fxkit";

const ORANGE = "#ff7a1a";
const CHALK = "#f4efe2";
const GREEN = "#1fa56a";

// Clic dans Celtic : un ballon rebondit sur le point cliqué (trois rebonds, de plus en plus bas), la balle
// « swishe » dans un cercle de panier et un « +2 » monte, sous une pluie de confettis aux couleurs du club.
export default function spawn(x, y, { add }) {
  add({
    dur: 1.5,
    draw(ctx, t) {
      // trois rebonds amortis
      const phase = t * 3;
      const k = Math.floor(Math.min(phase, 2.999));
      const f = phase - k;
      const h = 150 * Math.pow(0.5, k);
      const lift = Math.sin(f * Math.PI) * h;
      const squash = f < 0.06 || f > 0.94 ? 0.82 : 1;
      const fade = 1 - clamp((t - 0.82) / 0.18);
      const bx = x + t * 40;
      const by = y - lift;
      ctx.globalAlpha = fade;
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(bx, y + 26, 26 - lift * 0.08, 6, 0, 0, TAU);
      ctx.fill();
      ctx.translate(bx, by);
      ctx.scale(1 / squash, squash);
      ctx.rotate(t * 11);
      const g = ctx.createRadialGradient(-8, -9, 3, 0, 0, 28);
      g.addColorStop(0, "#ffa04d");
      g.addColorStop(0.6, ORANGE);
      g.addColorStop(1, "#b94d00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = "rgba(20,10,0,0.78)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-26, 0);
      ctx.lineTo(26, 0);
      ctx.moveTo(0, -26);
      ctx.lineTo(0, 26);
      ctx.arc(0, 0, 26, 0, TAU);
      ctx.stroke();
    },
  });

  add({
    dur: 1.2,
    draw(ctx, t) {
      const s = outBack(clamp(t / 0.25));
      ctx.globalAlpha = 1 - clamp((t - 0.6) / 0.4);
      ctx.translate(x + 40, y - 70 - t * 60);
      ctx.scale(s, s);
      ctx.font = "400 48px Anton, Impact, sans-serif";
      ctx.textAlign = "center";
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#07281c";
      ctx.strokeText("+2", 0, 0);
      ctx.fillStyle = ORANGE;
      ctx.fillText("+2", 0, 0);
    },
  });

  const bits = Array.from({ length: 34 }, () => ({ a: rnd(-Math.PI * 0.9, -Math.PI * 0.1), v: rnd(200, 520), color: pick([ORANGE, CHALK, GREEN, ORANGE]), spin: rnd(-9, 9), w: rnd(6, 13) }));
  add({
    dur: 1.6,
    draw(ctx, t) {
      const tau = t * 1.6;
      bits.forEach((b) => {
        const px = x + Math.cos(b.a) * b.v * tau;
        const py = y + Math.sin(b.a) * b.v * tau + 620 * tau * tau;
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(b.spin * tau);
        ctx.fillStyle = rgba(b.color, 1 - t * t);
        ctx.fillRect(-b.w / 2, -2.5, b.w, 5);
        ctx.restore();
      });
    },
  });

  add({
    dur: 0.7,
    draw(ctx, t) {
      ctx.strokeStyle = rgba(CHALK, (1 - t) * 0.85);
      ctx.lineWidth = 3 * (1 - t) + 1;
      ctx.beginPath();
      ctx.arc(x, y, 10 + outCubic(t) * 90, 0, TAU);
      ctx.stroke();
    },
  });
}
