# Motion design du portfolio

Le site est animé avec **GSAP** (timelines, ScrollTrigger, Flip), **Lenis** (défilement lissé), un shader WebGL maison pour le fond du hero et **Three.js** pour la manette 3D de l'accueil (concept « moteur de jeu » : HUD, niveaux, vue éclatée). Polices auto-hébergées via `@fontsource` (Bricolage Grotesque variable, Instrument Serif, JetBrains Mono).

## Principes

- **Une seule famille de courbes** : `expo.out` pour les entrées (départ vif, arrivée longue), `expo.inOut` pour les transitions de page et d'ouverture, `power3.out` pour les survols. Constantes dans `src/Effects/motion.js` (`EASE`) et variables CSS `--ease-*`.
- **Durées** : micro-interactions 0,25–0,6 s · révélations 0,9–1,5 s · rideau de page ≈ 0,85 s à l'aller, 0,85 s au retour. Les éléments qui sortent partent plus vite qu'ils n'entrent.
- **Chorégraphie** : lecture dans l'ordre (titre → média → fiche → texte → liens), décalage de 40 à 90 ms entre éléments d'un même groupe.
- **Que `transform` et `opacity`** pour tout ce qui bouge en continu (60 fps mesurés, y compris processeur bridé ×4).

## Couches globales (`src/index.js`)

| Couche | Fichier | Rôle |
|---|---|---|
| Défilement lissé | `Effects/SmoothScroll.js` | Lenis branché sur le ticker GSAP, `useScrollTo()` pour les ancres |
| Rideau de transition | `Effects/PageTransition.js` | Cinq colonnes violet puis noir entre deux routes ; `TLink` remplace `Link` |
| Préloader | `Effects/Preloader.js` + `intro.js` | Une fois par session : complet sur l'accueil, court ailleurs |
| Curseur | `Effects/Cursor.js` | Point + anneau ; états via `data-cursor="play|view|drag"` et `data-cursor-text` |
| Grain, progression | `css/Shell.css`, `Effects/ScrollProgress.js` | Texture fixe et barre de scroll |
| HUD « moteur de jeu » | `Component/Hud.js`, `css/Hud.css`, `Effects/hudState.js`, `Effects/perf.js` | Coins de cadre, niveau (chaque section portant `data-hud` est un niveau), barre d'XP = progression de lecture, FPS mesurés, heure de Paris, bouton son. `hudState` alimente aussi l'écran de la manette, `perf` règle sa résolution |
| Son | `Effects/sound.js` | Sons synthétisés (Web Audio, aucun fichier), **coupés par défaut**, choix mémorisé. `play("click")`, `playNote(i)` ; `data-sound-skip` rend un élément muet au clic |

**Porte de démarrage** (`lockGate()` / `onReady()` dans `motion.js`) : le préloader et le rideau la ferment, chaque page attend son ouverture avant de lancer son animation d'entrée. Toute nouvelle animation d'entrée doit passer par `onReady(() => tl.play())`.

## Briques réutilisables (`src/Effects`)

`Reveal` (apparition au scroll) · `SplitReveal` (mots ou lettres sous masque, texte lisible par les lecteurs d'écran) · `Magnetic` · `Parallax` · `Marquee` (accélère avec le scroll) · `Aurora` (fond WebGL, pause hors écran).
Côté composants : `Button` (texte qui roule, fond qui se remplit), `ProjectCase` + `ProjectMedia` (cas projet et lecteur), `PlayerCard` (carte du joueur, section À propos), `PageHero`, `Footer`, `Navbar` (menu plein écran).

## Scène 3D de l'accueil (`Component/Stage.js`, `Effects/stage3d/`)

Une manette procédurale (`controller.js`) sur un sol de « viewport » (`createStage.js`), dans un canvas fixe derrière le hero. Elle suit le scroll par **poses clés** : `buildKeys()` dans `Stage.js` donne, pour chaque section, une fraction de la section au centre de l'écran, la position/taille/rotation, l'éclatement (`explode`), l'opacité (`show`) et celle du sol. Dans la section compétences elle prend la taille du cadre `[data-stage="skills"]` et s'éclate ; cinq **annotations** HTML suivent alors les pièces.

- Three.js est dans un chunk à part (≈ 159 Ko gzip), chargé après le premier rendu ; `registerLoad()` (`Effects/ready.js`) fait attendre le préloader. Sans WebGL, `createStage` renvoie `null` et la page fonctionne sans manette.
- Le HUD mesure les FPS : sous 38 pendant trois relevés, la résolution du canvas baisse par paliers de 0,25. Pointeur tactile : pas d'antialiasing. `prefers-reduced-motion` : manette fixe dans le hero (`.stage--static`).
- Interaction : survol et clic des boutons 3D (une note chacun si le son est actif), glisser pour la faire tourner.
- Annotations : tableau `CALLOUTS` dans `Stage.js` (`dx`/`dy` = bout du trait, `dir` = sens de la bulle). Elles restent dans le cadre de la scène (± 40 px) et dans l'écran : décalage horizontal, puis bascule de l'autre côté du point si ça ne suffit pas (`--sx`, `--dir`, `--align`, `--ang` posées par JS ; largeurs mesurées hors de la boucle d'image). Ajouter une annotation : une ancre dans `controller.js` (`anchors`), une entrée dans `CALLOUTS`, les textes `Stage.*` dans les trois langues.
- Tout le calque 3D est `aria-hidden` : le contenu (compétences, liens) reste dans le DOM normal.
- Dans la section À propos (desktop) la manette est réduite et posée en bas à gauche, sous la bio, pour laisser la droite à la carte du joueur (pose clé `.intro` de `buildKeys()`).

## Carte « Joueur 1 » (`Component/PlayerCard.js`, `css/Card.css`)

Dans la section À propos, à droite du texte (sous lui sur mobile) : le portrait, le nom, les rôles et deux chiffres.

- **Le portrait se charge pendant le scroll** : un `<canvas>` par-dessus l'image dessine la photo en mosaïque de plus en plus fine (`MOSAIC`, de 5 à 170 pixels de large, puis l'image nette) tant que la carte monte dans l'écran (`ScrollTrigger` de 92 % à 38 %). Dans l'autre sens, elle se repixelise. Le canvas n'est repeint qu'à chaque changement d'étape.
- Entrée une fois : cadre qui se dévoile, textes en cascade, coins de visée qui se verrouillent, « JOUEUR 1 » qui se décode (`scrambleText`), chiffres qui montent. Souris : la carte s'incline vers le curseur (`quickTo`), un reflet suit, et la teinte violette se retire en grande partie au survol.
- Les chiffres ne sont pas écrits en dur : projets = somme des tableaux `*_PROJECTS`, certifications = `CERTIFICATES` (exporté par `CertificateCarousel.js`). La bio sous le texte est `Home.aboutMe`.
- Mouvement réduit ou JS absent : seule l'`<img>` est affichée, avec les valeurs finales et sans rien de masqué. Le canvas, le reflet et le libellé « décodé » sont `aria-hidden` ; le texte alternatif est `Card.alt`.
- La photo est `public/arthur.webp` (800×800), qui sert aussi d'image `og:image` / `twitter:image` : la remplacer change aussi les aperçus de partage. Pour une illustration, remplacer ce fichier suffit ; si elle n'est pas carrée, ajuster `aspect-ratio` de `.card__frame`.
- `key={i18n.language}` sur le libellé « décodé » : l'effet réécrit son texte, React doit donc remonter l'élément quand la langue change.

## Ajouter un projet

Chaque page de projets lit un tableau dans `src/Pages/<Page>/projects.js`. Un projet :

```js
{
  id: "mon-projet",            // clé React
  anchor: "MonAncre",          // optionnel : cible de /Page#MonAncre
  title: "Mon projet",         // ou titleKey: "Namespace.Cle"
  i18n: "Unity.MonProjet",     // lit .Langage .ToolsUsed .Duration .Completion .TeamSize .Role .Description
  video: "idYouTube",          // vignette puis lecteur au clic (string, ou { fr, en, es })
  poster: imageImportee,       // sinon la vignette YouTube est utilisée
  game: unityBuild("BuildDossier", "prefixeFichiers"), // jeu WebGL jouable dans la page
  alertKey: "…", hintKey: "…", // confirmation avant lancement / conseil sur la vignette
  links: [{ href, labelKey, primary: true }],
}
```

**Boucle vidéo du projet** : déposer `public/clips/<id>.mp4` (muet, ≈ 8 s, 960×540, fondu fin → début pour boucler) et `<id>.webp` (affiche) puis ajouter l'`id` dans `IDS` de `src/Pages/clips.js`. Le clip se charge à 400 px de l'écran, ne joue que s'il est visible et n'est pas utilisé avec `prefers-reduced-motion` ni `saveData` (la vignette reste). Sans clip, la vignette seule s'affiche.

Les clés de traduction vont dans `public/locales/{fr,en,es}/translation.json`. Plus aucun `tabIndex` à numéroter : `FocusLoop` calcule l'ordre de tabulation à partir du DOM.

## Accessibilité

- `prefers-reduced-motion` : pas de préloader, pas de Lenis, pas de rideau, pas de parallaxe ; le contenu apparaît directement et le fond WebGL est une image fixe.
- Curseur custom uniquement sur pointeur fin ; jamais sur tactile.
- Menu : `aria-expanded`, piège de focus, Échap, retour du focus sur le bouton.
- Le contraste du texte « pas encore allumé » de l'intro reste supérieur à 3:1.
- Le son est coupé par défaut et ne démarre que sur un clic ; la barre du HUD a un fond presque opaque pour que le texte qui défile dessous ne gêne pas la lecture.

## Debug

En développement : `window.gsap.globalTimeline.timeScale(0.1)` ralentit toutes les animations, `window.lenis` donne accès au défilement, `window.__stage` à la scène 3D.
En local sur le build (`serve -s build`), l'erreur console `Unexpected token '<'` vient de `/_vercel/speed-insights/script.js`, qui n'existe que sur Vercel : sans gravité.
Vidéo Cerebro : renseigner `video` dans `src/Pages/AI/projects.js` quand la démo sera publiée.
