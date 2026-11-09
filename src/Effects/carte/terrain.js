// La carte : relief, tracé du fil et position des régions. Données pures (aucun rendu), partagées par la scène.
// Le fil raconte le parcours (étapes) puis se divise vers les trois régions ; le terrain est aplani le long du fil.
import * as THREE from "three";

export const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Étapes du parcours, dans l'ordre du fil (x, z sur la carte). Les textes arriveront avec leur tranche.
export const STEPS = [
  { key: "lycee", x: -9, z: 9 },
  { key: "bachelor", x: -11.5, z: 1.5 },
  { key: "equipe", x: -5.5, z: -2.5 },
  { key: "master", x: 1, z: 1.5 },
  { key: "basket", x: 6, z: -3 },
];
export const FORK = { x: 3, z: -9 };
export const REGIONS = [
  { id: "web", x: -6.5, z: -13.5, hex: "#d9ff4a", rgb: [0.851, 1, 0.29] },
  { id: "ai", x: 3, z: -14.8, hex: "#63e6be", rgb: [0.39, 0.9, 0.745] },
  { id: "game", x: 12.5, z: -12.8, hex: "#ff5fa8", rgb: [1, 0.373, 0.659] },
];

export const ROAD = 0.75; // hauteur du fil (fond de vallée)
export const PLATEAU = 1.1; // hauteur des régions

// Bruit de valeur sur une table fixe : le même terrain à chaque visite
const table = new Float32Array(65536);
{
  let s = 7654321;
  for (let i = 0; i < 65536; i += 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    table[i] = s / 4294967296;
  }
}
const lat = (x, y) => table[((x & 255) << 8) | (y & 255)];
const vnoise = (x, y) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  let fx = x - ix;
  let fy = y - iy;
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);
  return lerp(lerp(lat(ix, iy), lat(ix + 1, iy), fx), lerp(lat(ix, iy + 1), lat(ix + 1, iy + 1), fx), fy);
};
const baseRelief = (x, y) => {
  let v = 0;
  let a = 0.5;
  let f = 0.13;
  for (let i = 0; i < 5; i += 1) {
    v += a * vnoise(x * f + 11.3, y * f + 4.7);
    f *= 2.03;
    a *= 0.5;
  }
  return Math.pow(clamp(v * 1.25 - 0.08), 1.6) * 4.8;
};

const flatCurve = new THREE.CatmullRomCurve3([...STEPS, FORK].map((s) => new THREE.Vector3(s.x, 0, s.z)), false, "catmullrom", 0.5);
const roadPts = flatCurve.getSpacedPoints(240);

// Le fil passe dans une vallée : la route est aplanie, les régions sont des plateaux
const ROAD_BOX = roadPts.reduce(
  (b, p) => ({ x0: Math.min(b.x0, p.x), x1: Math.max(b.x1, p.x), z0: Math.min(b.z0, p.z), z1: Math.max(b.z1, p.z) }),
  { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity }
);
const FAR = 14; // au-delà, ni l'aplanissement du fil ni la vallée n'ont d'effet : on évite de chercher le point du fil le plus proche

export function reliefAt(x, z) {
  let h = baseRelief(x, z);
  const near = x > ROAD_BOX.x0 - FAR && x < ROAD_BOX.x1 + FAR && z > ROAD_BOX.z0 - FAR && z < ROAD_BOX.z1 + FAR;
  if (near) {
    let d2 = Infinity;
    for (let i = 0; i < roadPts.length; i += 1) {
      const dx = x - roadPts[i].x;
      const dz = z - roadPts[i].z;
      const d = dx * dx + dz * dz;
      if (d < d2) d2 = d;
    }
    const road = Math.exp(-d2 / 2.2);
    h = h * (1 - road) + ROAD * road;
    // Vallée en pente douce : aucun relief ne passe entre la caméra et le repère
    h = Math.min(h, ROAD + Math.max(0, Math.sqrt(d2) - 1.2) * 0.42);
  }
  REGIONS.forEach((r) => {
    const g = Math.exp(-((x - r.x) ** 2 + (z - r.z) ** 2) / 5.5);
    h = h * (1 - g) + PLATEAU * g;
  });
  return h;
}

// Assez grand pour qu'aucun bord ne se voie, même dans une fenêtre très large et basse (la caméra de dessus y voit loin)
export const SIZE = 84;

// Le fil en 3D, posé sur le relief
const dense = flatCurve.getSpacedPoints(700).map((v) => new THREE.Vector3(v.x, reliefAt(v.x, v.z) + 0.07, v.z));
export const PATH = new THREE.CatmullRomCurve3(dense);
const PATH_LEN = PATH.getLength();
// Où tombe chaque étape le long du fil (0 → 1), et sa hauteur
STEPS.forEach((s) => {
  s.y = reliefAt(s.x, s.z);
  let best = 0;
  let bd = Infinity;
  dense.forEach((d, i) => {
    const dd = (d.x - s.x) ** 2 + (d.z - s.z) ** 2;
    if (dd < bd) {
      bd = dd;
      best = i;
    }
  });
  s.at = best / (dense.length - 1);
});

// Partition du défilement de l'accueil (0 → 1) : la marche le long du fil occupe [walkA, walkB]
export const P = { walkA: 0.33, walkB: 0.8 };
export const pOfWalk = (w) => P.walkA + w * (P.walkB - P.walkA);

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();
const endTan = PATH.getTangentAt(1);
export const pathPoint = (w, out) => {
  if (w <= 1) return PATH.getPointAt(clamp(w), out);
  return PATH.getPointAt(1, out).addScaledVector(endTan, (w - 1) * PATH_LEN);
};
const ang = (x, z) => Math.atan2(x, z);
export const angLerp = (a, b, t) => {
  const d = ((((b - a + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return a + d * t;
};
const AHEAD = ang(0.55, -1); // le fil part vers la droite et vers le fond de l'écran

// Orientation de la carte pour que la suite du fil parte vers la droite de l'écran
export const headingAt = (w) => {
  pathPoint(w, tmpA);
  let x = 0;
  let z = 0;
  [0.03, 0.07, 0.12].forEach((k) => {
    pathPoint(w + k, tmpB);
    x += tmpB.x - tmpA.x;
    z += tmpB.z - tmpA.z;
  });
  return AHEAD - ang(x, z);
};

// Le fil se divise vers les trois régions : une branche par région, posée sur le relief
REGIONS.forEach((r) => {
  const a = new THREE.Vector3(FORK.x, 0, FORK.z);
  const b = new THREE.Vector3(r.x, 0, r.z);
  const side = new THREE.Vector3(b.z - a.z, 0, a.x - b.x).normalize().multiplyScalar(1.2);
  const mid = a.clone().lerp(b, 0.5).add(side);
  const flat = new THREE.CatmullRomCurve3([a, mid, b]).getSpacedPoints(160);
  r.curve = new THREE.CatmullRomCurve3(flat.map((v) => new THREE.Vector3(v.x, reliefAt(v.x, v.z) + 0.07, v.z)));
});

// Vue d'ensemble finale : Web à gauche, Jeu à droite ; la caméra regarde le centre des régions
export const OVER = Math.PI / 2 - ang(REGIONS[2].x - REGIONS[0].x, REGIONS[2].z - REGIONS[0].z);
export const CENTROID = new THREE.Vector3(
  (REGIONS.reduce((a, r) => a + r.x, 0) * 2 + FORK.x) / 7,
  PLATEAU,
  (REGIONS.reduce((a, r) => a + r.z, 0) * 2 + FORK.z) / 7 - 3
);
