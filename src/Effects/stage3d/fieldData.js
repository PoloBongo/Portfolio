// Données du nuage de points : chaque point a une position cible dans chaque « forme », la simulation l'y attire.
// Formes : noise (bruit) · sphere (sphère + anneaux) · lattice (grille) · work (grappes) · stack (constellation)
//          browser (fenêtre filaire) · network (réseau de neurones) · at (arobase)
//          pad (manette en pixels) · name (le nom en grandes lettres, pour l'ouverture du hero).
// Chaque forme est une texture S × S : x, y, z de la cible, et w = paramètre de la forme (sert aux impulsions lumineuses).
// Tout est généré une seule fois, avec des graines fixes : le même nuage à chaque visite.

// Largeur (en unités du modèle) que le nuage occupe quand une pose clé demande « size = 1 »
export const MODEL_WIDTH = 10;

const SPHERE_RADIUS = 3.3;
const RING_SHARE = 0.2;

// Grappes de l'index des projets, dans l'ordre des lignes de WorkIndex. weight : part des points.
export const WORK_CLUSTERS = [
  { center: [-4.1, 1.3, 0.2], radius: 1.35, weight: 2.8 }, // web
  { center: [-1.3, -1.9, 0.6], radius: 1.0, weight: 1.4 }, // IA
  { center: [1.0, 2.0, -0.6], radius: 1.25, weight: 2.4 }, // Unity
  { center: [3.2, -0.9, 0.4], radius: 0.95, weight: 1.6 }, // Unreal
  { center: [4.6, 1.9, -0.8], radius: 0.95, weight: 1.6 }, // Game Jam
];

// Constellation de la section compétences : quatre domaines reliés entre eux. Les centres servent aussi aux annotations.
export const STACK_GROUPS = [
  { id: "web", center: [-3.0, 1.55, 0.3], radius: 1.15 },
  { id: "ai", center: [3.0, 1.85, -0.3], radius: 1.15 },
  { id: "data", center: [-2.5, -1.75, -0.2], radius: 1.0 },
  { id: "game", center: [3.4, -1.55, 0.4], radius: 0.95 },
];

// Liaisons de la constellation (indices de STACK_GROUPS) : des points s'alignent le long de ces arêtes
const STACK_LINKS = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [0, 3],
  [1, 2],
];
const BRIDGE_SHARE = 0.07;

// Points « étiquetés » : le curseur affiche le plus proche (le nom d'une technologie), quelle que soit la forme
export const PROBE_LABELS = [
  "React",
  "Next.js",
  "TypeScript",
  "Vue.js",
  "Python",
  "LLM",
  "RAG",
  "MCP",
  "n8n",
  "Qdrant",
  "Docker",
  "PHP",
  "Unity",
  "C++",
];

// Impulsions lumineuses : 0 aucune · 1 balayage vertical (fenêtre) · 2 flux le long des liaisons (réseau)
export const SHAPE_PULSE = { browser: 1, network: 2 };

function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Loi normale (Box-Muller)
const gauss = (rnd) => Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-6))) * Math.cos(2 * Math.PI * rnd());

// Rotation d'un point autour de X puis de Y
function rotate(p, rx, ry) {
  const cx = Math.cos(rx);
  const sx = Math.sin(rx);
  const y1 = p[1] * cx - p[2] * sx;
  const z1 = p[1] * sx + p[2] * cx;
  const cy = Math.cos(ry);
  const sy = Math.sin(ry);
  return [p[0] * cy + z1 * sy, y1, -p[0] * sy + z1 * cy];
}

// ---------- Chemins : des points répartis le long de polylignes ----------

const rect = (cx, cy, w, h, r = 0, steps = 5) => {
  const pts = [];
  const hw = w / 2;
  const hh = h / 2;
  const corners = [
    [hw - r, hh - r, 0],
    [-hw + r, hh - r, Math.PI / 2],
    [-hw + r, -hh + r, Math.PI],
    [hw - r, -hh + r, (Math.PI * 3) / 2],
  ];
  const arc = r > 0 ? steps : 0;
  corners.forEach(([ox, oy, a0]) => {
    for (let i = 0; i <= arc; i += 1) {
      const a = a0 + (arc ? i / arc : 0) * (Math.PI / 2);
      pts.push([cx + ox + Math.cos(a) * r, cy + oy + Math.sin(a) * r]);
    }
  });
  return { pts, closed: true };
};

const circle = (cx, cy, r, steps = 22) => ({
  pts: Array.from({ length: steps }, (_, i) => [cx + Math.cos((i / steps) * Math.PI * 2) * r, cy + Math.sin((i / steps) * Math.PI * 2) * r]),
  closed: true,
});

const segment = (x0, y0, x1, y1) => ({ pts: [[x0, y0], [x1, y1]], closed: false });

function pathSampler(paths) {
  const segs = [];
  let total = 0;
  paths.forEach((path) => {
    const n = path.pts.length;
    const last = path.closed ? n : n - 1;
    const weight = path.weight || 1;
    for (let i = 0; i < last; i += 1) {
      const a = path.pts[i];
      const b = path.pts[(i + 1) % n];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) * weight;
      if (len > 0) {
        segs.push({ a, b, start: total });
        total += len;
      }
    }
  });
  return (rnd) => {
    const r = rnd() * total;
    let lo = 0;
    let hi = segs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (segs[mid].start <= r) lo = mid;
      else hi = mid - 1;
    }
    const s = segs[lo];
    const u = rnd();
    return [s.a[0] + (s.b[0] - s.a[0]) * u, s.a[1] + (s.b[1] - s.a[1]) * u, u];
  };
}

function write(out, i, x, y, z, w = -1) {
  const o = i * 4;
  out[o] = x;
  out[o + 1] = y;
  out[o + 2] = z;
  out[o + 3] = w;
}

// ---------- Formes ----------

function buildNoise(count) {
  const rnd = mulberry32(11);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    write(out, i, (rnd() - 0.5) * 30, (rnd() - 0.5) * 17, (rnd() - 0.5) * 16);
  }
  return out;
}

// Coque fine (la silhouette se lit nettement), un peu de volume à l'intérieur, trois anneaux inclinés
function buildSphere(count) {
  const rnd = mulberry32(23);
  const out = new Float32Array(count * 4);
  const rings = [
    { radius: 1.3, rx: 1.15, ry: 0.25 },
    { radius: 1.46, rx: -0.55, ry: 0.95 },
    { radius: 1.64, rx: 0.3, ry: -1.25 },
  ];
  const onRing = new Uint8Array(count);
  let shell = 0;
  for (let i = 0; i < count; i += 1) {
    onRing[i] = rnd() < RING_SHARE ? 1 : 0;
    if (!onRing[i]) shell += 1;
  }
  let k = 0;
  for (let i = 0; i < count; i += 1) {
    if (onRing[i]) {
      const ring = rings[i % rings.length];
      const angle = rnd() * Math.PI * 2;
      const r = SPHERE_RADIUS * ring.radius + gauss(rnd) * 0.014 * SPHERE_RADIUS;
      const p = rotate([Math.cos(angle) * r, gauss(rnd) * 0.012 * SPHERE_RADIUS, Math.sin(angle) * r], ring.rx, ring.ry);
      write(out, i, p[0], p[1], p[2]);
    } else {
      const y = 1 - (2 * (k + 0.5)) / shell;
      const ringR = Math.sqrt(1 - y * y);
      const phi = k * 2.399963229728653;
      const inside = rnd() < 0.14;
      const r = SPHERE_RADIUS * (inside ? 0.22 + 0.66 * Math.pow(rnd(), 0.8) : 1 + gauss(rnd) * 0.016);
      write(out, i, Math.cos(phi) * ringR * r, y * r, Math.sin(phi) * ringR * r);
      k += 1;
    }
  }
  return out;
}

// Grille de repérage : des lignes (comme un plan de mise en page) et des nœuds plus denses aux intersections
function buildLattice(count) {
  const rnd = mulberry32(37);
  const out = new Float32Array(count * 4);
  const cols = [];
  const rows = [];
  for (let x = -7.5; x <= 7.51; x += 0.75) cols.push(x);
  for (let y = -4.5; y <= 4.51; y += 0.75) rows.push(y);
  for (let i = 0; i < count; i += 1) {
    const z = gauss(rnd) * 0.03;
    if (rnd() < 0.3) {
      write(out, i, cols[Math.floor(rnd() * cols.length)] + gauss(rnd) * 0.03, rows[Math.floor(rnd() * rows.length)] + gauss(rnd) * 0.03, z);
    } else if (rnd() < 0.5) {
      write(out, i, cols[Math.floor(rnd() * cols.length)] + gauss(rnd) * 0.012, (rnd() - 0.5) * 9.4, z);
    } else {
      write(out, i, (rnd() - 0.5) * 15.2, rows[Math.floor(rnd() * rows.length)] + gauss(rnd) * 0.012, z);
    }
  }
  return out;
}

function blob(out, i, center, radius, rnd) {
  let ox = gauss(rnd) * radius * 0.5;
  let oy = gauss(rnd) * radius * 0.5;
  let oz = gauss(rnd) * radius * 0.3;
  const reach = Math.hypot(ox, oy, oz);
  if (reach > radius * 1.6) {
    const k = (radius * 1.6) / reach;
    ox *= k;
    oy *= k;
    oz *= k;
  }
  write(out, i, center[0] + ox, center[1] + oy, center[2] + oz);
}

function buildWork(count, meta) {
  const rnd = mulberry32(41);
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    const wc = WORK_CLUSTERS[meta[i * 4]];
    blob(out, i, wc.center, wc.radius, rnd);
  }
  return out;
}

function buildStack(count, meta) {
  const rnd = mulberry32(53);
  const out = new Float32Array(count * 4);
  const lengths = STACK_LINKS.map(([a, b]) => {
    const A = STACK_GROUPS[a].center;
    const B = STACK_GROUPS[b].center;
    return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
  });
  const total = lengths.reduce((sum, l) => sum + l, 0);
  for (let i = 0; i < count; i += 1) {
    const group = meta[i * 4 + 1];
    if (group >= STACK_GROUPS.length) {
      let at = rnd() * total;
      let edge = 0;
      for (; edge < STACK_LINKS.length - 1; edge += 1) {
        at -= lengths[edge];
        if (at <= 0) break;
      }
      const A = STACK_GROUPS[STACK_LINKS[edge][0]].center;
      const B = STACK_GROUPS[STACK_LINKS[edge][1]].center;
      const u = 0.12 + rnd() * 0.76;
      write(
        out,
        i,
        A[0] + (B[0] - A[0]) * u + gauss(rnd) * 0.04,
        A[1] + (B[1] - A[1]) * u + gauss(rnd) * 0.04,
        A[2] + (B[2] - A[2]) * u + gauss(rnd) * 0.04
      );
    } else {
      const g = STACK_GROUPS[group];
      let sx = gauss(rnd) * g.radius * 0.5;
      let sy = gauss(rnd) * g.radius * 0.5;
      let sz = gauss(rnd) * g.radius * 0.25;
      const far = Math.hypot(sx, sy, sz);
      if (far > g.radius * 1.6) {
        const k = (g.radius * 1.6) / far;
        sx *= k;
        sy *= k;
        sz *= k;
      }
      write(out, i, g.center[0] + sx, g.center[1] + sy, g.center[2] + sz);
    }
  }
  return out;
}

// Fenêtre de navigateur filaire : barre de titre, adresse, image, texte et cartes. w = hauteur normalisée (balayage).
function buildBrowser(count) {
  const rnd = mulberry32(67);
  const out = new Float32Array(count * 4);
  const paths = [
    { ...rect(0, 0, 8.6, 6, 0.4, 6), weight: 2.4 },
    segment(-4.3, 1.95, 4.3, 1.95),
    { ...circle(-3.65, 2.5, 0.15), weight: 1.6 },
    { ...circle(-3.2, 2.5, 0.15), weight: 1.6 },
    { ...circle(-2.75, 2.5, 0.15), weight: 1.6 },
    rect(0.9, 2.5, 4.6, 0.44, 0.2, 4),
    { ...rect(-2.15, 0.35, 3.7, 2.7, 0.15, 4), weight: 1.3 },
    segment(-4, -1, -0.3, 1.7),
    segment(-0.3, -1, -4, 1.7),
    segment(0.1, 1.45, 3.9, 1.45),
    segment(0.1, 1.0, 3.5, 1.0),
    segment(0.1, 0.55, 3.9, 0.55),
    segment(0.1, 0.1, 2.8, 0.1),
    { ...rect(-2.55, -2.1, 2.4, 1.5, 0.12, 4), weight: 1.1 },
    { ...rect(0, -2.1, 2.4, 1.5, 0.12, 4), weight: 1.1 },
    { ...rect(2.55, -2.1, 2.4, 1.5, 0.12, 4), weight: 1.1 },
  ];
  const sample = pathSampler(paths);
  for (let i = 0; i < count; i += 1) {
    const [x, y] = sample(rnd);
    write(out, i, x + gauss(rnd) * 0.02, y + gauss(rnd) * 0.02, gauss(rnd) * 0.06, Math.min(1, Math.max(0, (3.4 - y) / 6.8)));
  }
  return out;
}

// Réseau de neurones : couches de nœuds reliées entre elles. w = indice de la liaison + position le long de la liaison.
function buildNetwork(count) {
  const rnd = mulberry32(79);
  const out = new Float32Array(count * 4);
  const layers = [4, 6, 7, 6, 3];
  const nodes = [];
  layers.forEach((n, li) => {
    const x = -4.4 + (li / (layers.length - 1)) * 8.8;
    for (let k = 0; k < n; k += 1) {
      const y = (k - (n - 1) / 2) * (5.6 / Math.max(n - 1, 1)) * (n > 3 ? 1 : 1.15);
      nodes.push({ layer: li, x, y, z: (rnd() - 0.5) * 1.1 });
    }
  });
  const edges = [];
  nodes.forEach((a) => {
    nodes.forEach((b) => {
      if (b.layer === a.layer + 1) edges.push([a, b]);
    });
  });
  for (let i = 0; i < count; i += 1) {
    if (rnd() < 0.16) {
      const node = nodes[Math.floor(rnd() * nodes.length)];
      blob(out, i, [node.x, node.y, node.z], 0.34, rnd);
    } else {
      const e = Math.floor(rnd() * edges.length);
      const [a, b] = edges[e];
      const t = rnd();
      write(
        out,
        i,
        a.x + (b.x - a.x) * t + gauss(rnd) * 0.014,
        a.y + (b.y - a.y) * t + gauss(rnd) * 0.014,
        a.z + (b.z - a.z) * t + gauss(rnd) * 0.014,
        e + t * 0.999
      );
    }
  }
  return out;
}

// Glyphe échantillonné depuis un canvas : les points se répartissent sur les pixels du caractère
function buildGlyph(count, glyph) {
  const rnd = mulberry32(97);
  const out = new Float32Array(count * 4);
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 460px "Bricolage Grotesque Variable", "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText(glyph, size / 2, size / 2 + 20);
  const pixels = ctx.getImageData(0, 0, size, size).data;
  const filled = [];
  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      if (pixels[(y * size + x) * 4 + 3] > 128) filled.push(x, y);
    }
  }
  const n = filled.length / 2;
  for (let i = 0; i < count; i += 1) {
    const k = Math.floor(rnd() * n) * 2;
    write(out, i, (filled[k] / size - 0.5) * 7.2 + gauss(rnd) * 0.015, -(filled[k + 1] / size - 0.5) * 7.2 + gauss(rnd) * 0.015, gauss(rnd) * 0.14);
  }
  return out;
}

// Manette en pixels : une cellule = un carré de points. Bords pleins, intérieur en damier (effet de dithering),
// croix directionnelle, boutons et sticks en creux. La moitié gauche est miroir de la droite.
const PAD_HALF = [
  "....XXXXXX...",
  "..XXXXXXXXXXX",
  ".XXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  "XXXXXXXXXXXXX",
  ".XXXXXXXXXXXX",
  ".XXXXXXXX....",
  "..XXXXXX.....",
  "...XXXX......",
];
const PAD_W = PAD_HALF[0].length * 2;
const PAD_HOLES = new Set(
  [
    [6, 4], [5, 5], [6, 5], [7, 5], [6, 6], // croix directionnelle
    [19, 4], [18, 5], [20, 5], [19, 6], // boutons
    [9, 7], [10, 7], [9, 8], [10, 8], // stick gauche
    [15, 7], [16, 7], [15, 8], [16, 8], // stick droit
    [12, 3], [13, 3], // start / select
  ].map(([x, y]) => `${x},${y}`)
);

function buildPad(count) {
  const rnd = mulberry32(113);
  const out = new Float32Array(count * 4);
  const lit = (x, y) => {
    if (y < 0 || y >= PAD_HALF.length || x < 0 || x >= PAD_W) return false;
    return PAD_HALF[y][x < PAD_W / 2 ? x : PAD_W - 1 - x] === "X" && !PAD_HOLES.has(`${x},${y}`);
  };
  const cells = [];
  let total = 0;
  for (let y = 0; y < PAD_HALF.length; y += 1) {
    for (let x = 0; x < PAD_W; x += 1) {
      if (!lit(x, y)) continue;
      const edge = !lit(x - 1, y) || !lit(x + 1, y) || !lit(x, y - 1) || !lit(x, y + 1);
      const weight = edge ? 1 : (x + y) % 2 ? 0.7 : 0.26;
      total += weight;
      cells.push({ x, y, end: total });
    }
  }
  const cell = 0.3;
  for (let i = 0; i < count; i += 1) {
    const r = rnd() * total;
    let lo = 0;
    let hi = cells.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cells[mid].end < r) lo = mid + 1;
      else hi = mid;
    }
    const c = cells[lo];
    write(
      out,
      i,
      (c.x - (PAD_W - 1) / 2 + (rnd() - 0.5) * 0.86) * cell,
      -(c.y - (PAD_HALF.length - 1) / 2 + (rnd() - 0.5) * 0.86) * cell,
      gauss(rnd) * 0.05
    );
  }
  return out;
}

// Le nom en grandes lettres, échantillonné depuis un canvas : une partie des points forme les lettres (pleines puis
// contour), le reste flotte autour comme une nébuleuse. La largeur du texte vaut MODEL_WIDTH : le nuage se cale
// sur le titre HTML en le posant sur la boîte de ses lettres.
function buildName(count, lines = 1) {
  const rnd = mulberry32(131);
  const out = new Float32Array(count * 4);
  const words = lines === 1 ? ["ARTHUR BRU"] : ["ARTHUR", "BRU"];
  const px = 240;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const setFont = () => {
    ctx.font = `800 ${px}px "Bricolage Grotesque Variable", "Helvetica Neue", Arial, sans-serif`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = `${-0.04 * px}px`;
  };
  setFont();
  const wide = Math.max(...words.map((word) => ctx.measureText(word).width));
  const lineH = px * 0.86;
  canvas.width = Math.ceil(wide + px * 0.4);
  canvas.height = Math.ceil(lineH * words.length + px * 0.5);
  setFont();
  ctx.fillStyle = "#fff";
  ctx.textBaseline = "alphabetic";
  words.forEach((word, i) => ctx.fillText(word, px * 0.2, px * 0.2 + lineH * (i + 0.78)));
  const { width, height } = canvas;
  const data = ctx.getImageData(0, 0, width, height).data;

  const STEP = 3;
  const on = (x, y) => x >= 0 && y >= 0 && x < width && y < height && data[(y * width + x) * 4 + 3] > 128;
  const fill = [];
  const edge = [];
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y += STEP) {
    for (let x = 0; x < width; x += STEP) {
      if (!on(x, y)) continue;
      fill.push(x, y);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (!on(x - STEP, y) || !on(x + STEP, y) || !on(x, y - STEP) || !on(x, y + STEP)) edge.push(x, y);
    }
  }
  const scale = MODEL_WIDTH / Math.max(1, maxX - minX);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  for (let i = 0; i < count; i += 1) {
    const r = rnd();
    const list = r < 0.3 || edge.length === 0 ? fill : edge;
    const k = Math.floor(rnd() * (list.length / 2)) * 2;
    let x = (list[k] - cx) * scale;
    let y = -(list[k + 1] - cy) * scale;
    let z = gauss(rnd) * 0.05;
    if (r > 0.52) {
      // nébuleuse : un point des lettres, repoussé de 0,2 à 1,4 unité
      const a = rnd() * Math.PI * 2;
      const d = 0.2 + Math.abs(gauss(rnd)) * 0.7;
      x += Math.cos(a) * d;
      y += Math.sin(a) * d;
      z = gauss(rnd) * 0.55;
    }
    write(out, i, x + gauss(rnd) * 0.012, y + gauss(rnd) * 0.012, z);
  }
  return out;
}

export { buildName };

// side : côté de la texture de simulation (le nuage compte side × side points)
export function buildField(side, { nameLines = 1 } = {}) {
  const count = side * side;
  const rnd = mulberry32(20261022);

  // Identité de chaque point : grappe de l'index (0-4), domaine de la constellation (0-3, 4 = liaison), point étiqueté
  const meta = new Float32Array(count * 4);
  const workTotal = WORK_CLUSTERS.reduce((sum, c) => sum + c.weight, 0);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i += 1) {
    let pick = rnd() * workTotal;
    let cluster = 0;
    for (; cluster < WORK_CLUSTERS.length - 1; cluster += 1) {
      pick -= WORK_CLUSTERS[cluster].weight;
      if (pick <= 0) break;
    }
    meta[i * 4] = cluster;
    meta[i * 4 + 1] = rnd() < BRIDGE_SHARE ? STACK_GROUPS.length : Math.floor(rnd() * STACK_GROUPS.length);
    seed[i * 4] = rnd();
    seed[i * 4 + 1] = rnd();
    seed[i * 4 + 2] = rnd();
    seed[i * 4 + 3] = rnd();
  }

  const shapes = {
    noise: buildNoise(count),
    sphere: buildSphere(count),
    lattice: buildLattice(count),
    work: buildWork(count, meta),
    stack: buildStack(count, meta),
    browser: buildBrowser(count),
    network: buildNetwork(count),
    at: buildGlyph(count, "@"),
    pad: buildPad(count),
    name: buildName(count, nameLines),
  };

  // Points étiquetés : pris dans la coque de la sphère (jamais sur un anneau), donc présents dans toutes les formes
  const probes = [];
  const step = Math.floor(count / PROBE_LABELS.length);
  PROBE_LABELS.forEach((label, k) => {
    let index = k * step + Math.floor(rnd() * step * 0.8);
    for (;;) {
      const o = (index % count) * 4;
      if (Math.hypot(shapes.sphere[o], shapes.sphere[o + 1], shapes.sphere[o + 2]) < SPHERE_RADIUS * 1.15) break;
      index += 1;
    }
    index %= count;
    meta[index * 4 + 2] = 1;
    probes.push({ label, index });
  });

  return { side, count, shapes, seed, meta, probes };
}
