import * as THREE from "three";

// Showcase des pages de catégorie en WebGL : un plan plein cadre qui montre le projet courant, et quatre façons de
// passer au suivant, tirées au hasard à chaque changement. Tout est piloté par la position de défilement `pos`
// (0 → n - 1, continue) : la transition est liée au défilement, on peut s'arrêter à mi-chemin.
//  0 encre     : seuil de bruit animé, dispersion chromatique et liseré lumineux sur la frontière ;
//  1 lentille  : un portail s'ouvre sous le curseur, l'ancienne image est repoussée par une onde ;
//  2 éclats    : l'image se brise en tuiles 3D qui fuient vers la caméra ;
//  3 élastique : les projets défilent à la verticale, l'image se plie avec la vitesse et les couleurs se séparent.
// Les textures ne passent pas par la gestion des couleurs de Three (NoColorSpace) : les shaders sortent les valeurs
// des images telles quelles.

const FOV = 35;
const GX = 16;
const GY = 9;
const SP = 2.35;
const DWELL = [0.2, 0.8]; // part du défilement d'un projet où la transition a lieu (le reste : le projet reste en place)

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const mod = (n, m) => ((n % m) + m) % m;
const smooth = (a, b, v) => {
  const t = clamp((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const hexRgb = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const CLIP_FPS = 30; // fréquence des boucles (public/clips)
let clipNow = 0; // date de l'image en cours (horodatage de requestAnimationFrame), partagée par les textures vidéo

// Texture d'une boucle vidéo. Le VideoTexture de Three met la texture à jour dans un rappel du fil principal
// (requestVideoFrameCallback) : dès que Lenis, ScrollTrigger ou React travaillent, ce rappel arrive en retard ou groupé
// et la vidéo avance par à-coups pendant le défilement. Ici l'envoi au GPU se décide dans le rendu, d'après l'horloge de
// la vidéo : une image envoyée par image de la vidéo, au bon moment, jamais plus. La texture a sa propre horloge, qui
// avance au pas régulier du rendu ; la lecture de currentTime, bruitée par le travail du fil principal, ne fait que la
// recaler doucement (sans quoi une image arrive tantôt après 1 rendu, tantôt après 3).
class ClipTexture extends THREE.Texture {
  constructor(video) {
    super(video);
    this.isVideoTexture = true; // le moteur n'alloue pas de stockage fixe et appelle update() à chaque rendu
    this.minFilter = THREE.LinearFilter;
    this.magFilter = THREE.LinearFilter;
    this.generateMipmaps = false;
    this.frame = -1; // index de l'image envoyée ; -1 tant qu'aucune ne l'a été
    this.time = -1; // horloge propre (secondes de vidéo)
    this.at = -1; // date de la dernière mise à jour de l'horloge
  }

  update() {
    const video = this.image;
    if (video.readyState < 2 || this.at === clipNow) return; // une fois par image, même si le moteur nous rappelle
    const dt = this.at < 0 ? 0 : (clipNow - this.at) / 1000;
    this.at = clipNow;
    const t = video.currentTime;
    if (video.paused || this.time < 0 || Math.abs(t - this.time) > 0.12) this.time = t; // arrêt, début, boucle ou saut
    else {
      this.time += dt;
      this.time += (t - this.time) * 0.03;
    }
    const frame = Math.floor(this.time * CLIP_FPS + 0.001);
    if (frame !== this.frame) {
      this.frame = frame;
      this.needsUpdate = true;
    }
  }
}

const COMMON = `
  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i+vec2(1.0,0.0)), f.x), mix(hash(i+vec2(0.0,1.0)), hash(i+vec2(1.0,1.0)), f.x), f.y); }
  float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(7.3, 2.1); a *= 0.5; } return v; }
  vec2 mir(vec2 u){ return 1.0 - abs(1.0 - mod(u, 2.0)); }
  vec2 zoomAt(vec2 uv, float z, vec2 c){ return c + (uv - c) / z; }`;

const PLANE_FRAGMENT = `
  uniform sampler2D uA; uniform sampler2D uB; uniform float uP; uniform float uTime; uniform float uAspect; uniform int uType; uniform vec3 uAccent; uniform vec2 uPointer;
  varying vec2 vUv;
  ${COMMON}
  vec3 sa(vec2 u){ return texture2D(uA, mir(u)).rgb; }
  vec3 sb(vec2 u){ return texture2D(uB, mir(u)).rgb; }
  void main(){
    vec2 uv = vUv; vec3 col;
    if (uType == 0) {
      float n = fbm(uv * vec2(uAspect, 1.0) * 2.4 + uTime * 0.05);
      float f = n * 0.62 + uv.x * 0.38;
      float th = mix(-0.14, 1.16, uP);
      float mask = 1.0 - smoothstep(th - 0.02, th + 0.02, f);
      float band = exp(-pow((f - th) / 0.045, 2.0));
      vec2 off = normalize(vec2(dFdx(f), dFdy(f)) + 1e-5) * band * 0.02;
      vec2 ua = zoomAt(uv, 1.0 + 0.16 * uP, vec2(0.5));
      vec2 ub = zoomAt(uv, 1.16 - 0.16 * uP, vec2(0.5));
      vec3 a = vec3(sa(ua + off).r, sa(ua).g, sa(ua - off).b);
      vec3 b = vec3(sb(ub + off).r, sb(ub).g, sb(ub - off).b);
      col = mix(a, b, mask) + uAccent * band * 0.65;
      col *= 1.0 - 0.1 * band;
    } else {
      vec2 c = vec2(0.5) + uPointer * vec2(0.22, -0.2);
      vec2 d = (uv - c) * vec2(uAspect, 1.0);
      float r = length(d);
      float R = uP * 1.6;
      float ring = exp(-pow((r - R) / 0.075, 2.0)) * smoothstep(0.0, 0.06, uP) * (1.0 - smoothstep(0.92, 1.0, uP));
      vec2 dir = d / (r + 1e-4) / vec2(uAspect, 1.0);
      vec2 ua = c + (uv - c) * (1.0 - 0.14 * uP) - dir * ring * 0.1;
      float k = smoothstep(0.0, max(R, 1e-3), r);
      vec2 ub = c + (uv - c) * mix(mix(0.5, 1.0, k), 1.0, smoothstep(0.55, 1.0, uP));
      float inside = 1.0 - smoothstep(R - 0.02, R + 0.004, r);
      float ca = ring * 0.02;
      vec3 a = vec3(sa(ua + dir * ca).r, sa(ua).g, sa(ua - dir * ca).b);
      vec3 b = vec3(sb(ub + dir * ca).r, sb(ub).g, sb(ub - dir * ca).b);
      col = mix(a, b, inside) + uAccent * ring * 0.4 + vec3(1.0) * pow(ring, 3.0) * 0.35;
    }
    col += (hash(vUv * 900.0 + uTime) - 0.5) * 0.03;
    gl_FragColor = vec4(col, 1.0);
  }`;

const TILE_VERTEX = `
  attribute vec3 aRand; attribute vec2 aCell; uniform float uP; uniform float uAspect; uniform vec2 uGrid;
  varying vec2 vUv; varying vec2 vLocal; varying float vShade; varying float vA; varying float vE; varying float vSide;
  mat3 rotAxis(vec3 ax, float a){ ax = normalize(ax); float s = sin(a), c = cos(a), oc = 1.0 - c;
    return mat3(oc*ax.x*ax.x+c, oc*ax.x*ax.y+ax.z*s, oc*ax.z*ax.x-ax.y*s, oc*ax.x*ax.y-ax.z*s, oc*ax.y*ax.y+c, oc*ax.y*ax.z+ax.x*s, oc*ax.z*ax.x+ax.y*s, oc*ax.y*ax.z-ax.x*s, oc*ax.z*ax.z+c); }
  void main(){
    vec2 center = (aCell + 0.5) / uGrid;
    vec3 base = vec3((center.x - 0.5) * 2.0 * uAspect, (center.y - 0.5) * 2.0, 0.0);
    vec2 cs = vec2(2.0 * uAspect, 2.0) / uGrid;
    float delay = distance(center * vec2(uAspect, 1.0), vec2(0.5 * uAspect, 0.5)) * 0.55 + aRand.x * 0.16;
    float lp = clamp((uP - delay * 0.55) / 0.55, 0.0, 1.0);
    float e = lp * lp * (3.0 - 2.0 * lp);
    vec3 p = vec3(position.xy * cs, position.z);
    mat3 R = rotAxis(aRand - 0.5 + 0.001, e * (1.4 + aRand.y * 3.2));
    p = R * p;
    vec3 fly = vec3((aRand.xy - 0.5) * 1.8, 1.2 + aRand.z * 1.4) * e * e;
    vec3 world = base + p + fly;
    vUv = center + position.xy / uGrid; vLocal = position.xy + 0.5;
    vec3 L = normalize(vec3(-0.4, 0.6, 0.7)); vec3 n = R * normal;
    vShade = 1.0 + 0.7 * (max(dot(n, L), 0.0) - L.z);
    vSide = 1.0 - smoothstep(0.5, 0.9, abs(normal.z));
    vA = 1.0 - smoothstep(0.72, 1.0, e); vE = e;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }`;

const TILE_FRAGMENT = `
  uniform sampler2D uA; uniform vec3 uAccent;
  varying vec2 vUv; varying vec2 vLocal; varying float vShade; varying float vA; varying float vE; varying float vSide;
  void main(){
    vec3 c = texture2D(uA, vUv).rgb * vShade;
    float edge = smoothstep(0.44, 0.5, max(abs(vLocal.x - 0.5), abs(vLocal.y - 0.5)));
    c += uAccent * edge * 0.6 * vE;
    c = mix(c, vec3(0.02, 0.02, 0.03) + uAccent * 0.08, vSide);
    gl_FragColor = vec4(c, vA);
  }`;

const STACK_VERTEX = `
  uniform float uVel; varying vec2 vUv;
  void main(){ vUv = uv; vec3 p = position; float c = sin(uv.y * 3.14159); p.z += c * uVel * 0.45; p.x *= 1.0 - abs(uVel) * 0.04 * c; p.y += (uv.x - 0.5) * uVel * 0.12;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;

const STACK_FRAGMENT = `
  uniform sampler2D uTex; uniform float uVel; uniform float uY; varying vec2 vUv;
  void main(){ vec2 uv = vUv; uv.y += uY * 0.07; uv = (uv - 0.5) * mix(1.0, 0.93, smoothstep(0.0, 1.2, abs(uY))) + 0.5; float s = uVel * 0.012;
    vec3 col = vec3(texture2D(uTex, uv + vec2(0.0, s)).r, texture2D(uTex, uv).g, texture2D(uTex, uv - vec2(0.0, s)).b);
    col *= 1.0 - 0.5 * clamp(abs(uY) / 2.4, 0.0, 1.0); gl_FragColor = vec4(col, 1.0); }`;

// items : [{ poster, clip, accent }] ; getPos() : position de défilement continue (0 → n - 1)
export function createShowcaseGL({ canvas, items, getPos }) {
  const host = canvas.parentElement;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (e) {
    return null;
  }
  renderer.setClearColor(0x08080c, 1);
  const n = items.length;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 50);
  camera.position.z = 1 / Math.tan((FOV * Math.PI) / 360);
  let aspect = 16 / 9;

  // ----- Textures : l'affiche de chaque projet, et sa boucle vidéo quand elle joue -----
  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin("anonymous");
  const raw = (texture) => {
    texture.colorSpace = THREE.NoColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    return texture;
  };
  // Projet sans affiche, ou image qui ne se charge pas : la vignette dessinée de l'item
  const fallbackTexture = (i) => raw(new THREE.CanvasTexture(items[i].fallback()));
  const posters = items.map((item, i) => {
    if (!item.poster) return fallbackTexture(i);
    return raw(
      loader.load(item.poster, undefined, undefined, () => {
        posters[i] = fallbackTexture(i);
      })
    );
  });
  const videos = items.map(() => null);
  const ensureVideo = (i) => {
    const item = items[i];
    if (!item.clip) return null;
    if (!videos[i]) {
      const el = document.createElement("video");
      el.muted = true;
      el.loop = true;
      el.playsInline = true;
      el.preload = "auto";
      el.src = item.clip;
      videos[i] = { el, texture: raw(new ClipTexture(el)) };
    }
    return videos[i];
  };
  const textureFor = (i) => {
    const v = videos[i];
    // Une vidéo en pause garde sa dernière image : revenir à l'affiche se verrait
    return v && v.texture.frame >= 0 ? v.texture : posters[i];
  };

  const accent = new THREE.Vector3(...hexRgb(items[0].accent));
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const shared = { uTime: { value: 0 }, uAspect: { value: aspect }, uAccent: { value: accent }, uPointer: { value: new THREE.Vector2() } };

  // ----- Plan plein cadre : encre et lentille -----
  const planeMaterial = new THREE.ShaderMaterial({
    uniforms: { uA: { value: posters[0] }, uB: { value: posters[Math.min(1, n - 1)] }, uP: { value: 0 }, uType: { value: 0 }, ...shared },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: PLANE_FRAGMENT,
    depthTest: false,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), planeMaterial);
  scene.add(plane);

  // ----- Éclats : tuiles instanciées + le projet suivant derrière -----
  const count = GX * GY;
  const box = new THREE.BoxGeometry(1, 1, 0.03);
  const tileGeometry = new THREE.InstancedBufferGeometry();
  tileGeometry.index = box.index;
  tileGeometry.setAttribute("position", box.attributes.position);
  tileGeometry.setAttribute("normal", box.attributes.normal);
  tileGeometry.setAttribute("uv", box.attributes.uv);
  const cells = new Float32Array(count * 2);
  const rands = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    cells[i * 2] = i % GX;
    cells[i * 2 + 1] = Math.floor(i / GX);
    rands[i * 3] = Math.random();
    rands[i * 3 + 1] = Math.random();
    rands[i * 3 + 2] = Math.random();
  }
  tileGeometry.setAttribute("aCell", new THREE.InstancedBufferAttribute(cells, 2));
  tileGeometry.setAttribute("aRand", new THREE.InstancedBufferAttribute(rands, 3));
  tileGeometry.instanceCount = count;
  const tileMaterial = new THREE.ShaderMaterial({
    uniforms: { uA: { value: posters[0] }, uP: { value: 0 }, uGrid: { value: new THREE.Vector2(GX, GY) }, ...shared },
    vertexShader: TILE_VERTEX,
    fragmentShader: TILE_FRAGMENT,
    transparent: true,
  });
  const tiles = new THREE.Mesh(tileGeometry, tileMaterial);
  tiles.frustumCulled = false;
  tiles.renderOrder = 2;
  scene.add(tiles);
  const behindMaterial = new THREE.ShaderMaterial({
    uniforms: { uTex: { value: posters[0] }, uK: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform sampler2D uTex; uniform float uK; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(uTex, vUv).rgb * uK, 1.0); }",
  });
  const behind = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), behindMaterial);
  behind.position.z = -0.05;
  scene.add(behind);

  // ----- Défilement élastique : quatre plans recyclés sur la colonne -----
  const stack = [];
  for (let j = 0; j < 4; j += 1) {
    const material = new THREE.ShaderMaterial({
      uniforms: { uTex: { value: posters[0] }, uVel: { value: 0 }, uY: { value: 0 } },
      vertexShader: STACK_VERTEX,
      fragmentShader: STACK_FRAGMENT,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 24, 24), material);
    mesh.visible = false;
    scene.add(mesh);
    stack.push(mesh);
  }

  // ----- Boucle -----
  const types = Array.from({ length: Math.max(1, n - 1) }, () => Math.floor(Math.random() * 4));
  let stackPos = 0;
  let lastStack = 0;
  let vel = 0;
  let last = performance.now();
  let time = 0;
  let raf = 0;
  let running = true;
  let activeVideo = "";
  let armed = false;

  const playOnly = (set) => {
    videos.forEach((v, i) => {
      if (!v) return;
      if (set.has(i)) {
        if (v.el.paused) v.el.play().catch(() => {});
      } else if (!v.el.paused) {
        v.el.pause();
      }
    });
  };

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    clipNow = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    shared.uTime.value = time;
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 6);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 6);
    shared.uPointer.value.set(pointer.x, pointer.y);

    const pos = clamp(getPos(), 0, n - 1);
    const idx = Math.min(Math.floor(pos), Math.max(0, n - 2));
    const f = n > 1 ? pos - idx : 0;
    const next = Math.min(idx + 1, n - 1);
    const p = smooth(DWELL[0], DWELL[1], f);

    // Nouveau tirage une seule fois par pause, jamais à chaque image : le rendu changerait de type en continu.
    // La prochaine transition, dans un sens comme dans l'autre, sera différente.
    if (f > 0.12 && f < 0.88) armed = true;
    else if (armed && (f < 0.02 || f > 0.98)) {
      armed = false;
      const at = f > 0.5 ? idx + 1 : idx;
      [at - 1, at].forEach((k) => {
        if (k >= 0 && k < types.length) types[k] = Math.floor(Math.random() * 4);
      });
    }
    const type = types[Math.min(idx, types.length - 1)];

    // Boucles à portée : créées d'avance, pour que leur image soit déjà là quand la transition les montre ; une vidéo en
    // pause garde sa dernière image
    for (let k = idx - 1; k <= next + 1; k += 1) {
      if (k < 0 || k >= n) continue;
      const v = ensureVideo(k);
      if (v) v.texture.update();
    }
    // Seules jouent celle du projet visible et, pendant la transition, celle du voisin. Des seuils éloignés (0,12 / 0,88)
    // évitent de lancer et d'arrêter une vidéo en boucle quand le défilement s'arrête près d'un seuil.
    const near = new Set([f > 0.5 ? next : idx]);
    if (f > 0.12 && f < 0.88) {
      near.add(idx);
      near.add(next);
    }
    const key = [...near].sort().join(",");
    if (key !== activeVideo) {
      activeVideo = key;
      playOnly(near);
    }

    // Au repos le rendu est le même quel que soit le type : l'image ne change jamais d'aspect quand on s'arrête.
    // L'élastique attend d'avoir fini de se poser.
    const settled = type !== 3 || Math.abs(stackPos - (idx + p)) < 0.004;
    const atRest = (p < 0.0005 || p > 0.9995) && settled;
    const mode = atRest ? 0 : type;
    const A = textureFor(p > 0.9995 ? next : idx);
    const B = textureFor(next);
    const color = hexRgb(items[idx].accent);
    const to = hexRgb(items[next].accent);
    accent.set(color[0] + (to[0] - color[0]) * p, color[1] + (to[1] - color[1]) * p, color[2] + (to[2] - color[2]) * p);

    plane.visible = mode < 2;
    tiles.visible = behind.visible = mode === 2;
    stack.forEach((m) => {
      m.visible = mode === 3;
    });
    if (mode < 2) {
      planeMaterial.uniforms.uA.value = A;
      planeMaterial.uniforms.uB.value = B;
      planeMaterial.uniforms.uP.value = atRest ? 0 : p;
      planeMaterial.uniforms.uType.value = mode;
      plane.scale.x = aspect;
    } else if (mode === 2) {
      tileMaterial.uniforms.uA.value = A;
      tileMaterial.uniforms.uP.value = p;
      behindMaterial.uniforms.uTex.value = B;
      behindMaterial.uniforms.uK.value = 0.4 + 0.6 * p;
      behind.scale.set((1.16 - 0.16 * p) * aspect, 1.16 - 0.16 * p, 1);
    } else {
      const target = idx + p;
      stackPos += (target - stackPos) * Math.min(1, dt * 9);
      vel += (((stackPos - lastStack) / Math.max(dt, 1e-3)) * 0.35 - vel) * Math.min(1, dt * 10);
      lastStack = stackPos;
      const b = Math.floor(stackPos);
      stack.forEach((m, j) => {
        const k = b + j - 1;
        const y = -(k - stackPos) * SP;
        m.material.uniforms.uTex.value = textureFor(mod(k, n));
        m.material.uniforms.uY.value = y;
        m.material.uniforms.uVel.value = clamp(vel, -3, 3);
        m.position.y = y;
        m.scale.x = aspect;
      });
    }
    if (mode !== 3) {
      stackPos = lastStack = idx + p;
      vel = 0;
    }
    renderer.render(scene, camera);
  };

  const resize = () => {
    const r = host.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(Math.max(2, r.width), Math.max(2, r.height), false);
    aspect = r.width / Math.max(1, r.height);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    shared.uAspect.value = aspect;
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();

  // Rendu seulement quand la scène est à l'écran et l'onglet visible
  const visibility = new IntersectionObserver(([entry]) => {
    running = entry.isIntersecting && !document.hidden;
    if (running) last = performance.now();
    else playOnly(new Set());
    activeVideo = "";
  });
  visibility.observe(host);
  const onVisibility = () => {
    running = !document.hidden;
    last = performance.now();
    if (document.hidden) playOnly(new Set());
    activeVideo = "";
  };
  document.addEventListener("visibilitychange", onVisibility);
  const onMove = (event) => {
    const r = host.getBoundingClientRect();
    pointer.tx = ((event.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((event.clientY - r.top) / r.height) * 2 - 1;
  };
  host.addEventListener("pointermove", onMove);
  raf = requestAnimationFrame(frame);

  return {
    dispose() {
      cancelAnimationFrame(raf);
      visibility.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("pointermove", onMove);
      videos.forEach((v) => {
        if (!v) return;
        v.el.pause();
        v.el.removeAttribute("src");
        v.el.load();
        v.texture.dispose();
      });
      posters.forEach((t) => t.dispose());
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
      renderer.dispose();
    },
  };
}
