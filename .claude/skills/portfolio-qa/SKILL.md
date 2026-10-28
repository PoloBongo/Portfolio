---
name: portfolio-qa
description: Vérifier visuellement et mesurer le portfolio d'Arthur BRU avant de conclure une modification d'interface ou d'animation (serveur de dev, émulation mobile et mouvement réduit, vidéo des transitions décodée avec ffmpeg, images par seconde, Lighthouse, trace de performance, build CI).
---

# Vérifier le portfolio

## Serveurs
- Dev (HMR) en arrière-plan : `$env:BROWSER="none"; $env:PORT="3055"; npm start` → http://localhost:3055/fr. Le cache ESLint du serveur devient périmé : `rm node_modules/.cache/.eslintcache`, puis `touch` des fichiers.
- Build de production : `rm -f node_modules/.cache/.eslintcache; CI=true npm run build` (les avertissements ESLint font échouer le build), puis `npx --yes serve -s build -l 5088` en arrière-plan (à arrêter ensuite). Mesurer Lighthouse et les images par seconde **sur ce build**, pas sur le serveur de dev.

## Navigateur de test (chrome-devtools)
- `emulate` : `viewport: "1440x900x1"`, `"390x844x3,mobile,touch"`, `"844x390x3,mobile,touch,landscape"` ; `prefersReducedMotion: "reduce"` ou `"no-preference"` (à remettre après un test).
- `navigate_page` (`type: "url"` ou `"reload"`, `ignoreCache: true`), `evaluate_script` (asynchrone possible, pas d'option `timeout`), `take_screenshot` avec `filePath` puis `Read` de l'image.
- Rejouer le préloader complet : `sessionStorage.removeItem("introPlayed")` puis recharger. En dev : `window.lenis.scrollTo(y, { immediate: true, force: true })`, `window.__field.debug()`, `window.__rag`, `window.gsap`.
- Une fenêtre Chrome de test **réduite** bride `requestAnimationFrame` à ~1 Hz (faux « 1 i/s ») : restaurer la fenêtre avant de mesurer.

## Juger une animation ou une transition
Une capture ne suffit pas : `screencast_start` → déclencher l'action (`evaluate_script`) → `screencast_stop` (fichier mp4), puis décoder avec ffmpeg
`C:\Users\polob\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.1.2-full_build\bin\ffmpeg.exe -y -ss <début> -i <video> -vf "fps=8,scale=480:300,tile=4x5" -frames:v 1 planche.png` et lire la planche avec `Read` (1 fps pour repérer le moment, 8 fps pour le détail). Un appel d'outil dure plusieurs secondes : ne pas compter sur des captures successives pour attraper un instant précis.

## Scène 3D et showcase des catégories
- En dev : `window.__field.debug()` (scène du hero), `.hero__rail-btn` (cliquer 0, 1, 2 = actes Web, IA, Jeu ; attendre ~4,5 s après le premier chargement, le rideau du préloader retarde la construction des objets). Une capture arrive ~1 s après l'ordre : un désassemblage de 1,9 s est fini quand elle est prise, filmer (`screencast`) pour le voir.
- Molette réaliste : `window.dispatchEvent(new WheelEvent("wheel", { deltaY: 100, deltaMode: 0, bubbles: true, cancelable: true }))` toutes les 110 ms (Lenis les écoute). `window.scrollTo` image par image charge aussi le fil principal (utile pour reproduire un tremblement). Showcase : `.showcase` (`--n`), pas = `(offsetHeight - innerHeight) / (n - 1)`, position = `top + pas × (projet + fraction)` ; pause 0–0,2 et 0,8–1, transition entre les deux.
- **Juger la régularité d'une vidéo en texture** : les i/s ne la montrent pas (60 i/s stables avec une vidéo qui saccade). Instrumenter le moteur sur le serveur de dev (une ligne `// TMPDEBUG` poussant `[pos, p, mode, texture.version, el.currentTime]` dans `window.__scLog`), rejouer la molette, compter les intervalles (en rendus) entre deux changements de `version` : un clip 30 i/s sur 60 Hz doit donner 2, 2, 2… Comparer à un `<video>` ordinaire + `requestVideoFrameCallback` pour écarter l'environnement (116 écarts sur 119 à 2). Retirer les lignes `TMPDEBUG` avant le build (`grep -rn TMPDEBUG src`).
- Une page de test restée ouverte pendant un rebuild du build statique donne `Unexpected token '<'` en console (anciens chunks absents, et le script Speed Insights en local) : faux positif.

## Mesures attendues
- Images par seconde : boucle `requestAnimationFrame` de 2 à 4 s au repos et pendant l'action, pire image < 25 ms (60 i/s sur Radeon RX 6600 ; une image de ~67 ms à la coupe d'une transition est acceptable).
- `lighthouse_audit` (bureau puis mobile, mode navigation) sur le build : accessibilité, SEO, agentic = 100, bonnes pratiques 100 (96 sur l'accueil servi en local : script Vercel Speed Insights absent, sans gravité). `performance_start_trace` avec `reload: true, autoStop: true` : LCP < 1,5 s, CLS < 0,1, puis `performance_analyze_insight` sur `CLSCulprits` si besoin.
- Règle d'accessibilité qui a déjà échoué : le nom accessible d'un bouton doit contenir son texte visible (`label-content-name-mismatch`).

## À tester à chaque fois
Bureau 1440×900 et 1366×657, mobile 390×844, mouvement réduit, FR / EN / ES, retour du navigateur, aucune erreur console (hors script Vercel).
