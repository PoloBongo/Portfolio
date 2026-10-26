// Scène d'Eko : une forêt de sapins en trois plans qui bougent en parallaxe au curseur, une brume qui dérive,
// le soleil, des pousses qui poussent (les abonnements).
export default function build(stage, { frame, pointer }) {
  const fir = (x, h, wd, col) =>
    `<path d="M${x} 100 L${x - wd / 2} 100 L${x - wd * 0.2} ${100 - h * 0.45} L${x - wd * 0.38} ${100 - h * 0.45} L${x} ${100 - h} L${x + wd * 0.38} ${100 - h * 0.45} L${x + wd * 0.2} ${100 - h * 0.45} L${x + wd / 2} 100Z" fill="${col}"/>`;
  const layer = (n, count, h, wd, col, seed) =>
    `<svg class="w-ek__layer w-ek__l${n}" viewBox="0 0 100 100" preserveAspectRatio="none">${Array.from({ length: count }, (_, i) =>
      fir(((i + 0.5) / count) * 100 + Math.sin(i * seed) * 2.2, h + Math.sin(i * seed * 1.7) * h * 0.3, wd, col)
    ).join("")}</svg>`;
  stage.innerHTML = `<i class="w-ek__sun"></i>${layer(1, 14, 52, 9, "#1d4a39", 2.3)}<i class="w-ek__mist w-ek__m1"></i>${layer(2, 10, 64, 11, "#25503b", 3.1)}<i class="w-ek__mist w-ek__m2"></i>${layer(3, 7, 78, 15, "#0a1d15", 4.7)}
    ${[24, 38, 50].map((x, i) => `<i class="w-ek__sprout" style="left:${x}cqw;--d:${i * 1.3}s"></i>`).join("")}`;

  // Parallaxe au curseur (sans curseur, il flâne seul)
  const layers = [".w-ek__l1", ".w-ek__l2", ".w-ek__l3"].map((sel) => stage.querySelector(sel));
  const depth = [-0.012, -0.03, -0.06];
  frame((t) => {
    const p = pointer(t);
    layers.forEach((layer, i) => {
      layer.style.transform = `translateX(${((p.x - p.w / 2) * depth[i]).toFixed(1)}px)`;
    });
  });
}
