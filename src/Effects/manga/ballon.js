// Refonte « manga » · le ballon de basket : en 3D quand Arthur le fait tourner sur son doigt ou le tient avant de tirer,
// en HTML pendant le vol (il traverse toute la page jusqu'au panier dessiné dans la case « Le basket »).
import * as THREE from "three";
import { gsap } from "../motion";

export const RAYON_BALLE = 0.115;

// Texture du ballon : orange grainé et coutures noires (projection équirectangulaire)
function texture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#e3702b";
  g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 3000; i += 1) {
    g.fillStyle = i % 2 ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 220, 190, 0.08)";
    g.fillRect(Math.random() * 512, Math.random() * 256, 2, 2);
  }
  g.strokeStyle = "#1b1311";
  g.lineWidth = 7;
  g.lineCap = "round";
  const trait = (points) => {
    g.beginPath();
    points.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.stroke();
  };
  trait([
    [0, 128],
    [512, 128],
  ]);
  trait([
    [128, 0],
    [128, 256],
  ]);
  trait([
    [384, 0],
    [384, 256],
  ]);
  // Les deux coutures courbes, de part et d'autre
  for (const signe of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 64; i += 1) {
      const u = i / 64;
      pts.push([u * 512, 128 + signe * 96 * Math.cos(u * Math.PI * 2)]);
    }
    trait(pts);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Ombrage en trois aplats, comme le reste de l'avatar
function degrade() {
  const t = new THREE.DataTexture(new Uint8Array([95, 185, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

export function creerBalle3D() {
  const groupe = new THREE.Group();
  const forme = new THREE.SphereGeometry(RAYON_BALLE, 32, 16);
  const balle = new THREE.Mesh(forme, new THREE.MeshToonMaterial({ map: texture(), gradientMap: degrade() }));
  // Contour à l'encre : la même sphère, un peu plus grande, vue de l'intérieur
  const contour = new THREE.Mesh(forme, new THREE.MeshBasicMaterial({ color: 0x101014, side: THREE.BackSide }));
  contour.scale.setScalar(1.07);
  groupe.add(contour, balle);
  groupe.visible = false;
  let angle = 0;
  return {
    groupe,
    tourner(vitesse, dt, penche = 0) {
      angle += vitesse * dt;
      balle.rotation.set(0.35 + penche, angle, 0.2);
    },
    dispose() {
      forme.dispose();
      balle.material.map.dispose();
      balle.material.gradientMap.dispose();
      balle.material.dispose();
      contour.material.dispose();
    },
  };
}

// Le vol : une cloche du point de départ jusqu'au panier (qui peut bouger si l'on défile), puis le filet
export function lancerBallon(depart, cible, { duree = 1, onPanier } = {}) {
  const el = document.createElement("div");
  el.className = "mg-ball";
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);
  const c0 = cible();
  const hauteur = Math.max(150, Math.hypot(c0.x - depart.x, c0.y - depart.y) * 0.45);
  const etat = { t: 0, chute: 0 };
  const placer = (x, y, tour, echelle = 1, opacite = 1) => {
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${tour.toFixed(0)}deg) scale(${echelle})`;
    el.style.opacity = opacite;
  };
  placer(depart.x, depart.y, 0, 0.6);
  return gsap
    .timeline({ onComplete: () => el.remove() })
    .to(etat, {
      t: 1,
      duration: duree,
      ease: "none",
      onUpdate: () => {
        const c = cible();
        const t = etat.t;
        placer(depart.x + (c.x - depart.x) * t, depart.y + (c.y - depart.y) * t - hauteur * 4 * t * (1 - t), -t * 760, 0.6 + 0.4 * Math.min(1, t * 3));
      },
    })
    .add(() => onPanier && onPanier(), duree)
    .to(etat, {
      chute: 1,
      duration: 0.42,
      ease: "power1.in",
      onUpdate: () => {
        const c = cible();
        const k = etat.chute;
        placer(c.x, c.y + k * 95, -760 - k * 90, 1 - k * 0.15, 1 - Math.max(0, k - 0.55) / 0.45);
      },
    });
}
