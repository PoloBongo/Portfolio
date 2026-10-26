// Scène de Payment : le ticket de caisse thermique qui s'imprime ligne à ligne (code-barres balayé en continu),
// sur un fond noir rayé de jaune fluo.
const ROWS = [["1× HOODIE", "89,00"], ["2× TEE LOGO", "58,00"], ["1× CAP", "29,00"], ["LIVRAISON", "0,00"]];

export default function build(stage) {
  stage.innerHTML = `<p class="w-pm__sub">Paiement · Stripe · 2026</p>
    <div class="w-pm__rcpt">${ROWS.map((r, i) => `<p style="--i:${i}"><span>${r[0]}</span><span>${r[1]}</span></p>`).join("")}<p class="tot" style="--i:4"><span>TOTAL</span><span>176,00 €</span></p><div class="w-pm__bar"></div></div>`;
}
