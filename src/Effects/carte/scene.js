// Scène de l'arrivée « la carte se soulève » : terrain en isolignes qui monte, repère « Arthur est ici » qui tombe sur le
// lycée, puis la carte est poussée sous lui : le fil qu'il trace relie les étapes du parcours. Un seul canvas, piloté par
// la progression de défilement (0 → 1). Le texte est du HTML par-dessus (cartes d'étapes, étiquettes, fil de navigation).
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { assemble, buildAttention, buildWebPage } from "../stage3d/objects";
import { buildController } from "../stage3d/controller";
import { clamp, lerp, smooth, STEPS, REGIONS, ROAD, PLATEAU, SIZE, P, OVER, CENTROID, pOfWalk, PATH, reliefAt, pathPoint, headingAt, angLerp } from "./terrain";

// La progression 0 → 1 de la section est la partition complète de la refonte : nom, carte qui se soulève, repère,
// marche le long du fil (P.walkA → P.walkB), puis le fil se divise vers les trois régions
export const P_FIN = 1;
// Image fixe du mouvement réduit : le repère posé, la bienvenue visible, avant la marche
export const P_STATIC = 0.29;

const SEG = 460; // ≈ 5,5 segments par unité : le contour se lit dans le shader, pas dans la géométrie
const HEAD = 1.5; // hauteur de la tête du repère au-dessus du sol

const terrainVert = /* glsl */ `
  attribute float aH;
  uniform float uLift;
  varying float vH;
  varying vec3 vP;
  varying vec3 vW;
  void main() {
    vH = aH;
    vec3 p = position;
    p.y = aH * uLift;
    vP = p;
    vec4 w = modelMatrix * vec4(p, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const terrainFrag = /* glsl */ `
  uniform vec3 uColor, uCam;
  uniform vec2 uCenter;
  uniform float uLift, uFlat, uRing, uRingA, uRegA;
  uniform vec2 uReg[3];
  uniform vec3 uRegC[3];
  varying float vH;
  varying vec3 vP;
  varying vec3 vW;
  void main() {
    float l = vH * 7.0;
    float fw = fwidth(l);
    float minor = 1.0 - smoothstep(0.0, fw * 1.4, abs(fract(l) - 0.5));
    float major = 1.0 - smoothstep(0.0, fwidth(l * 0.25) * 2.2, abs(fract(l * 0.25) - 0.5));
    vec3 n = normalize(cross(dFdx(vP), dFdy(vP)));
    float lit = clamp(dot(n, normalize(vec3(-0.5, 0.7, 0.4))), 0.0, 1.0);
    vec3 ground = mix(vec3(0.039, 0.039, 0.059), vec3(0.11, 0.1, 0.17), lit * uLift);
    vec3 tint = mix(uColor, vec3(0.39, 0.9, 0.75), smoothstep(0.6, 3.4, vH));
    // Les trois régions prennent leur couleur quand le fil se divise
    for (int i = 0; i < 3; i++) {
      float d = length(vP.xz - uReg[i]);
      tint = mix(tint, uRegC[i], exp(-d * d / 9.0) * uRegA);
    }
    vec3 col = ground + tint * (minor * 0.26 + major * 0.62);
    float r = length(vP.xz - uCenter);
    float ring = exp(-pow((r - uRing) / 0.32, 2.0)) * uRingA;
    col += vec3(0.85, 1.0, 0.29) * ring * (0.35 + minor + major);
    float d = length(vW - uCam);
    float fog = smoothstep(46.0, 18.0, d);
    col = mix(vec3(0.039, 0.039, 0.059), col, mix(fog, 1.0, uFlat));
    gl_FragColor = vec4(col, 1.0);
  }`;

/**
 * @param {HTMLElement} host   conteneur du canvas
 * @param {object} ui          éléments de texte : name, hello, here, root (le calque qui contient cartes, étiquettes et fil)
 *                             et onSeek(progression) appelé au clic sur un nœud du fil
 * @param {{reduced?: boolean}} opts
 */
export function createCarte(host, ui, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x0a0a0f, 1);
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1.7, 0.1, 160);
  const disposables = [];
  const keep = (x) => {
    disposables.push(x);
    return x;
  };

  // La carte : terrain, fil et nœuds. Tout bouge ensemble quand le défilement la pousse
  const map = new THREE.Group();
  scene.add(map);
  const geo = keep(new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG));
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const heights = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i += 1) heights[i] = reliefAt(pos.getX(i), pos.getZ(i));
  geo.setAttribute("aH", new THREE.BufferAttribute(heights, 1));
  const u = {
    uLift: { value: 0 },
    uColor: { value: new THREE.Vector3(0.74, 0.39, 1) },
    uCam: { value: new THREE.Vector3() },
    uFlat: { value: 1 },
    uRing: { value: 0 },
    uRingA: { value: 0 },
    uRegA: { value: 0 },
    uCenter: { value: new THREE.Vector2(STEPS[0].x, STEPS[0].z) },
    uReg: { value: REGIONS.map((r) => new THREE.Vector2(r.x, r.z)) },
    uRegC: { value: REGIONS.map((r) => new THREE.Vector3(...r.rgb)) },
  };
  map.add(new THREE.Mesh(geo, keep(new THREE.ShaderMaterial({ uniforms: u, vertexShader: terrainVert, fragmentShader: terrainFrag }))));

  // Le fil, tracé derrière le repère au fil de la marche
  const tube = keep(new THREE.TubeGeometry(PATH, 1100, 0.05, 6, false));
  const thread = new THREE.Mesh(tube, keep(new THREE.MeshBasicMaterial({ color: 0xd9ff4a, toneMapped: false })));
  map.add(thread);
  const tubeCount = tube.index.count;

  // Au bout, le fil se divise : une branche et un anneau par région
  const branches = REGIONS.map((r) => {
    const g = keep(new THREE.TubeGeometry(r.curve, 260, 0.05, 6, false));
    const m = new THREE.Mesh(g, keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(r.hex), toneMapped: false })));
    map.add(m);
    const ringMat = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(r.hex), transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide }));
    const ring = new THREE.Mesh(keep(new THREE.RingGeometry(1.75, 1.9, 72)), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(r.x, PLATEAU + 0.05, r.z);
    map.add(ring);
    return { m, count: g.index.count, ringMat, ring };
  });

  // Les objets du hero (page éclatée, attention, manette) marquent les régions, légèrement penchés vers le haut.
  // Construits au premier besoin : ils pèsent à l'initialisation et ne servent qu'à la fin du parcours.
  const timeU = { value: 0 };
  const marks = [];
  let envTex = null;
  const prevTone = renderer.toneMapping;
  const prevExposure = renderer.toneMappingExposure;
  const ensureMarks = () => {
    if (marks.length) return;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    const pmrem = new THREE.PMREMGenerator(renderer);
    envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = envTex;
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(-4, 8, 6);
    const rim = new THREE.DirectionalLight(0xb98cff, 3);
    rim.position.set(5, 3, -6);
    scene.add(key, rim);
    const web = buildWebPage();
    const ai = buildAttention(timeU);
    const pad = buildController();
    pad.update(0, 0, { explode: 0 });
    [
      { o: web, width: 7.4, parts: web.parts },
      { o: ai, width: 7.4, parts: ai.parts },
      { o: pad, width: 8.3, parts: null },
    ].forEach((m, i) => {
      const holder = new THREE.Group();
      holder.rotation.order = "YXZ";
      holder.rotation.x = -0.38;
      const r = REGIONS[i];
      holder.position.set(r.x, PLATEAU + 1.7, r.z);
      m.o.root.scale.setScalar(3 / m.width);
      holder.add(m.o.root);
      map.add(holder);
      marks.push({ ...m, holder, baseY: holder.position.y });
    });
  };

  // Les étapes du parcours : un nœud et un piquet qui s'allument au passage
  const knotGeo = keep(new THREE.SphereGeometry(0.17, 20, 14));
  const pinGeo = keep(new THREE.CylinderGeometry(0.012, 0.012, 1.25, 6));
  const knots = STEPS.map((s) => {
    const mat = keep(new THREE.MeshBasicMaterial({ color: 0x6b6880, toneMapped: false }));
    const k = new THREE.Mesh(knotGeo, mat);
    k.position.set(s.x, s.y + 0.08, s.z);
    const pin = new THREE.Mesh(pinGeo, keep(new THREE.MeshBasicMaterial({ color: 0xf3f0ea, toneMapped: false, transparent: true, opacity: 0.7 })));
    pin.position.set(s.x, s.y + 0.7, s.z);
    map.add(k, pin);
    return { mat, k, pin, top: new THREE.Vector3(s.x, s.y + 1.35, s.z) };
  });

  // Le repère : une goutte de carte (tête + pointe) avec un trou noir, un anneau d'onde à l'atterrissage
  const lime = keep(new THREE.MeshBasicMaterial({ color: 0xd9ff4a, toneMapped: false }));
  const guide = new THREE.Group();
  guide.rotation.order = "YXZ";
  const head = new THREE.Mesh(keep(new THREE.SphereGeometry(0.42, 32, 20)), lime);
  head.position.y = 1.25;
  const tip = new THREE.Mesh(keep(new THREE.ConeGeometry(0.4, 1.05, 32)), lime);
  tip.rotation.x = Math.PI;
  tip.position.y = 0.6;
  const hole = new THREE.Mesh(keep(new THREE.CircleGeometry(0.17, 32)), keep(new THREE.MeshBasicMaterial({ color: 0x0a0a0f, toneMapped: false })));
  hole.position.set(0, 1.27, 0.425);
  guide.add(head, tip, hole);
  guide.scale.setScalar(1.25);
  scene.add(guide);
  const wave = new THREE.Mesh(
    keep(new THREE.RingGeometry(0.56, 0.6, 64)),
    keep(new THREE.MeshBasicMaterial({ color: 0xd9ff4a, transparent: true, opacity: 0, toneMapped: false, side: THREE.DoubleSide }))
  );
  wave.rotation.x = -Math.PI / 2;
  scene.add(wave);

  // ---------- Texte : cartes d'étapes, étiquettes sur la carte, fil de navigation ----------
  const root = ui.root;
  const cards = [...root.querySelectorAll(".carte__card")];
  const tags = [...root.querySelectorAll(".carte__tag")];
  const lead = root.querySelector(".carte__lead");
  const leadLine = lead.querySelector("line");
  const leadDot = lead.querySelector("circle");
  const threadEl = root.querySelector(".carte__thread");
  const fillEl = root.querySelector(".carte__rail i");
  const knotEls = [...root.querySelectorAll(".carte__knot")];
  const regionEls = [...root.querySelectorAll(".carte__region")];
  const headEl = root.querySelector(".carte__head");
  // Un nœud par étape, plus « Bonjour » au début et « Projets » à la fin : p où la marche amène le repère juste avant l'étape
  const thrK = [0.27, ...STEPS.map((s) => pOfWalk(Math.max(0, s.at - 0.03))), 0.97];
  const span = thrK[thrK.length - 1] - thrK[0];
  knotEls.forEach((el, i) => {
    el.style.left = `${(clamp((thrK[i] - thrK[0]) / span) * 100).toFixed(2)}%`;
    el.addEventListener("click", () => ui.onSeek && ui.onSeek(thrK[i] / P_FIN));
  });
  tags.forEach((el, i) => el.addEventListener("click", () => ui.onSeek && ui.onSeek(thrK[i + 1] / P_FIN)));

  const v = new THREE.Vector3();
  const w3 = new THREE.Vector3();
  const look = new THREE.Vector3();
  const target = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const TOP = new THREE.Vector3(0, 21, 0.01);
  const heroP = new THREE.Vector3();
  const heroAt = new THREE.Vector3();
  const walkP = new THREE.Vector3();
  const walkAt = new THREE.Vector3();
  const overP = new THREE.Vector3();
  const overAt = new THREE.Vector3();
  const pt = new THREE.Vector3();
  let W = 1;
  let H = 1;
  let portrait = false;
  let clock = 0;
  let theta = null;
  let first = true;
  let started = false;

  let progress = 0; // 0 → 1, fixée par le défilement
  let raf = 0;
  let last = 0;
  let running = false;

  const project = (local) => {
    w3.copy(local);
    map.localToWorld(w3);
    v.copy(w3).project(cam);
    return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H, ok: v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 };
  };

  function draw(dt, t) {
    const p = opts.reduced ? P_STATIC : progress * P_FIN;
    const entry = smooth(0.2, 1.4, clock);
    const lift = Math.max(smooth(0.04, 0.2, p), 0.05 * entry);
    // Le repère s'envole à la fin : les régions prennent la place
    const rise = smooth(0.11, 0.26, p) * (1 - smooth(0.82, 0.9, p));
    const walk = clamp((p - P.walkA) / (P.walkB - P.walkA));
    const toHero = smooth(0.1, 0.3, p);
    const toWalk = smooth(0.29, 0.4, p);
    const toOver = smooth(0.8, 0.9, p);
    const k = first ? 1 : 1 - Math.exp(-dt * 6);
    timeU.value = t;
    if (p > 0.78) ensureMarks();

    // La carte est poussée : le point du fil où se trouve le repère reste sous lui, la carte tourne pour que la suite
    // du fil parte vers la droite de l'écran (à la fin : Web à gauche, Jeu à droite)
    const want = angLerp(headingAt(walk), OVER, toOver);
    theta = theta === null ? want : angLerp(theta, want, k);
    pathPoint(walk, pt);
    map.rotation.y = theta;
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    map.position.set(-(pt.x * c + pt.z * s), 0, -(-pt.x * s + pt.z * c));
    map.updateMatrixWorld();

    u.uLift.value = lift;
    u.uFlat.value = clamp(1 - smooth(0.08, 0.24, p) + toOver * 0.55);
    u.uRing.value = lerp(0.6, 12, smooth(0.12, 0.4, p));
    u.uRingA.value = smooth(0.12, 0.18, p) * (1 - smooth(0.3, 0.4, p));
    u.uRegA.value = smooth(0.84, 0.93, p);

    thread.visible = walk > 0.001;
    tube.setDrawRange(0, Math.floor((tubeCount / 6) * walk) * 6);
    branches.forEach((b, i) => {
      const g = smooth(0.84 + i * 0.015, 0.93 + i * 0.015, p);
      b.m.visible = g > 0.001;
      b.m.geometry.setDrawRange(0, Math.floor((b.count / 6) * g) * 6);
      b.ringMat.opacity = smooth(0.9, 0.96, p) * (0.75 + 0.25 * Math.sin(t * 2.4 + i));
      b.ring.scale.setScalar(0.85 + 0.15 * smooth(0.9, 0.97, p));
    });
    marks.forEach((m, i) => {
      const g = smooth(0.86 + i * 0.025, 0.95 + i * 0.025, p);
      if (m.parts) assemble(m.parts, g);
      else m.holder.scale.setScalar(Math.max(g, 0.0001));
      m.holder.visible = g > 0.001;
      m.holder.position.y = m.baseY + Math.sin(t * 0.9 + i * 2) * 0.12;
      m.holder.rotation.y = -theta + Math.sin(t * 0.4 + i) * 0.35; // face à l'écran, quel que soit le sens de la carte
    });
    STEPS.forEach((st, i) => {
      knots[i].mat.color.setHex(walk >= st.at - 0.005 && p > P.walkA - 0.01 ? 0xd9ff4a : 0x6b6880);
      // Le nœud et son piquet s'effacent quand le repère passe dessus
      const under = Math.abs(walk - st.at) < 0.07 && rise > 0.05;
      knots[i].k.visible = !under;
      knots[i].pin.visible = !under;
    });

    // Caméra : vue de dessus → face au repère → au-dessus de son épaule le long du fil
    const faceY = ROAD * lift + HEAD;
    if (portrait) {
      // Écran haut : la caméra surplombe nettement le terrain, sinon le haut de l'écran montre l'horizon (noir)
      heroP.set(0.2, faceY + 7.5, 7.6);
      heroAt.set(0, faceY - 1.6, 0);
      walkP.set(-0.4, 11, 11);
      walkAt.set(1, 0.8, -2.5);
    } else {
      heroP.set(0.4, faceY + 0.4, 6.6);
      heroAt.set(-1.4, faceY - 0.7, 0);
      walkP.set(-1.7, 4.6, 8.8);
      walkAt.set(2.7, 1.5, -3.2);
    }
    // Vue d'ensemble : au-dessus des trois régions
    overAt.copy(CENTROID);
    map.localToWorld(overAt);
    if (portrait) {
      // Écran haut : on recule jusqu'à ce que Web et Jeu vidéo (largeur utile ≈ 29 unités) tiennent dans la largeur
      const dist = clamp(19 / (Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.aspect), 30, 95);
      overP.copy(overAt).add(v.set(0, dist * 0.95, dist * 0.31));
    } else {
      overP.copy(overAt).add(v.set(0, 23, 10));
    }
    camPos.copy(TOP).lerp(heroP, toHero).lerp(walkP, toWalk).lerp(overP, toOver);
    target.set(0, 0, 0).lerp(heroAt, toHero).lerp(walkAt, toWalk).lerp(overAt, toOver);
    cam.position.lerp(camPos, k);
    look.lerp(target, k);
    cam.lookAt(look);
    cam.updateMatrixWorld();
    u.uCam.value.copy(cam.position);
    first = false;

    // Le repère tombe du ciel, puis oscille doucement ; une onde part de sa pointe à l'atterrissage
    const ground = ROAD * lift;
    guide.visible = rise > 0.001;
    guide.position.set(0, ground + (1 - rise) * (1 - rise) * 8, 0);
    guide.rotation.y = Math.atan2(cam.position.x, cam.position.z) + Math.sin(t * 1.3) * 0.15;
    // Vu de haut, le repère se penche vers la caméra (autour de sa pointe) au lieu de s'écraser
    const elev = Math.atan2(cam.position.y - faceY, Math.hypot(cam.position.x, cam.position.z));
    guide.rotation.x = -clamp(elev * 0.7, 0, 0.75);
    const f = (t * 0.8) % 1;
    wave.position.set(0, ground + 0.04, 0);
    wave.scale.setScalar(1 + f * 2.6);
    wave.material.opacity = (1 - f) * (1 - f) * 0.9 * smooth(0.2, 0.26, p) * (1 - smooth(0.3, 0.4, p));

    renderer.render(scene, cam);

    // ---------- Texte ----------
    // L'étiquette suit le haut de la tête du repère, même incliné
    guide.updateMatrixWorld();
    const hp = guide.localToWorld(v.set(0, 1.78, 0)).project(cam);
    ui.here.style.transform = `translate(${((hp.x * 0.5 + 0.5) * W).toFixed(1)}px, ${((-hp.y * 0.5 + 0.5) * H).toFixed(1)}px)`;
    // (mouvement réduit : la feuille de style fixe le nom, la bienvenue et l'étiquette)
    if (opts.reduced) return;

    const nameIn = started ? entry * (1 - smooth(0.04, 0.11, p)) : 0;
    ui.name.style.opacity = nameIn.toFixed(3);
    ui.name.style.transform = `translate(-50%, ${(-50 - (1 - nameIn) * 20).toFixed(1)}%)`;
    const hi = smooth(0.19, 0.24, p) * (1 - smooth(0.3, 0.335, p));
    ui.hello.style.opacity = hi.toFixed(3);
    ui.hello.style.transform = `translateY(${((1 - hi) * 18).toFixed(1)}px)`;
    ui.here.style.opacity = (smooth(0.2, 0.26, p) * (1 - smooth(0.8, 0.84, p))).toFixed(3);

    // Le fil de navigation, en bas
    const navOn = smooth(0.22, 0.28, p);
    threadEl.style.opacity = navOn.toFixed(3);
    threadEl.style.visibility = navOn > 0.02 ? "visible" : "hidden";
    fillEl.style.transform = `scaleX(${clamp((p - thrK[0]) / span).toFixed(4)})`;
    let cur = 0;
    thrK.forEach((kp, i) => {
      if (p >= kp - 0.012) cur = i;
    });
    knotEls.forEach((el, i) => {
      el.classList.toggle("done", p >= thrK[i] - 0.012);
      el.classList.toggle("cur", i === cur && p > 0.24);
    });

    // La carte de l'étape la plus proche reste ouverte pendant la marche, reliée à son nœud par un trait ;
    // les autres étapes restent nommées sur la carte
    const layerBox = root.getBoundingClientRect();
    let near = -1;
    let nd = 0.14;
    STEPS.forEach((st, i) => {
      const d = Math.abs(walk + 0.035 - st.at);
      if (d < nd) {
        nd = d;
        near = i;
      }
    });
    const walking = p > P.walkA - 0.015 && p < P.walkB + 0.005;
    cards.forEach((cd, i) => cd.classList.toggle("big", walking && i === near));
    // Les étiquettes ne se posent ni sur le repère ni sur la carte ouverte
    const shield = [];
    if (guide.visible) {
      const top = guide.localToWorld(v.set(0, 1.9, 0)).project(cam);
      const tx = (top.x * 0.5 + 0.5) * W;
      const ty = (-top.y * 0.5 + 0.5) * H;
      shield.push({ l: tx - 70, r: tx + 70, t: ty - 36, b: ty + 150 });
    }
    cards.forEach((cd) => {
      if (!cd.classList.contains("big")) return;
      const b = cd.getBoundingClientRect();
      shield.push({ l: b.left - layerBox.left - 60, r: b.right - layerBox.left + 60, t: b.top - layerBox.top - 30, b: b.bottom - layerBox.top + 10 });
    });
    const shielded = (x, y) => shield.some((z) => x > z.l && x < z.r && y > z.t && y < z.b);
    let leadOn = false;
    STEPS.forEach((st, i) => {
      const active = cards[i].classList.contains("big");
      const at = project(knots[i].top);
      const tagOn = !active && at.ok && lift > 0.8 && p > P.walkA && p < 0.86 && !shielded(at.x, at.y);
      tags[i].classList.toggle("on", tagOn);
      tags[i].classList.toggle("done", walk >= st.at);
      tags[i].style.transform = `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px)`;
      if (active && at.ok) {
        const b = cards[i].getBoundingClientRect();
        const ax = portrait ? b.left + b.width / 2 - layerBox.left : b.left - layerBox.left;
        const ay = portrait ? b.bottom - layerBox.top : b.top + 34 - layerBox.top;
        leadLine.setAttribute("x1", ax.toFixed(1));
        leadLine.setAttribute("y1", ay.toFixed(1));
        leadLine.setAttribute("x2", at.x.toFixed(1));
        leadLine.setAttribute("y2", at.y.toFixed(1));
        leadDot.setAttribute("cx", at.x.toFixed(1));
        leadDot.setAttribute("cy", at.y.toFixed(1));
        leadOn = true;
      }
    });
    lead.classList.toggle("on", leadOn);

    // Les régions : nom, description et lien, au-dessus de leur objet ; le titre « Mes projets » au-dessus de la vue
    const hd = smooth(0.93, 0.98, p);
    headEl.style.opacity = hd.toFixed(3);
    headEl.style.transform = `translateY(${((1 - hd) * 16).toFixed(1)}px)`;
    REGIONS.forEach((r, i) => {
      const at = project(v.set(r.x, PLATEAU + 4.3, r.z).clone());
      const a = smooth(0.9 + i * 0.015, 0.96 + i * 0.015, p);
      const el = regionEls[i];
      el.style.opacity = at.ok ? a.toFixed(3) : 0;
      el.style.transform = `translate(${at.x.toFixed(1)}px, ${(at.y + (1 - a) * 14).toFixed(1)}px)`;
      el.style.visibility = a > 0.02 && at.ok ? "visible" : "hidden";
    });
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    if (started) clock += dt;
    draw(dt, now / 1000);
  }

  return {
    /** Lance l'entrée (le nom apparaît) : à appeler quand la porte de démarrage du site est ouverte. */
    start() {
      started = true;
    },
    setProgress(p) {
      progress = clamp(p);
      // Sans boucle en cours (mouvement réduit, onglet masqué), on redessine à la demande
      if (!running) draw(0.016, performance.now() / 1000);
    },
    /** Démarre ou met en pause la boucle (hors écran : aucun calcul). */
    run(on) {
      if (on === running) return;
      running = on;
      cancelAnimationFrame(raf);
      if (on) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      }
    },
    resize(w, h) {
      W = w;
      H = h;
      portrait = w / h < 0.9;
      // Définition plafonnée (2 et environ 4,5 millions de pixels) : un grand écran ne doit pas saturer la carte graphique
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.5e6 / (w * h))));
      renderer.setSize(w, h, false);
      renderer.domElement.style.width = `${w}px`;
      renderer.domElement.style.height = `${h}px`;
      cam.aspect = w / h;
      cam.fov = portrait ? 42 : 34;
      cam.updateProjectionMatrix();
      root.classList.toggle("is-portrait", portrait);
      lead.setAttribute("width", w);
      lead.setAttribute("height", h);
      if (!running) draw(0.016, performance.now() / 1000);
    },
    dispose() {
      cancelAnimationFrame(raf);
      running = false;
      marks.forEach((m) => m.o.dispose());
      if (envTex) envTex.dispose();
      renderer.toneMapping = prevTone;
      renderer.toneMappingExposure = prevExposure;
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
