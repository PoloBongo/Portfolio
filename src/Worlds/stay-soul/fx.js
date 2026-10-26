import { TAU, clamp, rnd, pick, outCubic, rgba } from "../shared/fxkit";

const CREAM = "#f1f0e4";
const LAVENDER = "#a99ad6";
const PLUM = "#35264d";
const COLORS = [CREAM, LAVENDER, "#7b69a8", CREAM];
const GHOST = ["..XXXXX..", ".XXXXXXX.", "XXXXXXXXX", "XX.XXX.XX", "XXXXXXXXX", "XXXXXXXXX", "XXXXXXXXX", "XXXXXXXXX", "XX.XXX.XX", "X..X.X..X"];

// Pas de 6 px, images à 12 par seconde : le mouvement reste « 8 bits »
const GRID = 6;
const snap = (v) => Math.round(v / GRID) * GRID;
const stepped = (t) => Math.floor(t * 12) / 12;

// Clic dans Stay Soul : un éclat de pixels carrés, un anneau de blocs qui s'élargit et une âme (le fantôme) qui
// s'échappe vers le haut en ondulant.
export default function spawn(x, y, { add }) {
  const bits = Array.from({ length: 42 }, () => ({ a: rnd(0, TAU), v: rnd(90, 330), size: pick([1, 1, 2]) * GRID, color: pick(COLORS) }));
  add({
    dur: 1.0,
    draw(ctx, t) {
      const s = stepped(t);
      bits.forEach((b) => {
        const d = b.v * outCubic(s) * 0.7;
        const px = snap(x + Math.cos(b.a) * d);
        const py = snap(y + Math.sin(b.a) * d + s * s * 120);
        ctx.fillStyle = rgba(b.color, 1 - s);
        ctx.fillRect(px, py, b.size, b.size);
      });
    },
  });

  add({
    dur: 0.75,
    draw(ctx, t) {
      const s = stepped(t);
      const r = 18 + outCubic(s) * 110;
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * TAU;
        ctx.fillStyle = rgba(i % 2 ? LAVENDER : CREAM, (1 - s) * 0.95);
        ctx.fillRect(snap(x + Math.cos(a) * r), snap(y + Math.sin(a) * r), GRID, GRID);
      }
    },
  });

  add({
    dur: 1.9,
    draw(ctx, t) {
      const s = stepped(t);
      const gx = snap(x + Math.sin(s * 9) * 18) - 4.5 * 5;
      const gy = snap(y - outCubic(s) * 150) - 5 * 5;
      const px = 5;
      ctx.globalAlpha = 1 - clamp((t - 0.65) / 0.35);
      ctx.fillStyle = CREAM;
      GHOST.forEach((row, ry) =>
        [...row].forEach((c, rx) => {
          if (c === "X") ctx.fillRect(gx + rx * px, gy + ry * px, px, px);
        })
      );
      ctx.fillStyle = PLUM;
      ctx.fillRect(gx + 3 * px, gy + 3 * px, px, 2 * px);
      ctx.fillRect(gx + 5 * px, gy + 3 * px, px, 2 * px);
      ctx.fillRect(gx + 4 * px, gy + 6 * px, px, px);
    },
  });
}
