import { TAU, clamp, rnd, outCubic, rgba, roundRect } from "../shared/fxkit";

const CYAN = "#12d8dc";
const BLUE = "#1d6fc4";
const GREEN = "#49b8a5";
const WHITE = "#f4fbfb";

// Clic dans RATP : un panneau de ligne s'allume (pastille cyan), un métro traverse l'écran à la hauteur du clic avec
// ses fenêtres éclairées et un sillage de lumière, et un anneau de « bip » se propage.
export default function spawn(x, y, { add, W }) {
  const dir = x < W / 2 ? 1 : -1;
  const line = String(Math.floor(rnd(1, 15)));

  add({
    dur: 1.6,
    draw(ctx, t) {
      const k = outCubic(clamp(t / 0.7));
      const px = dir > 0 ? -380 + k * (W + 420) : W + 380 - k * (W + 420);
      const fade = 1 - clamp((t - 0.78) / 0.22);
      ctx.globalAlpha = fade;
      // sillage
      const g = ctx.createLinearGradient(px - dir * 520, 0, px, 0);
      g.addColorStop(0, rgba(CYAN, 0));
      g.addColorStop(1, rgba(CYAN, 0.35));
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(px, px - dir * 520), y - 30, 520, 60);
      // rame : trois voitures
      for (let i = 0; i < 3; i++) {
        const cx = px - dir * i * 132;
        ctx.save();
        ctx.translate(cx, y);
        const body = ctx.createLinearGradient(0, -26, 0, 26);
        body.addColorStop(0, "#e1eef1");
        body.addColorStop(1, "#8fb1bd");
        ctx.fillStyle = body;
        roundRect(ctx, -62, -26, 124, 52, 8);
        ctx.fill();
        ctx.fillStyle = "#12202b";
        for (let w = 0; w < 4; w++) ctx.fillRect(-52 + w * 28, -17, 20, 18);
        ctx.fillStyle = rgba("#ffd36b", 0.85);
        for (let w = 0; w < 4; w++) ctx.fillRect(-50 + w * 28, -15, 16, 14);
        ctx.fillStyle = BLUE;
        ctx.fillRect(-62, 12, 124, 5);
        ctx.restore();
      }
    },
  });

  add({
    dur: 1.5,
    draw(ctx, t) {
      const s = Math.min(1, t / 0.12);
      ctx.globalAlpha = 1 - clamp((t - 0.7) / 0.3);
      ctx.translate(x, y - 74);
      ctx.scale(s, s);
      ctx.fillStyle = CYAN;
      ctx.shadowColor = CYAN;
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#0a1018";
      ctx.font = "900 italic 26px Archivo, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(line, 0, 2);
    },
  });

  add({
    dur: 1.0,
    draw(ctx, t) {
      [0, 0.22].forEach((d, i) => {
        const k = clamp((t - d) / (1 - d));
        if (k <= 0) return;
        ctx.strokeStyle = rgba(i ? GREEN : WHITE, (1 - k) * 0.85);
        ctx.lineWidth = 3 * (1 - k) + 1;
        ctx.beginPath();
        ctx.arc(x, y, 8 + outCubic(k) * 120, 0, TAU);
        ctx.stroke();
      });
    },
  });
}
