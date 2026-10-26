// Scène d'Attraction Flow : le parc du jeu vu de dessus. Herbe menthe, allées beige à barrières, arbres low-poly
// colorés, manège bleu, portes rose et turquoise, visiteurs qui suivent les allées vers le manège.
const ORANGE = "#f2994a";
const BLUE = "#3c8dde";
const PATH = "#d9bd96";

export default function build(stage, { loop }) {
  stage.innerHTML = `<p class="w-af__money">100 ◈</p>`;
  const cols = [ORANGE, "#e04a5f", BLUE, "#f2c14e", "#2f9e6e"];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const trees = Array.from({ length: 70 }, () => ({ x: rnd(), y: rnd(), c: cols[(rnd() * cols.length) | 0], r: 0.008 + rnd() * 0.01 }));
  const guests = Array.from({ length: 16 }, (_, i) => ({ u: rnd(), s: 0.00006 + rnd() * 0.00006, v: i % 2, c: cols[i % cols.length] }));
  loop((ctx, W, H, t) => {
    ctx.clearRect(0, 0, W, H);
    const px = W * 0.62;
    const py = H * 0.66;
    const pw = W * 0.07;
    trees.forEach((q) => {
      const x = q.x * W;
      const y = q.y * H;
      if (Math.abs(x - px) < pw * 1.5 || Math.abs(y - py) < pw * 1.4 || (x < W * 0.5 && y < H * 0.52)) return;
      ctx.fillStyle = "rgba(0,0,0,.12)";
      ctx.beginPath();
      ctx.ellipse(x + 3, y + 4, q.r * W, q.r * W * 0.6, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = q.c;
      ctx.beginPath();
      ctx.moveTo(x, y - q.r * W * 1.4);
      ctx.lineTo(x + q.r * W, y + q.r * W * 0.6);
      ctx.lineTo(x - q.r * W, y + q.r * W * 0.6);
      ctx.fill();
    });
    ctx.fillStyle = PATH;
    ctx.fillRect(px - pw / 2, 0, pw, H);
    ctx.fillRect(0, py - pw / 2, W, pw);
    ctx.fillStyle = "#6b5236";
    for (let y = 0; y < H; y += H * 0.05) {
      ctx.fillRect(px - pw / 2 - 2, y, 2, H * 0.03);
      ctx.fillRect(px + pw / 2, y, 2, H * 0.03);
    }
    for (let x = 0; x < W; x += W * 0.05) {
      ctx.fillRect(x, py - pw / 2 - 2, W * 0.03, 2);
      ctx.fillRect(x, py + pw / 2, W * 0.03, 2);
    }
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.moveTo(px, H * 0.08);
    ctx.lineTo(px + W * 0.09, H * 0.22);
    ctx.lineTo(px - W * 0.09, H * 0.22);
    ctx.fill();
    ctx.fillStyle = ORANGE;
    ctx.fillRect(px - W * 0.05, H * 0.22, W * 0.1, H * 0.035);
    ctx.fillStyle = "#e84fa8";
    ctx.beginPath();
    ctx.arc(W * 0.96, H * 0.5, W * 0.022, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#26b8a8";
    ctx.beginPath();
    ctx.arc(W * 0.04, py, W * 0.022, 0, 7);
    ctx.fill();
    guests.forEach((g) => {
      const u = (g.u + t * g.s) % 1;
      const x = g.v ? (g.u > 0.5 ? u : 1 - u) * W : px + (g.u > 0.5 ? -1 : 1) * pw * 0.18;
      const y = g.v ? py + (g.u > 0.5 ? -1 : 1) * pw * 0.18 : (1 - u) * H;
      ctx.fillStyle = g.c;
      ctx.beginPath();
      ctx.arc(x, y, W * 0.006, 0, 7);
      ctx.fill();
    });
  });
}
