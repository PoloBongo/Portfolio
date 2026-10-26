// Scène d'UI UX Cooking : la cuisine low-poly du jeu (murs beige-gris en perspective, frigo turquoise, comptoir bleu
// avec poêle qui flambe, tables orange) et son chef en toque qui se dandine.
export default function build(stage) {
  stage.innerHTML = `<i class="w-uc__back"></i><i class="w-uc__lw"></i><i class="w-uc__rw"></i><i class="w-uc__ce"></i><i class="w-uc__fl"></i><i class="w-uc__glow"></i>
    <i class="w-uc__lamp"></i><i class="w-uc__fridge"></i><i class="w-uc__hood"></i><i class="w-uc__counter"></i><i class="w-uc__micro"></i><i class="w-uc__pan"></i><i class="w-uc__flame"></i>${[0, 1.05, 2.1]
      .map((d) => `<i class="w-uc__smoke" style="--d:${d}s"></i>`)
      .join("")}<i class="w-uc__disp"></i>
    <i class="w-uc__st"></i><i class="w-uc__bread"></i>
    <div class="w-uc__chef"><i class="tq"></i><i class="hd"></i><i class="mu"></i><i class="bd"></i><i class="bt"></i></div>
    <i class="w-uc__t" style="left:16cqw;top:40cqw;width:38cqw;height:12cqw"></i><i class="w-uc__t" style="left:68cqw;top:34cqw;width:22cqw;height:8cqw"></i>
    <i class="w-uc__item" style="left:22cqw;top:42.6cqw;width:2.2cqw;height:3.6cqw;background:#d6362d"></i><i class="w-uc__item" style="left:34cqw;top:43.4cqw;width:3.4cqw;height:2.6cqw;background:#f3e4c8"></i><i class="w-uc__item" style="left:43cqw;top:43.6cqw;width:3cqw;height:2.4cqw;border-radius:.3cqw;background:#f6c542"></i>`;
}
