// Scène de Spacial Race : la route d'asphalte grise sous la neige, lignes jaunes en perspective, la voiture orange
// à la flamme, chronomètre minimal. Un clic sur la scène (ou toutes les 5 s) inverse la gravité : tout se retourne.
export default function build(stage, { loop, every }) {
  stage.innerHTML = `<div class="w-sr__world"><i class="w-sr__sky"></i><i class="w-sr__mtn" style="left:-4cqw"></i><i class="w-sr__mtn" style="left:58cqw;width:46cqw"></i><div class="w-sr__car"><i class="w-sr__flame"></i></div></div>
    <p class="w-sr__hud"><small>TEMPS</small><span class="w-sr__t">02:00.83</span></p>
    <span class="w-sr__flip">Inverser la gravité</span>`;
  const world = stage.querySelector(".w-sr__world");
  const timer = stage.querySelector(".w-sr__t");

  loop((ctx, W, H, t) => {
    ctx.clearRect(0, 0, W, H);
    const hz = H * 0.44;
    const cx = W * 0.5;
    const spd = (t * 0.0009) % 1;
    ctx.fillStyle = "#b8bec3";
    ctx.fillRect(0, hz, W, H - hz);
    ctx.fillStyle = "#f3f6f8";
    ctx.beginPath();
    ctx.moveTo(0, hz);
    ctx.lineTo(cx - W * 0.03, hz);
    ctx.lineTo(-W * 0.5, H);
    ctx.lineTo(0, H);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W, hz);
    ctx.lineTo(cx + W * 0.03, hz);
    ctx.lineTo(W * 1.5, H);
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.fillStyle = "#6f757b";
    ctx.beginPath();
    ctx.moveTo(cx - W * 0.03, hz);
    ctx.lineTo(cx + W * 0.03, hz);
    ctx.lineTo(cx + W * 0.42, H);
    ctx.lineTo(cx - W * 0.42, H);
    ctx.fill();
    // les doubles lignes jaunes, en perspective
    for (let i = 0; i < 9; i++) {
      const z0 = (i + spd) / 9;
      const z1 = (i + spd + 0.45) / 9;
      const f = (z) => z * z;
      const y0 = hz + (H - hz) * f(z0);
      const y1 = hz + (H - hz) * f(z1);
      const w0 = 0.005 + 0.02 * f(z0);
      const w1 = 0.005 + 0.02 * f(z1);
      ctx.fillStyle = "#f2b521";
      [-1, 1].forEach((o) => {
        const gap = o * W * 0.008;
        ctx.beginPath();
        ctx.moveTo(cx + gap * f(z0) * 3 - W * w0 * 0.5, y0);
        ctx.lineTo(cx + gap * f(z0) * 3 + W * w0 * 0.5, y0);
        ctx.lineTo(cx + gap * f(z1) * 3 + W * w1 * 0.5, y1);
        ctx.lineTo(cx + gap * f(z1) * 3 - W * w1 * 0.5, y1);
        ctx.fill();
      });
    }
    const s = 120.83 - ((t * 0.001) % 60);
    timer.textContent = `02:${s % 60 < 10 ? "0" : ""}${(s % 60).toFixed(2)}`;
  });
  world.prepend(stage.querySelector("canvas.w-cv"));

  const flip = () => stage.classList.toggle("w-sr--flip");
  stage.addEventListener("click", flip);
  every(flip, 5000);
}
