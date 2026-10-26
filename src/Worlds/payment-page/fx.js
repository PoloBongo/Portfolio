import { TAU, clamp, outCubic, rgba } from "../shared/fxkit";

const YELLOW = "#e8ff2e";
const PAPER = "#f4f4ef";
const INK = "#151515";
const LINES = [["1× HOODIE", "89,00"], ["2× TEE LOGO", "58,00"], ["1× CAP", "29,00"], ["LIVRAISON", "0,00"]];

// Clic dans Payment : un ticket thermique sort de l'imprimante sous le curseur, s'imprime ligne à ligne (le papier
// avance par à-coups), affiche le total, et un bip jaune fluo part en anneau.
export default function spawn(x, y, { add }) {
  const w = 190;
  const h = 232;
  add({
    dur: 2.4,
    draw(ctx, t) {
      const feed = outCubic(clamp(t / 0.35));
      const fade = 1 - clamp((t - 0.8) / 0.2);
      const printed = clamp((t - 0.18) / 0.5);
      ctx.globalAlpha = fade;
      ctx.translate(x, y - 26 + (1 - feed) * -h);
      ctx.rotate(Math.sin(t * 3) * 0.015 + 0.03);
      // la fente de l'imprimante
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 8;
      ctx.fillStyle = PAPER;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h);
      ctx.lineTo(w / 2, -h);
      ctx.lineTo(w / 2, 0);
      for (let i = 0; i < 14; i++) ctx.lineTo(w / 2 - ((i + 0.5) * w) / 14, i % 2 ? 0 : 7);
      ctx.lineTo(-w / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = INK;
      ctx.font = "700 12px 'Courier Prime', 'Courier New', monospace";
      ctx.textAlign = "left";
      const line = (i) => clamp(printed * 6 - i);
      ctx.fillText("PAYMENT · BOUTIQUE", -w / 2 + 14, -h + 26);
      LINES.forEach((l, i) => {
        const a = line(i);
        if (a <= 0) return;
        ctx.globalAlpha = fade * a;
        ctx.fillText(l[0], -w / 2 + 14, -h + 58 + i * 20);
        ctx.textAlign = "right";
        ctx.fillText(l[1], w / 2 - 14, -h + 58 + i * 20);
        ctx.textAlign = "left";
      });
      ctx.globalAlpha = fade * line(4);
      ctx.fillRect(-w / 2 + 14, -h + 142, w - 28, 1.5);
      ctx.font = "700 16px 'Courier Prime', 'Courier New', monospace";
      ctx.fillText("TOTAL", -w / 2 + 14, -h + 164);
      ctx.textAlign = "right";
      ctx.fillText("176,00 €", w / 2 - 14, -h + 164);
      // code-barres
      ctx.globalAlpha = fade * line(5);
      for (let i = 0; i < 38; i++) {
        const bw = 1 + ((i * 7) % 3);
        ctx.fillRect(-w / 2 + 14 + i * 4.2, -h + 180, bw, 34);
      }
    },
  });

  add({
    dur: 0.9,
    draw(ctx, t) {
      ctx.strokeStyle = rgba(YELLOW, (1 - t) * 0.95);
      ctx.lineWidth = 4 * (1 - t) + 1;
      ctx.shadowColor = YELLOW;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(x, y, 8 + outCubic(t) * 110, 0, TAU);
      ctx.stroke();
    },
  });
}
