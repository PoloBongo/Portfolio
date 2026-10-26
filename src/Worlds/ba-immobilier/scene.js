// Scène de B.A Immobilier : la DA du site (anthracite, turquoise) prolongée par un plan d'architecte filaire dont
// les murs se dessinent en boucle ; une pièce après l'autre passe en « rendu ».
const ROOMS = [["Séjour", 4, 4, 32, 22], ["Cuisine", 36, 4, 22, 14], ["Chambre", 36, 18, 22, 22], ["Salle de bain", 4, 26, 16, 14], ["Entrée", 20, 26, 16, 14]];

export default function build(stage, { every }) {
  stage.innerHTML = `<p class="w-ba__welcome">Welcome on</p><span class="w-ba__disc">Discover</span>
    <svg class="w-ba__plan" viewBox="0 0 62 44">${ROOMS.map(
      (r) => `<rect class="w-ba__room" x="${r[1]}" y="${r[2]}" width="${r[3]}" height="${r[4]}"/><text x="${r[1] + r[3] / 2}" y="${r[2] + r[4] / 2 + 1}">${r[0]}</text>`
    ).join("")}
      <path class="w-ba__wall" d="M4 4 H58 V40 H4 Z M36 4 V40 M36 18 H58 M4 26 H36 M20 26 V40" pathLength="140"/>
      <path class="w-ba__dim" d="M4 1.6 H58 M4 0.6 V2.6 M58 0.6 V2.6"/><text x="31" y="-.6">12,40 m</text></svg>
    <span class="w-ba__conn">CONNECT</span>`;
  const rooms = stage.querySelectorAll(".w-ba__room");
  let i = 0;
  every(() => {
    rooms.forEach((r) => r.classList.remove("on"));
    rooms[i++ % rooms.length].classList.add("on");
  }, 1800);
}
