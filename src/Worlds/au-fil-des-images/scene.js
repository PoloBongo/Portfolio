// Scène d'Au fil des images : un fil tracé au chargement, des cadres photo suspendus qui oscillent.
const [, CORAL, VIOLET, SUN, AUBERGINE] = ["#f7f0e6", "#ff7a59", "#6b3fb5", "#ffc65c", "#2b1650"];
const GRADS = [[VIOLET, CORAL], [SUN, CORAL], [AUBERGINE, VIOLET], [CORAL, SUN], [VIOLET, SUN]];
const POSITIONS = [0.12, 0.3, 0.49, 0.67, 0.85];
const TILTS = [-3, 2, -1, 3, -2];

export default function build(stage) {
  stage.innerHTML = `<svg class="w-fil__svg" viewBox="0 0 100 62.5" preserveAspectRatio="xMidYMid slice">
      <defs>${GRADS.map(
        (g, i) => `<linearGradient id="w-fil-g${i}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${g[0]}"/><stop offset="1" stop-color="${g[1]}"/></linearGradient>`
      ).join("")}</defs>
      <path class="w-fil__thread" d="M-2 8 C20 24, 38 24, 52 13 S86 2, 102 15" pathLength="220"/>
      <g class="w-fil__photos"></g></svg>`;

  const path = stage.querySelector(".w-fil__thread");
  const group = stage.querySelector(".w-fil__photos");
  const len = path.getTotalLength();
  POSITIONS.forEach((k, i) => {
    const pt = path.getPointAtLength(len * k);
    group.insertAdjacentHTML(
      "beforeend",
      `<g transform="translate(${pt.x.toFixed(2)} ${pt.y.toFixed(2)}) rotate(${TILTS[i]})"><g class="w-fil__ph" style="--i:${i}">
        <rect x="-.5" y="-1.6" width="1" height="3" rx=".3" fill="${AUBERGINE}"/>
        <rect x="-4.4" y="1" width="8.8" height="11.4" rx=".5" fill="#fffaf2" stroke="rgba(43,22,80,.18)" stroke-width=".12"/>
        <rect x="-3.6" y="1.8" width="7.2" height="7.6" rx=".3" fill="url(#w-fil-g${i})"/>
        <rect x="-3.6" y="10.2" width="4.2" height=".5" rx=".25" fill="${AUBERGINE}" opacity=".5"/></g></g>`
    );
  });
}
