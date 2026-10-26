import { TAU, clamp, rnd, outCubic, rgba } from "../shared/fxkit";

const FLASH = "#e9f2ff";
const BOLT = "#cfe6ff";
const SUN = "#ffc857";

// Clic dans Météo : la foudre tombe sur le point cliqué. Un éclair ramifié descend du haut de l'écran, un éclat blanc
// éclaire toute la vitre une fraction de seconde, puis des éclaboussures concentriques et un rayon de soleil passent.
export default function spawn(x, y, { add, W }) {
  // l'éclair : une ligne brisée qui part du haut, à peu près au-dessus du clic, et ses branches
  const main = [[x + rnd(-120, 120), -20]];
  const steps = 11;
  for (let i = 1; i <= steps; i++) {
    const u = i / steps;
    main.push([x + (main[0][0] - x) * (1 - u) + rnd(-34, 34) * (1 - u * 0.4), -20 + (y + 20) * u]);
  }
  main[steps] = [x, y];
  const branches = Array.from({ length: 4 }, () => {
    const at = 2 + Math.floor(rnd(0, steps - 4));
    const pts = [main[at]];
    const dir = rnd(0, 1) < 0.5 ? -1 : 1;
    for (let i = 1; i <= 4; i++) pts.push([pts[i - 1][0] + dir * rnd(14, 40), pts[i - 1][1] + rnd(18, 48)]);
    return pts;
  });
  const stroke = (ctx, pts, w, color, glow) => {
    ctx.lineWidth = w;
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 26;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.stroke();
  };

  add({
    dur: 0.9,
    draw(ctx, t) {
      const strike = clamp(t / 0.16);
      const fade = 1 - clamp((t - 0.22) / 0.55);
      const flicker = t > 0.28 && t < 0.4 ? 0.55 : 1;
      const n = Math.max(2, Math.ceil(strike * main.length));
      ctx.globalAlpha = fade * flicker;
      branches.forEach((b) => stroke(ctx, b.slice(0, Math.max(2, Math.ceil(strike * b.length))), 2, BOLT, "#7fb2ff"));
      stroke(ctx, main.slice(0, n), 7, rgba("#7fb2ff", 0.6), "#7fb2ff");
      stroke(ctx, main.slice(0, n), 3, "#ffffff", FLASH);
    },
  });

  add({
    dur: 0.5,
    draw(ctx, t) {
      ctx.fillStyle = rgba(FLASH, 0.5 * Math.pow(1 - t, 2.2));
      ctx.fillRect(0, 0, W * 2, 4000);
    },
  });

  add({
    dur: 1.3,
    draw(ctx, t) {
      [0, 0.12, 0.26].forEach((delay, i) => {
        const k = clamp((t - delay) / (1 - delay));
        if (k <= 0) return;
        ctx.strokeStyle = rgba(i === 1 ? SUN : "#cfe0ee", (1 - k) * 0.85);
        ctx.lineWidth = 2.4 * (1 - k) + 0.6;
        ctx.beginPath();
        ctx.ellipse(x, y, 10 + outCubic(k) * (80 + i * 26), (10 + outCubic(k) * (80 + i * 26)) * 0.38, 0, 0, TAU);
        ctx.stroke();
      });
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI * (0.1 + (i / 11) * 0.8);
        const d = outCubic(t) * (50 + (i % 4) * 22);
        ctx.fillStyle = rgba("#cfe0ee", (1 - t) * 0.9);
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d + t * t * 40, 2.4, 0, TAU);
        ctx.fill();
      }
    },
  });
}
