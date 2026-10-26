// Scène de Shadow Scholar : l'emblème e-sport (silhouette encapuchonnée, traits de vitesse acier et corail),
// derrière un store dont les lames ne laissent voir que ce qu'éclaire la lampe du curseur.
const STEEL = "#4a86d6";
const CORAL = "#e5566d";

export default function build(stage) {
  const streaks = Array.from(
    { length: 9 },
    (_, i) =>
      `<i class="w-ss__streak" style="right:${14 + (i % 3) * 3}cqw;top:${14 + i * 2.6}cqw;--c:${i % 2 ? CORAL : STEEL};--r:${-24 + i * 6}deg;--w:${24 + (i % 4) * 7}cqw;--d:${i * 0.25}s"></i>`
  ).join("");
  stage.innerHTML = `${streaks}
    <svg class="w-ss__scholar" viewBox="0 0 60 68">
      <path d="M30 8 L52 17 L30 23 L8 17 Z" fill="#0b1124" stroke="${STEEL}" stroke-width=".7"/>
      <path d="M12 62 C10 40 16 24 30 22 C44 24 50 40 48 62 Z" fill="#070b1a" stroke="${STEEL}" stroke-width=".7"/>
      <ellipse cx="30" cy="34" rx="10" ry="11" fill="#02030a"/>
      <ellipse cx="25.6" cy="33" rx="2.1" ry="1.1" fill="#fff"/><ellipse cx="34.4" cy="33" rx="2.1" ry="1.1" fill="#fff"/>
      <path d="M52 17 L56 26" stroke="${CORAL}" stroke-width="1.2"/></svg>
    <i class="w-ss__dark"></i>`;
}
