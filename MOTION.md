# Motion design du portfolio

Le site est animé avec **GSAP** (timelines, ScrollTrigger, Flip), **Lenis** (défilement lissé), un shader WebGL maison pour le fond (aurore) et **Three.js** pour une **scène 3D** : des courbes de niveau (isolignes) qui dérivent derrière tout le contenu, un objet construit à la main par métier dans le hero (page web éclatée, attention, manette) et un showcase des projets en shaders. Polices auto-hébergées via `@fontsource` (Bricolage Grotesque variable, Instrument Serif, JetBrains Mono).

> Cette branche (`motion-web-ia`) est la version **web / IA**. La version « moteur de jeu » (manette 3D, HUD de jeu, page Projets Jeu Vidéo) est conservée sur la branche `motion-game-hud`.

## Concept

Le site est une **bande-annonce de trois métiers**, web, IA et jeu vidéo, dans un espace de courbes de niveau (isolignes) qui dérivent derrière tout le contenu, comme une carte d'espace latent. Chaque métier a son objet 3D construit à la main, en vue éclatée. Les particules de la première version (un nuage de 65 536 points) ont été retirées le 2026-10-28 : elles ne plaisaient pas, et les isolignes et les objets les remplacent.

| Où | Ce qui est à l'écran | Idée |
|---|---|---|
| Accueil, hero | acte Web : page web éclatée en cinq plaques de verre ; acte IA : attention (les mots « Quelle est la marge du T3 ? », trois têtes d'attention en arcs, matrice en relief inclinée vers la caméra pour qu'on voie le dessus des barres) ; acte Jeu : la manette détaillée | un acte par rôle : objet, couleur (lime, menthe, rose) et écriture du rôle ; le passage de l'un à l'autre est un désassemblage |
| Accueil, Compétences | la manette en vue éclatée, quatre annotations | bumpers = Web, écran = IA, sticks = outils, boutons de façade = jeu |
| Autres sections de l'accueil, pages de catégorie, contact, programme, 404 | les isolignes seules | discrètes derrière le contenu |
| Pages projet (`/work/:slug`) | les isolignes à la couleur du monde du projet | la teinte change pendant que la page s'ouvre (voir « Pages projet et mondes ») |
| Pages de catégorie | showcase épinglé en WebGL | voir « Pages projet et mondes » |

## Principes

- **Une seule famille de courbes** : `expo.out` pour les entrées (départ vif, arrivée longue), `expo.inOut` pour les transitions de page et d'ouverture, `power3.out` pour les survols. Constantes dans `src/Effects/motion.js` (`EASE`) et variables CSS `--ease-*`.
- **Durées** : micro-interactions 0,25–0,6 s · révélations 0,9–1,5 s · rideau de page ≈ 0,85 s à l'aller, 0,85 s au retour · condensation du nuage 3,4 s (1,8 s quand il écrit le nom) · un acte du hero 8 s. Les éléments qui sortent partent plus vite qu'ils n'entrent.
- **Chorégraphie** : lecture dans l'ordre (titre → média → fiche → texte → liens), décalage de 40 à 90 ms entre éléments d'un même groupe.
- **Deux couleurs de signal** : violet (`--violet`) pour la matière, menthe (`--mint`) pour tout ce qui est « interrogé » (voisins du curseur, grappe survolée, curseur d'écriture).
- **Que `transform` et `opacity`** pour tout ce qui bouge dans la page (60 fps mesurés, y compris processeur bridé ×4) ; la scène 3D et le showcase sont calculés par le GPU.

## Couches globales (`src/index.js`)

| Couche | Fichier | Rôle |
|---|---|---|
| Défilement lissé | `Effects/SmoothScroll.js` | Lenis branché sur le ticker GSAP, `useScrollTo()` pour les ancres |
| Rideau de transition | `Effects/PageTransition.js` | Cinq colonnes violet puis noir entre deux routes ; `TLink` remplace `Link`, précharge la page visée au survol et donne le point de départ de la transition « monde » (cercle depuis le clic) vers et depuis les pages projet |
| Préloader | `Effects/Preloader.js` + `intro.js` | Une fois par session : journal de démarrage (`init latent_space`, `load field.points`…), complet sur l'accueil (salutations ≈ 0,7 s, un clic ou une touche accélère ×4), court ailleurs. La ligne « field.points » attend le vrai chargement du nuage. `announceBuild()` (`intro.js`) lance la condensation du nuage derrière le rideau (3ᵉ salutation sur l'accueil, sortie du préloader ailleurs) : `Stage` s'y abonne avec `onIntroBuild` |
| Scène 3D et fond | `Component/Stage.js` | **Un seul exemplaire** pour tout le site, monté une fois avant les routes (jamais recréé pendant la navigation), derrière le contenu. Porte aussi le fond `Aurora` (`.backdrop`) et les annotations de la manette |
| Copie au clic | `Effects/CopyText.js`, `css/Copy.css` | Pas de surlignage au double clic (voir « Copie d'un texte au clic ») |
| Curseur | `Effects/Cursor.js` | Point + anneau ; états via `data-cursor="play|view|drag|query"` et `data-cursor-text`. `query` (hero, 404, schéma RAG) : anneau menthe = zone interrogée |
| Grain, progression | `css/Shell.css`, `Effects/ScrollProgress.js` | Texture fixe et barre de scroll |
| HUD « console » | `Component/Hud.js`, `css/Hud.css`, `Effects/perf.js` | Coins de cadre, `SEC` (section : chaque élément portant `data-hud`), `CTX` (part de la page parcourue), `VEC` (position du curseur, de −1 à +1), `LAT` (durée d'une image, en ms), heure locale, bouton son. `perf` transmet les FPS mesurés au nuage |
| Son | `Effects/sound.js` | Sons synthétisés (Web Audio, aucun fichier), **coupés par défaut**, choix mémorisé. `play("click")`, `playNote(i)` ; `data-sound-skip` rend un élément muet au clic |
| Pont interface → scène | `Effects/fieldBus.js` | Quatre canaux : `setFieldFocus(i)` (l'index des projets ; sans effet depuis la fin du nuage), `setHeroShape(nom)` (l'acte affiché choisit l'objet du hero), `setFieldTint(rgb, dose)` (la couleur du monde affiché : teinte les isolignes, les lumières et le fond `Aurora`), `triggerWarp(1 | 0)` (le rideau de page, ou un changement d'acte, accélère le fond et élargit la caméra, puis relâche) |

**Porte de démarrage** (`lockGate()` / `onReady()` dans `motion.js`) : le préloader et le rideau la ferment, chaque page attend son ouverture avant de lancer son animation d'entrée. Toute nouvelle animation d'entrée doit passer par `onReady(() => tl.play())`.

## Briques réutilisables (`src/Effects`)

`Reveal` (apparition au scroll) · `SplitReveal` (mots ou lettres sous masque, texte lisible par les lecteurs d'écran) · `Magnetic` · `Parallax` · `Aurora` (fond WebGL, pause hors écran).
Côté composants : `Button` (texte qui roule, fond qui se remplit), `ProjectCard` (carte d'un projet dans un hub ou sur l'accueil), `ProjectMedia` (vignette et lecteur), `WorkPage` (page d'un projet), `PageHero`, `Footer`, `Navbar` (menu plein écran).

## Scène 3D globale (`Component/Stage.js`, `Effects/stage3d/`)

Depuis la refonte « La carte » (2026-11), la scène globale ne garde que le **fond d'isolignes** : un canvas persistant derrière le contenu (z-index 0, l'aurore est dessous), jamais recréé pendant la navigation. Three.js r186, WebGL 2 ; sans WebGL, l'aurore reste seule.

- **Fond : isolignes** (`isolines.js`) : un quad plein écran, transparent, qui trace des courbes de niveau d'un bruit fractal (`fbm`, une courbe fine tous les 1/15, une plus marquée toutes les quatre). Couleur via `setTint` (monde du projet, violet sinon) ; curseur et défilement la déplacent, `warp` l'accélère. Les couleurs passent en `Vector3` sRGB.
- **Retiré** : page éclatée, attention, manette, annotations (callouts), rotation à la main et `__field.debug()`. `objects.js` et `controller.js` ne servent plus qu'à la carte.
- **Performance** : résolution plafonnée à 2 (1,5 sur tactile), réduite à 1 sous 38 i/s (`subscribePerf`), onglet masqué = pas de rendu. Mouvement réduit : une image fixe.
- **Navigation** : `PageTransition` appelle `triggerWarp(1)` quand le rideau tombe, puis `triggerWarp(0)` avant la révélation. Au retour d'une page projet : Lenis `resize()` avant `scrollTo` (`jumpTo`).
- **Pièges** : en développement React monte deux fois (le nettoyage libère tout) ; les textures du showcase sont en `NoColorSpace`.


## L'accueil : la carte (`Component/Carte.js`, `Effects/carte/{terrain,scene}.js`, `css/Carte.css`)

L'accueil est **une carte parcourue par un seul trait** : isolignes = terrain, Web / IA / Jeu = régions, projets = lieux. Refonte du 2026-11 (choix R4 : repère « Arthur est ici », sans avatar). Elle remplace `Hero`, `Intro`, `ProfileCard` et `Marquee` (supprimés).

- **Structure** : une section `position: sticky` de 800 svh avec **son propre canvas Three.js** (`scene.js`, terrain de 84 u dans `terrain.js`), piloté par une partition de défilement (`P_FIN = 1`) : nom → la carte se soulève → le repère tombe (photo `public/arthur.webp` dans le texte de bienvenue, aussi `og:image`) → le fil des **5 étapes** (lycée, bachelor, équipe, master, basket ; cartes, étiquettes, trait de liaison) → le fil se divise en **3 branches** (Web lime, IA menthe, Jeu rose) portant les objets du hero (page éclatée, attention, manette, penchés de −0,38 rad, construits au premier besoin par `ensureMarks`) → « Mes projets ».
- **Navigation** : barre de nœuds cliquable (`onSeek` → `useScrollTo`), étiquettes des régions en `TLink` vers `/ProjectsWeb`, `/AI`, `/Unity`. Vue d'ensemble reculée en portrait selon l'aspect.
- **Textes** : clés `Carte.*`, `Carte.step.*`, `Carte.region.*`, `Carte.head*` dans les trois langues. Contenu confirmé par Arthur (2026-11-09) : « Paul-Louis Courier » et « G.Tech » sont corrects.
- **Replis** : mouvement réduit = liste statique des étapes ; portrait = carte d'étape en haut.
- **Piège** : `css/Landing.css` (projets, certificats, bandeau pro) est importé par `Arthur.js`, plus par l'ancien hero.

## Sélection : le fil des lieux (`Component/Featured.js`, `css/Featured.css`)

Rendue dans `Arthur.js` après `WorkIndex` (qui garde l'index des 5 catégories). Défilement épinglé horizontal (ScrollTrigger, 70 svh par projet), 6 projets `FEATURED`, boucle vidéo du projet actif, fil de nav cliquable, mini-plan de région aux couleurs de la carte. Pile verticale ≤ 900 px et en mouvement réduit.

## Compétences : la preuve par les projets (`Component/Skills.js`, `skillsData.js`, `css/Skills.css`)

28 compétences filtrables ; chacune est rattachée à ses preuves : le champ `tags` des projets et les certificats Educative. Plus de manette ni de scène 3D dans la section (1 550 px de haut au lieu de 36 000).


## Pied de page : le nom tombe (`Effects/footerDrop.js`, `Component/Footer.js`, `css/Footer.css`)

P1, validé le 2026-11-09. À l'entrée du pied de page (aussi la version `compact` de la page Contact), les 9 lettres d'ARTHUR BRU sont des corps rigides **Matter.js** : elles tombent, rebondissent (`restitution` 0,32) et s'empilent sur un sol relevé de 90 px (au-dessus de la barre du HUD). Un canvas couvre le pied de page (`.footer__drop`, `pointer-events: none`), le grand nom HTML (`.footer__giant`, `aria-hidden`, `data-no-copy`) est la version fixe et s'efface (`footer--drop`) quand la chute démarre.

- **Chargement** : `import("matter-js")` à 800 px du pied de page (chunk à part, le JS principal reste sous 200 Ko), chute au seuil de 25 % de visibilité.
- **Souris** (pointeur fin seulement) : `MouseConstraint` attache la souris au pied de page (les liens restent cliquables) ; `mousedown` sur une lettre évite la sélection de texte ; le curseur du site passe en « Attraper » (`setCursorHint`, clé `Footer.grab`) et une souris rapide pousse la lettre sans clic. Tactile : les lettres tombent, rien ne s'attrape (le défilement prime).
- **Replis** : mouvement réduit, JS absent ou sans IntersectionObserver = le grand nom gris reste posé. Pièges : le canvas se mesure sur le pied de page, un resize reconstruit les lettres ; la police est lue sur `.footer__giant` et attendue (`document.fonts.load`).

## Certifications : le passeport de tampons (`Component/CertificateCarousel.js`, `css/Passport.css`)

Validé le 2026-11-09. Une page de passeport (papier sombre, guillochis, bord en pointillé) où chaque certificat est un tampon SVG rond (anneaux, nom courbé en haut, date en bas, sigle au centre, filtre `feTurbulence` d'encre usée `#stamp-rough`), incliné à la main (`TILT`). Au défilement (`ScrollTrigger` à 72 %, une fois), les tampons s'impriment un à un : chute, rebond (`back.out`), anneau d'encre, la page encaisse (4 px). Survol, focus ou clic = le détail à droite (titre, date, lien de vérification Educative) change ; le tampon choisi se « re-presse ». Mouvement réduit : tampons posés. `CERTIFICATES` (avec `short`, `abbr`, `tone`) est toujours exporté, `Skills.js` l'importe.

## Menu : le fil (`Component/Navbar.js`, `css/Navbar.css`)

2026-11-09. À gauche de la liste, un fil vertical avec un nœud par page ; un repère lime tombe (bounce) sur la page actuelle une fois le cercle ouvert, avec la pastille « Arthur est ici » (`Carte.here`), et glisse vers la ligne survolée ou focalisée, le fil se remplissant jusqu'à lui ; au repos il revient. Sans page correspondante, il n'apparaît qu'au survol. Le focus automatique du premier lien ne compte pas comme un survol (900 ms). **Pièges** : le panneau porte `data-lenis-prevent` (Lenis arrêté interceptait quand même la molette) ; le dégradé est le `background` du panneau (un pseudo-élément absolu défilait avec le contenu) ; les `li` masquent par `clip-path` et non `overflow: hidden` pour que les nœuds dépassent à gauche.

## 404 (`Pages/ErrorPage.js`, `css/Pages.css`)

Le « 0 » du milieu est le repère de la carte (lime, trou sombre) : il tombe, rebondit (`bounce.out`), oscille doucement ; bulle « Arthur est perdu » (`ErrorPage.lost`) et ombre au sol.

## Schéma RAG de Cerebro (`Component/RagDiagram.js`, `css/Diagram.css`)

Cerebro n'a pas encore de vidéo : son cadre média (`diagram: "rag"` dans `src/Pages/AI/projects.js`) affiche à la place un **schéma animé de son pipeline**, chargé à la demande (`lazy` dans `ProjectMedia.js`, chunk à part ≈ 8 Ko gzip). Il reprend le langage du nuage : un espace vectoriel (Qdrant) qui se balance, une requête en anneau menthe qui y entre et allume ses voisins.

- **Le récit**, en boucle de 16 s, une étape du rail du bas par temps fort : **01 Ingestion** (un PDF se découpe en texte, tableaux et images, chaque fragment devient un vecteur de l'espace) → **02 Recherche** (la question est tapée, vectorisée, son anneau entre dans l'espace et allume ses cinq voisins) → **03 Reranking** (un cross-encoder rescore les candidats *image* seulement, comme dans le projet ; un seuil écarte les moins pertinents) → **04 Génération** (le contexte retenu part vers Mistral-7B) → **05 Streaming** (les jetons SSE écrivent la réponse). Les technologies affichées sont celles du projet (Qdrant, E5, mMiniLM, Mistral-7B/OVH, SSE) ; les scores, les pages et la question sont illustratifs.
- **Deux couches** : un `<canvas>` pour le spatial (nuage de 220 points, vols de particules, anneau et traînée, liens, onde) et du HTML pour l'interface (saisie, liste reclassée, modèle, réponse, rail). Le texte reste du vrai texte, net à toutes les tailles ; le canvas est dessiné dans un repère fixe (`W × H`) et le HTML positionné en pourcentages de ce repère (`--x`, `--y`, `--w`, `--h` sur `.rag__box`).
- **Deux dispositions** (`LAYOUTS`) : *large* (16:9, flux de gauche à droite) et *haute* (≤ 560 px : le cadre passe en 600 / 880 via `.case__media--diagram` et le flux descend : question, espace, reranking, modèle, réponse). Mêmes éléments et mêmes animations, seules les positions changent ; la bascule suit un `matchMedia`.
- **Timeline unique** : toutes les valeurs animées vivent dans un objet d'état `S` que la timeline GSAP tweene et que `draw()` relit à chaque image (`gsap.ticker`). Elle ne tourne que si le cadre est à l'écran (`IntersectionObserver`) et après `onReady`. `T` (début de chaque étape) règle le rythme.
- **Interaction** : le cadre porte `data-cursor="query"` ; le curseur devient l'anneau menthe du site, les points qu'il contient s'allument, le nuage se penche vers le pointeur. Rien de tout cela au toucher.
- **Mouvement réduit** : une image fixe (la timeline est amenée à `T_STATIC`, la réponse est écrite), pas de ticker ni de pointeur. `role="img"` + `aria-label` (`AIProjects.Diagram.Alt`) décrivent l'ensemble ; le détail est dans le texte de la page.
- **Ajouter un autre schéma** : un composant dans `DIAGRAMS` (`ProjectMedia.js`) et `diagram: "clé"` dans les données du projet.

## Pages projet et mondes (`Pages/WorkPage.js`, `Worlds/`)

**Pages de catégorie** (`Component/ProjectsPage.js`, `Component/HubShowcase.js`, `css/Showcase.css`, `Effects/stage3d/showcaseGL.js`) : sur écran d'au moins 900 × 560, sans `prefers-reduced-motion` et avec WebGL2 (`useShowcaseMode`, réactif), la liste des projets est un **showcase épinglé** : une scène `position: sticky` de 100 svh dans une section de `100 svh + (N - 1) × 80 svh`. Un `ScrollTrigger` (`top top` → `bottom bottom`) donne la position continue `pos` (0 → N - 1), lue par le canvas WebGL du cadre média (`showcaseGL.js`) et par le projet affiché (`Math.floor(pos + 0.5)`, qui commande le titre, le numéro, le rail et le halo). Le passage d'un projet au suivant est lié au défilement (la transition occupe 20 à 80 % du pas, le reste est un temps de pause) et **tiré au hasard parmi quatre transitions en shaders**, retirées à chaque fois que le projet est au repos : *encre* (seuil de bruit animé, dispersion chromatique et liseré lumineux), *lentille* (portail réfractif ouvert sous le curseur), *éclats* (144 tuiles 3D instanciées qui fuient vers la caméra), *élastique* (défilement vertical, image pliée selon la vitesse, séparation RVB, parallaxe). Les textures sont les affiches (`public/clips/*.webp`) ou, pour le projet affiché, sa boucle vidéo (`ClipTexture`, voir plus bas) ; un projet sans affiche (Cerebro) ou dont l'image ne se charge pas reçoit une vignette dessinée en canvas. Seules les vidéos du projet visible (et du suivant pendant la transition) jouent ; celles des voisins sont chargées d'avance et gardent leur première image, une vidéo en pause garde sa dernière image (jamais de retour à l'affiche). **Le type de transition n'est retiré qu'une fois par pause**, pas à chaque image, et au repos les quatre types rendent exactement la même image (l'élastique ne zoome que pendant le mouvement). **`ClipTexture`** remplace le `VideoTexture` de Three : celui-ci envoie l'image au GPU dans un rappel `requestVideoFrameCallback` du fil principal, qui arrive en retard ou groupé quand Lenis, ScrollTrigger ou React travaillent, et la vidéo tremblait pendant le défilement (mesuré en dev : 12 % des images arrivaient après 1 ou 3 rendus au lieu de 2). La texture a sa propre horloge, qui avance au pas régulier du rendu et que `currentTime` recale à 3 % par image ; elle n'envoie qu'une image par image de la vidéo (30 i/s, `CLIP_FPS`). Mesure : 98 à 99 % des envois à exactement 2 rendus, au repos comme en défilement. Le titre est le vrai lien (`TLink` vers `/work/:slug`) ; le canvas est recouvert d'un lien doublon `aria-hidden` / `tabIndex=-1` vers le projet affiché, le rail est cliquable (défile jusqu'au projet), l'ancre de l'URL (`#NextJs`) ouvre directement le bon projet. Le fond du site prend la teinte du monde affiché (`previewTint`). Repli (mobile, mouvement réduit, écran bas, sans WebGL2) : la grille de `ProjectCard`.

Chaque projet a sa page, `/:lang/work/:slug` (le slug est l'`id` du projet, identique dans les trois langues), où il prend son **monde** : une peau (les couleurs de toute l'interface), une forme et une teinte du nuage, éventuellement un hero sur mesure. Les pages de catégorie (`/AI`, `/ProjectsWeb`, `/Unity`…) restent des **hubs** : une grille de cartes (`ProjectCard`, classes `.proj*`) ; l'accueil montre une sélection de six projets sous l'index (`FEATURED`, composant `Featured.js`). La coque (HUD, menu, curseur, grain, courbes d'animation) ne change jamais.

- **Registre** : `Pages/work.js` rassemble les cinq tableaux `*_PROJECTS` (`WORKS`, `getWork(slug)`, `neighbours(work)` = précédent et suivant dans la catégorie, la liste boucle). `Pages/media.js` : vignette du projet (image ou miniature YouTube, avec repli).
- **Mondes** (`Worlds/config.js`) : par défaut un projet prend le monde de sa catégorie, aux couleurs et formes des trois actes du hero (web = lime et fenêtre, IA = menthe et réseau, jeu = rose et manette en pixels). `WORLDS` surcharge projet par projet : `accent` / `secondary` (deviennent `--violet` / `--mint`), `bg` / `bgRaised` / `bgSunken`, `shape`, `tint`, `mix`, `cloud` (pose du nuage). `Worlds/theme.js` : `applyWorld()` pose les variables sur `<html>` et teinte le nuage, puis remet tout à la normale au démontage ; `previewTint()` / `clearTint()` servent à l'aperçu au survol d'une carte (seul le nuage change).
- **Module sur mesure** : `Worlds/index.js` (`MODULES`) charge un chunk par monde (hero et styles), préchargé avant la transition. Il reçoit `{ work, world, title, tagline, crumb, facts, media }` et compose sa mise en page. Cerebro : invite de commande, nom en capitales condensées dégradées vers la menthe, accroche écrite en streaming, schéma RAG en grand dans un cadre de console. Sans module, `DefaultHero` (titre, accroche, faits, média).
- **Fond et HUD** : les isolignes prennent la couleur du monde (`setFieldTint`) ; `data-work-top` et `data-work-body` repèrent le hero et le corps. Le HUD affiche `SEC 01 / IA & AUTOMATISATION / CEREBRO` (`data-hud` sur `<main>`).
- **Transition « monde »** (`PageTransition.js`, `playWorld`) pour entrer dans un monde, en sortir ou passer de l'un à l'autre : l'ancien décor se tend (contenu assombri, nuage étiré, 0,26 s) pendant que la page et son monde se chargent (`Effects/prefetch.js`, déclenché aussi au survol, au focus ou au début de toucher des liens), puis `document.startViewTransition` + `flushSync(navigate)` : la nouvelle page se dévoile en cercle depuis le clic (Web Animations sur `::view-transition-new(root)`, 1,05 s, `expo.inOut`), nuage et couleurs du nouveau monde déjà en place. Les animations d'entrée de la page partent quand le cercle est à un tiers de son ouverture (porte `lockGate`). Sans View Transitions, ou au retour / à l'avance du navigateur : rideau de cinq colonnes ; mouvement réduit : changement de page direct.
- **Retour à l'accueil** (`Effects/homeReturn.js`) : en quittant l'accueil, son défilement est retenu (`rememberHome`) ; le précédent du navigateur, ou le lien « ← Projets » (`/fr#work`, en tête des pages de catégorie et dans le fil d'Ariane des pages projet), pose la page directement à l'ancre ou à la position retenue (`jumpTo`, `landingFor`) et le hero (`peekLanding`) repart de l'acte où l'on se trouve, sans visite ni écriture du nom (`toured` / `nameFormed`). Piège : le navigateur restaurait aussi la position de l'entrée d'historique une fois l'accueil monté (retombée sur l'ancre `#work`, au 3e montage après un chargement) ; `history.scrollRestoration` est donc `manual`, posé par `ScrollTrigger.clearScrollMemory("manual")` (écrire la propriété soi-même ne tient pas : ScrollTrigger remet « auto » à chaque refresh). Conséquence : un rechargement ne restaure plus le défilement.
- **Pièges** : pas de `requestAnimationFrame` dans le callback d'une View Transition (le rendu y est suspendu, le navigateur attend 4 s puis abandonne) ; les effets de mise en page des enfants passent avant ceux des parents, donc `WorldTheme` est rendu en premier (le schéma RAG lit les couleurs de l'interface à son montage) ; `lazyPreload` évite que la page repasse par le Suspense une fois préchargée ; la classe `.card` appartient à la carte de profil (`Card.css`), les cartes de projet sont `.proj*`.
- **Ajouter un monde sur mesure** : une entrée dans `WORLDS`, un dossier `Worlds/<id>/` (`index.js` qui exporte `Hero`, plus ses styles) et une ligne dans `MODULES`.
- **Mondes à scène** (palier S du moodboard : SEO Autopilot, Au fil des images, Depths Of Hue, Shadow Scholar, Funfair, Stay Soul, Choco Blast) : `Worlds/shared/SceneHero.js` compose le hero (fil d'Ariane, titre et accroche posés sur un cadre décoratif 16:10, faits, puis le média du projet) ; `Worlds/shared/scene.js` est le moteur de scène (`mountScene` : HTML décoratif en unités `cqw`, canvas 2D via `loop`, `frame`, `every`, pointeur qui flâne seul et alimente `--mx` / `--my`, tout suspendu hors écran, une image fixe en mouvement réduit). Un monde = `scene.js` (fonction `build(stage, outils)`), son CSS (`.w-<id>`, polices et pose du titre en `cqw`, décor `.w-<abréviation>__*`), `Hero.js` d'une ligne, `index.js`. `config.js` porte `WORLDS` (couleurs du site, nuage), `PALETTES` (`--w0…--w4` : fond, accent, second, surface, encre) et `FONTS` (feuille Google chargée par le monde). Largeur du cadre = `min(100 %, (100 svh − 250 px) × 1,6)` : titre et scène tiennent dans le premier écran. Sous 760 px le texte passe au-dessus de la scène. Thème clair : `ink` dans le monde (`applyWorld` dérive `--ink-dim`, `--line`…), et `--bg-rgb` pilote les voiles du HUD et du menu. Les 23 projets ont maintenant un monde sur mesure.
- **Transitions signature** (`Effects/worldTransition.js`, données dans `Worlds/transitions.js`) : chaque monde a son genre, joué dans la View Transition quand on y entre (ou qu'on en sort vers une page ordinaire, avec le genre du monde quitté). Un genre échantillonne densément, une valeur par image (16 ms), les styles de la nouvelle et de l'ancienne image (`clip-path`, `mask-image`, filtre, transformation : discrets ou interpolables, peu importe) et dessine son décor dans un canvas posé au-dessus (`.vt-fx`, nommé `vt-fx` pour faire partie de la transition). Deux familles : *révélation* (la nouvelle page apparaît par un masque) et *couverture* (un décor opaque ferme l'écran, la page change dessous, le décor s'ouvre). Genres : `iris` (cercle, défaut), `scan` (Cerebro : ligne néon qui décode l'écran), `dots` (SEO Autopilot, Attraction Flow : demi-teinte), `thread` (Au fil des images : fil tendu et cadres suspendus), `ink` (Depths Of Hue : tache organique et bulles), `blinds` (Shadow Scholar : store vénitien et éclair), `tear` (Funfair, Payment : ticket déchiré, bord perforé), `pixels` (Stay Soul : mosaïque en ordre de Bayer), `flood` (Choco Blast : chocolat qui monte puis s'écoule ; Navy Bongo : eau et écume, `style: "water"`), `doors` (portes : `skin` `news` pour Articles Manager, `metro` pour RATP, `chest` pour Inventory), `fog` (UI UX Cooking : fumée qui monte), `memphis` (Eko : formes plates qui jaillissent, aplat pêche, trou en cercle, envol), `rain` (Météo : rideau de gouttes), `draft` (B.A Immobilier : plan dessiné pièce par pièce), `projectile` (Celtic : ballon qui rebondit ; Angry Birds : oiseau lancé), `sweep` (Unity RL : faisceau de projecteur), `flip` (Spacial Race : retournement en perspective). Ajouter un genre = une fonction `(c) => { duration, unlockAt, newAt(p), oldAt(p), draw(ctx, p, now), oldOnTop }` dans `GENRES`, une entrée dans `TRANSITIONS`. Debug en dev : `window.__navigateTo(chemin, { origin })`, `window.__vtSlow = 5` (ralenti), `window.__vtFreeze = 0.4` puis `window.__vtRelease()` (fige la transition à 40 % pour la photographier). Le module est chargé à la demande (`loadGenres` dans `PageTransition.js`, préchargé au survol d'un lien vers un monde). Sans View Transitions : rideau de colonnes ; mouvement réduit : changement direct. Pièges : `postcss-calc` (minifieur du build) échoue sur les `calc()` à unités mélangées avec `cqw` ou `var()` (parallaxe d'Eko faite en JS, encoches du ticket de Payment en pourcentages) ; pas de `requestAnimationFrame` dans le callback de la View Transition (tout démarre après `ready`).
- **Effets de clic** (`Effects/ClickFx.js`, `Worlds/<id>/fx.js`, boîte à outils `Worlds/shared/fxkit.js`) : un clic ou un toucher sur une page projet (hors liens, champs, vidéos) lance `spawn(x, y, { add, W, H })` du monde, qui ajoute des effets `{ dur, draw(ctx, t, now) }` à un canvas plein écran (`.click-fx`, créé au montage, animé seulement tant qu'un effet vit). Un geste par monde : onde de requête et voisins aimantés (Cerebro), nœud « Exécuter » et fil qui valide (SEO Autopilot), aiguille, fil et cadre qui tombe (Au fil des images), caustiques et bulles (Depths Of Hue), double entaille et éclats (Shadow Scholar), feu d'artifice d'ampoules et ticket (Funfair), éclat de pixels et fantôme (Stay Soul), éclaboussure de chocolat (Choco Blast), ballon et « +2 » (Celtic), foudre (Météo), tampon « PUBLIÉ » (Articles Manager), autocollant « POP ! » et formes plates qui rebondissent (Eko), pièce tracée et rendu (B.A Immobilier), métro qui traverse l'écran (RATP), plumes et étoiles (Angry Birds), gerbe d'eau et pièce d'or (Navy Bongo), vitesse lumière (Spacial Race), ticket imprimé (Payment), coordonnées et spirale (Portfolio), flammes et ingrédients (UI UX Cooking), tir et « BUT ! » (Unity RL), butin vers la barre d'objets (Inventory), pièces et ballons (Attraction Flow). Debug en dev : `window.__clickFx(x, y)`.

## Rotation à la main (retirée)

La prise à la souris et le ressort de retour des objets 3D ont été retirés de la scène globale avec la refonte (les objets n'existent plus que dans la carte). `Effects/cursorBus.js` (`setCursorHint`) reste disponible.

## Copie d'un texte au clic (`Effects/CopyText.js`, `css/Copy.css`)

Monté une fois dans `index.js` (`initCopyText()`), pour tout le site.

- **Double et triple clic** : `mousedown` en capture, `preventDefault()` si `detail > 1` (champs de saisie exceptés). Plus de mot ni de ligne surlignés ; **le glisser sélectionne toujours** (et `Ctrl+C` fonctionne comme avant).
- **Clic simple sur un texte** (`click`, `detail === 1`, bouton gauche, pas de sélection en cours) : copie le bloc de texte touché. Le point doit tomber **sur une lettre** (`caretPositionFromPoint` / `caretRangeFromPoint`, puis rectangle du caractère ± 3 px : une marge vide ne copie rien). Le bloc est le premier ancêtre dont `display` n'est pas `inline*` (les lettres et mots découpés remontent jusqu'au titre). Texte : nœuds visibles seulement (jamais la copie `.sr-only` des titres découpés, ni ce qui est masqué), un espace là où l'écart géométrique entre deux nœuds le demande (les titres en lettres n'ont pas de nœud espace entre les mots), `text-transform` appliqué, plafonné à 1 600 caractères. Repli `execCommand('copy')` si l'API presse-papiers échoue ; l'effet ne part que si la copie a réussi.
- **Exclus** (`SKIP`) : liens, boutons, champs, `label`, `summary`, `canvas`, `svg`, vidéos, iframes, `[data-no-copy]`, HUD, curseur, préloader, effets de clic. Un glisser sur un objet 3D avale le clic qui suit.
- **Effet** : un bandeau par ligne balaie le texte de gauche à droite (violet vers menthe, bord d'attaque menthe) puis s'efface, un anneau menthe part du pointeur, une pastille « Copié » (`Copy.done`) monte au-dessus, un son `click` si le son est activé ; la région `role="status"` annonce « Texte copié dans le presse-papiers » (`Copy.announce`). Mouvement réduit : fondu simple, sans balayage ni anneau.

## Hiérarchie du contenu

Web et IA d'abord : menu (`Component/navItems.js`), index des projets (`WorkIndex.js`) et groupes de compétences (`Skills.js`) placent le web et l'IA en tête ; le jeu vidéo (Unity, Unreal, Game Jam) reste accessible, regroupé sous l'intitulé « Aussi — jeu vidéo », en plus petit. Les régions de la carte s'enchaînent web → IA → jeu vidéo, et chaque accroche s'écrit « en streaming » (jetons irréguliers puis curseur qui clignote). La page Projets Jeu Vidéo n'existe plus dans cette version : `vercel.json` redirige son ancienne adresse (avec ou sans préfixe de langue) vers l'accueil en 301 ; hors Vercel, l'application affiche la 404.

## Ajouter un projet

Chaque page de catégorie lit un tableau dans `src/Pages/<Page>/projects.js`, et chaque projet a sa page `/work/<id>`. Un projet :

```js
{
  id: "mon-projet",            // clé React, et slug de l'adresse /fr/work/mon-projet
  anchor: "MonAncre",          // optionnel : cible de /Page#MonAncre
  title: "Mon projet",         // ou titleKey: "Namespace.Cle"
  tags: "Unity · C# · Lead",   // court, sans mot de langue : carte, fil d'Ariane, méta-description
  i18n: "Unity.MonProjet",     // lit .Langage .ToolsUsed .Duration .Completion .TeamSize .Role .Description
  video: "idYouTube",          // vignette puis lecteur au clic (string, ou { fr, en, es })
  diagram: "rag",              // sans vidéo ni image : schéma animé à la place de la vignette (voir plus haut)
  poster: imageImportee,       // sinon la vignette YouTube est utilisée
  game: unityBuild("BuildDossier", "prefixeFichiers"), // jeu WebGL jouable dans la page
  alertKey: "…", hintKey: "…", // confirmation avant lancement / conseil sur la vignette
  links: [{ href, labelKey, primary: true }],
}
```

**Boucle vidéo du projet** : déposer `public/clips/<id>.mp4` (muet, ≈ 8 s, 1280×720 encodé depuis une source 1080p, crf 23, fondu fin → début pour boucler) et `<id>.webp` (affiche) puis ajouter l'`id` dans `IDS` de `src/Pages/clips.js`. Le clip se charge à 400 px de l'écran, ne joue que s'il est visible et n'est pas utilisé avec `prefers-reduced-motion` ni `saveData` (la vignette reste). Sans clip, la vignette seule s'affiche. Avec un clip, son affiche `.webp` sert aussi de vignette (cartes et `ProjectMedia`) : aucune requête YouTube (la miniature HD n'existe pas toujours, d'où un 404 en console).

Les clés de traduction vont dans `public/locales/{fr,en,es}/translation.json`, dont l'accroche du projet (`Work.Tagline.<id>`, une phrase : carte, page, méta-description). Penser aussi aux trois URL du `sitemap.xml` (`/fr|en|es/work/<id>`) et à `llms.txt`. Pour la sélection de l'accueil, ajouter l'`id` à `FEATURED` (`WorkIndex.js`). Plus aucun `tabIndex` à numéroter : `FocusLoop` calcule l'ordre de tabulation à partir du DOM.

## Accessibilité

- `prefers-reduced-motion` : pas de préloader, pas de Lenis, pas de rideau, pas de parallaxe ; le contenu apparaît directement, le fond WebGL est une image fixe et le nuage une image fixe de la sphère. La carte devient une liste statique des étapes (voir « L'accueil : la carte »).
- Curseur custom uniquement sur pointeur fin ; jamais sur tactile.
- Menu : `aria-expanded`, piège de focus, Échap, retour du focus sur le bouton.
- Le contraste du texte « pas encore allumé » de l'intro reste supérieur à 3:1.
- Le schéma RAG est une image décrite (`role="img"`, `aria-label` traduit) ; sa disposition haute (≤ 560 px) garde le texte lisible ; en mouvement réduit il devient une image fixe complète.
- Le son est coupé par défaut et ne démarre que sur un clic ; la barre du HUD a un fond presque opaque pour que le texte qui défile dessous ne gêne pas la lecture.
- Les isolignes s'atténuent hors du hero (0,55) pour ne pas gêner la lecture ; sur mobile l'objet du hero passe derrière le nom, jamais derrière le texte courant.

## Debug

En développement : `window.gsap.globalTimeline.timeScale(0.1)` ralentit toutes les animations, `window.lenis` donne accès au défilement, `window.__rag.tl.pause().seek(7, false)` fige le schéma RAG à un instant précis (avancer seulement : les rappels du passé ne se rejouent pas en reculant).
En local sur le build (`serve -s build`), l'erreur console `Unexpected token '<'` vient de `/_vercel/speed-insights/script.js`, qui n'existe que sur Vercel : sans gravité. Si ESLint signale une erreur fantôme après plusieurs éditions rapides, supprimer `node_modules/.cache/.eslintcache`.
Vidéo Cerebro : renseigner `video` dans `src/Pages/AI/projects.js` quand la démo sera publiée (la vignette YouTube remplace alors le schéma RAG ; retirer `diagram` pour ne pas laisser de donnée morte).
