// Scène d'Angry Birds : le jeu tel quel (ciel gris-bleu, herbe et terre, lance-pierre en bois, boutons vernis),
// l'oiseau est tiré en parabole sur une tour de bois qui s'effondre.
const RED = "#e0242e";
const WOOD = "#2a1d12";

export default function build(stage, { loop, clamp, ease }) {
  const clouds = [[8, 6, 14, 5, 0], [42, 12, 18, 6, -14], [70, 5, 12, 4, -28]]
    .map((c) => `<i class="w-ab__cloud" style="left:${c[0]}cqw;top:${c[1]}cqw;width:${c[2]}cqw;height:${c[3]}cqw;animation-delay:${c[4]}s"></i>`)
    .join("");
  stage.innerHTML = `${clouds}<i class="w-ab__ground"></i><div class="w-ab__tog"><i>Use Friction</i><i class="g">Enable Unity Gravity</i><i>Show Debug</i></div>`;

  loop((ctx, W, H, t) => {
    ctx.clearRect(0, 0, W, H);
    const T = 4200;
    const k = (t % T) / T;
    const g = H * 0.83;
    const sx = W * 0.22;
    const sy = g - H * 0.23;
    const tx = W * 0.8;
    const ty = g - H * 0.1;
    const hit = k > 0.62;
    // lance-pierre
    ctx.strokeStyle = "#8a5a2b";
    ctx.lineWidth = W * 0.012;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(sx, g);
    ctx.lineTo(sx, sy + H * 0.06);
    ctx.moveTo(sx, sy + H * 0.06);
    ctx.lineTo(sx - W * 0.02, sy - H * 0.02);
    ctx.moveTo(sx, sy + H * 0.06);
    ctx.lineTo(sx + W * 0.02, sy - H * 0.02);
    ctx.stroke();
    // tour de bois qui s'effondre à l'impact
    const fall = hit ? clamp((k - 0.62) / 0.3) : 0;
    for (let i = 0; i < 3; i++) {
      const bx = tx + (i % 2) * W * 0.004 + fall * W * 0.05 * (i + 1) * 0.4;
      const by = g - (i + 1) * H * 0.075 + fall * H * 0.075 * i * 0.8;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(fall * (i - 1) * 0.5);
      ctx.fillStyle = "#b9803f";
      ctx.strokeStyle = WOOD;
      ctx.lineWidth = 1.5;
      ctx.fillRect(-W * 0.028, -H * 0.036, W * 0.056, H * 0.072);
      ctx.strokeRect(-W * 0.028, -H * 0.036, W * 0.056, H * 0.072);
      ctx.restore();
    }
    // l'oiseau : tension, vol, impact
    const x0 = sx - W * 0.05;
    const y0 = sy + H * 0.05;
    const arc = (p) => [x0 + (tx - W * 0.03 - x0) * p, y0 + (ty - y0) * p - 4 * H * 0.34 * p * (1 - p)];
    let bx;
    let by;
    if (k < 0.25) {
      const p = ease(k / 0.25);
      bx = sx - W * 0.05 * p;
      by = sy + H * 0.05 * p;
    } else if (k < 0.62) {
      [bx, by] = arc((k - 0.25) / 0.37);
    } else {
      bx = tx - W * 0.03 - (k - 0.62) * W * 0.08;
      by = ty + clamp((k - 0.62) * 3) * (g - H * 0.035 - ty);
    }
    if (k < 0.62) {
      ctx.fillStyle = "rgba(42,29,18,.5)";
      for (let i = 1; i < 14; i++) {
        const p = i / 14;
        if (k > 0.25 && p < (k - 0.25) / 0.37) continue;
        const [px, py] = arc(p);
        ctx.beginPath();
        ctx.arc(px, py, W * 0.004, 0, 7);
        ctx.fill();
      }
    }
    const r = H * 0.045;
    ctx.fillStyle = RED;
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#f6d9b0";
    ctx.beginPath();
    ctx.ellipse(bx + r * 0.1, by + r * 0.35, r * 0.62, r * 0.5, 0, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#f2a31b";
    ctx.beginPath();
    ctx.moveTo(bx + r * 0.55, by - r * 0.05);
    ctx.lineTo(bx + r * 1.15, by + r * 0.2);
    ctx.lineTo(bx + r * 0.55, by + r * 0.4);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(bx + r * 0.3, by - r * 0.25, r * 0.22, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#111";
    ctx.beginPath();
    ctx.arc(bx + r * 0.38, by - r * 0.22, r * 0.1, 0, 7);
    ctx.fill();
    ctx.strokeStyle = "#111";
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.05, by - r * 0.62);
    ctx.lineTo(bx + r * 0.6, by - r * 0.3);
    ctx.stroke();
  });
}
