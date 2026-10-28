import { TAU, clamp, rnd, pick, outCubic, outBack } from "../shared/fxkit";

const INK = "#1b1b1f";
const COLORS = ["#ec4e3a", "#3369d0", "#5cc552", "#ffd23f", "#ffffff", "#ffb391"];
const WORDS = ["POP !", "EKO !", "OUI !", "BRAVO"];

// Une forme Memphis centrée sur l'origine : disque, triangle, étoile, croix
function shape(ctx, kind, r) {
  ctx.beginPath();
  if (kind === 0) {
    ctx.arc(0, 0, r, 0, TAU);
  } else if (kind === 1) {
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.92, r * 0.72);
    ctx.lineTo(-r * 0.92, r * 0.72);
    ctx.closePath();
  } else if (kind === 2) {
    for (let i = 0; i < 16; i++) {
      const a = (i * TAU) / 16 - Math.PI / 2;
      const rr = i % 2 ? r * 0.5 : r;
      ctx[i ? "lineTo" : "moveTo"](Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  } else {
    const w = r * 0.36;
    ctx.rect(-w, -r, w * 2, r * 2);
    ctx.rect(-r, -w, r * 2, w * 2);
  }
}

// Clic dans Eko : un autocollant « POP ! » éclate à l'endroit du clic et des formes plates, avec leur ombre dure,
// jaillissent, retombent et rebondissent.
export default function spawn(x, y, { add, H }) {
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    a: (i / 16) * TAU + rnd(-0.2, 0.2),
    v: rnd(260, 620),
    kind: i % 4,
    size: rnd(9, 20),
    color: COLORS[i % COLORS.length],
    spin: rnd(-9, 9),
    rot: rnd(0, TAU),
  }));
  const floor = Math.min(H - 6, y + 260);

  add({
    dur: 2.1,
    draw(ctx, t) {
      const s = t * 2.1;
      const fade = 1 - clamp((t - 0.82) / 0.18);
      pieces.forEach((p) => {
        const run = (p.v * (1 - Math.exp(-4 * s))) / 4;
        const px = x + Math.cos(p.a) * run;
        let py = y + Math.sin(p.a) * run + 0.5 * 900 * s * s;
        // rebond sur le « sol » : une fois, en perdant de l'énergie
        if (py > floor) py = floor - (py - floor) * 0.35 * Math.min(1, 1.4 - s * 0.4);
        const scale = outBack(clamp(s / 0.22));
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(px, py);
        ctx.rotate(p.rot + p.spin * s);
        ctx.scale(scale, scale);
        ctx.fillStyle = INK;
        ctx.save();
        ctx.translate(3, 3);
        shape(ctx, p.kind, p.size);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = p.color;
        shape(ctx, p.kind, p.size);
        ctx.fill();
        ctx.restore();
      });
    },
  });

  const word = pick(WORDS);
  add({
    dur: 1.25,
    draw(ctx, t) {
      const k = outBack(clamp(t / 0.2));
      const out = 1 - clamp((t - 0.72) / 0.28);
      const r = 62 * k * (0.9 + 0.1 * out);
      if (r <= 0 || out <= 0) return;
      ctx.globalAlpha = out;
      ctx.translate(x, y - 8);
      ctx.rotate(-0.16 + t * 0.12);
      ctx.fillStyle = INK;
      ctx.save();
      ctx.translate(5, 5);
      shape(ctx, 2, r);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#ffd23f";
      shape(ctx, 2, r);
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = INK;
      ctx.font = "800 22px Poppins, 'Helvetica Neue', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(word, 0, 1);
    },
  });

  add({
    dur: 0.7,
    draw(ctx, t) {
      ctx.strokeStyle = "#ec4e3a";
      ctx.lineWidth = 5 * (1 - t);
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.arc(x, y, 14 + outCubic(t) * 120, 0, TAU);
      ctx.stroke();
    },
  });
}
