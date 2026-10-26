import { TAU, clamp, lerp, rnd, outCubic, outBack, rgba, roundRect } from "../shared/fxkit";

const AMBER = "#ffb04a";
const CYAN = "#5fc9d6";
const SAND = "#f4e6d2";

// Clic dans Inventory : un objet est ramassé. Un butin lumineux apparaît sous le curseur, vole en arc jusqu'à la case
// de la barre d'objets en bas de l'écran (traînée ambre), la case s'illumine en cyan, une infobulle « ajouté » apparaît
// et des étincelles d'or retombent.
export default function spawn(x, y, { add, W, H }) {
  const cx = W / 2 + (Math.floor(rnd(0, 5)) - 2) * 90;
  const cy = H - 60;
  const label = ["Buste de marbre", "Clé rouillée", "Fiole bleue", "Pièce d'or", "Parchemin"][Math.floor(rnd(0, 5))];

  add({
    dur: 1.45,
    draw(ctx, t) {
      const u = clamp((t - 0.12) / 0.5);
      const e = outCubic(u);
      const pos = (k) => [lerp(x, cx, k), lerp(y, cy, k) - Math.sin(k * Math.PI) * 120];
      for (let i = 8; i >= 0; i--) {
        const [px, py] = pos(Math.max(0, e - i * 0.03));
        ctx.fillStyle = rgba(AMBER, (1 - i / 9) * 0.45 * (1 - clamp((t - 0.6) / 0.2)));
        ctx.beginPath();
        ctx.arc(px, py, 13 - i, 0, TAU);
        ctx.fill();
      }
      if (t < 0.64) {
        const [bx, by] = pos(e);
        const s = outBack(clamp(t / 0.14)) * (1 - e * 0.45);
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(e * 6);
        ctx.scale(s, s);
        ctx.shadowColor = AMBER;
        ctx.shadowBlur = 22;
        ctx.fillStyle = CYAN;
        roundRect(ctx, -17, -17, 34, 34, 8);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.fillRect(-11, -11, 12, 5);
        ctx.restore();
      }
    },
  });

  add({
    dur: 1.2,
    draw(ctx, t) {
      if (t < 0.4) return;
      const k = (t - 0.4) / 0.6;
      ctx.strokeStyle = rgba(CYAN, (1 - k) * 0.95);
      ctx.lineWidth = 3;
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 24;
      roundRect(ctx, cx - 32 - k * 8, cy - 32 - k * 8, 64 + k * 16, 64 + k * 16, 12);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(8,8,10,0.88)";
      const a = 1 - clamp((k - 0.6) / 0.4);
      ctx.globalAlpha = a;
      roundRect(ctx, cx - 78, cy - 96 - k * 12, 156, 44, 7);
      ctx.fill();
      ctx.strokeStyle = AMBER;
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = AMBER;
      ctx.font = "600 13px Rubik, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(label, cx, cy - 76 - k * 12);
      ctx.fillStyle = SAND;
      ctx.font = "400 11px Rubik, system-ui, sans-serif";
      ctx.fillText("ajouté à l'inventaire", cx, cy - 61 - k * 12);
    },
  });

  const sparks = Array.from({ length: 24 }, () => ({ a: rnd(-Math.PI * 0.95, -Math.PI * 0.05), v: rnd(120, 360) }));
  add({
    dur: 1.1,
    draw(ctx, t) {
      ctx.globalCompositeOperation = "lighter";
      const tau = t * 1.1;
      sparks.forEach((s) => {
        const px = x + Math.cos(s.a) * s.v * tau;
        const py = y + Math.sin(s.a) * s.v * tau + 520 * tau * tau;
        ctx.fillStyle = rgba(AMBER, (1 - t) * 0.95);
        ctx.beginPath();
        ctx.arc(px, py, 2.6 * (1 - t) + 0.6, 0, TAU);
        ctx.fill();
      });
    },
  });
}
