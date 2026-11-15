// Les emblèmes 3D des trois portes (chapitre 2 de l'accueil) : une fenêtre de navigateur « </> » (Web), un petit
// réseau de neurones (IA), une manette (Jeu vidéo). Rendu manga : trois aplats d'ombre (MeshToonMaterial) et un contour
// à l'encre (la même forme, un peu plus grande, vue de l'intérieur). Un seul canvas posé sur les trois portes.
// Au repos, ils flottent dans le haut de leur case ; au survol de la porte, l'emblème sort de la case vers le lecteur
// en faisant un tour ; quand la porte s'ouvre (clic), il fonce vers l'écran.
import * as THREE from "three";

const ENCRE = 0x101014;
const COULEURS = { web: 0xd9ff4a, ai: 0x63e6be, game: 0xff5fa8 };

function degrade() {
  const t = new THREE.DataTexture(new Uint8Array([90, 170, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

export function creerEmblemes(liste) {
  const portes = Array.from(liste.querySelectorAll(".mg-world"));
  if (portes.length < 3) return () => {};
  const reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const canvas = renderer.domElement;
  canvas.className = "ax-emblemes";
  canvas.setAttribute("aria-hidden", "true");
  liste.style.position = "relative";
  liste.appendChild(canvas);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  cam.position.set(0, 0, 10);
  const soleil = new THREE.DirectionalLight(0xffffff, 2.6);
  soleil.position.set(-2, 3, 4);
  scene.add(soleil, new THREE.AmbientLight(0xffffff, 0.9));

  const grad = degrade();
  const geos = [];
  const mats = [];
  const toon = (couleur) => {
    const m = new THREE.MeshToonMaterial({ color: couleur, gradientMap: grad });
    mats.push(m);
    return m;
  };
  const contour = new THREE.MeshBasicMaterial({ color: ENCRE, side: THREE.BackSide });
  mats.push(contour);
  // Une pièce : la forme en aplats + son contour à l'encre
  const piece = (geo, couleur, epais = 1.07) => {
    geos.push(geo);
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, toon(couleur)));
    const c = new THREE.Mesh(geo, contour);
    c.scale.setScalar(epais);
    g.add(c);
    return g;
  };

  // --- Web : fenêtre de navigateur, barre et trois pastilles, « </> » en relief
  function web() {
    const g = new THREE.Group();
    g.add(piece(new THREE.BoxGeometry(1.4, 1.0, 0.14), 0xfbf9f3, 1.04));
    const barre = piece(new THREE.BoxGeometry(1.4, 0.22, 0.18), COULEURS.web, 1.04);
    barre.position.set(0, 0.39, 0.01);
    g.add(barre);
    [-0.56, -0.44, -0.32].forEach((x, i) => {
      const p = piece(new THREE.SphereGeometry(0.045, 16, 10), [0xff3b1f, 0xffd21f, ENCRE][i]);
      p.position.set(x, 0.39, 0.11);
      g.add(p);
    });
    const trait = (x, y, rz, l = 0.3) => {
      const t = piece(new THREE.BoxGeometry(l, 0.075, 0.1), ENCRE, 1.0);
      t.position.set(x, y, 0.12);
      t.rotation.z = rz;
      g.add(t);
    };
    trait(-0.33, 0.0, 0.62);
    trait(-0.33, -0.17, -0.62);
    trait(0.33, 0.0, -0.62);
    trait(0.33, -0.17, 0.62);
    trait(0, -0.085, 1.2, 0.46);
    return g;
  }

  // --- IA : réseau 2 → 3 → 2, nœuds en sphères, liaisons à l'encre
  function ia() {
    const g = new THREE.Group();
    const couches = [
      [-0.62, [-0.3, 0.3]],
      [0, [-0.45, 0, 0.45]],
      [0.62, [-0.3, 0.3]],
    ];
    const noeuds = couches.map(([x, ys]) => ys.map((y) => new THREE.Vector3(x, y, 0)));
    const lien = new THREE.CylinderGeometry(0.022, 0.022, 1, 8);
    geos.push(lien);
    const matLien = toon(ENCRE);
    for (let c = 0; c < noeuds.length - 1; c += 1) {
      noeuds[c].forEach((a) =>
        noeuds[c + 1].forEach((b) => {
          const m = new THREE.Mesh(lien, matLien);
          m.position.copy(a).add(b).multiplyScalar(0.5);
          m.scale.y = a.distanceTo(b);
          m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
          g.add(m);
        })
      );
    }
    noeuds.flat().forEach((p, i) => {
      const n = piece(new THREE.SphereGeometry(i === 3 ? 0.17 : 0.13, 24, 14), i === 3 ? 0xfbf9f3 : COULEURS.ai);
      n.position.copy(p);
      g.add(n);
    });
    return g;
  }

  // --- Jeu vidéo : manette (corps, deux poignées), croix directionnelle, quatre boutons
  function jeu() {
    const g = new THREE.Group();
    const corps = piece(new THREE.CapsuleGeometry(0.3, 0.75, 6, 16), COULEURS.game, 1.05);
    corps.rotation.z = Math.PI / 2;
    g.add(corps);
    [-1, 1].forEach((s) => {
      const p = piece(new THREE.CapsuleGeometry(0.2, 0.32, 6, 12), COULEURS.game, 1.06);
      p.position.set(s * 0.5, -0.24, 0);
      p.rotation.z = s * 0.5;
      g.add(p);
    });
    [0, Math.PI / 2].forEach((rz) => {
      const c = piece(new THREE.BoxGeometry(0.26, 0.08, 0.08), ENCRE, 1.0);
      c.position.set(-0.36, 0.02, 0.27);
      c.rotation.z = rz;
      g.add(c);
    });
    [
      [0.36, 0.12, 0xd9ff4a],
      [0.46, 0.02, 0x63e6be],
      [0.36, -0.08, 0xfbf9f3],
      [0.26, 0.02, 0xff3b1f],
    ].forEach(([x, y, c]) => {
      const b = piece(new THREE.SphereGeometry(0.05, 14, 10), c);
      b.position.set(x, y, 0.27);
      g.add(b);
    });
    return g;
  }

  const emblemes = [web(), ia(), jeu()].map((objet, i) => {
    const pivot = new THREE.Group();
    pivot.add(objet);
    scene.add(pivot);
    return { pivot, objet, porte: portes[i], survol: 0, vSurvol: 0, cible: 0, ouvre: 0, tour: 0 };
  });

  // Survol des portes
  const ecoutes = [];
  emblemes.forEach((e) => {
    const entrer = () => {
      e.cible = 1;
    };
    const sortir = () => {
      e.cible = 0;
    };
    e.porte.addEventListener("pointerenter", entrer);
    e.porte.addEventListener("pointerleave", sortir);
    e.porte.addEventListener("focusin", entrer);
    e.porte.addEventListener("focusout", sortir);
    ecoutes.push(() => {
      e.porte.removeEventListener("pointerenter", entrer);
      e.porte.removeEventListener("pointerleave", sortir);
      e.porte.removeEventListener("focusin", entrer);
      e.porte.removeEventListener("focusout", sortir);
    });
  });
  const souris = { x: 0, y: 0 };
  const bouger = (ev) => {
    souris.x = (ev.clientX / window.innerWidth) * 2 - 1;
    souris.y = (ev.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener("pointermove", bouger, { passive: true });

  // Taille et placement : chaque emblème au-dessus du titre de sa porte
  let W = 1;
  let H = 1;
  let unite = 1; // pixels → unités de la scène (dans le plan z = 0)
  const placer = () => {
    const r = liste.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(liste.offsetHeight));
    renderer.setSize(W, H, false);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    cam.aspect = W / H;
    cam.updateProjectionMatrix();
    const hauteurMonde = 2 * cam.position.z * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    unite = hauteurMonde / H;
    emblemes.forEach((e) => {
      const p = e.porte.getBoundingClientRect();
      // Carte haute (bureau) : au centre, en haut ; carte basse et large (téléphone) : à droite, plus petit
      const large = p.width > p.height * 1.15;
      const cx = p.left - r.left + p.width * (large ? 0.74 : 0.5);
      const cy = p.top - r.top + p.height * (large ? 0.3 : 0.29);
      e.base = new THREE.Vector3((cx - W / 2) * unite, (H / 2 - cy) * unite, 0);
      e.taille = (large ? Math.min(p.width * 0.24, p.height * 0.36) : Math.min(p.width * 0.32, p.height * 0.28)) * unite;
    });
  };
  placer();
  // Les shaders sont compilés tout de suite, avant que les portes soient à l'écran (sinon une image saute à l'arrivée)
  renderer.compile(scene, cam);
  const ro = new ResizeObserver(placer);
  ro.observe(liste);

  let raf = 0;
  let vu = false;
  let avant = performance.now();
  let temps = 0;
  const image = (maintenant) => {
    raf = 0;
    const dt = Math.min(0.05, (maintenant - avant) / 1000);
    avant = maintenant;
    temps += dt;
    emblemes.forEach((e, i) => {
      // ressort du survol (un léger dépassement)
      e.vSurvol = (e.vSurvol + (e.cible - e.survol) * 0.12) * 0.8;
      e.survol += e.vSurvol;
      const ouverte = e.porte.classList.contains("is-open");
      e.ouvre += ((ouverte ? 1 : 0) - e.ouvre) * Math.min(1, dt * 5);
      // un tour complet au survol ; une fois fait, il compte pour zéro (même orientation) et ne repart pas en arrière
      if (e.cible > 0.5) e.tour += (Math.PI * 2 - e.tour) * Math.min(1, dt * 4.5);
      else if (e.tour > Math.PI * 2 - 0.05) e.tour = 0;
      else e.tour += (0 - e.tour) * Math.min(1, dt * 4.5);
      const flotte = reduit ? 0 : Math.sin(temps * 1.5 + i * 2.1) * 0.06;
      e.pivot.position.copy(e.base);
      e.pivot.position.y += flotte * e.taille + e.survol * 0.12 * e.taille;
      e.pivot.position.z = e.survol * 1.6 + e.ouvre * 6;
      const s = e.taille * (1 + 0.22 * e.survol);
      e.pivot.scale.setScalar(s);
      e.objet.rotation.set(
        -0.18 + souris.y * 0.25 + Math.sin(temps * 0.9 + i) * 0.06,
        -0.35 + souris.x * 0.45 + (reduit ? 0 : Math.sin(temps * 0.7 + i) * 0.25) + e.tour + e.ouvre * 3,
        0
      );
    });
    renderer.render(scene, cam);
    if (vu && !reduit) raf = requestAnimationFrame(image);
  };
  const io = new IntersectionObserver(([entree]) => {
    vu = entree.isIntersecting;
    if (vu && !raf) {
      placer();
      avant = performance.now();
      raf = requestAnimationFrame(image);
    }
  });
  io.observe(liste);

  return () => {
    io.disconnect();
    ro.disconnect();
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", bouger);
    ecoutes.forEach((f) => f());
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    grad.dispose();
    renderer.dispose();
    canvas.remove();
  };
}
