// Scène de SEO Autopilot : un éditeur de nœuds sur papier pointillé, une impulsion court le long des fils.
const NODES = [
  { x: 5, y: 27, t: "Cron", c: "#7b8794", a: "chaque nuit", b: "02:00", d: 0 },
  { x: 30, y: 17, t: "Lighthouse", c: "#f08a1c", a: "performance", b: "92", d: 1.7 },
  { x: 30, y: 37, t: "WAVE", c: "#4b5bd7", a: "accessibilité", b: "0 erreur", d: 1.7 },
  { x: 55, y: 27, t: "GPT", c: "#1c1c24", a: "reformule", b: "12 cartes", d: 3.4 },
  { x: 79, y: 27, t: "Archive S3", c: "#ff5a47", a: "rapport.json", b: "ok", d: 5.1 },
];
const LINKS = [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]];
const BEGIN = [0.5, 0.5, 2.2, 2.2, 3.9];
const NW = 17;
const NH = 9.4;

export default function build(stage) {
  const wires = LINKS.map(([a, b], i) => {
    const A = NODES[a];
    const B = NODES[b];
    const x1 = A.x + NW;
    const y1 = A.y + NH / 2;
    const x2 = B.x;
    const y2 = B.y + NH / 2;
    const d = `M${x1} ${y1} C${x1 + 6} ${y1},${x2 - 6} ${y2},${x2} ${y2}`;
    return `<path d="${d}" fill="none" stroke="rgba(28,28,36,.38)" stroke-width=".28"/>
      <circle r=".95" fill="#ff5a47" opacity="0"><animateMotion dur="7s" begin="${BEGIN[i]}s" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;.18;1" calcMode="linear" path="${d}"/><animate attributeName="opacity" dur="7s" begin="${BEGIN[i]}s" repeatCount="indefinite" values="0;1;1;0;0" keyTimes="0;.02;.17;.2;1"/></circle>`;
  }).join("");

  stage.innerHTML = `<p class="w-seo__file">workflow.json · 5 nœuds · dernière exécution 02:00</p>
    <svg class="w-seo__wires" viewBox="0 0 100 62.5" preserveAspectRatio="none">${wires}</svg>
    ${NODES.map(
      (n) =>
        `<div class="w-seo__node" style="left:${n.x}cqw;top:${n.y}cqw;--c:${n.c};--d:${n.d}s"><header><i></i>${n.t}</header><p>${n.a}</p><b>${n.b}</b></div>`
    ).join("")}`;
}
