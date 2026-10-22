import * as THREE from "three";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Manette générique entièrement procédurale (aucun modèle téléchargé) :
// silhouette extrudée + textures peintes en canvas, boutons, sticks, croix directionnelle, écran,
// et un état « vue éclatée » où chaque pièce s'écarte de la coque.

export const COLORS = {
  violet: 0xbc63ff,
  mint: 0x63e6be,
  pink: 0xff7ad9,
  sky: 0x6fb7ff,
  cream: 0xf3f0ea,
};

const DEPTH = 0.5;
const BEVEL_T = 0.32;
const BEVEL_S = 0.3;
const HALF = DEPTH / 2 + BEVEL_T;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// Épaississement des poignées et léger bombé : même fonction pour la coque et pour placer les pièces dessus
const grip = (x, y) => smooth(1.3, 3.3, Math.abs(x)) * smooth(0.9, -1.4, y);
const dome = (x, y) => 1 - Math.min(1, (x / 4.1) ** 2 + (y / 2.4) ** 2);
const kz = (x, y) => (1 + 0.42 * grip(x, y)) * (1 + 0.16 * dome(x, y));
export const frontZ = (x, y) => HALF * kz(x, y);

// Silhouette vue de face : épaules, poignées, vallée centrale
function silhouette() {
  const s = new THREE.Shape();
  s.moveTo(0, 1.55);
  s.bezierCurveTo(1.2, 1.62, 2.3, 1.7, 3.0, 1.35);
  s.bezierCurveTo(3.55, 1.08, 3.78, 0.2, 3.72, -0.55);
  s.bezierCurveTo(3.66, -1.5, 3.55, -2.05, 3.05, -2.32);
  s.bezierCurveTo(2.55, -2.58, 2.1, -2.2, 1.7, -1.55);
  s.bezierCurveTo(1.35, -1.0, 0.9, -0.88, 0, -0.88);
  s.bezierCurveTo(-0.9, -0.88, -1.35, -1.0, -1.7, -1.55);
  s.bezierCurveTo(-2.1, -2.2, -2.55, -2.58, -3.05, -2.32);
  s.bezierCurveTo(-3.55, -2.05, -3.66, -1.5, -3.72, -0.55);
  s.bezierCurveTo(-3.78, 0.2, -3.55, 1.08, -3.0, 1.35);
  s.bezierCurveTo(-2.3, 1.7, -1.2, 1.62, 0, 1.55);
  return s;
}

// Extrusion arrondie, normales lissées (ExtrudeGeometry est facetté par défaut)
function smoothExtrude(shape, options) {
  let geometry = new THREE.ExtrudeGeometry(shape, options);
  geometry.deleteAttribute("normal");
  geometry.deleteAttribute("uv");
  geometry = mergeVertices(geometry, 1e-3);
  return geometry;
}

// Décale les points d'un contour vers l'extérieur (pour l'arête de sélection)
function offsetOutline(points, distance) {
  const out = [];
  const n = points.length;
  let area = 0;
  for (let i = 0; i < n; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % n];
    area += a.x * b.y - b.x * a.y;
  }
  const sign = area > 0 ? 1 : -1;
  for (let i = 0; i < n; i += 1) {
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const len = Math.hypot(tx, ty) || 1;
    out.push(new THREE.Vector3(points[i].x + (sign * ty * distance) / len, points[i].y - (sign * tx * distance) / len, 0));
  }
  return out;
}

function canvasTexture(canvas, { srgb = true } = {}) {
  const texture = new THREE.CanvasTexture(canvas);
  if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Textures de la coque : zone « plaque » brillante au centre, coque satinée, détails imprimés
function paintBody(bbox, outline) {
  const W = 1024;
  const H = Math.round((W * (bbox.max.y - bbox.min.y)) / (bbox.max.x - bbox.min.x));
  const toX = (x) => ((x - bbox.min.x) / (bbox.max.x - bbox.min.x)) * W;
  const toY = (y) => (1 - (y - bbox.min.y) / (bbox.max.y - bbox.min.y)) * H;

  // Plaque : le contour réduit de 7 % autour de son centre
  const cx = 0;
  const cy = -0.4;
  const plate = new Path2D();
  outline.forEach((p, i) => {
    const x = toX(cx + (p.x - cx) * 0.93);
    const y = toY(cy + (p.y - cy) * 0.9);
    if (i === 0) plate.moveTo(x, y);
    else plate.lineTo(x, y);
  });
  plate.closePath();

  const color = document.createElement("canvas");
  color.width = W;
  color.height = H;
  const c = color.getContext("2d");
  c.fillStyle = "#1a1a24";
  c.fillRect(0, 0, W, H);

  // Grain léger sur la coque
  for (let i = 0; i < 9000; i += 1) {
    c.fillStyle = `rgba(255,255,255,${Math.random() * 0.035})`;
    c.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
  }

  c.fillStyle = "#0a0a11";
  c.fill(plate);
  c.lineWidth = 3;
  c.strokeStyle = "rgba(188, 99, 255, 0.42)";
  c.stroke(plate);

  // Évents sur les poignées
  c.fillStyle = "rgba(0, 0, 0, 0.5)";
  [-1, 1].forEach((side) => {
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 4; col += 1) {
        const x = toX(side * (2.55 + col * 0.2 - row * 0.05));
        const y = toY(-1.35 - row * 0.15);
        c.beginPath();
        c.arc(x, y, 3.4, 0, Math.PI * 2);
        c.fill();
      }
    }
  });

  // Marquages
  c.fillStyle = "rgba(243, 240, 234, 0.5)";
  c.font = '600 15px "JetBrains Mono Variable", ui-monospace, monospace';
  c.textAlign = "center";
  c.fillText("ARTHUR_ENGINE  V5.1", toX(0), toY(-0.62));
  c.font = '600 11px "JetBrains Mono Variable", ui-monospace, monospace';
  c.fillStyle = "rgba(188, 99, 255, 0.8)";
  c.fillText("PLAYER 1", toX(0), toY(-0.78));

  const rough = document.createElement("canvas");
  rough.width = W;
  rough.height = H;
  const r = rough.getContext("2d");
  r.fillStyle = "rgb(150,150,150)";
  r.fillRect(0, 0, W, H);
  r.fillStyle = "rgb(40,40,40)";
  r.fill(plate);

  return {
    map: canvasTexture(color),
    roughnessMap: canvasTexture(rough, { srgb: false }),
    width: W,
    height: H,
  };
}

function glyphTexture(type) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  g.strokeStyle = "rgba(10, 10, 18, 0.82)";
  g.fillStyle = "rgba(10, 10, 18, 0.82)";
  g.lineWidth = 13;
  g.lineCap = "round";
  g.lineJoin = "round";
  if (type === "dot") {
    g.beginPath();
    g.arc(64, 64, 20, 0, Math.PI * 2);
    g.fill();
  } else if (type === "ring") {
    g.beginPath();
    g.arc(64, 64, 30, 0, Math.PI * 2);
    g.stroke();
  } else if (type === "bar") {
    g.beginPath();
    g.moveTo(34, 64);
    g.lineTo(94, 64);
    g.stroke();
  } else {
    g.beginPath();
    g.moveTo(34, 78);
    g.lineTo(64, 48);
    g.lineTo(94, 78);
    g.stroke();
  }
  return canvasTexture(canvas);
}

// Écran central : texte du niveau en cours (fourni par le HUD), barre d'XP, glyphe du dernier bouton pressé
function createScreen() {
  const canvas = document.createElement("canvas");
  canvas.width = 340;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const texture = canvasTexture(canvas);
  const state = { title: "PLAYER 1", xp: 0, flash: "", flashAt: -10, lastDraw: -1, shown: "" };
  const font = (size, weight = 600) => `${weight} ${size}px "JetBrains Mono Variable", ui-monospace, monospace`;

  const draw = (time) => {
    const blink = Math.floor(time * 2) % 2 === 0;
    const flashing = time - state.flashAt < 0.55;
    const signature = `${state.title}|${Math.round(state.xp * 50)}|${blink}|${flashing ? state.flash : ""}`;
    if (signature === state.shown) return;
    state.shown = signature;

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0b0b14");
    gradient.addColorStop(1, "#1a1230");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,0.035)";
    for (let y = 0; y < canvas.height; y += 4) ctx.fillRect(0, y, canvas.width, 1);

    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillStyle = "#bc63ff";
    ctx.font = font(15);
    ctx.fillText("P1", 16, 28);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(243,240,234,0.55)";
    ctx.fillText("ARTHUR_ENGINE", canvas.width - 16, 28);

    ctx.textAlign = "center";
    if (flashing) {
      ctx.fillStyle = "#f3f0ea";
      ctx.font = font(40, 700);
      ctx.fillText(state.flash, canvas.width / 2, 84);
    } else {
      const text = state.title.toUpperCase();
      let size = 40;
      ctx.font = font(size, 700);
      while (ctx.measureText(text).width > canvas.width - 70 && size > 18) {
        size -= 2;
        ctx.font = font(size, 700);
      }
      ctx.fillStyle = "#f3f0ea";
      const w = ctx.measureText(text).width;
      ctx.fillText(text, canvas.width / 2 - 8, 84);
      if (blink) {
        ctx.fillStyle = "#bc63ff";
        ctx.fillRect(canvas.width / 2 - 8 + w / 2 + 6, 84 - size * 0.72, size * 0.48, size * 0.8);
      }
    }

    ctx.fillStyle = "rgba(243,240,234,0.14)";
    ctx.fillRect(16, 104, canvas.width - 32, 8);
    ctx.fillStyle = "#bc63ff";
    ctx.fillRect(16, 104, (canvas.width - 32) * state.xp, 8);
    texture.needsUpdate = true;
  };

  draw(0);
  return {
    texture,
    tick: draw,
    setTitle: (title) => {
      state.title = title || "PLAYER 1";
    },
    setXp: (xp) => {
      state.xp = clamp(xp);
    },
    flash: (glyph, time) => {
      state.flash = glyph;
      state.flashAt = time;
    },
  };
}

function radialTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gradient;
  g.fillRect(0, 0, 128, 128);
  return canvasTexture(canvas);
}

function labelTexture(letter, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const g = canvas.getContext("2d");
  g.fillStyle = color;
  g.font = '700 40px "JetBrains Mono Variable", ui-monospace, monospace';
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(letter, 32, 34);
  return canvasTexture(canvas);
}

function crossShape(arm = 0.74, w = 0.25) {
  const r = 0.08;
  const s = new THREE.Shape();
  s.moveTo(-w + r, arm);
  s.lineTo(w - r, arm);
  s.quadraticCurveTo(w, arm, w, arm - r);
  s.lineTo(w, w);
  s.lineTo(arm - r, w);
  s.quadraticCurveTo(arm, w, arm, w - r);
  s.lineTo(arm, -w + r);
  s.quadraticCurveTo(arm, -w, arm - r, -w);
  s.lineTo(w, -w);
  s.lineTo(w, -arm + r);
  s.quadraticCurveTo(w, -arm, w - r, -arm);
  s.lineTo(-w + r, -arm);
  s.quadraticCurveTo(-w, -arm, -w, -arm + r);
  s.lineTo(-w, -w);
  s.lineTo(-arm + r, -w);
  s.quadraticCurveTo(-arm, -w, -arm, -w + r);
  s.lineTo(-arm, w - r);
  s.quadraticCurveTo(-arm, w, -arm + r, w);
  s.lineTo(-w, w);
  s.lineTo(-w, arm - r);
  s.quadraticCurveTo(-w, arm, -w + r, arm);
  return s;
}

function roundedRect(width, height, radius) {
  const x = -width / 2;
  const y = -height / 2;
  const s = new THREE.Shape();
  s.moveTo(x + radius, y);
  s.lineTo(x + width - radius, y);
  s.quadraticCurveTo(x + width, y, x + width, y + radius);
  s.lineTo(x + width, y + height - radius);
  s.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  s.lineTo(x + radius, y + height);
  s.quadraticCurveTo(x, y + height, x, y + height - radius);
  s.lineTo(x, y + radius);
  s.quadraticCurveTo(x, y, x + radius, y);
  return s;
}

// Profil de révolution d'un capuchon (axe Y) : base, flanc, arrondi, creux
function capProfile(radius, height, edge, dish) {
  const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(radius, 0), new THREE.Vector2(radius, height - edge)];
  for (let i = 1; i <= 8; i += 1) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push(new THREE.Vector2(radius - edge + Math.cos(a) * edge, height - edge + Math.sin(a) * edge));
  }
  const inner = radius - edge;
  for (let i = 1; i <= 8; i += 1) {
    const r = inner * (1 - i / 8);
    pts.push(new THREE.Vector2(r, height - dish * (1 - (r / inner) ** 2)));
  }
  return pts;
}

export function buildController() {
  const root = new THREE.Group();
  const group = new THREE.Group(); // pivot de la manette
  root.add(group);

  const disposables = [];
  const track = (resource) => {
    disposables.push(resource);
    return resource;
  };

  // ---------- Coque ----------
  const outline2d = silhouette().getPoints(96);
  const bodyGeo = track(
    (() => {
      const geometry = smoothExtrude(silhouette(), {
        depth: DEPTH,
        bevelEnabled: true,
        bevelThickness: BEVEL_T,
        bevelSize: BEVEL_S,
        bevelSegments: 10,
        curveSegments: 64,
      });
      geometry.translate(0, 0, -DEPTH / 2);
      const pos = geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 1) {
        pos.setZ(i, pos.getZ(i) * kz(pos.getX(i), pos.getY(i)));
      }
      geometry.computeVertexNormals();
      geometry.computeBoundingBox();
      return geometry;
    })()
  );
  const bbox = bodyGeo.boundingBox;
  const paint = paintBody(bbox, outline2d);
  const uv = new Float32Array(bodyGeo.attributes.position.count * 2);
  for (let i = 0; i < bodyGeo.attributes.position.count; i += 1) {
    uv[i * 2] = (bodyGeo.attributes.position.getX(i) - bbox.min.x) / (bbox.max.x - bbox.min.x);
    uv[i * 2 + 1] = (bodyGeo.attributes.position.getY(i) - bbox.min.y) / (bbox.max.y - bbox.min.y);
  }
  bodyGeo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  track(paint.map);
  track(paint.roughnessMap);

  const shellMat = track(
    new THREE.MeshPhysicalMaterial({
      map: paint.map,
      roughnessMap: paint.roughnessMap,
      roughness: 1,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      clearcoatRoughnessMap: paint.roughnessMap,
      envMapIntensity: 0.85,
    })
  );
  const body = new THREE.Mesh(bodyGeo, shellMat);
  group.add(body);

  const satin = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x1d1d28,
      roughness: 0.46,
      metalness: 0.12,
      clearcoat: 0.5,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.1,
    })
  );
  const darkMetal = track(new THREE.MeshStandardMaterial({ color: 0x15151d, roughness: 0.35, metalness: 0.8 }));
  const blackGloss = track(
    new THREE.MeshPhysicalMaterial({ color: 0x07070c, roughness: 0.12, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 })
  );

  // Arête de sélection violette (visible en vue éclatée) : le contour au plus large de la coque
  const outlinePts = offsetOutline(outline2d, BEVEL_S + 0.015);
  const outlineGeo = track(new THREE.BufferGeometry().setFromPoints(outlinePts));
  const outlineMat = track(
    new THREE.LineBasicMaterial({ color: COLORS.violet, transparent: true, opacity: 0, depthWrite: false })
  );
  const outline = new THREE.LineLoop(outlineGeo, outlineMat);
  group.add(outline);

  const parts = [];
  const pressables = [];

  // Surface locale : position + normale approchée par différences finies, pour poser une pièce sur la coque
  const surfaceNormal = (x, y) => {
    const e = 0.05;
    const dzx = (frontZ(x + e, y) - frontZ(x - e, y)) / (2 * e);
    const dzy = (frontZ(x, y + e) - frontZ(x, y - e)) / (2 * e);
    return new THREE.Vector3(-dzx, -dzy, 1).normalize();
  };
  const place = (object, x, y, lift = 0) => {
    const n = surfaceNormal(x, y);
    object.position.set(x, y, frontZ(x, y) + lift);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
  };

  // Enregistre une pièce : position d'origine + déplacement en vue éclatée
  const addPart = (name, object, { ex = [0, 0, 0], rot = [0, 0, 0], delay = 0, note = null } = {}) => {
    group.add(object);
    const part = {
      name,
      object,
      home: object.position.clone(),
      baseQuat: object.quaternion.clone(),
      ex: new THREE.Vector3(...ex),
      exRot: new THREE.Euler(...rot),
      delay,
      note,
      hover: 0,
      press: 0,
      hoverTarget: 0,
      tilt: new THREE.Vector2(),
      tiltTarget: new THREE.Vector2(),
    };
    object.userData.part = part;
    parts.push(part);
    return part;
  };

  // ---------- Boutons d'action ----------
  const faceSpecs = [
    { name: "face-top", color: 0x2fd6a0, glyph: "dot", dx: 0, dy: 1 },
    { name: "face-right", color: 0xff4fb8, glyph: "ring", dx: 1, dy: 0 },
    { name: "face-bottom", color: 0xa43cff, glyph: "bar", dx: 0, dy: -1 },
    { name: "face-left", color: 0x3f9cff, glyph: "chevron", dx: -1, dy: 0 },
  ];
  const faceCenter = new THREE.Vector2(2.12, 0.42);
  const faceParts = [];
  faceSpecs.forEach((spec, index) => {
    const button = new THREE.Group();
    const R = 0.285;
    const ring = new THREE.Mesh(track(new THREE.TorusGeometry(R + 0.05, 0.034, 12, 48)), darkMetal);
    ring.position.z = 0.012;
    button.add(ring);

    const capMat = track(
      new THREE.MeshPhysicalMaterial({
        color: spec.color,
        roughness: 0.34,
        metalness: 0.0,
        clearcoat: 0.55,
        clearcoatRoughness: 0.2,
        emissive: spec.color,
        emissiveIntensity: 0.02,
      })
    );
    const capGeo = track(new THREE.LatheGeometry(capProfile(R, 0.17, 0.055, 0.03), 48));
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.rotation.x = Math.PI / 2;
    button.add(cap);

    const glyph = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.17, 32)),
      track(new THREE.MeshBasicMaterial({ map: track(glyphTexture(spec.glyph)), transparent: true, depthWrite: false, toneMapped: false }))
    );
    glyph.position.z = 0.17 - 0.03 + 0.004;
    button.add(glyph);

    place(button, faceCenter.x + spec.dx * 0.64, faceCenter.y + spec.dy * 0.64, 0);
    const part = addPart(spec.name, button, {
      ex: [spec.dx * 0.6, spec.dy * 0.6, 3.1 + index * 0.18],
      rot: [0.15 * spec.dy, -0.15 * spec.dx, 0.2],
      delay: 0.08 + index * 0.04,
      note: index,
    });
    part.cap = cap;
    part.pressDepth = 0.075;
    cap.userData.part = part;
    pressables.push(cap);
    faceParts.push(part);
  });

  // ---------- Croix directionnelle ----------
  const dpad = new THREE.Group();
  const dpadRing = new THREE.Mesh(track(new THREE.TorusGeometry(0.86, 0.04, 12, 64)), darkMetal);
  dpadRing.position.z = 0.012;
  dpad.add(dpadRing);
  const dpadPlate = new THREE.Mesh(track(new THREE.CircleGeometry(0.84, 48)), blackGloss);
  dpadPlate.position.z = 0.004;
  dpad.add(dpadPlate);
  const dpadGeo = track(
    (() => {
      const geometry = smoothExtrude(crossShape(), {
        depth: 0.08,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.05,
        bevelSegments: 6,
        curveSegments: 12,
      });
      geometry.computeVertexNormals();
      return geometry;
    })()
  );
  const dpadMat = track(
    new THREE.MeshPhysicalMaterial({
      color: 0x20202b,
      roughness: 0.34,
      metalness: 0.1,
      clearcoat: 0.9,
      clearcoatRoughness: 0.15,
      emissive: COLORS.violet,
      emissiveIntensity: 0,
    })
  );
  const dpadCross = new THREE.Mesh(dpadGeo, dpadMat);
  dpadCross.position.z = 0.03;
  dpad.add(dpadCross);
  // Petites flèches
  const arrowShape = new THREE.Shape();
  arrowShape.moveTo(0, 0.07);
  arrowShape.lineTo(0.07, -0.05);
  arrowShape.lineTo(-0.07, -0.05);
  arrowShape.closePath();
  const arrowGeo = track(new THREE.ShapeGeometry(arrowShape));
  const arrowMat = track(new THREE.MeshBasicMaterial({ color: COLORS.violet, toneMapped: false }));
  [0, 1, 2, 3].forEach((i) => {
    const arrow = new THREE.Mesh(arrowGeo, arrowMat);
    const a = (i * Math.PI) / 2;
    arrow.position.set(-Math.sin(a) * 0.58, Math.cos(a) * 0.58, 0.152);
    arrow.rotation.z = a;
    dpad.add(arrow);
  });
  place(dpad, -2.12, 0.42, 0);
  const dpadPart = addPart("dpad", dpad, { ex: [-0.5, 0.2, 2.9], rot: [0.1, 0.1, 0], delay: 0.1, note: 4 });
  dpadPart.cap = dpadCross;
  dpadPart.pressDepth = 0.03;
  dpadCross.userData.part = dpadPart;
  pressables.push(dpadCross);

  // ---------- Sticks ----------
  const sticks = [-1, 1].map((side, i) => {
    const stick = new THREE.Group();
    const well = new THREE.Mesh(track(new THREE.TorusGeometry(0.5, 0.05, 14, 56)), darkMetal);
    well.position.z = 0.014;
    stick.add(well);
    const cup = new THREE.Mesh(track(new THREE.CircleGeometry(0.5, 48)), blackGloss);
    cup.position.z = 0.006;
    stick.add(cup);

    const tilter = new THREE.Group();
    stick.add(tilter);
    const stem = new THREE.Mesh(track(new THREE.CylinderGeometry(0.13, 0.17, 0.3, 24)), darkMetal);
    stem.rotation.x = Math.PI / 2;
    stem.position.z = 0.15;
    tilter.add(stem);
    const capMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x20202b,
        roughness: 0.9,
        emissive: COLORS.violet,
        emissiveIntensity: 0,
      })
    );
    const cap = new THREE.Mesh(track(new THREE.LatheGeometry(capProfile(0.38, 0.2, 0.07, 0.07), 48)), capMat);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.28;
    tilter.add(cap);
    const rim = new THREE.Mesh(
      track(new THREE.TorusGeometry(0.335, 0.014, 8, 56)),
      track(new THREE.MeshBasicMaterial({ color: COLORS.violet, toneMapped: false }))
    );
    rim.position.z = 0.28 + 0.2 - 0.02;
    tilter.add(rim);

    place(stick, side * 1.1, -0.2, 0);
    const part = addPart(side < 0 ? "stick-left" : "stick-right", stick, {
      ex: [side * 0.7, -0.6, 3.9 + i * 0.15],
      rot: [0.2, 0, 0],
      delay: 0.14 + i * 0.05,
      note: 5 + i,
    });
    part.tilter = tilter;
    part.cap = cap;
    part.pressDepth = 0.06;
    cap.userData.part = part;
    pressables.push(cap);
    return part;
  });

  // ---------- Écran central ----------
  const screen = createScreen();
  track(screen.texture);
  const display = new THREE.Group();
  const bezel = new THREE.Mesh(
    track(
      smoothExtrude(roundedRect(1.98, 0.8, 0.14), {
        depth: 0.04,
        bevelEnabled: true,
        bevelThickness: 0.03,
        bevelSize: 0.03,
        bevelSegments: 4,
        curveSegments: 10,
      })
    ),
    blackGloss
  );
  bezel.geometry.computeVertexNormals();
  display.add(bezel);
  const panel = new THREE.Mesh(
    track(new THREE.PlaneGeometry(1.76, 0.6)),
    track(new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false }))
  );
  panel.position.z = 0.072;
  display.add(panel);
  place(display, 0, 0.6, 0);
  addPart("screen", display, { ex: [0, 0.7, 2.3], rot: [-0.1, 0, 0], delay: 0.05 });

  // ---------- Petits boutons centraux ----------
  [-1, 1].forEach((side) => {
    const pill = new THREE.Mesh(
      track(new THREE.CapsuleGeometry(0.06, 0.22, 6, 14)),
      track(new THREE.MeshPhysicalMaterial({ color: 0x3a3a4c, roughness: 0.3, clearcoat: 0.8 }))
    );
    pill.rotation.z = Math.PI / 2 + side * 0.4;
    const holder = new THREE.Group();
    holder.add(pill);
    place(holder, side * 0.55, -0.34, 0.02);
    addPart(side < 0 ? "pill-left" : "pill-right", holder, { ex: [side * 0.3, -0.4, 1.9], delay: 0.2 });
  });

  // ---------- Gâchettes supérieures ----------
  const bumpers = [-1, 1].map((side, i) => {
    const bumperGeo = track(new RoundedBoxGeometry(1.5, 0.3, 0.68, 6, 0.13));
    const bumperMat = track(satin.clone());
    bumperMat.emissive = new THREE.Color(COLORS.violet);
    bumperMat.emissiveIntensity = 0;
    const bumper = new THREE.Mesh(bumperGeo, bumperMat);
    const holder = new THREE.Group();
    holder.add(bumper);
    const accent = new THREE.Mesh(
      track(new RoundedBoxGeometry(1.0, 0.025, 0.04, 2, 0.01)),
      track(new THREE.MeshBasicMaterial({ color: COLORS.violet, toneMapped: false }))
    );
    accent.position.set(0, 0.155, 0.12);
    holder.add(accent);
    holder.position.set(side * 2.5, 1.78, 0.02);
    holder.rotation.z = -side * 0.19;
    const part = addPart(side < 0 ? "bumper-left" : "bumper-right", holder, {
      ex: [side * 0.7, 1.5, 1.7],
      rot: [0, 0, -side * 0.15],
      delay: 0.16 + i * 0.04,
      note: 7 + i,
    });
    part.cap = bumper;
    part.pressAxis = "bumper";
    bumper.userData.part = part;
    pressables.push(bumper);
    return part;
  });

  const triggerMat = satin;
  [-1, 1].forEach((side, i) => {
    const trigger = new THREE.Mesh(track(new RoundedBoxGeometry(1.2, 0.56, 0.6, 6, 0.2)), triggerMat);
    trigger.position.set(side * 2.55, 1.46, -0.72);
    trigger.rotation.set(-0.5, 0, -side * 0.28);
    addPart(side < 0 ? "trigger-left" : "trigger-right", trigger, {
      ex: [side * 0.6, 0.9, -2.6],
      rot: [-0.2, 0, 0],
      delay: 0.22 + i * 0.04,
    });
  });

  // ---------- Barre lumineuse ----------
  const barMat = track(new THREE.MeshBasicMaterial({ color: COLORS.violet, toneMapped: false }));
  const lightbar = new THREE.Mesh(track(new RoundedBoxGeometry(2.7, 0.07, 0.07, 3, 0.025)), barMat);
  place(lightbar, 0, 1.22, 0.03);
  const glowTex = track(radialTexture());
  const glowSprite = new THREE.Sprite(
    track(
      new THREE.SpriteMaterial({
        map: glowTex,
        color: COLORS.violet,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    )
  );
  glowSprite.scale.set(4.2, 1.1, 1);
  glowSprite.position.set(0, 0, 0.1);
  lightbar.add(glowSprite);
  addPart("lightbar", lightbar, { ex: [0, 1.7, 1.2], delay: 0.1 });

  // Port USB-C
  const usb = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.07, 0.38, 6, 12)), blackGloss);
  usb.rotation.z = Math.PI / 2;
  const usbHolder = new THREE.Group();
  usbHolder.add(usb);
  usbHolder.position.set(0, 1.74, 0.05);
  addPart("usb", usbHolder, { ex: [0, 2.1, 0.6], delay: 0.3 });

  // ---------- Repère d'axes de l'objet (visible en vue éclatée) ----------
  const gizmo = new THREE.Group();
  const gizmoMats = [];
  [
    { axis: [1, 0, 0], color: 0xff5470, letter: "X" },
    { axis: [0, 1, 0], color: COLORS.mint, letter: "Y" },
    { axis: [0, 0, 1], color: COLORS.sky, letter: "Z" },
  ].forEach(({ axis, color, letter }) => {
    const mat = track(new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
    gizmoMats.push(mat);
    const dir = new THREE.Vector3(...axis);
    const line = new THREE.Line(
      track(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), dir.clone().multiplyScalar(5.4)])),
      mat
    );
    gizmo.add(line);
    const spriteMat = track(
      new THREE.SpriteMaterial({
        map: track(labelTexture(letter, `#${new THREE.Color(color).getHexString()}`)),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })
    );
    gizmoMats.push(spriteMat);
    const label = new THREE.Sprite(spriteMat);
    label.scale.set(0.5, 0.5, 1);
    label.position.copy(dir.clone().multiplyScalar(5.75));
    gizmo.add(label);
  });
  gizmo.position.set(0, -0.2, -1.4);
  group.add(gizmo);

  // Segments pointillés reliant chaque pièce éclatée à sa position d'origine
  const leaderMat = track(
    new THREE.LineBasicMaterial({ color: COLORS.violet, transparent: true, opacity: 0, depthWrite: false })
  );
  const leaderGeo = track(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 1, 1)]));
  const leaders = parts
    .filter((part) => !["usb", "pill-left", "pill-right"].includes(part.name))
    .map((part) => {
      const line = new THREE.Line(leaderGeo, leaderMat);
      line.position.copy(part.home);
      group.add(line);
      return { part, line };
    });

  // ---------- Mise à jour ----------
  const tmpQuat = new THREE.Quaternion();
  const tmpEuler = new THREE.Euler();
  const zAxis = new THREE.Vector3(0, 0, 1);

  const setExplode = (value) => {
    parts.forEach((part) => {
      const k = easeOut(clamp((value - part.delay) / (1 - part.delay)));
      part.object.position.copy(part.home).addScaledVector(part.ex, k);
      tmpEuler.set(part.exRot.x * k, part.exRot.y * k, part.exRot.z * k);
      tmpQuat.setFromEuler(tmpEuler);
      part.object.quaternion.copy(part.baseQuat).multiply(tmpQuat);
    });
    leaders.forEach(({ part, line }) => {
      const k = easeOut(clamp((value - part.delay) / (1 - part.delay)));
      line.scale.set(part.ex.x * k, part.ex.y * k, part.ex.z * k);
      line.visible = k > 0.01;
    });
    leaderMat.opacity = clamp(value * 1.4) * 0.55;
    outlineMat.opacity = clamp(value * 1.2) * 0.9;
    gizmoMats.forEach((m) => {
      m.opacity = clamp(value * 1.3) * 0.85;
    });
    gizmo.visible = value > 0.01;
  };

  const update = (dt, time, { explode, highlight }) => {
    const ease = 1 - Math.exp(-dt * 14);
    parts.forEach((part) => {
      const target = part.hoverTarget || (highlight && part.name.startsWith(highlight) ? 1 : 0);
      part.hover += (target - part.hover) * ease;
      part.press = Math.max(0, part.press - dt * 4.2);
      part.tilt.lerp(part.tiltTarget, ease);
    });

    setExplode(explode);

    // Retour d'effort : enfoncement, inclinaison des sticks et de la croix, lueur au survol
    parts.forEach((part) => {
      const depth = part.press * (part.pressDepth || 0);
      if (depth) {
        const local = zAxis.clone().applyQuaternion(part.object.quaternion).multiplyScalar(-depth);
        part.object.position.add(local);
      }
      if (part.tilter) {
        part.tilter.rotation.set(-part.tilt.y * 0.34, part.tilt.x * 0.34, 0);
      }
      if (part.name === "dpad") {
        part.object.rotateX(-part.tilt.y * 0.16);
        part.object.rotateY(part.tilt.x * 0.16);
      }
      if (part.pressAxis === "bumper") {
        part.object.rotation.x += part.press * 0.22;
      }
    });

    // Les pièces survolées ou pressées brillent
    parts.forEach((part) => {
      const material = part.cap && part.cap.material;
      if (!material) return;
      material.emissiveIntensity = (part.name.startsWith("face") ? 0.02 : 0) + part.hover * 0.55 + part.press * 0.9;
    });

    barMat.color.setHex(COLORS.violet).multiplyScalar(0.8 + Math.sin(time * 2.2) * 0.2 + 0.4);
    glowSprite.material.opacity = 0.42 + Math.sin(time * 2.2) * 0.1 + explode * 0.2;
    screen.tick(time);
  };

  const dispose = () => {
    disposables.forEach((resource) => resource.dispose && resource.dispose());
  };

  return {
    root,
    group,
    parts,
    pressables,
    faceParts,
    sticks,
    bumpers,
    screen,
    update,
    dispose,
    anchors: {
      face: faceParts[1].object,
      dpad,
      sticks: sticks[1].object,
      screen: display,
      bumpers: bumpers[1].object,
    },
  };
}
