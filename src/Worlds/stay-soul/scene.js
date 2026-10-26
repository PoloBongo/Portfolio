// Scène de Stay Soul : fond noir tramé (Bayer, lavande), un petit fantôme pixel, l'âme, qui suit le curseur
// en laissant une traînée de pixels.
const LAVENDER = [0x7b, 0x69, 0xa8];
const MIST = "#a99ad6";
const PRUNE = "#35264d";
const CREAM = "#f1f0e4";
const SPRITE = ["..XXXXX..", ".XXXXXXX.", "XXXXXXXXX", "XX.XXX.XX", "XXXXXXXXX", "XXXXXXXXX", "XXXXXXXXX", "XXXXXXXXX", "XX.XXX.XX", "X..X.X..X"];
const GW = 160;
const GH = 100;

export default function build(stage, { loop, clamp, rgba, BAYER }) {
  stage.innerHTML = `<p class="w-sy__hint">Reste en vie</p>`;

  // Fond : dégradé radial seuillé par la matrice de Bayer, dessiné une fois en basse résolution
  const bg = document.createElement("canvas");
  bg.width = GW;
  bg.height = GH;
  const g = bg.getContext("2d");
  const image = g.createImageData(GW, GH);
  for (let y = 0; y < GH; y++) {
    for (let x = 0; x < GW; x++) {
      const d = Math.hypot((x - GW * 0.5) / GW, (y - GH * 0.45) / GH);
      const v = clamp(1 - d * 2.4) * 0.55;
      const th = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
      const i = (y * GW + x) * 4;
      const on = v > th;
      image.data[i] = on ? LAVENDER[0] : 7;
      image.data[i + 1] = on ? LAVENDER[1] : 5;
      image.data[i + 2] = on ? LAVENDER[2] : 12;
      image.data[i + 3] = 255;
    }
  }
  g.putImageData(image, 0, 0);

  const trail = [];
  let gx = 0;
  let gy = 0;
  let ready = false;
  const canvas = loop((ctx, W, H, t, p) => {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);
    if (!ready) {
      gx = W * 0.5;
      gy = H * 0.72;
      ready = true;
    }
    gx += (p.x - gx) * 0.08;
    gy += (p.y - gy) * 0.08;
    trail.push({ x: gx, y: gy });
    if (trail.length > 14) trail.shift();
    const s = Math.max(2, Math.round(W / 130));
    trail.forEach((q, i) => {
      ctx.fillStyle = rgba(MIST, (i / trail.length) * 0.35);
      const r = s * 2;
      ctx.fillRect(Math.round(q.x / s) * s - r / 2 + 2 * s, Math.round(q.y / s) * s + 4 * s, r, r);
    });
    const ox = Math.round(gx / s) * s - 4.5 * s;
    const oy = Math.round(gy / s) * s - 5 * s + Math.round(Math.sin(t * 0.004) * s);
    ctx.fillStyle = CREAM;
    SPRITE.forEach((row, ry) =>
      [...row].forEach((c, rx) => {
        if (c === "X") ctx.fillRect(ox + rx * s, oy + ry * s, s, s);
      })
    );
    ctx.fillStyle = PRUNE;
    ctx.fillRect(ox + 3 * s, oy + 3 * s, s, 2 * s);
    ctx.fillRect(ox + 5 * s, oy + 3 * s, s, 2 * s);
    ctx.fillRect(ox + 4 * s, oy + 6 * s, s, s);
  });
  canvas.style.imageRendering = "pixelated";
}
