// Scène d'Inventory : les ruines de grès de la démo, éclairage ambre, la table au liseré orange, le mannequin en
// filaire (« Press E »), deux boutons gris de remise à zéro et la barre d'objets aux cases cyan qui se remplit.
export default function build(stage) {
  const slots = Array.from({ length: 5 }, (_, i) => `<i><b style="--i:${i}"></b></i>`).join("");
  stage.innerHTML = `<i class="w-iv__floor"></i><i class="w-iv__rug"></i><i class="w-iv__table"></i>
    <svg class="w-iv__man" viewBox="0 0 60 130" fill="none" stroke="#f4e6d2" stroke-width="1"><circle cx="30" cy="12" r="9"/><path d="M12 30 Q30 24 48 30 L52 70 L40 72 L38 128 M12 30 L8 70 L20 72 L22 128 M22 36 L30 52 L38 36 M16 50 L44 50 M14 62 L46 62 M30 24 V72" opacity=".9"/></svg>
    <p class="w-iv__press"><kbd>E</kbd><br>Press E</p><span class="w-iv__rb" style="top:4cqw">Reset la scène</span><span class="w-iv__rb" style="top:10.5cqw">Reset l'inventaire</span>
    <div class="w-iv__tip"><b>Buste de marbre</b>Objet · poids 4</div><div class="w-iv__slots">${slots}</div>`;
}
