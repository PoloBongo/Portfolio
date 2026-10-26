// Scène de Celtic La Riche Basket : l'affiche de club collée dans la rue (vert profond, trame de demi-teinte),
// un tableau d'affichage dont le score monte, un ballon qui rebondit avec son ombre.
export default function build(stage, { every }) {
  stage.innerHTML = `<p class="w-cb2__kick">Saison 2026 · Basket</p>
    <div class="w-cb2__board"><span><small>DOM</small><em>48</em></span><span><small>VIS</small>42</span></div>
    <i class="w-cb2__shadow"></i><i class="w-cb2__ball"></i>`;
  const score = stage.querySelector(".w-cb2__board em");
  let n = 48;
  every(() => {
    n = n >= 99 ? 48 : n + 2;
    score.textContent = n;
  }, 1500);
}
