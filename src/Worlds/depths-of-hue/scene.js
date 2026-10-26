// Scène de Depths Of Hue : la coursive du sous-marin, hublots vert menthe. Tout est gris sauf sous le curseur :
// la couleur revient dans le halo (voir .w-dh__grey).
const HUBS = [10, 30, 56, 80];
const CORALS = [[8, 1], [26, 0.7], [52, 1.1], [74, 0.8], [90, 1]];
const FISH = [[30, 9, 0], [44, 12, 3], [20, 15, 6]];

export default function build(stage) {
  const hubs = HUBS.map((x) => `<i class="w-dh__hub" style="left:${x}cqw"></i>`).join("");
  const corals = CORALS.map((c) => `<i class="w-dh__coral" style="left:${c[0]}cqw;transform:scale(${c[1]});transform-origin:50% 100%"></i>`).join("");
  const fish = FISH.map((f) => `<i class="w-dh__fish" style="--y:${f[0]}cqw;--t:${f[1]}s;--d:${f[2]}s"></i>`).join("");
  const bubbles = Array.from(
    { length: 12 },
    (_, i) => `<i class="w-dh__bub" style="--x:${6 + i * 8}cqw;--s:${0.8 + (i % 4) * 0.5}cqw;--t:${5 + (i % 5)}s;--d:${-i * 0.7}s"></i>`
  ).join("");
  stage.innerHTML = `<div class="w-dh__art">${hubs}${corals}${fish}${bubbles}</div><i class="w-dh__grey"></i>`;
}
