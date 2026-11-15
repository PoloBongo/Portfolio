// Refonte « manga » · le basket du compagnon : il dribble sur place quand on ne fait rien, garde le ballon contre la
// hanche quand on fait défiler, le passe dans l'autre main quand il a besoin de sa main droite (montrer, saluer,
// tamponner), et tire au panier, coude aligné sous le ballon.
//
// Tout est posé par cinématique inverse à deux os (bras : épaule → coude → main ; jambes : hanche → genou → cheville) :
// les mains sont vraiment sur le ballon, les pieds restent plantés quand il fléchit les genoux. Les positions sont
// données dans le repère du personnage (pivot : x à sa gauche, y en haut, z vers l'écran), en mètres.
//
// Ce module ne dépend que de three ; il est partagé avec le banc d'essai (avatar-arthur-manga/labo/basket.html).

const R = 0.115; // rayon du ballon (RAYON_BALLE)
const PAUME = 0.035; // épaisseur de la main posée sur le ballon

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lisse = (x) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const borne = (x, a, b) => clamp((x - a) / (b - a), 0, 1);

// Le dribble : cinq rebonds en boucle. Chaque segment part d'une main (la main pousse le ballon), rebondit au sol,
// et finit dans une main (elle le cueille et accompagne sa montée).
//   1-2. deux dribbles bas de la main droite ;
//   3.   entre les jambes (pied gauche devant) : de la main droite au rebond entre les pieds, la main gauche le cueille
//        derrière la jambe gauche ;
//   4.   un dribble de la main gauche, qui ramène le ballon devant ;
//   5.   crossover devant lui, de la main gauche à la main droite.
// Puis il change d'appui (petit saut pendant le crossover) et rejoue le même enchaînement en miroir, pied droit devant :
//   B1. dribble de la main droite ; B2. crossover vers la main gauche ; B3. dribble de la main gauche ;
//   B4. entre les jambes de la main gauche à la main droite, derrière la jambe droite ;
//   B5. il ramène le ballon devant et repasse pied gauche devant (petit saut).
const MAINS = {
  rAvant: [-0.29, 0.83, 0.25],
  rArriere: [-0.3, 0.84, 0.03],
  gArriere: [0.3, 0.84, 0.03],
  gAvant: [0.29, 0.83, 0.26],
};
const SEGMENTS = [
  { de: "rAvant", vers: "rAvant", sol: [-0.33, 0.3], duree: 0.42, appui: "A" },
  { de: "rAvant", vers: "rAvant", sol: [-0.33, 0.31], duree: 0.4, appui: "A" },
  { de: "rAvant", vers: "gArriere", sol: [0.0, 0.05], duree: 0.5, appui: "A", oeil: true },
  { de: "gArriere", vers: "gAvant", sol: [0.34, 0.18], duree: 0.44, appui: "A" },
  { de: "gAvant", vers: "rAvant", sol: [0.0, 0.54], duree: 0.52, appui: "A", bascule: true },
  { de: "rAvant", vers: "rAvant", sol: [-0.34, 0.32], duree: 0.42, appui: "B" },
  { de: "rAvant", vers: "gAvant", sol: [0.0, 0.54], duree: 0.48, appui: "B" },
  { de: "gAvant", vers: "gAvant", sol: [0.33, 0.31], duree: 0.4, appui: "B" },
  { de: "gAvant", vers: "rArriere", sol: [0.0, 0.05], duree: 0.5, appui: "B", oeil: true },
  { de: "rArriere", vers: "rAvant", sol: [-0.34, 0.18], duree: 0.5, appui: "B", bascule: true },
];
const CYCLE = SEGMENTS.reduce((s, g) => s + g.duree, 0);
const REBOND = 0.47; // instant du rebond dans le segment (le ballon descend plus vite qu'il ne remonte)

// Appuis : A = pied gauche devant, pied droit derrière ; B = l'inverse. Le bassin tourne vers le pied avant.
const PIEDS = { left: [0.13, 0.115, 0.15], right: [-0.13, 0.115, -0.1] };
const PIEDS_B = { left: [0.13, 0.115, -0.1], right: [-0.13, 0.115, 0.15] };
const LACET = 0.12;

// La peau du corps sous les vêtements n'est jamais dessinée. Quand il lève les bras (tir) ou fléchit les genoux
// (dribble), la déformation faisait percer la peau du torse à travers le pull (aisselles, flancs). Le test se fait dans
// la pose de référence du modèle (en T, attribut « position » avant déformation) : il ne dépend pas de la pose du
// moment. Restent visibles : les mains (au-delà des poignets, |x| ≥ 0,6), le cou (|x| < 0,075) et la tête (y ≥ 1,5).
export function cacherPeauSousVetements(vrm) {
  vrm.scene.traverse((o) => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
      if (!m || !/Body_00_SKIN/.test(m.name) || m.userData.peauCachee) return;
      m.userData.peauCachee = true;
      const avant = m.onBeforeCompile;
      m.onBeforeCompile = (shader, renderer) => {
        if (avant) avant.call(m, shader, renderer);
        shader.vertexShader = shader.vertexShader.replace("void main() {", "varying vec3 vLie;\nvoid main() {\n  vLie = position;");
        shader.fragmentShader = shader.fragmentShader.replace(
          "void main() {",
          "varying vec3 vLie;\nvoid main() {\n  if (abs(vLie.x) < 0.6 && (vLie.y < 1.4 || (abs(vLie.x) > 0.075 && vLie.y < 1.5))) discard;"
        );
      };
      const cle = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : () => "";
      m.customProgramCacheKey = () => `${cle()}|peauCachee`;
      m.needsUpdate = true;
    });
  });
}

export function creerBasket({ THREE, vrm, pivot }) {
  const os = (nom) => vrm.humanoid.getNormalizedBoneNode(nom);
  const hanches = os("hips");
  const qB = new THREE.Quaternion();
  const qA = new THREE.Quaternion();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const pA = new THREE.Vector3();
  const pB = new THREE.Vector3();
  const pC = new THREE.Vector3();
  const axe = new THREE.Vector3();
  const w = new THREE.Vector3();
  const coude = new THREE.Vector3();
  const monde = new THREE.Vector3();
  const pole = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const eu = new THREE.Euler();
  const balle = new THREE.Vector3();
  const regard = new THREE.Vector3();
  const piedsRepos = {};

  // Oriente un os pour que son enfant soit dans la direction voulue (repère du monde)
  function viser(nom, enfant, dirMonde, poids) {
    const b = os(nom);
    const e = os(enfant);
    if (!b || !e || !b.parent || poids <= 0) return;
    b.parent.updateWorldMatrix(true, false);
    b.parent.getWorldQuaternion(qB).invert();
    v1.copy(dirMonde).normalize().applyQuaternion(qB);
    v2.copy(e.position).normalize();
    qA.setFromUnitVectors(v2, v1);
    b.quaternion.slerp(qA, poids);
    b.updateWorldMatrix(false, true);
  }
  const ajouter = (nom, x, y, z) => {
    const b = os(nom);
    if (!b) return;
    qA.setFromEuler(eu.set(x, y, z, "ZYX"));
    b.quaternion.multiply(qA);
  };
  const versPose = (nom, x, y, z, poids) => {
    const b = os(nom);
    if (!b || poids <= 0) return;
    qA.setFromEuler(eu.set(x, y, z, "ZYX"));
    b.quaternion.slerp(qA, poids);
  };

  // Points et directions du repère du personnage vers le monde
  const point = (x, y, z, cible = monde) => pivot.localToWorld(cible.set(x, y, z));
  const direction = (x, y, z, cible = pole) => cible.set(x, y, z).transformDirection(pivot.matrixWorld);

  // Cinématique inverse à deux os : la racine reste, le coude (ou le genou) se place du côté de « vers »
  function ik(haut, milieu, bout, cibleMonde, vers, poids) {
    const A = os(haut);
    const B = os(milieu);
    const C = os(bout);
    if (!A || !B || !C || poids <= 0) return;
    A.getWorldPosition(pA);
    B.getWorldPosition(pB);
    C.getWorldPosition(pC);
    const a = pA.distanceTo(pB);
    const b = pB.distanceTo(pC);
    axe.subVectors(cibleMonde, pA);
    const d = clamp(axe.length(), Math.abs(a - b) + 1e-3, (a + b) * 0.999);
    axe.normalize();
    const x = (a * a - b * b + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, a * a - x * x));
    w.copy(vers).addScaledVector(axe, -vers.dot(axe)).normalize();
    coude.copy(pA).addScaledVector(axe, x).addScaledVector(w, h);
    viser(haut, milieu, v1.subVectors(coude, pA), poids);
    B.getWorldPosition(pB);
    viser(milieu, bout, tmp.subVectors(cibleMonde, pB), poids);
  }

  // --- la posture : genoux fléchis, buste penché, pieds plantés
  function posture(bas, penche, poids, recul = 0, pieds = PIEDS, lacet = 0) {
    hanches.position.y -= bas * poids;
    hanches.position.z -= recul * poids;
    if (lacet) ajouter("hips", 0, lacet * poids, 0);
    hanches.updateWorldMatrix(true, true);
    // (avec ce modèle, une rotation x négative penche le buste en avant : mesuré sur le banc)
    ajouter("spine", -penche * 0.6 * poids, 0, 0);
    ajouter("chest", -penche * 0.4 * poids, 0, 0);
    ajouter("neck", penche * 0.75 * poids, 0, 0); // il relève la tête : il regarde devant, pas ses pieds
    for (const cote of ["left", "right"]) {
      const [x, y, z] = pieds[cote];
      if (!piedsRepos[cote]) {
        const pied = os(`${cote}Foot`);
        pied.updateWorldMatrix(true, false);
        piedsRepos[cote] = pivot.worldToLocal(pied.getWorldPosition(new THREE.Vector3()));
      }
      const r = piedsRepos[cote];
      // De l'appui de repos vers l'appui du dribble, selon le poids
      const cible = point(r.x + (x - r.x) * poids, r.y + (y - r.y) * poids, r.z + (z - r.z) * poids, new THREE.Vector3());
      ik(`${cote}UpperLeg`, `${cote}LowerLeg`, `${cote}Foot`, cible, direction(cote === "left" ? 0.25 : -0.25, 0, 1, new THREE.Vector3()), 1);
      // Pied à plat, orteils devant
      viser(`${cote}Foot`, `${cote}Toes`, direction(cote === "left" ? 0.22 : -0.22, -0.42, 1, new THREE.Vector3()), 1);
    }
  }

  // --- les mains
  // Main posée sur le dessus du ballon (paume vers le bas, doigts vers l'avant et un peu en dehors)
  function mainSur(cote, centre, poids, recul = 0) {
    const s = cote === "left" ? 1 : -1;
    const cible = tmp.copy(centre);
    cible.y += R + PAUME;
    cible.z -= 0.045 + recul;
    cible.x -= s * 0.02;
    ik(`${cote}UpperArm`, `${cote}LowerArm`, `${cote}Hand`, pivot.localToWorld(cible.clone()), direction(s * 0.8, -0.2, -0.6, new THREE.Vector3()), poids);
    viser(`${cote}Hand`, `${cote}MiddleProximal`, direction(s * 0.25, -0.62, 1, new THREE.Vector3()), poids);
    doigts(cote, 0.35, poids);
  }
  // Main libre d'un meneur : en garde, avant-bras levé devant lui, paume vers l'avant
  function garde(cote, poids) {
    const s = cote === "left" ? 1 : -1;
    const cible = point(s * 0.24, 1.0, 0.33, new THREE.Vector3());
    ik(`${cote}UpperArm`, `${cote}LowerArm`, `${cote}Hand`, cible, direction(s * 0.9, -0.5, -0.3, new THREE.Vector3()), poids);
    viser(`${cote}Hand`, `${cote}MiddleProximal`, direction(-s * 0.15, 1, 0.45, new THREE.Vector3()), poids);
    doigts(cote, 0.25, poids);
  }
  function doigts(cote, pli, poids) {
    for (const d of ["Index", "Middle", "Ring", "Little"]) {
      for (const seg of ["Proximal", "Intermediate", "Distal"]) {
        versPose(`${cote}${d}${seg}`, 0, 0, (cote === "left" ? 1 : -1) * pli * (seg === "Proximal" ? 0.6 : 1), poids);
      }
    }
  }

  // --- le dribble
  const centreEnMain = (nom, cible) => {
    const [x, y, z] = MAINS[nom];
    return cible.set(x, y - R - PAUME, z);
  };
  const cA = new THREE.Vector3();
  const cB = new THREE.Vector3();
  const cS = new THREE.Vector3();

  function segmentA(t) {
    let reste = ((t % CYCLE) + CYCLE) % CYCLE;
    for (let i = 0; i < SEGMENTS.length; i += 1) {
      if (reste < SEGMENTS[i].duree) return { i, s: reste / SEGMENTS[i].duree };
      reste -= SEGMENTS[i].duree;
    }
    return { i: 0, s: 0 };
  }

  // Position du ballon (repère du personnage) dans un segment, à l'avancement s ∈ [0, 1]
  function balleDans(seg, s, cible) {
    centreEnMain(seg.de, cA);
    centreEnMain(seg.vers, cB);
    cS.set(seg.sol[0], R, seg.sol[1]);
    let ecrase = 1;
    if (s < REBOND) {
      const u = s / REBOND;
      cible.lerpVectors(cA, cS, u);
      cible.y = cA.y + (R - cA.y) * Math.pow(u, 1.55); // il accélère vers le sol
    } else {
      const u = (s - REBOND) / (1 - REBOND);
      cible.lerpVectors(cS, cB, u);
      cible.y = R + (cB.y - R) * (1 - Math.pow(1 - u, 1.7)); // il ralentit en remontant dans la main
    }
    const contact = Math.abs(s - REBOND);
    if (contact < 0.035) ecrase = 0.8 + 0.2 * (contact / 0.035);
    return ecrase;
  }

  const MAIN_DE = { rAvant: "right", rArriere: "right", gArriere: "left", gAvant: "left" };
  const piedsDe = { left: [0, 0, 0], right: [0, 0, 0] };

  function dribble(t, poids) {
    const { i, s } = segmentA(t);
    const seg = SEGMENTS[i];
    const ecrase = balleDans(seg, s, balle);
    const pousse = MAIN_DE[seg.de];
    const cueille = MAIN_DE[seg.vers];
    // Petit rebond du corps à chaque poussée (genoux)
    const pompe = Math.sin(clamp(s / 0.3, 0, 1) * Math.PI) * 0.018;
    // Changement d'appui : pendant un segment « bascule », les pieds s'inversent d'un petit saut
    let versB = seg.appui === "B" ? 1 : 0;
    let saut = 0;
    if (seg.bascule) {
      const u = borne(s, 0.14, 0.6);
      versB = seg.appui === "B" ? 1 - lisse(u) : lisse(u);
      saut = Math.sin(Math.PI * u);
    }
    for (const cote of ["left", "right"]) {
      for (let k = 0; k < 3; k += 1) piedsDe[cote][k] = PIEDS[cote][k] + (PIEDS_B[cote][k] - PIEDS[cote][k]) * versB;
      piedsDe[cote][1] += saut * 0.055;
    }
    posture(0.15 + pompe - saut * 0.045, 0.5, poids, 0.05, piedsDe, -LACET + 2 * LACET * versB);

    for (const cote of ["left", "right"]) {
      const enPousse = cote === pousse ? 1 - lisse(borne(s, 0.1, 0.32)) : 0; // la main accompagne le ballon puis remonte
      const enCueille = cote === cueille ? lisse(borne(s, 0.72, 0.9)) : 0; // la main vient au-devant du ballon
      const surBalle = Math.max(enPousse, enCueille);
      const actif = cote === pousse || cote === cueille;
      if (surBalle > 0.001) {
        // Entre deux contacts, la main attend au-dessus du point de prise
        centreEnMain(cote === cueille ? seg.vers : seg.de, cB);
        cB.y += 0.05;
        cA.copy(balle);
        cA.lerp(cB, 1 - surBalle);
        mainSur(cote, cA, poids);
      } else if (actif) {
        centreEnMain(cote === cueille ? seg.vers : seg.de, cB);
        cB.y += 0.06;
        mainSur(cote, cB, poids * 0.9);
      } else {
        garde(cote, poids);
      }
    }
    // Il regarde l'écran, et jette un œil au ballon pendant le passage entre les jambes
    const coupDOeil = seg.oeil ? Math.sin(s * Math.PI) * 0.8 : 0;
    point(0, 1.45 * (1 - coupDOeil) + 0.3 * coupDOeil, 3 * (1 - coupDOeil) + 0.6 * coupDOeil, regard);
    return { ecrase, rotation: (t % CYCLE) * 18 };
  }

  // --- le ballon contre la hanche droite (on fait défiler) ou gauche (sa main droite est occupée)
  function tenir(cote, poids) {
    const s = cote === "left" ? 1 : -1;
    posture(0.02, 0.04, poids);
    balle.set(s * 0.27, 0.86, 0.1);
    // Main sur le côté extérieur du ballon, avant-bras qui le serre contre la hanche
    const cible = point(s * (0.27 + R * 0.55), 0.86 + R * 0.65, 0.1, new THREE.Vector3());
    ik(`${cote}UpperArm`, `${cote}LowerArm`, `${cote}Hand`, cible, direction(s * 0.6, 0, -0.8, new THREE.Vector3()), poids);
    viser(`${cote}Hand`, `${cote}MiddleProximal`, direction(-s * 0.35, -0.75, 0.55, new THREE.Vector3()), poids);
    doigts(cote, 0.45, poids);
    point(0, 1.45, 3, regard);
    return { ecrase: 1, rotation: 0 };
  }

  // --- le tir : rassemblement à la poitrine, flexion des genoux pendant que le ballon monte côté droit, point de tir
  // au-dessus et devant le front (le « L » : bras à l'horizontale devant, avant-bras vertical, coude sous le ballon et
  // pointé vers le panier, main droite dessous paume vers le ciel, main gauche sur le flanc), extension et petit saut,
  // lâcher, poignet cassé (« col de cygne »), tenue du geste, puis il relâche.
  const LACHER = 0.52;
  const POINT = [-0.1, 1.78, 0.2]; // le ballon au point de tir
  const pos = (x, y, z) => new THREE.Vector3(x, y, z);
  function tir(t, poids) {
    const flexion = lisse(borne(t, 0.06, 0.26)) * (1 - lisse(borne(t, 0.26, 0.44)));
    const saut = lisse(borne(t, 0.36, 0.52)) * (1 - lisse(borne(t, 0.56, 0.78)));
    // Après la tenue du geste, les mains redescendent par l'avant (sinon le bras retombait par le côté)
    const relache = lisse(borne(t, 0.82, 1.22));
    const w = poids * (1 - lisse(borne(t, 1.18, 1.42)));
    posture(0.03 + 0.11 * flexion - 0.06 * saut, 0.16 * flexion, poids * (1 - relache * 0.7));

    // Trajet du ballon : poitrine (côté droit) → point de tir → lâcher vers le haut et l'avant
    const monte = lisse(borne(t, 0.1, 0.38));
    const part = borne(t, 0.42, LACHER);
    balle.set(-0.07 + (POINT[0] + 0.07) * monte, 1.06 + (POINT[1] - 1.06) * monte, 0.26 + (POINT[2] - 0.26) * monte);
    balle.y += 0.16 * part;
    balle.z += 0.12 * part;
    const lache = t > LACHER;

    // Main droite : sous le ballon (poignet dessous et un peu en arrière), puis bras tendu vers le panier après le lâcher
    const flick = lisse(borne(t, LACHER - 0.03, LACHER + 0.09));
    const sous = lache ? pos(-0.09, 1.92, 0.4).lerp(pos(-0.23, 0.98, 0.2), relache) : pos(balle.x - 0.01, balle.y - R - 0.03, balle.z + 0.01);
    // Pôle du coude : sous le ballon et devant (vers le panier) ; à la poitrine, il reste le long du corps
    ik("rightUpperArm", "rightLowerArm", "rightHand", pivot.localToWorld(sous), direction(-0.15, -0.55 + 0.35 * monte, 1, new THREE.Vector3()), w);
    // Poignet armé (doigts vers l'arrière, paume vers le ciel) puis cassé (doigts vers le bas et l'avant)
    const arme = monte;
    viser("rightHand", "rightMiddleProximal", direction(0.05, 0.2 + 0.7 * (1 - arme) - 0.55 * flick - 0.3 * relache, -0.9 * arme + 1.75 * flick + 0.6 * (1 - arme) - 1.2 * relache, new THREE.Vector3()), w);
    doigts("right", 0.15 + 0.55 * flick, w);
    // Main gauche (guide) sur le flanc gauche du ballon, doigts vers le haut ; elle s'écarte au lâcher, sans pousser
    const guide = 1 - lisse(borne(t, LACHER, LACHER + 0.16));
    const flanc = lache ? pos(0.3, 1.56, 0.16).lerp(pos(0.24, 0.98, 0.17), relache) : pos(balle.x + R + 0.025, balle.y - 0.04, balle.z - 0.01);
    ik("leftUpperArm", "leftLowerArm", "leftHand", pivot.localToWorld(flanc), direction(1, -0.7, 0.2, new THREE.Vector3()), w);
    viser("leftHand", "leftMiddleProximal", direction(-0.25 * guide, 1, 0.2 + 0.4 * (1 - guide), new THREE.Vector3()), w);
    doigts("left", 0.2, w);
    // Il regarde le panier (au-dessus et devant lui), pas le ballon
    point(-0.1, 2.3, 3, regard);
    return { ecrase: 1, rotation: lache ? 0 : -monte * 1.2, lache, leve: saut * 0.06 };
  }

  function appliquer(geste, t, poids = 1) {
    pivot.updateMatrixWorld(true);
    let etat;
    if (geste === "dribble") etat = dribble(t, poids);
    else if (geste === "tir") etat = tir(t, poids);
    else etat = tenir(geste === "tenirGauche" ? "left" : "right", poids);
    return {
      balle: geste === "tir" && etat.lache ? null : pivot.localToWorld(balle.clone()),
      ecrase: etat.ecrase,
      rotation: etat.rotation,
      regard: regard.clone(),
      lache: !!etat.lache,
      leve: etat.leve || 0,
    };
  }

  // --- l'enchaînement des gestes, sans à-coups
  // Le site dit ce qu'il voudrait (« dribble », « tenir », « tenirGauche », « tir », « rien ») ; le module attend le bon
  // moment (il ne lâche pas un ballon en l'air : il le rattrape d'abord dans la main droite) puis fond les deux gestes.
  const FONDU = 0.28;
  const jeu = { geste: "tenir", t: 0, ancien: null, tAncien: 0, k: 1, attente: 0, sansBalle: 0 };
  // segments du dribble qui finissent dans la main droite
  const DROITE_FIN = SEGMENTS.map((g, k) => (MAIN_DE[g.vers] === "right" ? k : -1)).filter((k) => k >= 0);
  function pretAChanger(voulu) {
    if (jeu.geste === "tir") return jeu.t > 1.42;
    if (jeu.geste === "dribble" && voulu !== "tir") {
      const { i, s: av } = segmentA(jeu.t);
      return (DROITE_FIN.includes(i) && av > 0.9) || jeu.attente > 0.6;
    }
    return true;
  }
  function maj(dt, voulu) {
    jeu.t += dt;
    jeu.tAncien += dt;
    if (voulu !== jeu.geste) {
      jeu.attente += dt;
      if (pretAChanger(voulu)) {
        jeu.ancien = jeu.geste === "rien" ? null : jeu.geste;
        jeu.tAncien = jeu.t;
        jeu.geste = voulu;
        jeu.t = 0;
        jeu.k = 0;
        jeu.attente = 0;
      }
    } else jeu.attente = 0;
    jeu.k = Math.min(1, jeu.k + dt / FONDU);
    const k = lisse(jeu.k);
    let a = null;
    if (jeu.ancien && k < 1) a = appliquer(jeu.ancien, jeu.tAncien, 1 - k);
    const b = jeu.geste === "rien" ? null : appliquer(jeu.geste, jeu.t, k);
    // Le ballon : celui du geste courant, fondu depuis l'ancien ; absent pendant le vol du tir et pendant « rien »
    let pos = b && b.balle;
    if (pos && a && a.balle) pos = a.balle.lerp(pos, k);
    if (!pos && a && a.balle && jeu.geste === "rien") pos = a.balle;
    jeu.sansBalle = pos ? 0 : jeu.sansBalle + dt;
    const r = b || a || { ecrase: 1, rotation: 0, regard: null, lache: false, leve: 0 };
    return {
      balle: pos,
      taille: jeu.geste === "rien" ? 1 - k : 1,
      ecrase: r.ecrase,
      rotation: r.rotation,
      regard: r.regard,
      lache: !!(b && b.lache),
      leve: (b ? b.leve * k : 0) + (a ? a.leve * (1 - k) : 0),
      geste: jeu.geste,
      tGeste: jeu.t,
    };
  }

  return {
    LACHER,
    CYCLE,
    // Un geste à l'instant t, avec un poids (banc d'essai) : "dribble" | "tenir" | "tenirGauche" | "tir"
    appliquer,
    // Une image du compagnon : voulu = "dribble" | "tenir" | "tenirGauche" | "tir" | "rien"
    maj,
    // Le prochain tir repart de zéro
    tirer() {
      jeu.ancien = jeu.geste === "rien" || jeu.geste === "tir" ? null : jeu.geste;
      jeu.tAncien = jeu.t;
      jeu.geste = "tir";
      jeu.t = 0;
      jeu.k = 0;
    },
  };
}
