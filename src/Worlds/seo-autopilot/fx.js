import { TAU, clamp, lerp, outBack, outCubic, smooth, rgba, roundRect } from "../shared/fxkit";

const CORAL = "#ff5a47";
const INDIGO = "#4b5bd7";
const INK = "#1c1c24";

// Clic dans SEO Autopilot : un nœud « Exécuter » apparaît sous le curseur, une impulsion court sur son fil vers un
// second nœud qui valide (✓), comme une exécution du workflow.
export default function spawn(x, y, { add, W, H }) {
  const dir = x < W * 0.55 ? 1 : -1;
  const w = 128;
  const h = 58;
  const run = Math.min(230, dir > 0 ? W - x - w - 40 : x - w - 40);
  const x0 = x + (dir * w) / 2;
  const x1 = x + dir * (w / 2 + Math.max(110, run));
  const y1 = y + (y < H * 0.6 ? 1 : -1) * 70;
  const curve = (u) => {
    const c1 = x0 + dir * 70;
    const c2 = x1 - dir * 70;
    const m = 1 - u;
    return [m * m * m * x0 + 3 * m * m * u * c1 + 3 * m * u * u * c2 + u * u * u * x1, m * m * m * y + 3 * m * m * u * y + 3 * m * u * u * y1 + u * u * u * y1];
  };

  add({
    dur: 2.1,
    draw(ctx, t) {
      const fade = 1 - clamp((t - 0.82) / 0.18);
      ctx.globalAlpha = fade;

      // fil
      const k = smooth(clamp((t - 0.1) / 0.45));
      ctx.strokeStyle = rgba(INK, 0.4);
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const [px, py] = curve((i / 40) * k);
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
      if (k > 0 && k < 1) {
        const [px, py] = curve(k);
        ctx.fillStyle = CORAL;
        ctx.shadowColor = CORAL;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, TAU);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // nœud « Exécuter »
      const s = outBack(clamp(t / 0.16));
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      ctx.shadowColor = "rgba(28,28,36,0.35)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = "#fff";
      roundRect(ctx, -w / 2, -h / 2, w, h, 10);
      ctx.fill();
      ctx.shadowColor = "transparent";
      ctx.save();
      roundRect(ctx, -w / 2, -h / 2, w, h, 10);
      ctx.clip();
      ctx.fillStyle = t > 0.12 && t < 0.62 ? CORAL : "#7b8794";
      ctx.fillRect(-w / 2, -h / 2, w, 20);
      ctx.restore();
      ctx.strokeStyle = "rgba(28,28,36,0.18)";
      ctx.lineWidth = 1;
      roundRect(ctx, -w / 2, -h / 2, w, h, 10);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-w / 2 + 12, -h / 2 + 10, 3.4, 0, TAU);
      ctx.fill();
      ctx.font = "600 11px 'IBM Plex Sans', system-ui, sans-serif";
      ctx.fillText("Exécuter", -w / 2 + 22, -h / 2 + 14);
      ctx.fillStyle = INK;
      ctx.font = "600 17px 'IBM Plex Sans', system-ui, sans-serif";
      ctx.fillText(t > 0.6 ? "terminé" : `${Math.round(lerp(0, 100, clamp(t / 0.6)))} %`, -w / 2 + 12, h / 2 - 12);
      ctx.restore();

      // nœud d'arrivée qui valide
      if (k >= 0.98) {
        const a = outBack(clamp((t - 0.55) / 0.15));
        ctx.save();
        ctx.translate(x1, y1);
        ctx.scale(a, a);
        ctx.fillStyle = INDIGO;
        roundRect(ctx, -46, -16, 92, 32, 9);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "600 13px 'IBM Plex Sans', system-ui, sans-serif";
        ctx.fillText("✓ 12 cartes", -36, 5);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
  });

  add({
    dur: 0.8,
    draw(ctx, t) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU;
        const r = 26 + outCubic(t) * 52;
        ctx.fillStyle = rgba(CORAL, (1 - t) * 0.9);
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 3 * (1 - t) + 0.6, 0, TAU);
        ctx.fill();
      }
    },
  });
}
