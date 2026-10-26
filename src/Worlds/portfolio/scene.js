// Scène de Portfolio : le site se décrit lui-même. Un nuage de points violet qui s'écarte du curseur, un HUD qui
// affiche le nombre de points, les images par seconde mesurées et la latence.
const VIOLET = "#bc63ff";
const MINT = "#63e6be";

export default function build(stage, { loop, clamp, sprite }) {
  stage.innerHTML = `<div class="w-pf__hud"><span>Points <b>65 536</b></span><span>i/s <b class="w-pf__fps">60</b></span><span>Latence <b>0,4 ms</b></span></div><p class="w-pf__role">Gameplay programmer · Web · IA</p>`;
  const sv = sprite(VIOLET, 32);
  const sm = sprite(MINT, 32);
  const N = 420;
  const pts = Array.from({ length: N }, (_, i) => ({ a: Math.random() * 7, b: Math.acos(2 * Math.random() - 1), r: 0.5 + Math.random() * 0.5, m: i % 9 === 0 }));
  const fps = stage.querySelector(".w-pf__fps");
  let frames = 0;
  let t0 = 0;
  loop((ctx, W, H, t, p) => {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    const cx = W * 0.72;
    const cy = H * 0.5;
    const R = Math.min(W, H) * 0.42;
    const rot = t * 0.0003;
    pts.forEach((q) => {
      const a = q.a + rot;
      const x = Math.sin(q.b) * Math.cos(a);
      const y = Math.cos(q.b);
      const z = Math.sin(q.b) * Math.sin(a);
      const k = 1 / (1.8 - z * 0.5);
      let sx = cx + x * R * q.r * k * 1.2;
      let sy = cy + y * R * q.r * k * 1.2;
      const dx = sx - p.x;
      const dy = sy - p.y;
      const d = Math.hypot(dx, dy);
      const pull = d < 90 ? (1 - d / 90) * 26 : 0;
      if (pull) {
        sx -= (dx / d) * pull;
        sy -= (dy / d) * pull;
      }
      const s = (q.m ? 11 : 6) * k;
      ctx.globalAlpha = clamp(0.25 + 0.75 * (z * 0.5 + 0.5));
      ctx.drawImage(q.m ? sm : sv, sx - s, sy - s, s * 2, s * 2);
    });
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    frames++;
    if (t - t0 > 1000) {
      fps.textContent = Math.min(60, frames);
      frames = 0;
      t0 = t;
    }
  });
}
