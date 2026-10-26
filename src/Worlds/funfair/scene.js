// Scène de Funfair : la composition de l'affiche vidéo (nuit, cadre vert avec la grande roue, cadre bleu avec le
// stand rouge, badge Unreal) sous une guirlande d'ampoules qui s'allument près du curseur.
const WARM = "#ffd36b";

export default function build(stage, { loop, clamp, rgba }) {
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4;
    const x = 50 + Math.cos(a) * 22;
    const y = 36 + Math.sin(a) * 22;
    return `<line x1="50" y1="36" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#f4c430" stroke-width=".8"/><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2" fill="#ff5f5f"/>`;
  }).join("");
  const bulbs = Array.from({ length: 14 }, (_, i) => `<circle cx="${4 + i * 7.4}" cy="${6 + Math.sin((i / 13) * Math.PI) * 4}" r=".9" fill="${WARM}"/>`).join("");

  stage.innerHTML = `<div class="w-ff__fg"><svg viewBox="0 0 100 62">${bulbs}<path d="M30 62 L50 36 L70 62" stroke="#8a8aa8" stroke-width="1.2" fill="none"/><g class="w-ff__wheel"><circle cx="50" cy="36" r="22" fill="none" stroke="#f4c430" stroke-width=".9"/>${spokes}</g></svg></div>
    <div class="w-ff__fb"><i class="w-ff__cac"></i><i class="w-ff__tb"></i><i class="w-ff__bt"></i><i class="w-ff__ba"></i></div>
    <div class="w-ff__ue"><b>U</b><span>UNREAL<br>ENGINE</span></div><p class="w-ff__eng">Unreal<br>Engine<br>5.4</p>`;

  loop((ctx, W, H, t, p) => {
    ctx.clearRect(0, 0, W, H);
    for (let line = 0; line < 2; line++) {
      const n = 26;
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        const x = u * W;
        const y = H * (0.03 + line * 0.06) + Math.sin(u * Math.PI * 3) * H * 0.014;
        const near = clamp(1 - Math.hypot(x - p.x, y - p.y) / (W * 0.2));
        const a = clamp(0.28 + near * 0.9 + (Math.sin(t * 0.004 - i * 0.6 + line) * 0.5 + 0.5) * 0.3);
        ctx.fillStyle = rgba(WARM, a * 0.35);
        ctx.beginPath();
        ctx.arc(x, y, W * 0.011 * (1 + a), 0, 7);
        ctx.fill();
        ctx.fillStyle = rgba(a > 0.6 ? "#fff6d0" : WARM, 0.35 + a * 0.65);
        ctx.beginPath();
        ctx.arc(x, y, W * 0.0048, 0, 7);
        ctx.fill();
      }
    }
  });
}
