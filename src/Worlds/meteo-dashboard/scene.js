// Scène de Météo Dashboard : une vitre sous la pluie, les gouttes courent, la buée est essuyée par le curseur
// (voir .w-mt__fog dans le CSS : un masque suit --mx / --my).
export default function build(stage, { loop, rgba }) {
  stage.innerHTML = `<p class="w-mt__temp">18<sup>°</sup></p><p class="w-mt__city">Tours · averses</p>
    <div class="w-mt__hours"><span><b>14h</b> 19°</span><span><b>17h</b> 16°</span><span><b>21h</b> 12°</span></div><i class="w-mt__fog"></i>`;
  const drops = Array.from({ length: 34 }, () => ({ x: Math.random(), y: Math.random(), v: 0.12 + Math.random() * 0.3, r: 0.8 + Math.random() * 1.8, run: Math.random() < 0.35 }));
  let last = 0;
  loop((ctx, W, H, t) => {
    const dt = Math.min(48, t - last) / 1000;
    last = t;
    ctx.clearRect(0, 0, W, H);
    drops.forEach((d) => {
      d.y += (d.run ? d.v : d.v * 0.06) * dt;
      if (d.y > 1.05) {
        d.y = -0.05;
        d.x = Math.random();
      }
      const x = d.x * W;
      const y = d.y * H;
      ctx.fillStyle = "rgba(233,242,255,.42)";
      ctx.beginPath();
      ctx.ellipse(x, y, d.r, d.r * 1.35, 0, 0, 7);
      ctx.fill();
      if (d.run) {
        ctx.strokeStyle = "rgba(233,242,255,.14)";
        ctx.lineWidth = d.r * 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - H * 0.09);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.fillRect(x - d.r * 0.3, y - d.r * 0.6, d.r * 0.5, d.r * 0.5);
    });
    if (Math.sin(t * 0.0007) > 0.985) {
      ctx.fillStyle = rgba("#e9f2ff", 0.12);
      ctx.fillRect(0, 0, W, H);
    }
  });
}
