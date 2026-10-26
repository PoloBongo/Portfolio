// Scène de Navy Bongo : le pont d'un voilier pirate vu du gouvernail. Mer qui houle (canvas), voiles noires, gréement,
// HUD du jeu (barre de vie, chrono, destruction, pièces d'or).
export default function build(stage, { loop, rgba }) {
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    return `<line x1="50" y1="50" x2="${(50 + Math.cos(a) * 46).toFixed(1)}" y2="${(50 + Math.sin(a) * 46).toFixed(1)}" stroke="#4a2812" stroke-width="5" stroke-linecap="round"/><circle cx="${(50 + Math.cos(a) * 47).toFixed(1)}" cy="${(50 + Math.sin(a) * 47).toFixed(1)}" r="5.2" fill="#8a4f2b" stroke="#4a2812" stroke-width="2"/>`;
  }).join("");
  stage.innerHTML = `<i class="w-nb__sun"></i><i class="w-nb__isle" style="left:8cqw;width:16cqw"></i><i class="w-nb__isle" style="left:70cqw;width:22cqw;height:3.4cqw;top:20cqw"></i>
    <i class="w-nb__mast"></i><i class="w-nb__boom"></i><i class="w-nb__sail" style="left:33.6cqw"></i><i class="w-nb__sail" style="left:51cqw;top:1.2cqw"></i><i class="w-nb__flag"></i>
    <svg class="w-nb__rig" viewBox="0 0 100 62.5" preserveAspectRatio="none"><line x1="50" y1="1" x2="6" y2="44"/><line x1="50" y1="1" x2="94" y2="44"/><line x1="50" y1="12" x2="14" y2="44"/><line x1="50" y1="12" x2="86" y2="44"/></svg>
    <i class="w-nb__deck"></i><i class="w-nb__post" style="left:6cqw"></i><i class="w-nb__post" style="left:92.4cqw"></i>
    <svg class="w-nb__wheel" viewBox="0 0 100 100"><circle cx="50" cy="50" r="39" fill="none" stroke="#7a4423" stroke-width="9"/><circle cx="50" cy="50" r="39" fill="none" stroke="#4a2812" stroke-width="1.6"/>${spokes}<circle cx="50" cy="50" r="8" fill="#8a4f2b" stroke="#4a2812" stroke-width="2"/></svg>
    <div class="w-nb__hp">NAVY</div><div class="w-nb__xp">5 % destruction</div><div class="w-nb__timer">08:12</div><p class="w-nb__gold"><i></i>15000</p>`;
  loop((ctx, W, H, t) => {
    ctx.clearRect(0, 0, W, H);
    const hz = H * 0.37;
    for (let l = 0; l < 10; l++) {
      const y0 = hz + (H - hz) * Math.pow(l / 10, 1.6);
      const amp = 1 + l * 0.9;
      const f = 0.006 / (1 + l * 0.15);
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) ctx.lineTo(x, y0 + Math.sin(x * f * 6 + t * 0.0012 * (1 + l * 0.15) + l) * amp + Math.sin(x * f * 11 - t * 0.0008 + l * 2) * amp * 0.4);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fillStyle = rgba(l % 2 ? "#0f5c9a" : "#0c4f87", 0.55);
      ctx.fill();
      ctx.strokeStyle = rgba("#dff4ff", 0.32 - l * 0.025);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < 12; i++) {
      const x = ((i * 97 + t * 0.02 * (1 + (i % 3))) % (W + 40)) - 20;
      const y = hz + 6 + (((i * 53) % 100) / 100) * (H - hz) * 0.7;
      ctx.fillRect(x, y, 6 + (i % 4) * 3, 1.5);
    }
  });
}
