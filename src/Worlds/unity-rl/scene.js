// Scène d'Unity RL : le terrain de foot sur un toit, en plein jour, en écran partagé à deux joueurs. Grillage, ciel
// bleu, cage de but et cible en bois, ballon qui rebondit, scores cyan et rouge, jauges jaunes.
export default function build(stage, { every }) {
  const half = (c) =>
    `<div class="w-rl__half w-rl__${c}"><i class="pole" style="left:2%"></i><i class="pole" style="right:2%"></i><i class="fence"></i><i class="goal"></i><i class="tgt" style="left:${c === "h1" ? 12 : 18}%"></i><i class="line"></i><i class="circle"></i><i class="shadow"></i><i class="ball"></i><i class="bar"></i></div>`;
  stage.innerHTML = `${half("h1")}${half("h2")}<div class="w-rl__score"><span class="a">0</span><span class="b">0</span></div>`;
  const [a, b] = stage.querySelectorAll(".w-rl__score span");
  let n = 0;
  every(() => {
    n++;
    const el = n % 2 ? a : b;
    el.textContent = (+el.textContent + 1) % 10;
  }, 2200);
}
