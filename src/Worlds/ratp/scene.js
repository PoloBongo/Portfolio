// Scène de RATP Maintenance Challenge : l'affiche du jeu (nuit urbaine en bokeh, cyan et bleu RATP), le quai en
// perspective où arrive un rame, et un tableau à palettes dont les destinations se recomposent lettre à lettre.
const DEST = [["Châtelet", "2"], ["Nation", "5"], ["La Défense", "8"]];
const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export default function build(stage, { every }) {
  stage.innerHTML = `<div class="w-rt__quay"><i class="w-rt__train"></i><i class="w-rt__pin"></i></div>
    <div class="w-rt__board">${DEST.map((d) => `<p><span class="dst" data-t="${d[0]}">${d[0]}</span><span>${d[1]} min</span></p>`).join("")}</div>`;
  const els = stage.querySelectorAll(".dst");
  let k = 0;
  every(() => {
    const el = els[k++ % els.length];
    const target = el.dataset.t;
    let n = 0;
    const id = setInterval(() => {
      el.textContent = target
        .split("")
        .map((c, i) => (i < n || c === " " ? c : GLYPHS[(Math.random() * 26) | 0]))
        .join("");
      if (++n > target.length) {
        clearInterval(id);
        el.textContent = target;
      }
    }, 60);
  }, 2200);
}
