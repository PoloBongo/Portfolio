// Scène d'Articles Manager : la une d'un quotidien. Bandeau de titre, colonnes avec lettrine, photo en trame,
// télescripteur rouge qui défile en bas.
export default function build(stage) {
  const body =
    "Rédigez, relisez et publiez depuis une seule interface : brouillons, versions, statuts et calendrier éditorial réunis sous la même une. Chaque article garde son historique et passe en ligne en un clic. ".repeat(3);
  stage.innerHTML = `<div class="w-am__mast"><span>Édition n° 23</span><strong>Le Manager</strong><span>Lundi 26 octobre</span></div>
    <p class="w-am__cols">${body}</p><i class="w-am__photo"></i>
    <div class="w-am__tick"><span>Dernière heure — 12 articles publiés · 3 brouillons à relire · calendrier éditorial à jour · </span></div>`;
}
