import { clamp, rnd, outCubic, smooth, rgba } from "../shared/fxkit";

const LINE = "#1fb8c4";
const RENDER = "#f2b97a";

// Clic dans B.A Immobilier : une pièce se trace au point cliqué (murs turquoise, cotes, étiquette en m²), les
// hachures passent en « rendu » orange puis le plan s'efface.
export default function spawn(x, y, { add }) {
  const w = rnd(190, 260);
  const h = rnd(130, 180);
  const x0 = x - w / 2;
  const y0 = y - h / 2;
  const area = ((w * h) / 1900).toFixed(1).replace(".", ",");

  add({
    dur: 2.5,
    draw(ctx, t) {
      const fade = 1 - clamp((t - 0.78) / 0.22);
      ctx.globalAlpha = fade;
      // le rendu : remplissage orange après le tracé
      const fill = smooth(clamp((t - 0.42) / 0.3));
      if (fill > 0) {
        ctx.fillStyle = rgba(RENDER, 0.5 * fill);
        ctx.fillRect(x0, y0, w, h);
        ctx.strokeStyle = rgba(RENDER, 0.5 * fill);
        ctx.lineWidth = 1;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x0, y0, w, h);
        ctx.clip();
        for (let i = -h; i < w; i += 12) {
          ctx.beginPath();
          ctx.moveTo(x0 + i, y0 + h);
          ctx.lineTo(x0 + i + h, y0);
          ctx.stroke();
        }
        ctx.restore();
      }
      // le tracé des quatre murs, un après l'autre
      const total = 2 * (w + h);
      let drawn = outCubic(clamp(t / 0.4)) * total;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 3;
      ctx.lineCap = "square";
      ctx.shadowColor = LINE;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      [[x0, y0, x0 + w, y0], [x0 + w, y0, x0 + w, y0 + h], [x0 + w, y0 + h, x0, y0 + h], [x0, y0 + h, x0, y0]].forEach(([ax, ay, bx, by]) => {
        const len = Math.hypot(bx - ax, by - ay);
        const part = Math.min(len, drawn);
        if (part <= 0) return;
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax + ((bx - ax) * part) / len, ay + ((by - ay) * part) / len);
        drawn -= part;
      });
      ctx.stroke();
      ctx.shadowBlur = 0;
      // cotes
      const dim = clamp((t - 0.3) / 0.2);
      ctx.strokeStyle = rgba("#e8e8e6", 0.75 * dim);
      ctx.fillStyle = rgba("#e8e8e6", 0.9 * dim);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y0 - 14);
      ctx.lineTo(x0 + w, y0 - 14);
      ctx.moveTo(x0, y0 - 20);
      ctx.lineTo(x0, y0 - 8);
      ctx.moveTo(x0 + w, y0 - 20);
      ctx.lineTo(x0 + w, y0 - 8);
      ctx.stroke();
      ctx.font = "500 12px 'Share Tech Mono', ui-monospace, monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${(w / 46).toFixed(2).replace(".", ",")} m`, x, y0 - 20);
      ctx.fillStyle = rgba(LINE, dim);
      ctx.font = "500 14px 'Share Tech Mono', ui-monospace, monospace";
      ctx.fillText(`${area} m²`, x, y + 5);
    },
  });
}
