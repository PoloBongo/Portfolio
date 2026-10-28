---
name: portfolio-worlds
description: Ajouter ou modifier un projet, une page projet (/work/:slug), un monde sur mesure, une carte de projet, la transition en cercle ou une scène du moodboard dans le portfolio d'Arthur BRU (branche motion-web-ia). À utiliser pour toute tâche touchant aux mondes, aux hubs de catégorie ou au moodboard des directions artistiques.
---

# Mondes et pages projet du portfolio

Lire d'abord : `MOTION.md` (sections « Pages projet et mondes » et « Hero en trois actes ») et la mémoire `project_worlds_plan`, `project_moodboard_mondes`. Réponses et commentaires de code en français, « vous », guillemets doubles, points-virgules, 2 espaces.

## Ajouter un projet
1. Un objet dans `src/Pages/<Page>/projects.js` : `id` (= slug, unique), `title` ou `titleKey`, `tags` (court, sans mot de langue), `i18n` (préfixe des clés Langage, ToolsUsed, Duration, Completion, TeamSize, Role, Description), `video` / `poster` / `game` / `links`.
2. Traductions dans `public/locales/{fr,en,es}/translation.json` (fichiers en **CRLF** : insérer par un script Node, jamais à la main) : les clés du projet **et** `Work.Tagline.<id>` (une phrase).
3. Trois URL `/fr|en|es/work/<id>` dans `public/sitemap.xml`, une ligne dans `public/llms.txt`.
4. Facultatif : `FEATURED` dans `src/Component/WorkIndex.js` (sélection de l'accueil), boucle vidéo (`public/clips/<id>.mp4` + `.webp`, `IDS` de `src/Pages/clips.js`).

## Ajouter un monde sur mesure
1. `src/Worlds/config.js`, objet `WORLDS` : `accent`, `secondary`, `bg`, `bgRaised`, `bgSunken`, `tint` / `mix` (couleur des isolignes du fond et de l'aurore, via `setFieldTint`). Sans entrée, le projet prend le monde de sa catégorie. `shape` et `cloud` sont des restes du nuage de points supprimé le 2026-10-28 : sans effet, ne pas les renseigner.
2. `src/Worlds/<id>/` : `index.js` qui exporte `Hero`, plus son CSS. Le hero reçoit `{ work, world, title, tagline, crumb, facts, media }`, porte `data-work-top`, anime son entrée dans `useGSAP` avec `onReady(() => tl.play())` (rien en mouvement réduit). Le fond 3D (isolignes + objets du hero) vit dans `src/Effects/stage3d/` (`createScene.js`) : un monde n'a rien à y déclarer, seulement sa teinte.
3. Une ligne dans `MODULES` de `src/Worlds/index.js` (chunk à la demande, préchargé par `prefetch`).
4. Vérifier avec la skill `portfolio-qa` (bureau, mobile, mouvement réduit, FR/EN/ES, transition filmée).

## Monde à scène (modèle des 23 mondes)
Un monde = `Worlds/<id>/` : `scene.js` (`build(stage, { loop, frame, every, pointer, … })`, voir `Worlds/shared/scene.js`), `<id>.css` (polices, pose du titre en `cqw`, décor `.w-<abréviation>__*`), `Hero.js` d'une ligne (`SceneHero`), `fx.js` (effet de clic), `index.js` (exporte `Hero` et `fx`). Puis : `WORLDS`, `PALETTES`, `FONTS` dans `Worlds/config.js`, `MODULES` dans `Worlds/index.js`, `TRANSITIONS` dans `Worlds/transitions.js` (genre de la transition signature, voir `Effects/worldTransition.js`). Vérifier les transitions en dev avec `window.__navigateTo`, `__vtFreeze` / `__vtRelease`, `__vtSlow`, et les clics avec `__clickFx(x, y)`. Les titres réels des projets sont souvent plus longs que prévu (« Design d'un processus de paiement », « Articles Manager Next Js ») : toujours les regarder dans le navigateur.

## Pièges déjà rencontrés
- `postcss-calc` (build) échoue sur `calc()` mélangeant `cqw` ou `var()` et des nombres : faire le calcul en JS ou en pourcentages ; toujours finir par `CI=true npm run build`.
- Dans le callback d'une View Transition, **jamais de `requestAnimationFrame`** (rendu suspendu, abandon après 4 s).
- Les effets de mise en page des enfants (dont `useGSAP`) passent avant ceux des parents : le thème du monde est appliqué par `WorldTheme`, rendu en premier.
- `.card` appartient à la carte de profil (`Card.css`) ; les cartes de projet sont `.proj*`. Après un renommage en masse, revérifier les `var(--…)` CSS.
- `lazyPreload` évite le retour au Suspense une fois la page préchargée ; la page projet est remontée par `key={slug}` (animations d'entrée rejouées).
- Cache ESLint du serveur de dev périmé : `rm node_modules/.cache/.eslintcache`, `touch` des fichiers, ou `npx eslint --no-cache`.

## Moodboard des 23 mondes
`docs/moodboard-mondes.html` : données `WORLDS`, moteur, glyphes de transition, panneaux d'avis. Une scène = `SCENES.<id> = (stage, world) => { … }` (unités `cqw`, couleurs `var(--w0…--w4)`, `uiRow("SEC 01 / …")`, canvas via `loop(stage, draw)`), CSS `.s-<id>` inséré avant `/* @@WORLD-CSS */`, JS avant `/* @@SCENES */`. Publier avec l'outil Artifact après avoir chargé les skills `artifact-design` et `artifact-capabilities` (`capabilities: {db: {}}`), puis lire les avis avec `ArtifactData` (`list`, collection `verdicts`, un document par monde : `status` ok / revise / no, `note`).
