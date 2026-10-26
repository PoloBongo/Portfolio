// Scène de Choco Blast : le menu du jeu (boutons rose bonbon à liseré jaune sur fond cacao) et des gouttes de
// chocolat qui fusionnent (filtre « goo ») en suivant le curseur.
const ITEMS = ["Start", "Score", "Settings", "Quit"];
const SIZES = [90, 64, 52, 42, 34, 26, 20];

export default function build(stage, { frame, pointer }) {
  stage.innerHTML = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs><filter id="w-cb-goo"><feGaussianBlur in="SourceGraphic" stdDeviation="9" result="b"/><feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -9"/></filter></defs></svg>
    <div class="w-cb__goo">${SIZES.map(() => "<i></i>").join("")}</div>
    <div class="w-cb__menu">${ITEMS.map((label, i) => `<i${i === 0 ? ' class="on"' : ""}>${label}</i>`).join("")}</div>
    <p class="w-cb__ver">Version 0.0</p>`;

  const blobs = [...stage.querySelectorAll(".w-cb__goo i")];
  const items = [...stage.querySelectorAll(".w-cb__menu i")];
  const pos = blobs.map(() => ({ x: 0, y: 0 }));
  let last = -1;

  frame((t) => {
    const width = stage.getBoundingClientRect().width;
    const p = pointer(t);
    blobs.forEach((b, i) => {
      const size = (SIZES[i] * width) / 640;
      const tx = i === 0 ? p.x : pos[i - 1].x + Math.sin(t * 0.002 + i) * size * 0.9;
      const ty = i === 0 ? p.y : pos[i - 1].y + Math.cos(t * 0.0017 + i) * size * 0.9;
      pos[i].x += (tx - pos[i].x) * (0.18 - i * 0.012);
      pos[i].y += (ty - pos[i].y) * (0.18 - i * 0.012);
      b.style.width = b.style.height = `${size}px`;
      b.style.transform = `translate(${pos[i].x - size / 2}px, ${pos[i].y - size / 2}px)`;
    });
    // le liseré jaune passe d'un bouton à l'autre
    const idx = Math.floor(t / 1600) % items.length;
    if (idx !== last) {
      items.forEach((it, k) => it.classList.toggle("on", k === idx));
      last = idx;
    }
  });
}
