import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { gsap } from "../motion";
import { subscribePerf } from "../perf";
import { playNote, getAudioLevel } from "../sound";
import { buildField, buildName, MODEL_WIDTH, STACK_GROUPS, SHAPE_PULSE } from "./fieldData";

const FOV = 38;
const DIST = 16;
const FIELDS = ["nx", "ny", "size", "rx", "ry", "rz", "show", "flow", "query", "aurora"];
const INTERACTIVE = 'a, button, input, textarea, select, summary, [role="button"]';
const PROBE_RADIUS = 110; // px autour du curseur
const QUERY_RADIUS = 0.2; // rayon de la « requête », en coordonnées d'écran normalisées (hauteur = 2)
const ROUND = { sphere: 1 }; // formes qui tournent sur elles-mêmes (les autres restent de face)
// Pose du nuage dans le hero selon la forme du moment : [décalage x, décalage y (fractions de l'écran), échelle].
// La sphère passe derrière le nom ; les formes filaires glissent dessous pour rester lisibles.
// La forme « name » n'a pas de pose fixe : elle se cale sur la boîte des lettres du titre (voir update).
const HERO_POSE = {
  sphere: [0, 0, 1],
  network: [-0.005, 0.155, 0.74],
  browser: [-0.005, 0.165, 0.82],
  pad: [-0.005, 0.165, 0.86],
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// ---------------------------------------------------------------------------------------------
// Simulation : une position et une vitesse par point, stockées dans des textures (GPGPU)
// ---------------------------------------------------------------------------------------------

// Champ de turbulence sans divergence (rotationnel d'un potentiel de sinusoïdes) : les points tourbillonnent
// sans jamais s'amasser. Dérivées écrites à la main : une vingtaine d'opérations trigonométriques par point,
// contre 18 évaluations de bruit de simplexe pour un rotationnel par différences finies.
const NOISE = `
vec3 curlOctave(vec3 p, vec3 t, float f) {
  vec3 q = p * f;
  float sy = sin(q.y * 1.7 + t.x);
  float cy = cos(q.y * 1.7 + t.x);
  float sz = sin(q.z * 1.3 - t.y);
  float cz = cos(q.z * 1.3 - t.y);
  float sx = sin(q.x * 1.1 - t.y);
  float cx = cos(q.x * 1.1 - t.y);
  float s2 = sin(q.z * 1.5 + t.z);
  float c2 = cos(q.z * 1.5 + t.z);
  float s3 = sin(q.y * 1.6 + t.z);
  float c3 = cos(q.y * 1.6 + t.z);
  float s4 = sin(q.x * 1.9 + t.x);
  float c4 = cos(q.x * 1.9 + t.x);
  // A = (sin(y)cos(z), sin(z')cos(x'), sin(x)cos(y')) ; rotationnel dérivé analytiquement
  float x = -sx * s3 * 1.6 - c2 * c4 * 1.5;
  float y = -sy * sz * 1.3 - cx * c3 * 1.1;
  float z = -s2 * s4 * 1.9 - cy * cz * 1.7;
  return vec3(x, y, z) * f;
}

vec3 curlNoise(vec3 p, float time) {
  vec3 t = vec3(time * 0.9, time * 0.7, time * 0.8);
  vec3 v = curlOctave(p, t, 0.45) + curlOctave(p + vec3(7.3, -3.1, 5.2), t * 1.7 + 2.0, 1.15) * 0.45;
  return normalize(v + vec3(1e-5));
}
`;

// Vitesse : ressort vers la forme visée + amortissement + turbulence + curseur + onde du clic.
// w = paramètre de la forme (impulsions lumineuses), transmis à la position.
const VELOCITY = `
uniform sampler2D tA;
uniform sampler2D tB;
uniform sampler2D tSeed;
uniform float uDt;
uniform float uTime;
uniform float uBlend;
uniform float uBuild;
uniform float uFlow;
uniform float uBurst;
uniform float uSwirl;
uniform float uPulse;
uniform float uBeat;
uniform vec3 uPointer;
uniform vec3 uPointerVel;
uniform vec3 uToCamera;
uniform float uPointerRadius;
uniform float uPointerForce;

${NOISE}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);
  vec4 vel = texture2D(textureVelocity, uv);
  vec4 seed = texture2D(tSeed, uv);
  vec4 a = texture2D(tA, uv);
  vec4 b = texture2D(tB, uv);

  // Forme visée : fondu de a vers b, chaque point part avec son propre retard
  float delay = seed.x * 0.42;
  float local = clamp((uBlend - delay) / (1.0 - delay), 0.0, 1.0);
  float s = local * local * (3.0 - 2.0 * local);
  vec3 target = mix(a.xyz, b.xyz, s);
  float param = s < 0.5 ? a.w : b.w;

  // Ressort : raideur et amortissement propres à chaque point (dépassement organique)
  float k = mix(4.0, 9.5, seed.z);
  float zeta = mix(0.5, 0.92, seed.w);
  float c = 2.0 * zeta * sqrt(k);
  float grip = smoothstep(seed.y * 0.5, seed.y * 0.5 + 0.35, uBuild);
  vec3 acc = k * grip * (target - pos.xyz) - c * vel.xyz;

  // Turbulence
  vec3 curl = curlNoise(pos.xyz, uTime * 0.2);
  acc += curl * (uFlow * 6.5 + uBurst * 15.0) * (0.35 + seed.w * 0.9);

  // Entrée : le bruit se resserre en spirale autour de l'axe vertical
  float tighten = uSwirl * grip * (1.0 - grip) * 4.0;
  acc += vec3(pos.z, 0.0, -pos.x) * tighten * 1.6;

  // Curseur : les points proches sont repoussés, attirés vers la caméra et entraînés dans son sillage
  vec3 dp = pos.xyz - uPointer;
  float r = length(dp);
  float f = smoothstep(uPointerRadius, 0.0, r) * uPointerForce;
  acc += (dp / max(r, 0.001)) * f * 7.0;
  acc += uToCamera * f * 9.0;
  acc += uPointerVel * f * 0.9;

  // Clic : une onde part du centre
  float rr = length(pos.xyz);
  float dr = (rr - uPulse * 10.0) * 0.7;
  float wave = exp(-dr * dr) * smoothstep(0.0, 0.05, uPulse) * (1.0 - uPulse);
  acc += (pos.xyz / max(rr, 0.001)) * (wave * 70.0 + uBeat * 6.0);

  vec3 v = vel.xyz + acc * uDt;
  float speed = length(v);
  if (speed > 30.0) v *= 30.0 / speed;
  gl_FragColor = vec4(v, param);
}
`;

const POSITION = `
uniform float uDt;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 pos = texture2D(texturePosition, uv);
  vec4 vel = texture2D(textureVelocity, uv);
  gl_FragColor = vec4(pos.xyz + vel.xyz * uDt, vel.w);
}
`;

// ---------------------------------------------------------------------------------------------
// Rendu : un point par particule, lu dans les textures de la simulation
// ---------------------------------------------------------------------------------------------

const POINT_VERTEX = `
uniform sampler2D tPos;
uniform sampler2D tVel;
uniform float uTime;
uniform float uOpacity;
uniform float uSize;
uniform float uPixel;
uniform float uFocus;
uniform float uFocusMix;
uniform float uQuery;
uniform float uAspect;
uniform float uWarp;
uniform float uScrollVel;
uniform float uPulseMode;
uniform float uBeat;
uniform vec2 uPointer;
uniform vec2 uDepth; // distance caméra → centre du nuage, demi-épaisseur du nuage (unités du monde)
uniform vec2 uRes;   // taille de l'écran en pixels CSS

attribute vec2 aRef;
attribute vec4 aSeed;
attribute vec4 aMeta;

varying float vAlpha;
varying float vMint;
varying float vHot;
varying float vStretch;
varying vec2 vDir;

void main() {
  vec4 pp = texture2D(tPos, aRef);
  vec3 p = pp.xyz;
  float param = pp.w;
  vec3 vel = texture2D(tVel, aRef).xyz;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;

  // Requête : les points proches du curseur (à l'écran) passent à la menthe
  vec2 dv = (ndc - uPointer) * vec2(uAspect, 1.0);
  float near = uQuery > 0.0 ? 1.0 - smoothstep(0.0, uQuery, length(dv)) : 0.0;
  near *= near;
  mv.z += near * 0.4;
  gl_Position = projectionMatrix * mv;

  // Vitesse à l'écran (px) : étire le point dans le sens du mouvement. Le scroll et le « saut » y ajoutent la leur.
  vec4 c1 = projectionMatrix * (modelViewMatrix * vec4(p + vel * 0.05, 1.0));
  vec2 sv = (c1.xy / c1.w - ndc) * 0.5 * uRes;
  sv.y += uScrollVel * 44.0;
  sv += (ndc / max(length(ndc), 0.05)) * uWarp * length(ndc) * 170.0;
  float speed = length(sv);
  vDir = speed > 0.01 ? sv / speed : vec2(1.0, 0.0);
  vStretch = 1.0 + clamp(speed / 16.0, 0.0, 4.0);

  // Impulsions : un balayage qui descend dans la fenêtre, des paquets qui parcourent les liaisons du réseau
  float pulse = 0.0;
  if (param >= 0.0) {
    if (uPulseMode > 1.5) {
      float edge = floor(param);
      float phase = fract(uTime * 0.2 + fract(sin(edge * 12.9898) * 43758.5453));
      float d = fract(param) - phase;
      d -= floor(d + 0.5);
      pulse = exp(-d * d * 150.0);
    } else if (uPulseMode > 0.5) {
      float d = param - fract(uTime * 0.2);
      d -= floor(d + 0.5);
      pulse = exp(-d * d * 220.0);
    }
  }

  // Grappe éclairée par l'index des projets : les autres s'effacent
  float hasFocus = step(-0.5, uFocus);
  float isF = hasFocus * (1.0 - step(0.5, abs(aMeta.x - uFocus)));
  float focus = isF * uFocusMix;
  float dim = hasFocus * uFocusMix * (1.0 - isF);
  float label = aMeta.z;

  // Profondeur : -1 devant le centre du nuage, +1 derrière. L'avant brille, l'arrière s'efface.
  float zn = clamp((-mv.z - uDepth.x) / uDepth.y, -1.0, 1.0);
  float facing = 1.0 - 0.74 * smoothstep(-0.7, 1.0, zn);

  float twinkle = 0.84 + 0.16 * sin(uTime * (1.2 + aSeed.y * 2.0) + aSeed.x * 6.2831);
  float size = uSize * (0.7 + aSeed.y * 0.9) * (1.12 - 0.26 * zn);
  size *= 1.0 + near * 1.5 + focus * 0.9 + label * 1.1 + pulse * 1.0 + uBeat * 0.5;
  float grow = 1.0 + (vStretch - 1.0) * 0.55;
  gl_PointSize = clamp(size * grow * uPixel * (14.0 / -mv.z), 1.0, 48.0);

  vAlpha = uOpacity * twinkle * facing * (1.0 - 0.65 * dim) * (1.0 + focus * 0.9 + pulse * 1.6) / sqrt(grow);
  vMint = clamp(near + focus * 0.9 + pulse * 0.85, 0.0, 1.0);
  vHot = label;
}
`;

const POINT_FRAGMENT = `
uniform vec3 uTint;
uniform float uTintMix;
varying float vAlpha;
varying float vMint;
varying float vHot;
varying float vStretch;
varying vec2 vDir;

void main() {
  // Le point est une ellipse allongée dans le sens du mouvement (l'axe y de gl_PointCoord est inversé)
  vec2 c = gl_PointCoord - 0.5;
  vec2 dir = vec2(vDir.x, -vDir.y);
  vec2 q = vec2(dot(c, dir), dot(c, vec2(-dir.y, dir.x)));
  float grow = 1.0 + (vStretch - 1.0) * 0.55;
  float d = length(vec2(q.x, q.y * grow));
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.0, d);
  float a = pow(core, 1.35) * vAlpha;
  // La couleur du monde en cours (acte du hero) remplace le violet et teinte le cœur clair des points
  vec3 violet = mix(vec3(0.62, 0.34, 0.98), uTint, uTintMix);
  vec3 pale = mix(vec3(0.93, 0.88, 1.0), mix(uTint, vec3(1.0), 0.7), uTintMix);
  vec3 mint = vec3(0.39, 0.90, 0.75);
  vec3 col = mix(violet, pale, smoothstep(0.35, 1.0, core) * (0.4 + 0.4 * vHot));
  col = mix(col, mint, vMint);
  gl_FragColor = vec4(col, a);
}
`;

// ---------------------------------------------------------------------------------------------
// Post-traitement : halo (bloom), aberration chromatique, grain
// ---------------------------------------------------------------------------------------------

const QUAD_VERTEX = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const BRIGHT = `
uniform sampler2D tMap;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tMap, vUv).rgb;
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(0.35, 0.9, l), 1.0);
}
`;

const BLUR = `
uniform sampler2D tMap;
uniform vec2 uDir;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tMap, vUv).rgb * 0.2270270270;
  c += texture2D(tMap, vUv + uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tMap, vUv - uDir * 1.3846153846).rgb * 0.3162162162;
  c += texture2D(tMap, vUv + uDir * 3.2307692308).rgb * 0.0702702703;
  c += texture2D(tMap, vUv - uDir * 3.2307692308).rgb * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}
`;

const COMPOSITE = `
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform vec2 uRes;
uniform float uCA;
uniform float uBloom;
uniform float uTime;
varying vec2 vUv;
void main() {
  vec2 c = vUv - 0.5;
  vec2 off = c * uCA * (0.35 + length(c) * 1.3);
  vec3 col = vec3(texture2D(tScene, vUv + off).r, texture2D(tScene, vUv).g, texture2D(tScene, vUv - off).b);
  col += texture2D(tBloom, vUv).rgb * uBloom;
  float n = fract(sin(dot(vUv * uRes + fract(uTime), vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) * 0.01 * smoothstep(0.0, 0.2, max(col.r, max(col.g, col.b)));
  col = max(col, 0.0);
  float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}
`;

// Nuage de points : un « espace latent » piloté par le scroll, simulé sur le GPU.
// getKeys() renvoie les poses clés (section + fraction + forme + position) ;
// onProject() reçoit à chaque image la position écran des centres de la constellation ;
// onProbe() reçoit le point étiqueté le plus proche du curseur.
export async function createField({ host, getKeys, onProject, onProbe, reduced = false, onFrame, getNameBox }) {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  // En développement, ?side=64 force la taille de la simulation (test de performance)
  const forced = process.env.NODE_ENV === "development" ? Number(new URLSearchParams(window.location.search).get("side")) : 0;
  const side = forced || (coarse ? 128 : 256);

  // Les lettres du nom sont échantillonnées dans la police du titre : on l'attend (au plus 1,5 s)
  if (document.fonts && document.fonts.load) {
    await Promise.race([
      document.fonts.load('800 64px "Bricolage Grotesque Variable"').catch(() => {}),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  }
  let nameLines = (getNameBox && getNameBox() && getNameBox().lines) || 1;
  const data = buildField(side, { nameLines });

  const canvas = document.createElement("canvas");
  canvas.className = "stage__canvas";
  host.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    host.removeChild(canvas);
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  // Les textures de simulation exigent le rendu en virgule flottante (sinon : pas de nuage)
  const floatTargets = renderer.extensions.has("EXT_color_buffer_float");
  const halfTargets = floatTargets || renderer.extensions.has("EXT_color_buffer_half_float");
  if (!halfTargets) {
    renderer.dispose();
    host.removeChild(canvas);
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, DIST);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  // ---------- Formes visées (une texture par forme) ----------
  const textures = {};
  Object.entries(data.shapes).forEach(([name, array]) => {
    const texture = new THREE.DataTexture(array, side, side, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.needsUpdate = true;
    textures[name] = texture;
  });
  const seedTexture = new THREE.DataTexture(data.seed, side, side, THREE.RGBAFormat, THREE.FloatType);
  seedTexture.minFilter = THREE.NearestFilter;
  seedTexture.magFilter = THREE.NearestFilter;
  seedTexture.needsUpdate = true;

  // ---------- Simulation ----------
  const gpu = new GPUComputationRenderer(side, side, renderer);
  gpu.setDataType(floatTargets ? THREE.FloatType : THREE.HalfFloatType);
  const startShape = data.shapes[reduced ? "sphere" : "noise"];
  const initialPos = gpu.createTexture();
  initialPos.image.data.set(startShape);
  const initialVel = gpu.createTexture();
  const velocityVar = gpu.addVariable("textureVelocity", VELOCITY, initialVel);
  const positionVar = gpu.addVariable("texturePosition", POSITION, initialPos);
  gpu.setVariableDependencies(velocityVar, [velocityVar, positionVar]);
  gpu.setVariableDependencies(positionVar, [velocityVar, positionVar]);

  const sim = velocityVar.material.uniforms;
  Object.assign(sim, {
    tA: { value: textures.sphere },
    tB: { value: textures.sphere },
    tSeed: { value: seedTexture },
    uDt: { value: 0.016 },
    uTime: { value: 0 },
    uBlend: { value: 0 },
    uBuild: { value: reduced ? 1 : 0 },
    uFlow: { value: 0.1 },
    uBurst: { value: 0 },
    uSwirl: { value: 1 },
    uPulse: { value: 0 },
    uBeat: { value: 0 },
    uPointer: { value: new THREE.Vector3() },
    uPointerVel: { value: new THREE.Vector3() },
    uToCamera: { value: new THREE.Vector3(0, 0, 1) },
    uPointerRadius: { value: 1 },
    uPointerForce: { value: 0 },
  });
  positionVar.material.uniforms.uDt = sim.uDt;

  if (gpu.init() !== null) {
    renderer.dispose();
    host.removeChild(canvas);
    return null;
  }

  // ---------- Points ----------
  const count = data.count;
  const refs = new Float32Array(count * 2);
  for (let i = 0; i < count; i += 1) {
    refs[i * 2] = ((i % side) + 0.5) / side;
    refs[i * 2 + 1] = (Math.floor(i / side) + 0.5) / side;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aRef", new THREE.BufferAttribute(refs, 2));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(data.seed, 4));
  geometry.setAttribute("aMeta", new THREE.BufferAttribute(data.meta, 4));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);

  const baseSize = coarse ? 3.2 : 2.5;
  const uniforms = {
    tPos: { value: null },
    tVel: { value: null },
    uTime: { value: 0 },
    uOpacity: { value: 0 },
    uSize: { value: baseSize },
    uPixel: { value: 1 },
    uFocus: { value: -1 },
    uFocusMix: { value: 0 },
    uQuery: { value: 0 },
    uAspect: { value: 1 },
    uWarp: { value: 0 },
    uScrollVel: { value: 0 },
    uPulseMode: { value: 0 },
    uBeat: { value: 0 },
    uTint: { value: new THREE.Vector3(0.62, 0.34, 0.98) },
    uTintMix: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uDepth: { value: new THREE.Vector2(DIST, 3) },
    uRes: { value: new THREE.Vector2(1, 1) },
  };
  const material = new THREE.ShaderMaterial({
    vertexShader: POINT_VERTEX,
    fragmentShader: POINT_FRAGMENT,
    uniforms,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  // Repères dans le repère du nuage : centres de la constellation (annotations)
  const anchors = {};
  STACK_GROUPS.forEach(({ id, center }) => {
    const anchor = new THREE.Object3D();
    anchor.position.set(center[0], center[1], center[2]);
    group.add(anchor);
    anchors[id] = anchor;
  });

  // ---------- Post-traitement ----------
  const post = {
    enabled: true,
    rtScene: new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: false }),
    rtA: new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: false }),
    rtB: new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: false }),
  };
  const makePass = (fragmentShader, extra) =>
    new FullScreenQuad(
      new THREE.ShaderMaterial({
        vertexShader: QUAD_VERTEX,
        fragmentShader,
        uniforms: extra,
        depthTest: false,
        depthWrite: false,
      })
    );
  const brightPass = makePass(BRIGHT, { tMap: { value: null } });
  const blurPass = makePass(BLUR, { tMap: { value: null }, uDir: { value: new THREE.Vector2() } });
  const compositePass = makePass(COMPOSITE, {
    tScene: { value: null },
    tBloom: { value: null },
    uRes: { value: new THREE.Vector2(1, 1) },
    uCA: { value: 0 },
    uBloom: { value: 0.9 },
    uTime: { value: 0 },
  });

  // ---------- Dimensions ----------
  let W = 1;
  let H = 1;
  let dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
  let drawCount = count;

  const sizeTargets = () => {
    const w = Math.max(2, Math.floor(W * dpr));
    const h = Math.max(2, Math.floor(H * dpr));
    post.rtScene.setSize(w, h);
    const bw = Math.max(64, Math.floor(w / 4));
    const bh = Math.max(64, Math.floor(h / 4));
    post.rtA.setSize(bw, bh);
    post.rtB.setSize(bw, bh);
    post.rtA.texture.minFilter = post.rtA.texture.magFilter = THREE.LinearFilter;
    post.rtB.texture.minFilter = post.rtB.texture.magFilter = THREE.LinearFilter;
    post.rtScene.texture.minFilter = post.rtScene.texture.magFilter = THREE.LinearFilter;
  };

  // ---------- Poses clés pilotées par le scroll ----------
  let table = [];
  let keysSource = getKeys;
  const measure = () => {
    const vh = window.innerHeight;
    table = keysSource()
      .filter((k) => k.section)
      .map((k) => {
        const rect = k.section.getBoundingClientRect();
        return { ...k, at: rect.top + window.scrollY + k.f * rect.height - vh / 2 };
      })
      .sort((a, b) => a.at - b.at);

    // Le titre passe sur deux lignes sur mobile : la forme « name » en fait autant
    const box = getNameBox && getNameBox();
    if (box && box.lines !== nameLines) rebuildName(box.lines);
  };

  const rebuildName = (lines) => {
    nameLines = lines;
    const next = buildName(count, lines);
    data.shapes.name = next;
    textures.name.image.data.set(next);
    textures.name.needsUpdate = true;
  };

  const keyInto = (k, out) => {
    if (k.anchor) {
      const r = k.anchor.getBoundingClientRect();
      out.nx = (r.left + r.width / 2) / W;
      out.ny = (r.top + r.height / 2) / H;
      out.size = (r.width / W) * (k.sizeMul || 1);
    } else {
      out.nx = k.x;
      out.ny = k.y;
      out.size = k.size;
    }
    out.rx = k.rot[0];
    out.ry = k.rot[1];
    out.rz = k.rot[2];
    out.show = k.show;
    out.flow = k.flow;
    out.query = k.query;
    out.aurora = k.aurora === undefined ? 0.4 : k.aurora;
  };

  const makeState = () => ({ nx: 0.7, ny: 0.5, size: 0.5, rx: 0, ry: 0, rz: 0, show: 0, flow: 0.1, query: 1, aurora: 0.4 });
  const cur = makeState();
  const tgt = makeState();
  const keyA = makeState();
  const keyB = makeState();
  const FALLBACK = { shape: "hero", x: 0.7, y: 0.5, size: 0.45, rot: [0.2, 0, 0], show: 1, flow: 0.1, query: 1 };
  const seg = { a: "hero", b: "hero", t: 0 };

  const sampleInto = (s, out) => {
    const n = table.length;
    if (n === 0) {
      keyInto(FALLBACK, out);
      seg.a = FALLBACK.shape;
      seg.b = FALLBACK.shape;
      seg.t = 0;
      return;
    }
    if (s <= table[0].at) {
      keyInto(table[0], out);
      seg.a = table[0].shape;
      seg.b = table[0].shape;
      seg.t = 0;
      return;
    }
    if (s >= table[n - 1].at) {
      keyInto(table[n - 1], out);
      seg.a = table[n - 1].shape;
      seg.b = table[n - 1].shape;
      seg.t = 0;
      return;
    }
    let i = 0;
    while (i < n - 2 && s >= table[i + 1].at) i += 1;
    const a = table[i];
    const b = table[i + 1];
    const t = easeInOut(clamp((s - a.at) / (b.at - a.at || 1)));
    keyInto(a, keyA);
    keyInto(b, keyB);
    for (let f = 0; f < FIELDS.length; f += 1) {
      const name = FIELDS[f];
      out[name] = keyA[name] + (keyB[name] - keyA[name]) * t;
    }
    seg.a = a.shape;
    seg.b = b.shape;
    seg.t = t;
  };

  // Position écran normalisée → plan z = 0, échelle pour occuper une fraction `size` de la largeur
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const pointerPlane = new THREE.Plane();
  const texel = new THREE.Vector2();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const toPoint = new THREE.Vector3();
  const v = new THREE.Vector3();
  const halfFov = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const placement = { pos: new THREE.Vector3(), scale: 1 };

  const place = (nx, ny, size) => {
    ndc.set(nx * 2 - 1, -(ny * 2 - 1));
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(plane, hit);
    camera.getWorldDirection(forward);
    toPoint.copy(hit).sub(camera.position);
    const depth = toPoint.dot(forward);
    const worldWidth = 2 * halfFov * depth * camera.aspect;
    placement.pos.copy(hit);
    placement.scale = (size * worldWidth) / MODEL_WIDTH;
  };

  // ---------- Pointeur, onde, halo ----------
  const pointer = { nx: 0.5, ny: 0.5, sx: 0, sy: 0, px: 0, py: 0, active: false, force: 0 };
  const build = { v: reduced ? 1 : 0 };
  const pulse = { v: 0 };
  const burst = { v: 0 };
  const warp = { v: 0 };
  const focus = { index: -1, mix: 0 };
  let heroShape = "sphere";
  const heroPose = { x: 0, y: 0, s: 1 };
  let nameBlend = 0;
  let poseSnap = true;
  const tint = { rgb: [0.62, 0.34, 0.98], mix: 0 };
  const tintTarget = { rgb: [0.62, 0.34, 0.98], mix: 0 };
  let note = 0;

  const onMove = (e) => {
    if (e.pointerType === "touch") return;
    pointer.nx = e.clientX / W;
    pointer.ny = e.clientY / H;
    pointer.px = e.clientX;
    pointer.py = e.clientY;
    pointer.active = true;
  };

  const onLeave = () => {
    pointer.active = false;
  };

  // Un clic sur le nuage envoie une onde (et une note)
  const onDown = (e) => {
    if (e.button > 0 || cur.show < 0.5 || cur.query < 0.5) return;
    if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
    gsap.killTweensOf(pulse);
    pulse.v = 0.001;
    gsap.to(pulse, {
      v: 1,
      duration: 1.9,
      ease: "power1.out",
      onComplete: () => {
        pulse.v = 0;
      },
    });
    playNote(note);
    note = (note + 3) % 8;
  };

  // ---------- Dimensionnement ----------
  const resize = () => {
    const w = window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    // Barre d'adresse mobile : de petites variations de hauteur ne redimensionnent pas le canvas
    if (coarse && Math.abs(w - W) < 1 && Math.abs(h - H) < 120 && H > 1) {
      measure();
      return;
    }
    W = w;
    H = h;
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    sizeTargets();
    uniforms.uPixel.value = renderer.getPixelRatio();
    uniforms.uAspect.value = W / H;
    uniforms.uRes.value.set(W, H);
    compositePass.material.uniforms.uRes.value.set(W * dpr, H * dpr);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    measure();
  };

  // ---------- Boucle ----------
  let elapsed = 0;
  let spin = 0;
  let round = 0;
  let scrollY = window.scrollY;
  let scrollVel = 0;
  let wasVisible = false;
  let disposed = false;
  let lowStreak = 0;
  let lastProbe = "";
  let segKey = "";
  let beat = 0;
  const worldPointer = new THREE.Vector3();
  const lastWorldPointer = new THREE.Vector3();
  const localVel = new THREE.Vector3();
  const invQuat = new THREE.Quaternion();
  const frame = { show: 0, aurora: 0, points: {} };
  Object.keys(anchors).forEach((name) => {
    frame.points[name] = { x: 0, y: 0 };
  });

  const shapeOf = (name) => (name === "hero" ? heroShape : name);
  // Durées côté CPU (ms, lissées) : aide au debug via window.__field.debug()
  const stats = { compute: 0, draw: 0, update: 0 };

  const sendProbe = (state) => {
    if (!onProbe) return;
    const key = state.visible ? `${state.label}|${Math.round(state.x)}|${Math.round(state.y)}|${state.dist.toFixed(2)}` : "";
    if (key === lastProbe) return;
    lastProbe = key;
    onProbe(state);
  };

  // Rend le nuage : directement à l'écran, ou via la chaîne de post-traitement
  const draw = () => {
    if (!post.enabled) {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      return;
    }
    renderer.setRenderTarget(post.rtScene);
    renderer.clear();
    renderer.render(scene, camera);

    brightPass.material.uniforms.tMap.value = post.rtScene.texture;
    renderer.setRenderTarget(post.rtA);
    brightPass.render(renderer);

    blurPass.material.uniforms.tMap.value = post.rtA.texture;
    blurPass.material.uniforms.uDir.value.copy(texel.set(1 / post.rtA.width, 0));
    renderer.setRenderTarget(post.rtB);
    blurPass.render(renderer);
    blurPass.material.uniforms.tMap.value = post.rtB.texture;
    blurPass.material.uniforms.uDir.value.set(0, 1 / post.rtA.height);
    renderer.setRenderTarget(post.rtA);
    blurPass.render(renderer);

    const u = compositePass.material.uniforms;
    u.tScene.value = post.rtScene.texture;
    u.tBloom.value = post.rtA.texture;
    renderer.setRenderTarget(null);
    compositePass.render(renderer);
  };

  const update = (dt, rendering = true) => {
    // Vitesse de défilement (px/s, lissée) : étire les points et décale les canaux de couleur
    const dy = window.scrollY - scrollY;
    scrollY = window.scrollY;
    scrollVel += (clamp((dy / Math.max(dt, 0.001)) / (H * 3), -1, 1) - scrollVel) * (1 - Math.exp(-dt * 8));

    sampleInto(window.scrollY, tgt);
    const follow = reduced ? 1 : 1 - Math.exp(-dt * 6);
    for (let f = 0; f < FIELDS.length; f += 1) {
      const name = FIELDS[f];
      cur[name] += (tgt[name] - cur[name]) * follow;
    }

    // Formes en cours : A → B, la forme du hero dépend du rôle affiché
    const nameA = shapeOf(seg.a);
    const nameB = shapeOf(seg.b);
    const key = `${nameA}>${nameB}`;
    if (key !== segKey) {
      segKey = key;
      sim.tA.value = textures[nameA];
      sim.tB.value = textures[nameB];
      uniforms.uPulseMode.value = 0;
    }
    const blend = seg.t;
    uniforms.uPulseMode.value = SHAPE_PULSE[blend < 0.5 ? nameA : nameB] || 0;

    pointer.sx += ((pointer.active ? (pointer.nx - 0.5) * 2 : 0) - pointer.sx) * (1 - Math.exp(-dt * 4));
    pointer.sy += ((pointer.active ? (pointer.ny - 0.5) * 2 : 0) - pointer.sy) * (1 - Math.exp(-dt * 4));

    // La sphère tourne doucement ; les formes plates restent de face avec un léger balancement
    const roundTarget = (ROUND[nameA] || 0) * (1 - blend) + (ROUND[nameB] || 0) * blend;
    round += (roundTarget - round) * (1 - Math.exp(-dt * 3));
    if (round < 0.001) spin = 0;
    spin += dt * 0.09 * round;
    const sway = Math.sin(elapsed * 0.45) * 0.22 * (1 - round);

    // La pose propre à la forme du hero ne compte que tant que la scène est sur la clé « hero » (et pas sur mobile,
    // où le nuage est au-dessus du texte)
    let target = W < 900 ? HERO_POSE.sphere : HERO_POSE[heroShape] || HERO_POSE.sphere;
    // Le nom se cale sur la boîte des lettres du titre HTML (centre et largeur), de face
    const nameOn = heroShape === "name";
    const box = nameOn && getNameBox ? getNameBox() : null;
    if (box) target = [box.cx / W - cur.nx, box.cy / H - cur.ny, box.w / W / Math.max(cur.size, 0.05)];
    const slide = poseSnap && box ? 1 : 1 - Math.exp(-dt * 2.4);
    if (box) poseSnap = false;
    heroPose.x += (target[0] - heroPose.x) * slide;
    heroPose.y += (target[1] - heroPose.y) * slide;
    heroPose.s += (target[2] - heroPose.s) * slide;
    const heroAmount = Math.min(1, (seg.a === "hero" ? 1 - blend : 0) + (seg.b === "hero" ? blend : 0));
    const size = cur.size * (1 + (heroPose.s - 1) * heroAmount);
    place(cur.nx + heroPose.x * heroAmount, cur.ny + heroPose.y * heroAmount, size);
    group.position.copy(placement.pos);
    group.scale.setScalar(placement.scale);
    nameBlend += ((nameOn ? 1 : 0) - nameBlend) * (1 - Math.exp(-dt * 3));
    const flat = nameBlend * heroAmount;
    group.rotation.set(
      (cur.rx + pointer.sy * 0.1) * (1 - flat),
      (cur.ry + spin * round + sway + pointer.sx * 0.2) * (1 - flat),
      cur.rz
    );
    group.updateMatrixWorld(true);

    // Le curseur dans le repère du nuage
    camera.getWorldDirection(forward);
    pointerPlane.setFromNormalAndCoplanarPoint(forward, group.position);
    ndc.set(pointer.nx * 2 - 1, -(pointer.ny * 2 - 1));
    ray.setFromCamera(ndc, camera);
    if (ray.ray.intersectPlane(pointerPlane, worldPointer)) {
      localVel.copy(worldPointer).sub(lastWorldPointer).divideScalar(Math.max(dt, 0.001));
      lastWorldPointer.copy(worldPointer);
      group.getWorldQuaternion(invQuat).invert();
      localVel.applyQuaternion(invQuat).divideScalar(placement.scale);
      sim.uPointerVel.value.copy(localVel).clampLength(0, 40);
      sim.uPointer.value.copy(worldPointer);
      group.worldToLocal(sim.uPointer.value);
      sim.uToCamera.value.set(0, 0, 1).applyQuaternion(invQuat);
    }
    const queryOn = pointer.active && cur.query > 0.05 && !reduced;
    pointer.force += ((queryOn ? clamp(cur.query) : 0) - pointer.force) * (1 - Math.exp(-dt * 10));
    sim.uPointerForce.value = pointer.force;
    sim.uPointerRadius.value = (QUERY_RADIUS * halfFov * DIST) / placement.scale;

    // Entrée en scène, onde, souffle du son
    const intro = build.v;
    beat += (getAudioLevel() - beat) * (1 - Math.exp(-dt * 12));
    sim.uDt.value = Math.min(dt, 1 / 30);
    sim.uTime.value = elapsed;
    sim.uBlend.value = blend;
    sim.uBuild.value = intro;
    sim.uFlow.value = cur.flow;
    sim.uBurst.value = burst.v;
    sim.uPulse.value = pulse.v;
    sim.uBeat.value = beat;
    const t0 = performance.now();
    if (!reduced) gpu.compute();
    stats.compute += (performance.now() - t0 - stats.compute) * 0.1;

    uniforms.tPos.value = gpu.getCurrentRenderTarget(positionVar).texture;
    uniforms.tVel.value = gpu.getCurrentRenderTarget(velocityVar).texture;
    uniforms.uTime.value = elapsed;
    // Couleur du monde : le nuage vire en douceur vers la teinte demandée par le hero
    const toTint = reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    for (let c = 0; c < 3; c += 1) tint.rgb[c] += (tintTarget.rgb[c] - tint.rgb[c]) * toTint;
    tint.mix += (tintTarget.mix - tint.mix) * toTint;
    uniforms.uTint.value.set(tint.rgb[0], tint.rgb[1], tint.rgb[2]);
    uniforms.uTintMix.value = tint.mix;
    // Les mêmes points sur une surface plus petite brilleraient davantage : on compense la densité
    const density = clamp(Math.pow(size / 0.44, 1.2), 0.5, 1);
    uniforms.uOpacity.value = clamp(cur.show) * density * (0.25 + 0.75 * smooth(0, 0.25, intro)) * (1 + beat * 0.5);
    // Points plus fins quand la forme est petite à l'écran (mobile) : sa structure reste lisible
    uniforms.uSize.value = baseSize * clamp(Math.pow((size * W) / 560, 0.6), 0.55, 1);
    uniforms.uFocus.value = focus.index;
    uniforms.uFocusMix.value = focus.mix;
    uniforms.uQuery.value = queryOn ? QUERY_RADIUS * clamp(cur.query) : 0;
    uniforms.uPointer.value.set(pointer.nx * 2 - 1, -(pointer.ny * 2 - 1));
    uniforms.uDepth.value.set(camera.position.z - group.position.z, Math.max(0.5, 3.6 * placement.scale));
    uniforms.uWarp.value = warp.v;
    uniforms.uScrollVel.value = scrollVel;
    uniforms.uBeat.value = beat;
    compositePass.material.uniforms.uCA.value = 0.0016 + Math.abs(scrollVel) * 0.012 + warp.v * 0.02;
    compositePass.material.uniforms.uTime.value = elapsed;
    points.visible = uniforms.uOpacity.value > 0.003;

    if (onFrame) onFrame({ aurora: cur.aurora * (0.3 + 0.7 * smooth(0, 0.6, intro)), intro });

    // Annotations de la constellation
    if (onProject) {
      frame.show = nameB === "stack" || nameA === "stack"
        ? (nameA === nameB ? 1 : nameB === "stack" ? smooth(0.7, 1, blend) : 1 - smooth(0, 0.3, blend))
        : 0;
      frame.show *= clamp(cur.show) * smooth(0.6, 1, intro);
      Object.keys(anchors).forEach((name) => {
        anchors[name].getWorldPosition(v);
        v.project(camera);
        frame.points[name].x = (v.x * 0.5 + 0.5) * W;
        frame.points[name].y = (-v.y * 0.5 + 0.5) * H;
      });
      onProject(frame);
    }

    // Point étiqueté le plus proche du curseur (formes stables, nuage au repos)
    const settled = blend < 0.06 || blend > 0.94;
    const probing = !reduced && pointer.active && cur.query > 0.5 && settled && intro > 0.92 && cur.show > 0.5;
    if (probing) {
      const shape = data.shapes[blend < 0.5 ? nameA : nameB];
      let best = null;
      let bestDist = PROBE_RADIUS;
      for (let i = 0; i < data.probes.length; i += 1) {
        const o = data.probes[i].index * 4;
        v.set(shape[o], shape[o + 1], shape[o + 2]).applyMatrix4(group.matrixWorld);
        if (round > 0.5 && v.z < group.position.z - 0.05) continue; // face cachée de la sphère
        v.project(camera);
        const x = (v.x * 0.5 + 0.5) * W;
        const y = (-v.y * 0.5 + 0.5) * H;
        const d = Math.hypot(x - pointer.px, y - pointer.py);
        if (d < bestDist) {
          bestDist = d;
          best = { label: data.probes[i].label, x, y };
        }
      }
      sendProbe(best ? { visible: true, ...best, dist: bestDist / PROBE_RADIUS } : { visible: false });
    } else {
      sendProbe({ visible: false });
    }

    if (!rendering) return;
    if (points.visible) {
      if (!wasVisible) canvas.style.visibility = "visible";
      const t1 = performance.now();
      draw();
      stats.draw += (performance.now() - t1 - stats.draw) * 0.1;
      wasVisible = true;
    } else if (wasVisible) {
      renderer.setRenderTarget(null);
      renderer.clear();
      canvas.style.visibility = "hidden";
      wasVisible = false;
    }
  };

  const tick = (time, deltaMs) => {
    if (disposed) return;
    const dt = Math.min(0.05, (deltaMs || 16) / 1000);
    elapsed += dt;
    update(dt);
  };

  // Qualité adaptative : sous 38 i/s plusieurs mesures de suite, on coupe d'abord le halo, puis on baisse la
  // résolution, puis le nombre de points
  const stopPerf = subscribePerf((fps) => {
    lowStreak = fps < 38 ? lowStreak + 1 : 0;
    if (lowStreak < 3) return;
    lowStreak = 0;
    if (post.enabled && dpr <= 1) {
      post.enabled = false;
    } else if (dpr > 1) {
      dpr = Math.max(1, dpr - 0.25);
      renderer.setPixelRatio(dpr);
      renderer.setSize(W, H, false);
      sizeTargets();
      uniforms.uPixel.value = renderer.getPixelRatio();
      compositePass.material.uniforms.uRes.value.set(W * dpr, H * dpr);
    } else if (drawCount > count * 0.45) {
      drawCount = Math.floor(drawCount * 0.8);
      geometry.setDrawRange(0, drawCount);
    }
  });

  // ---------- Démarrage ----------
  resize();
  sampleInto(window.scrollY, cur);
  update(0.016);
  if (reduced) {
    // Image fixe : on laisse la forme se poser avant de rendre une seule fois
    uniforms.tPos.value = gpu.getCurrentRenderTarget(positionVar).texture;
    uniforms.tVel.value = gpu.getCurrentRenderTarget(velocityVar).texture;
    update(0.016);
  }
  if (disposed) return null;

  const listeners = [];
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };

  listen(window, "resize", resize);
  if (!reduced) {
    listen(window, "pointermove", onMove, { passive: true });
    listen(window, "pointerdown", onDown);
    listen(document.documentElement, "mouseleave", onLeave);
    gsap.ticker.add(tick);
  }

  return {
    measure,
    // Aides au debug (console) : window.__field.debug()
    debug: () => ({
      W,
      H,
      side,
      count,
      dpr,
      drawCount,
      postEnabled: post.enabled,
      stats: { ...stats },
      cur: { ...cur },
      segment: { ...seg, shapeA: shapeOf(seg.a), shapeB: shapeOf(seg.b) },
      table: table.map((k) => ({ at: Math.round(k.at), f: k.f, shape: k.shape, anchor: !!k.anchor })),
      scale: placement.scale,
      pos: placement.pos.toArray(),
      scrollY: window.scrollY,
      scrollVel,
      warp: warp.v,
      build: build.v,
      points: JSON.parse(JSON.stringify(frame.points)),
    }),
    // Entrée en scène : le bruit se resserre en spirale quand le rideau du préloader se lève. Quand le nuage écrit
    // le nom, la mise en place est plus vive : les lettres sont lisibles avant l'arrivée du titre.
    intro: () => {
      if (reduced) return;
      const writing = heroShape === "name";
      gsap.to(build, { v: 1, duration: writing ? 1.8 : 3.4, ease: writing ? "power2.out" : "power2.inOut" });
    },
    // Changement de page : nouvelles poses clés (la forme se transforme avec le ressort)
    setKeys: (fn) => {
      keysSource = fn;
      measure();
    },
    // Forme du hero : sphere | browser | network (le nuage se disperse puis se reforme)
    setHeroShape: (name) => {
      if (!textures[name] || name === heroShape) return;
      heroShape = name;
      if (reduced) return;
      gsap.killTweensOf(burst);
      burst.v = 1;
      gsap.to(burst, { v: 0, duration: 1.4, ease: "power2.out" });
    },
    // Couleur du monde : rgb (0-1) et dose (0 = violet d'origine)
    setTint: (rgb, mix = 1) => {
      tintTarget.rgb = [rgb[0], rgb[1], rgb[2]];
      tintTarget.mix = mix;
    },
    // « Saut » de navigation : le nuage s'étire radialement (amount > 0), puis retombe doucement (amount = 0)
    warp: (amount = 1) => {
      if (reduced) return;
      gsap.killTweensOf(warp);
      if (amount > 0) gsap.to(warp, { v: clamp(amount, 0, 1.5), duration: 0.45, ease: "power2.in" });
      else gsap.to(warp, { v: 0, duration: 1.1, ease: "power3.out" });
    },
    // Index de la ligne survolée dans l'index des projets (-1 : aucune)
    setFocus: (index) => {
      if (index >= 0) focus.index = index;
      gsap.to(focus, { mix: index >= 0 ? 1 : 0, duration: index >= 0 ? 0.5 : 0.8, ease: "power2.out", overwrite: true });
    },
    dispose: () => {
      disposed = true;
      gsap.ticker.remove(tick);
      gsap.killTweensOf([build, pulse, burst, warp, focus]);
      stopPerf();
      listeners.forEach((off) => off());
      gpu.dispose();
      Object.values(textures).forEach((texture) => texture.dispose());
      seedTexture.dispose();
      geometry.dispose();
      material.dispose();
      [post.rtScene, post.rtA, post.rtB].forEach((target) => target.dispose());
      [brightPass, blurPass, compositePass].forEach((pass) => {
        pass.material.dispose();
        pass.dispose();
      });
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
  };
}
