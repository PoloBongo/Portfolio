# Motion design du portfolio

Le site est animé avec **GSAP** (timelines, ScrollTrigger, Flip), **Lenis** (défilement lissé), un shader WebGL maison pour le fond (aurore) et **Three.js** pour un **nuage de 65 536 points simulé sur le GPU** : un « espace latent » que l'on traverse en scrollant et qui change de forme d'une page à l'autre (concept web / IA). Polices auto-hébergées via `@fontsource` (Bricolage Grotesque variable, Instrument Serif, JetBrains Mono).

> Cette branche (`motion-web-ia`) est la version **web / IA**. La version « moteur de jeu » (manette 3D, HUD de jeu, page Projets Jeu Vidéo) est conservée sur la branche `motion-game-hud`.

## Concept

Tout ce que le portfolio raconte (projets, compétences, certifications) est un point dans un espace. Le visiteur le traverse : au chargement le bruit se condense en spirale, au scroll le nuage change de forme, à chaque navigation il « saute » (le nuage s'étire puis retombe), et **le curseur est une requête** qui éclaire ses plus proches voisins. Le vocabulaire de l'interface suit : section, contexte, vecteur, latence.

| Où | Forme du nuage | Idée |
|---|---|---|
| Accueil, hero | nom « ARTHUR BRU » (à l'ouverture du préloader) → fenêtre de navigateur → réseau de neurones → manette en pixels | un acte par rôle (web, IA, jeu) : forme, couleur et écriture du rôle changent ; le nuage se disperse puis se reforme (voir « Hero en trois actes ») |
| Accueil, À propos | trame (grille qui ondule) | discrète derrière le texte |
| Accueil, Projets | cinq grappes | une par ligne de l'index, la ligne survolée éclaire la sienne |
| Accueil, Compétences | constellation de quatre domaines | des flux de points les relient, des annotations les nomment |
| Accueil, Certifications | sphère | la boucle se ferme |
| Accueil, pied de page, Contact | arobase | le glyphe est échantillonné sur un canvas |
| Pages projet (`/work/:slug`) | forme et couleur du monde du projet (fenêtre lime, réseau menthe, manette rose, ou monde sur mesure) | le nuage se transforme pendant que la page s'ouvre en cercle (voir « Pages projet et mondes ») |
| Projets Web | fenêtre de navigateur filaire | un balayage lumineux descend dans la fenêtre |
| IA | réseau de neurones (couches 4-6-7-6-3) | des paquets de lumière parcourent les liaisons |
| Unity, Unreal, Game Jam, Programme | trame | la même, vue de dessus |
| 404 | bruit agité | le point n'est pas dans l'espace |

## Principes

- **Une seule famille de courbes** : `expo.out` pour les entrées (départ vif, arrivée longue), `expo.inOut` pour les transitions de page et d'ouverture, `power3.out` pour les survols. Constantes dans `src/Effects/motion.js` (`EASE`) et variables CSS `--ease-*`.
- **Durées** : micro-interactions 0,25–0,6 s · révélations 0,9–1,5 s · rideau de page ≈ 0,85 s à l'aller, 0,85 s au retour · condensation du nuage 3,4 s (1,8 s quand il écrit le nom) · un acte du hero 8 s. Les éléments qui sortent partent plus vite qu'ils n'entrent.
- **Chorégraphie** : lecture dans l'ordre (titre → média → fiche → texte → liens), décalage de 40 à 90 ms entre éléments d'un même groupe.
- **Deux couleurs de signal** : violet (`--violet`) pour la matière, menthe (`--mint`) pour tout ce qui est « interrogé » (voisins du curseur, grappe survolée, curseur d'écriture).
- **Que `transform` et `opacity`** pour tout ce qui bouge dans la page (60 fps mesurés, y compris processeur bridé ×4) ; le nuage est calculé par le GPU.

## Couches globales (`src/index.js`)

| Couche | Fichier | Rôle |
|---|---|---|
| Défilement lissé | `Effects/SmoothScroll.js` | Lenis branché sur le ticker GSAP, `useScrollTo()` pour les ancres |
| Rideau de transition | `Effects/PageTransition.js` | Cinq colonnes violet puis noir entre deux routes ; `TLink` remplace `Link`, précharge la page visée au survol et donne le point de départ de la transition « monde » (cercle depuis le clic) vers et depuis les pages projet |
| Préloader | `Effects/Preloader.js` + `intro.js` | Une fois par session : journal de démarrage (`init latent_space`, `load field.points`…), complet sur l'accueil (salutations ≈ 0,7 s, un clic ou une touche accélère ×4), court ailleurs. La ligne « field.points » attend le vrai chargement du nuage. `announceBuild()` (`intro.js`) lance la condensation du nuage derrière le rideau (3ᵉ salutation sur l'accueil, sortie du préloader ailleurs) : `Stage` s'y abonne avec `onIntroBuild` |
| Nuage et fond | `Component/Stage.js` | **Un seul exemplaire** pour tout le site, monté une fois avant les routes (jamais recréé pendant la navigation), derrière le contenu. Porte aussi le fond `Aurora` (`.backdrop`), les annotations et la puce « voisin le plus proche » |
| Curseur | `Effects/Cursor.js` | Point + anneau ; états via `data-cursor="play|view|drag|query"` et `data-cursor-text`. `query` (hero, 404, schéma RAG) : anneau menthe = zone interrogée |
| Grain, progression | `css/Shell.css`, `Effects/ScrollProgress.js` | Texture fixe et barre de scroll |
| HUD « console » | `Component/Hud.js`, `css/Hud.css`, `Effects/perf.js` | Coins de cadre, `SEC` (section : chaque élément portant `data-hud`), `CTX` (part de la page parcourue), `VEC` (position du curseur, de −1 à +1), `LAT` (durée d'une image, en ms), heure locale, bouton son. `perf` transmet les FPS mesurés au nuage |
| Son | `Effects/sound.js` | Sons synthétisés (Web Audio, aucun fichier), **coupés par défaut**, choix mémorisé. `play("click")`, `playNote(i)` ; `data-sound-skip` rend un élément muet au clic |
| Pont interface → nuage | `Effects/fieldBus.js` | Quatre canaux : `setFieldFocus(i)` (l'index des projets désigne la grappe à éclairer), `setHeroShape(nom)` (l'acte affiché choisit la forme du hero), `setFieldTint(rgb, dose)` (la couleur du monde affiché : teinte le nuage et le fond `Aurora`), `triggerWarp(1 | 0)` (le rideau de page, ou un changement d'acte, étire le nuage puis le relâche) |

**Porte de démarrage** (`lockGate()` / `onReady()` dans `motion.js`) : le préloader et le rideau la ferment, chaque page attend son ouverture avant de lancer son animation d'entrée. Toute nouvelle animation d'entrée doit passer par `onReady(() => tl.play())`.

## Briques réutilisables (`src/Effects`)

`Reveal` (apparition au scroll) · `SplitReveal` (mots ou lettres sous masque, texte lisible par les lecteurs d'écran) · `Magnetic` · `Parallax` · `Marquee` (accélère avec le scroll) · `Aurora` (fond WebGL, pause hors écran).
Côté composants : `Button` (texte qui roule, fond qui se remplit), `ProjectCard` (carte d'un projet dans un hub ou sur l'accueil), `ProjectMedia` (vignette et lecteur), `WorkPage` (page d'un projet), `ProfileCard` (carte de profil, section À propos), `PageHero`, `Footer`, `Navbar` (menu plein écran).

## Nuage de points (`Component/Stage.js`, `Effects/stage3d/`)

Un `THREE.Points` de **65 536 particules** (256 × 256 ; 16 384 sur écran tactile) dont la position et la vitesse vivent dans des textures flottantes mises à jour par le GPU à chaque image (`GPUComputationRenderer`). C'est du WebGL 2 et non du WebGPU : les shaders de calcul de Three.js n'ont pas de repli WebGL (r186). Sans rendu en flottant 32 bits (cas d'iOS), la simulation bascule en demi-flottant (`HalfFloatType`).

- **Formes** : `fieldData.js` génère une fois (graines fixes : le même nuage à chaque visite) la cible de chaque point dans chaque forme : `noise`, `sphere` (coque fine + trois anneaux), `lattice` (trame), `work` (cinq grappes), `stack` (constellation de quatre domaines et leurs liaisons), `browser` (fenêtre filaire), `network` (réseau de neurones), `pad` (manette en pixels : demi-bitmap miroir de 13 colonnes → 26 × 13 cellules en damier, creux = croix, boutons, sticks), `name` (« ARTHUR BRU » échantillonné sur canvas dans la police du titre : 30 % des points sur le plein, jusqu'à 52 % sur le contour, le reste en nébuleuse ; reconstruit sur deux lignes quand le titre passe sur deux lignes), `at` (arobase). Une texture S × S par forme : x, y, z de la cible, et `w` = paramètre de la forme (il pilote les impulsions lumineuses).
- **Simulation** (`VELOCITY` et `POSITION` dans `createField.js`) : chaque point est tiré vers sa cible par un ressort à la raideur et à l'amortissement qui lui sont propres (donc un dépassement organique, et un départ décalé d'un point à l'autre), agité par une turbulence sans divergence (rotationnel d'un potentiel de sinusoïdes, dérivées écrites à la main), repoussé et entraîné par le pointeur (sillage), parcouru par l'onde du clic. À l'intro, le bruit se resserre en spirale (`uBuild`, 3,4 s).
- **Rendu** : sprites additifs étirés dans le sens de leur vitesse à l'écran (vitesse de scroll et « saut » de navigation comprises), l'avant du nuage brille et l'arrière s'efface. Chaîne de post-traitement maison : passe lumineuse, flou à 1/4 de résolution, composition (bloom, aberration chromatique liée à la vitesse de scroll et du saut, grain).
- **Un nuage, une forme par page** : `PAGE_SHAPES` dans `Stage.js` associe chaque route à une forme (voir le tableau du concept), `buildPageKeys(forme)` en tire les poses clés, `buildLostKeys()` celles de la 404. Quand la route change, `measure()` relit les poses de la nouvelle scène et la simulation transforme le nuage (ressorts).
- **Poses clés** : chaque pose donne une fraction de section au centre de l'écran (`section`, `f`), une forme (`shape`), la position, la taille et la rotation, l'opacité (`show`), l'agitation (`flow`), la sensibilité au curseur (`query`) et l'intensité du fond (`aurora`). Le nuage interpole entre deux poses selon le scroll ; dans la section compétences il prend la taille du cadre `[data-stage="skills"]`. Seule la sphère tourne sur elle-même, les autres formes restent de face (`ROUND`).
- **Hero** : `ACTS` dans `Hero.js` associe chaque acte à une forme ; `setHeroShape()` la transmet et le nuage se disperse (`burst`) puis se reforme. `HERO_POSE` règle la pose propre à chaque forme (les formes filaires glissent sous le nom pour rester lisibles) ; la forme `name` n'a pas de pose fixe : `createField` la cale sur la boîte des lettres du titre HTML (`getNameBox`, mesurée par `measureNameBox` dans `Stage.js`, avec une correction de 3 % en largeur et 0,05 em en hauteur mesurée sur capture). Le hero occupe trois écrans : les clés de pose du hero sont doublées (`half` et `1 - half`) pour que le nuage garde sa pose pendant tout le défilement épinglé.
- **Teinte** : `setTint(rgb, dose)` (uniformes `uTint` / `uTintMix`, lissés image par image) remplace le violet de la matière et de son halo par la couleur du monde ; `Aurora` s'abonne au même canal (`subscribeTint`) et reste sombre.
- **Navigation** : `PageTransition` appelle `triggerWarp(1)` quand le rideau tombe (le nuage s'étire radialement), puis `triggerWarp(0)` juste avant la révélation de la page.
- **Son** : si le son est activé, `getAudioLevel()` (graves et médiums lus par un `AnalyserNode`) fait battre le nuage (`uBeat`, lissé dans `createField`).
- **Requête du curseur** : les points proches du curseur (rayon `QUERY_RADIUS`, en espace écran) passent à la menthe et grossissent. Sur la sphère de l'accueil, une puce affiche le **point étiqueté le plus proche** (`PROBE_LABELS` : React, RAG, Qdrant…) avec sa distance.
- **Clic** : une onde traverse le nuage depuis son centre et joue une note (pentatonique, si le son est activé).
- **Index des projets** : survol ou focus clavier d'une ligne → `setFieldFocus(i)` → la grappe `i` s'éclaire, les autres s'estompent. L'ordre des lignes de `WorkIndex.js` et de `WORK_CLUSTERS` doit rester le même.
- **Annotations** : tableau `CALLOUTS` dans `Stage.js` (`dx`/`dy` = bout du trait, `dir` = sens de la bulle), ancrées sur les centres de `STACK_GROUPS`. Elles restent dans le cadre de la scène (± 40 px) et dans l'écran : décalage horizontal, puis bascule de l'autre côté du point si ça ne suffit pas (`--sx`, `--dir`, `--align`, `--ang` posées par JS ; largeurs mesurées hors de la boucle d'image). Ajouter une annotation : un centre dans `STACK_GROUPS`, une entrée dans `CALLOUTS`, les textes `Stage.*` dans les trois langues.
- **Fond** : `Aurora` (shader WebGL, pause hors écran) est monté dans `Stage.js` (`.backdrop`) et son opacité suit `aurora` de la pose courante ; sans nuage (pas de WebGL 2), le fond reste visible à 50 %.
- **Performance** : 60 i/s mesurés (Radeon RX 6600, écran 1440 × 900, 65 536 points, post-traitement actif). Le HUD mesure les images par seconde ; sous 38 i/s pendant trois relevés, le nuage coupe d'abord le post-traitement, puis baisse la résolution par paliers de 0,25, puis le nombre de points de 20 % à la fois (jusqu'à 45 %). Three.js est dans un chunk à part (≈ 140 Ko gzip).
- **Replis** : sans WebGL 2 ni rendu en virgule flottante, `createField` renvoie `null` et la page fonctionne sans nuage ; `prefers-reduced-motion` : image fixe de la sphère dans le hero (`.stage--static`), pas de boucle ; pointeur tactile : pas de requête ni de puce.
- **404** : le nuage reste en bruit agité (`buildLostKeys`), sans annotations.
- Tout le calque 3D est `aria-hidden` : le contenu (compétences, liens) reste dans le DOM normal.

## Hero en trois actes (`Component/Hero.js`, `css/Landing.css`)

Le hero est une bande-annonce du site : trois **actes**, un monde chacun, sur une scène épinglée (`position: sticky`, 100 svh) dans une section de trois écrans de haut (`calc(100svh * 3)`) ; le défilement natif est conservé.

| Acte | Forme | Couleur | Écriture du rôle | Lien |
|---|---|---|---|---|
| Web | fenêtre | `#d9ff4a` | grotesque grasse en capitales, ombre dure ; les blocs s'ouvrent (`clip-path` en `steps(9)`) | `/ProjectsWeb` |
| IA | réseau | `#63e6be` | serif italique + curseur ; le texte se « décode » depuis du bruit (`scrambleText`) | `/AI` |
| Jeu | manette en pixels | `#ff5fa8` | mono capitales, frange RVB ; le mot se résout en mosaïque (canvas, 8 définitions) ; lignes de balayage sur toute la scène | `/Unity` |

- **Qui mène** : la première fois (une visite guidée par chargement de page : `toured`, variable de module), les actes s'enchaînent seuls, 8 s chacun (`DWELL`), la barre du rail se remplit ; en fin de cycle retour à l'acte 1 et **arrêt** (WCAG 2.2.2 : le bouton pause / reprise / relecture est toujours là). Au premier défilement, la visite s'arrête et le scroll prend la main : la page se cale sur l'acte affiché (`handOver`). Ensuite le défilement choisit l'acte (`ScrollTrigger` de `top top` à `bottom bottom`, hystérésis autour du milieu) ; le rail (`01 Web · 02 IA · 03 Jeu`) mène directement à un acte (défilement Lenis de 1,1 s, `locked` le temps du trajet).
- **Entrée** : à l'ouverture du préloader le nuage a déjà commencé à écrire le nom (forme `name`) ; 1 s après l'ouverture du rideau les lettres du titre montent par-dessus (le texte HTML reste la source pour le SEO et les lecteurs d'écran), puis `goTo(0)` : le nuage se disperse et devient la fenêtre. Le nom n'est écrit qu'après un préloader complet (`introMode === "full"`), une fois par chargement ; au retour sur l'accueil (précédent du navigateur) il n'y a ni nom ni visite et l'on repart de l'acte où se trouve la page (`initialAct`).
- **Un acte** (`goTo`) : le rôle sortant s'efface (0,4 s), le suivant s'écrit (`enterTl`, accroche en jetons irréguliers puis lien « Voir… → »), `setHeroShape` et `setFieldTint` changent forme et couleur, `--act` (variable CSS de la couleur du monde) est tweenée, `triggerWarp(0.4)` étire un instant le nuage, `play("reveal")` joue le balayage sonore (si le son est activé).
- **Accessibilité** : le `h1` est du vrai texte ; un texte masqué (`sr-only`) liste les trois rôles et l'accroche ; seul l'acte visible est dans l'arbre d'accessibilité (`visibility`) ; rôles et « Voir… → » sont de vrais liens (`TLink`) ; les boutons du rail portent le texte « 01 Web » (sur mobile les noms inactifs sont masqués à l'œil, pas aux lecteurs d'écran) et `aria-current` ; le bouton pause a trois états (`aria-label` : pause, reprise, relecture). Rail et pause sont inertes tant que l'entrée joue (`data-started`).
- **Replis** : `prefers-reduced-motion` → `hero--static` (ni épinglage ni visite, sphère fixe, les trois rôles côte à côte avec leur accroche, pas de rail) ; écran de moins de 561 px de haut → pas d'épinglage, le hero grandit avec son contenu et la visite et le rail fonctionnent sans le scroll.
- **Tenir dans l'écran** : titre plafonné à 38 svh, rôles à 4,6–6,6 svh, rail dans une capsule sombre (`backdrop-filter`) pour rester lisible par-dessus le nuage. Vérifié de 1366 × 657 à 1920 × 1080, en 768 × 1024, 390 × 844 et 844 × 390.
- **Ajouter un acte** : une entrée dans `ACTS` (forme, teinte, couleur, lien), la forme dans `fieldData.js` et `HERO_POSE`, les clés `Hero.role*`, `Hero.tag.*`, `Hero.enter.*` et `Hero.rail.*` dans les trois langues, une règle `.hero__act--id` et un cas dans `enterTl` ; la hauteur du hero (`* 3`) et les clés de pose de `Stage.js` suivent le nombre d'écrans.

## Carte de profil (`Component/ProfileCard.js`, `css/Card.css`)

Dans la section À propos, à droite du texte (sous lui sur mobile) : le portrait, le nom, les rôles et deux chiffres.

- **Le portrait se débruite pendant le scroll** : un `<canvas>` par-dessus l'image dessine la photo en mosaïque de plus en plus fine sous un grain de plus en plus léger (`MOSAIC` de 5 à 170 pixels, `GRAIN` de 0,8 à 0,05, puis l'image nette) tant que la carte monte dans l'écran (`ScrollTrigger` de 92 % à 38 %). Dans l'autre sens, elle se « rebruite ». Le canvas n'est repeint qu'à chaque changement d'étape.
- Entrée une fois : cadre qui se dévoile, textes en cascade, coins de visée qui se verrouillent, « PROFIL » qui se décode (`scrambleText`), chiffres qui montent. Souris : la carte s'incline vers le curseur (`quickTo`), un reflet suit, et la teinte violette se retire en grande partie au survol.
- Les chiffres ne sont pas écrits en dur : projets = somme des tableaux `*_PROJECTS`, certifications = `CERTIFICATES` (exporté par `CertificateCarousel.js`). La bio sous le texte est `Home.aboutMe`.
- Mouvement réduit ou JS absent : seule l'`<img>` est affichée, avec les valeurs finales et sans rien de masqué. Le canvas, le reflet et le libellé « décodé » sont `aria-hidden` ; le texte alternatif est `Card.alt`.
- La photo est `public/arthur.webp` (800×800), qui sert aussi d'image `og:image` / `twitter:image` : la remplacer change aussi les aperçus de partage. Pour une illustration, remplacer ce fichier suffit ; si elle n'est pas carrée, ajuster `aspect-ratio` de `.card__frame`.
- `key={i18n.language}` sur le libellé « décodé » : l'effet réécrit son texte, React doit donc remonter l'élément quand la langue change.

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

Chaque projet a sa page, `/:lang/work/:slug` (le slug est l'`id` du projet, identique dans les trois langues), où il prend son **monde** : une peau (les couleurs de toute l'interface), une forme et une teinte du nuage, éventuellement un hero sur mesure. Les pages de catégorie (`/AI`, `/ProjectsWeb`, `/Unity`…) restent des **hubs** : une grille de cartes (`ProjectCard`, classes `.proj*`) ; l'accueil montre une sélection de six projets sous l'index (`FEATURED` dans `WorkIndex.js`). La coque (HUD, menu, curseur, grain, courbes d'animation) ne change jamais.

- **Registre** : `Pages/work.js` rassemble les cinq tableaux `*_PROJECTS` (`WORKS`, `getWork(slug)`, `neighbours(work)` = précédent et suivant dans la catégorie, la liste boucle). `Pages/media.js` : vignette du projet (image ou miniature YouTube, avec repli).
- **Mondes** (`Worlds/config.js`) : par défaut un projet prend le monde de sa catégorie, aux couleurs et formes des trois actes du hero (web = lime et fenêtre, IA = menthe et réseau, jeu = rose et manette en pixels). `WORLDS` surcharge projet par projet : `accent` / `secondary` (deviennent `--violet` / `--mint`), `bg` / `bgRaised` / `bgSunken`, `shape`, `tint`, `mix`, `cloud` (pose du nuage). `Worlds/theme.js` : `applyWorld()` pose les variables sur `<html>` et teinte le nuage, puis remet tout à la normale au démontage ; `previewTint()` / `clearTint()` servent à l'aperçu au survol d'une carte (seul le nuage change).
- **Module sur mesure** : `Worlds/index.js` (`MODULES`) charge un chunk par monde (hero et styles), préchargé avant la transition. Il reçoit `{ work, world, title, tagline, crumb, facts, media }` et compose sa mise en page. Cerebro : invite de commande, nom en capitales condensées dégradées vers la menthe, accroche écrite en streaming, schéma RAG en grand dans un cadre de console. Sans module, `DefaultHero` (titre, accroche, faits, média).
- **Nuage et HUD** : `buildWorkKeys` (`Stage.js`) lit forme et pose dans le monde ; `data-work-top` et `data-work-body` repèrent le hero et le corps. Le HUD affiche `SEC 01 / IA & AUTOMATISATION / CEREBRO` (`data-hud` sur `<main>`).
- **Transition « monde »** (`PageTransition.js`, `playWorld`) pour entrer dans un monde, en sortir ou passer de l'un à l'autre : l'ancien décor se tend (contenu assombri, nuage étiré, 0,26 s) pendant que la page et son monde se chargent (`Effects/prefetch.js`, déclenché aussi au survol, au focus ou au début de toucher des liens), puis `document.startViewTransition` + `flushSync(navigate)` : la nouvelle page se dévoile en cercle depuis le clic (Web Animations sur `::view-transition-new(root)`, 1,05 s, `expo.inOut`), nuage et couleurs du nouveau monde déjà en place. Les animations d'entrée de la page partent quand le cercle est à un tiers de son ouverture (porte `lockGate`). Sans View Transitions, ou au retour / à l'avance du navigateur : rideau de cinq colonnes ; mouvement réduit : changement de page direct.
- **Pièges** : pas de `requestAnimationFrame` dans le callback d'une View Transition (le rendu y est suspendu, le navigateur attend 4 s puis abandonne) ; les effets de mise en page des enfants passent avant ceux des parents, donc `WorldTheme` est rendu en premier (le schéma RAG lit les couleurs de l'interface à son montage) ; `lazyPreload` évite que la page repasse par le Suspense une fois préchargée ; la classe `.card` appartient à la carte de profil (`Card.css`), les cartes de projet sont `.proj*`.
- **Ajouter un monde sur mesure** : une entrée dans `WORLDS`, un dossier `Worlds/<id>/` (`index.js` qui exporte `Hero`, plus ses styles) et une ligne dans `MODULES`.
- **Mondes à scène** (palier S du moodboard : SEO Autopilot, Au fil des images, Depths Of Hue, Shadow Scholar, Funfair, Stay Soul, Choco Blast) : `Worlds/shared/SceneHero.js` compose le hero (fil d'Ariane, titre et accroche posés sur un cadre décoratif 16:10, faits, puis le média du projet) ; `Worlds/shared/scene.js` est le moteur de scène (`mountScene` : HTML décoratif en unités `cqw`, canvas 2D via `loop`, `frame`, `every`, pointeur qui flâne seul et alimente `--mx` / `--my`, tout suspendu hors écran, une image fixe en mouvement réduit). Un monde = `scene.js` (fonction `build(stage, outils)`), son CSS (`.w-<id>`, polices et pose du titre en `cqw`, décor `.w-<abréviation>__*`), `Hero.js` d'une ligne, `index.js`. `config.js` porte `WORLDS` (couleurs du site, nuage), `PALETTES` (`--w0…--w4` : fond, accent, second, surface, encre) et `FONTS` (feuille Google chargée par le monde). Largeur du cadre = `min(100 %, (100 svh − 250 px) × 1,6)` : titre et scène tiennent dans le premier écran. Sous 760 px le texte passe au-dessus de la scène. Thème clair : `ink` dans le monde (`applyWorld` dérive `--ink-dim`, `--line`…), et `--bg-rgb` pilote les voiles du HUD et du menu. Les 23 projets ont maintenant un monde sur mesure.
- **Transitions signature** (`Effects/worldTransition.js`, données dans `Worlds/transitions.js`) : chaque monde a son genre, joué dans la View Transition quand on y entre (ou qu'on en sort vers une page ordinaire, avec le genre du monde quitté). Un genre échantillonne densément, une valeur par image (16 ms), les styles de la nouvelle et de l'ancienne image (`clip-path`, `mask-image`, filtre, transformation : discrets ou interpolables, peu importe) et dessine son décor dans un canvas posé au-dessus (`.vt-fx`, nommé `vt-fx` pour faire partie de la transition). Deux familles : *révélation* (la nouvelle page apparaît par un masque) et *couverture* (un décor opaque ferme l'écran, la page change dessous, le décor s'ouvre). Genres : `iris` (cercle, défaut), `scan` (Cerebro : ligne néon qui décode l'écran), `dots` (SEO Autopilot, Attraction Flow : demi-teinte), `thread` (Au fil des images : fil tendu et cadres suspendus), `ink` (Depths Of Hue : tache organique et bulles), `blinds` (Shadow Scholar : store vénitien et éclair), `tear` (Funfair, Payment : ticket déchiré, bord perforé), `pixels` (Stay Soul : mosaïque en ordre de Bayer), `flood` (Choco Blast : chocolat qui monte puis s'écoule ; Navy Bongo : eau et écume, `style: "water"`), `doors` (portes : `skin` `news` pour Articles Manager, `metro` pour RATP, `chest` pour Inventory), `fog` (Eko : brume latérale ; UI UX Cooking : fumée qui monte), `rain` (Météo : rideau de gouttes), `draft` (B.A Immobilier : plan dessiné pièce par pièce), `projectile` (Celtic : ballon qui rebondit ; Angry Birds : oiseau lancé), `sweep` (Unity RL : faisceau de projecteur), `flip` (Spacial Race : retournement en perspective). Ajouter un genre = une fonction `(c) => { duration, unlockAt, newAt(p), oldAt(p), draw(ctx, p, now), oldOnTop }` dans `GENRES`, une entrée dans `TRANSITIONS`. Debug en dev : `window.__navigateTo(chemin, { origin })`, `window.__vtSlow = 5` (ralenti), `window.__vtFreeze = 0.4` puis `window.__vtRelease()` (fige la transition à 40 % pour la photographier). Le module est chargé à la demande (`loadGenres` dans `PageTransition.js`, préchargé au survol d'un lien vers un monde). Sans View Transitions : rideau de colonnes ; mouvement réduit : changement direct. Pièges : `postcss-calc` (minifieur du build) échoue sur les `calc()` à unités mélangées avec `cqw` ou `var()` (parallaxe d'Eko faite en JS, encoches du ticket de Payment en pourcentages) ; pas de `requestAnimationFrame` dans le callback de la View Transition (tout démarre après `ready`).
- **Effets de clic** (`Effects/ClickFx.js`, `Worlds/<id>/fx.js`, boîte à outils `Worlds/shared/fxkit.js`) : un clic ou un toucher sur une page projet (hors liens, champs, vidéos) lance `spawn(x, y, { add, W, H })` du monde, qui ajoute des effets `{ dur, draw(ctx, t, now) }` à un canvas plein écran (`.click-fx`, créé au montage, animé seulement tant qu'un effet vit). Un geste par monde : onde de requête et voisins aimantés (Cerebro), nœud « Exécuter » et fil qui valide (SEO Autopilot), aiguille, fil et cadre qui tombe (Au fil des images), caustiques et bulles (Depths Of Hue), double entaille et éclats (Shadow Scholar), feu d'artifice d'ampoules et ticket (Funfair), éclat de pixels et fantôme (Stay Soul), éclaboussure de chocolat (Choco Blast), ballon et « +2 » (Celtic), foudre (Météo), tampon « PUBLIÉ » (Articles Manager), pousses et lucioles (Eko), pièce tracée et rendu (B.A Immobilier), métro qui traverse l'écran (RATP), plumes et étoiles (Angry Birds), gerbe d'eau et pièce d'or (Navy Bongo), vitesse lumière (Spacial Race), ticket imprimé (Payment), coordonnées et spirale (Portfolio), flammes et ingrédients (UI UX Cooking), tir et « BUT ! » (Unity RL), butin vers la barre d'objets (Inventory), pièces et ballons (Attraction Flow). Debug en dev : `window.__clickFx(x, y)`.

## Hiérarchie du contenu

Web et IA d'abord : menu (`Component/navItems.js`), index des projets (`WorkIndex.js`) et groupes de compétences (`Skills.js`) placent le web et l'IA en tête ; le jeu vidéo (Unity, Unreal, Game Jam) reste accessible, regroupé sous l'intitulé « Aussi — jeu vidéo », en plus petit. Les actes du hero s'enchaînent web → IA → jeu vidéo, et chaque accroche s'écrit « en streaming » (jetons irréguliers puis curseur qui clignote). La page Projets Jeu Vidéo n'existe plus dans cette version : `vercel.json` redirige son ancienne adresse (avec ou sans préfixe de langue) vers l'accueil en 301 ; hors Vercel, l'application affiche la 404.

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

**Boucle vidéo du projet** : déposer `public/clips/<id>.mp4` (muet, ≈ 8 s, 960×540, fondu fin → début pour boucler) et `<id>.webp` (affiche) puis ajouter l'`id` dans `IDS` de `src/Pages/clips.js`. Le clip se charge à 400 px de l'écran, ne joue que s'il est visible et n'est pas utilisé avec `prefers-reduced-motion` ni `saveData` (la vignette reste). Sans clip, la vignette seule s'affiche.

Les clés de traduction vont dans `public/locales/{fr,en,es}/translation.json`, dont l'accroche du projet (`Work.Tagline.<id>`, une phrase : carte, page, méta-description). Penser aussi aux trois URL du `sitemap.xml` (`/fr|en|es/work/<id>`) et à `llms.txt`. Pour la sélection de l'accueil, ajouter l'`id` à `FEATURED` (`WorkIndex.js`). Plus aucun `tabIndex` à numéroter : `FocusLoop` calcule l'ordre de tabulation à partir du DOM.

## Accessibilité

- `prefers-reduced-motion` : pas de préloader, pas de Lenis, pas de rideau, pas de parallaxe ; le contenu apparaît directement, le fond WebGL est une image fixe et le nuage une image fixe de la sphère. Le hero devient une page fixe (voir « Hero en trois actes »).
- La visite guidée du hero (contenu qui change seul) s'arrête après un cycle et son bouton pause / reprise / relecture reste accessible (WCAG 2.2.2). Le nuage, lui, est décoratif (`aria-hidden`) et s'immobilise en mouvement réduit.
- Curseur custom uniquement sur pointeur fin ; jamais sur tactile.
- Menu : `aria-expanded`, piège de focus, Échap, retour du focus sur le bouton.
- Le contraste du texte « pas encore allumé » de l'intro reste supérieur à 3:1.
- Le schéma RAG est une image décrite (`role="img"`, `aria-label` traduit) ; sa disposition haute (≤ 560 px) garde le texte lisible ; en mouvement réduit il devient une image fixe complète.
- Le son est coupé par défaut et ne démarre que sur un clic ; la barre du HUD a un fond presque opaque pour que le texte qui défile dessous ne gêne pas la lecture.
- Le nuage s'atténue derrière les contenus à lire (À propos, Projets, Certifications : `show` entre 0,16 et 0,5) ; sur mobile la sphère passe au-dessus du nom, jamais derrière le texte.

## Debug

En développement : `window.gsap.globalTimeline.timeScale(0.1)` ralentit toutes les animations, `window.lenis` donne accès au défilement, `window.__field.debug()` à l'état du nuage (poses clés, échelle, durées CPU, positions des annotations). `?side=64` (ou 128) dans l'URL force la taille de la simulation pour tester les performances. `window.__rag.tl.pause().seek(7, false)` fige le schéma RAG à un instant précis (avancer seulement : les rappels du passé ne se rejouent pas en reculant).
En local sur le build (`serve -s build`), l'erreur console `Unexpected token '<'` vient de `/_vercel/speed-insights/script.js`, qui n'existe que sur Vercel : sans gravité. Si ESLint signale une erreur fantôme après plusieurs éditions rapides, supprimer `node_modules/.cache/.eslintcache`.
Vidéo Cerebro : renseigner `video` dans `src/Pages/AI/projects.js` quand la démo sera publiée (la vignette YouTube remplace alors le schéma RAG ; retirer `diagram` pour ne pas laisser de donnée morte).
