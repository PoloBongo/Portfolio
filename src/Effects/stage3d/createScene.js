import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { subscribePerf } from "../perf";
import { buildController } from "./controller";
import { assemble, buildAttention, buildWebPage } from "./objects";
import { createIsolines } from "./isolines";

// Scène 3D persistante du site (un seul canvas, jamais recréé pendant la navigation), derrière le contenu :
//  - un fond de courbes de niveau (isolignes) teinté par l'acte ou le monde, sur toutes les pages ;
//  - dans le hero, un objet 3D par acte : page web éclatée (Web), attention (IA), manette (Jeu). Le passage d'un acte
//    à l'autre est un « désassemblage » : l'objet qui part se défait pièce par pièce, le suivant se recompose ;
//  - dans la section compétences, la manette en vue éclatée, avec ses annotations (onProject).
// L'interface reprend celle de l'ancien nuage de points (Stage.js n'a pas changé de contrat).

const FOV = 30;
const DIST = 18;
const MODEL_WIDTH = 8.3; // largeur de la manette dans son repère
const SHAPE_ACT = { browser: 0, network: 1, pad: 2 }; // forme demandée par Hero.js → objet
const TRANSITION = 1.9; // durée du désassemblage (s)
const NEUTRAL = [0.62, 0.34, 0.98];
const PAD_HERO_ROT = [-0.34, -0.5, 0.1];
const PAD_SKILLS_ROT = [-0.8, 0.24, 0.02];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const find = (selector) => document.querySelector(selector);

export async function createScene({ host, onProject, onFrame, reduced = false, getScene = () => "home" }) {
  // Les textures peintes en canvas (écran de la manette, couches de la page) utilisent les polices du site
  if (document.fonts && document.fonts.load) {
    try {
      await Promise.race([
        Promise.all([
          document.fonts.load('600 16px "JetBrains Mono Variable"'),
          document.fonts.load('700 40px "Bricolage Grotesque Variable"'),
        ]),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch (e) {
      // polices indisponibles : repli système
    }
  }

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const canvas = document.createElement("canvas");
  canvas.className = "stage__canvas";
  host.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !coarse, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    host.removeChild(canvas);
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, DIST);

  // Reflets : pièce d'éclairage de studio, puis des lumières colorées pour détacher les silhouettes
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.5;
  if (room.dispose) room.dispose();
  pmrem.dispose();
  const rim = new THREE.DirectionalLight(0xb98cff, 3.4);
  rim.position.set(-7, 5, -5);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(5, 7, 9);
  const accentLight = new THREE.PointLight(0xbc63ff, 45, 30, 2);
  accentLight.position.set(0, -2.5, 6);
  scene.add(rim, key, accentLight);

  // ---------- Fond et objets ----------
  const iso = createIsolines();
  scene.add(iso.mesh);
  const pulseTime = { value: 0 };
  const web = buildWebPage();
  const ai = buildAttention(pulseTime);
  const pad = buildController();
  const objects = [web, ai, { root: pad.root, width: MODEL_WIDTH }];
  const holders = objects.map((o) => {
    const holder = new THREE.Group();
    holder.visible = false;
    holder.add(o.root);
    scene.add(holder);
    return holder;
  });
  pad.update(0, 0, { explode: 0 });

  // ---------- Dimensions ----------
  let W = 1;
  let H = 1;
  let aspect = 1;
  const maxDpr = coarse ? 1.5 : 2;
  let dprCap = maxDpr;
  const applySize = () => {
    W = Math.max(1, host.clientWidth || window.innerWidth);
    H = Math.max(1, host.clientHeight || window.innerHeight);
    aspect = W / H;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    iso.uniforms.uRes.value.set(W * dpr, H * dpr);
  };
  applySize();
  const resizeObserver = new ResizeObserver(applySize);
  resizeObserver.observe(host);
  const offPerf = subscribePerf((fps) => {
    const next = fps < 38 ? 1 : maxDpr;
    if (next !== dprCap) {
      dprCap = next;
      applySize();
    }
  });

  // ---------- État ----------
  const state = { from: -1, to: -1, p: 1, start: 0 };
  const tint = { rgb: [...NEUTRAL], mix: 0, rgbTo: [...NEUTRAL], mixTo: 0, now: [...NEUTRAL] };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let warpTarget = 0;
  let warpValue = 0;
  let introValue = reduced ? 1 : 0;
  let introTarget = reduced ? 1 : 0;
  let hostElements = { hero: null, skills: null };
  let dirty = true;
  let lastScroll = -1;
  const explodeState = { explode: 0 };

  const measure = () => {
    hostElements = { hero: find(".hero"), skills: find("[data-stage='skills']") };
    dirty = true;
  };
  measure();

  // L'acte demandé avant l'ouverture du rideau du préloader attend : l'objet se construit sous les yeux du visiteur
  let started = reduced;
  let pendingAct = null;
  const startAct = (next) => {
    if (next === state.to) return;
    state.from = state.p >= 1 || state.p > 0.5 ? state.to : state.from;
    state.to = next;
    state.p = reduced ? 1 : 0;
    state.start = performance.now();
    dirty = true;
  };
  const setHeroShape = (shape) => {
    const next = SHAPE_ACT[shape] === undefined ? -1 : SHAPE_ACT[shape];
    if (started) startAct(next);
    else pendingAct = next;
  };
  const begin = () => {
    introTarget = 1;
    dirty = true;
    if (!started) {
      started = true;
      if (pendingAct !== null) startAct(pendingAct);
    }
  };
  const setTint = (rgb, mix) => {
    tint.rgbTo = rgb;
    tint.mixTo = mix;
    if (reduced) {
      tint.rgb = [...rgb];
      tint.mix = mix;
    }
    dirty = true;
  };

  // ---------- Pointeur ----------
  const onMove = (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
  };
  if (!reduced) window.addEventListener("pointermove", onMove, { passive: true });

  // ---------- Placement : position écran normalisée → plan z = 0, taille = fraction de la largeur de l'écran ----------
  const halfFov = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const place = (holder, index, nx, ny, size) => {
    const worldHeight = 2 * halfFov * DIST;
    const worldWidth = worldHeight * aspect;
    holder.position.set((nx - 0.5) * worldWidth, (0.5 - ny) * worldHeight, 0);
    holder.scale.setScalar((size * worldWidth) / objects[index].width);
  };

  const frameData = { show: 0, points: { web: { x: 0, y: 0 }, ai: { x: 0, y: 0 }, data: { x: 0, y: 0 }, game: { x: 0, y: 0 } } };
  const anchorWorld = new THREE.Vector3();
  const callouts = { web: pad.anchors.bumpers, ai: pad.anchors.screen, data: pad.anchors.sticks, game: pad.anchors.face };

  // ---------- Boucle ----------
  let time = 0;
  let last = performance.now();
  let raf = 0;
  let hidden = false;
  let heroPresenceSmooth = 0;
  const onVisibility = () => {
    hidden = document.hidden;
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const introFallback = setTimeout(begin, 5000);

  const applyU = (index, u, vis) => {
    const holder = holders[index];
    holder.visible = vis;
    if (index === 2) {
      explodeState.explode = Math.max(explodeState.explode, 1 - u);
      holder.scale.multiplyScalar(0.28 + 0.72 * smooth(u));
      holder.rotation.y += (1 - u) * 2.4;
    } else {
      assemble(objects[index].parts, u);
    }
  };

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (hidden) return;
    const dt = reduced ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    const scrollY = window.scrollY;
    const moving = state.p < 1 || Math.abs(introTarget - introValue) > 0.002 || Math.abs(warpTarget - warpValue) > 0.002 || scrollY !== lastScroll;
    lastScroll = scrollY;
    if (reduced && !dirty && !moving) return;
    dirty = false;

    introValue += (introTarget - introValue) * (reduced ? 1 : 1 - Math.exp(-dt * 2.4));
    warpValue += (warpTarget - warpValue) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
    if (state.p < 1) state.p = clamp((now - state.start) / 1000 / TRANSITION);
    const kt = reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    for (let i = 0; i < 3; i += 1) tint.rgb[i] += (tint.rgbTo[i] - tint.rgb[i]) * kt;
    tint.mix += (tint.mixTo - tint.mix) * kt;
    for (let i = 0; i < 3; i += 1) tint.now[i] = NEUTRAL[i] + (tint.rgb[i] - NEUTRAL[i]) * tint.mix;
    pointer.x += (pointer.tx - pointer.x) * (reduced ? 0 : 1 - Math.exp(-dt * 4));
    pointer.y += (pointer.ty - pointer.y) * (reduced ? 0 : 1 - Math.exp(-dt * 4));
    pulseTime.value = time;

    // ----- Où est-on ? -----
    const onHome = getScene() === "home";
    let heroPresence = 0;
    let heroShift = 0;
    if (onHome && hostElements.hero) {
      const r = hostElements.hero.getBoundingClientRect();
      heroShift = Math.min(0, r.bottom - H) / H;
      heroPresence = r.bottom > -0.25 * H ? 1 : 0;
    }
    let skillsPresence = 0;
    let skillsRect = null;
    if (onHome && hostElements.skills) {
      skillsRect = hostElements.skills.getBoundingClientRect();
      const offCentre = Math.abs((skillsRect.top + skillsRect.bottom) / 2 - H / 2);
      skillsPresence = smooth(1 - clamp((offCentre - 0.1 * H) / (0.55 * H)));
    }
    const small = W < 900;

    holders.forEach((h) => {
      h.visible = false;
      h.rotation.set(0, 0, 0);
    });
    explodeState.explode = 0;

    const tiltX = pointer.y * 0.12 + Math.sin(time * 0.31) * 0.04;
    const tiltY = pointer.x * 0.35 + Math.sin(time * 0.42) * 0.14;

    if (skillsPresence > 0.01 && skillsRect) {
      // compétences : la manette en vue éclatée, ses annotations suivent ses pièces
      const holder = holders[2];
      place(holder, 2, (skillsRect.left + skillsRect.width / 2) / W, (skillsRect.top + skillsRect.height / 2) / H, (skillsRect.width / W) * (small ? 0.8 : 0.66));
      holder.visible = true;
      holder.rotation.set(PAD_SKILLS_ROT[0] + tiltX * 0.5, PAD_SKILLS_ROT[1] + tiltY * 0.5, PAD_SKILLS_ROT[2]);
      explodeState.explode = smooth(clamp((skillsPresence - 0.2) / 0.8));
    } else if (heroPresence) {
      // hero : l'objet de l'acte, ou deux objets pendant le désassemblage
      const nx = small ? 0.5 : 0.7;
      const ny = (small ? 0.3 : 0.62) + heroShift;
      const size = small ? 0.9 : 0.46;
      const { from, to, p } = state;
      const showOut = p < 1 && from >= 0;
      const outU = 1 - clamp(p / 0.6);
      const inU = from < 0 ? clamp(p / 0.7) : clamp((p - 0.36) / 0.64);
      [from, to].forEach((index) => {
        if (index < 0 || (index === from && !showOut && index !== to)) return;
        const holder = holders[index];
        place(holder, index, nx, ny, size);
        if (index === 2) holder.rotation.set(PAD_HERO_ROT[0] + tiltX, PAD_HERO_ROT[1] + tiltY * 0.6, PAD_HERO_ROT[2]);
        else holder.rotation.set(tiltX, tiltY, 0);
        const u = p >= 1 ? 1 : index === to && index !== from ? inU : outU;
        applyU(index, u, true);
      });
      camera.position.z = DIST - 1.4 * Math.sin(Math.PI * state.p) * (p < 1 ? 1 : 0);
    }
    if (!(heroPresence && state.p < 1)) camera.position.z = DIST;

    // La manette garde ses propres animations (écran, éclat) : on lui donne son éclatement du moment
    pad.update(dt, time, { explode: explodeState.explode });

    // ----- Couleurs et fond -----
    const accent = tint.now;
    accentLight.color.setRGB(accent[0], accent[1], accent[2], THREE.SRGBColorSpace);
    iso.uniforms.uColor.value.set(accent[0], accent[1], accent[2]);
    iso.uniforms.uTime.value = time;
    iso.uniforms.uPointer.value.set(pointer.x, pointer.y);
    iso.uniforms.uScroll.value = scrollY;
    heroPresenceSmooth += ((heroPresence ? 1 : 0) - heroPresenceSmooth) * (reduced ? 1 : 1 - Math.exp(-dt * 3));
    iso.uniforms.uOpacity.value = (0.55 + 0.45 * heroPresenceSmooth) * introValue;
    iso.uniforms.uSpeed.value = 1 + warpValue * 3;
    camera.fov = FOV + warpValue * 9;
    camera.updateProjectionMatrix();

    if (onFrame) onFrame({ aurora: (0.45 + 0.55 * heroPresenceSmooth) * clamp(introValue / 0.6) });

    if (onProject) {
      frameData.show = skillsRect ? clamp((explodeState.explode - 0.75) / 0.25) * smooth(skillsPresence) * introValue : 0;
      if (frameData.show > 0.001) {
        Object.keys(callouts).forEach((name) => {
          callouts[name].getWorldPosition(anchorWorld);
          anchorWorld.project(camera);
          frameData.points[name].x = (anchorWorld.x * 0.5 + 0.5) * W;
          frameData.points[name].y = (-anchorWorld.y * 0.5 + 0.5) * H;
        });
      }
      onProject(frameData);
    }

    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  const instance = {
    setFocus() {},
    setHeroShape,
    setTint,
    warp(amount) {
      warpTarget = amount;
      dirty = true;
    },
    measure,
    intro: begin,
    debug() {
      return { act: state.to, from: state.from, p: state.p, intro: introValue, tint: [...tint.now], explode: explodeState.explode };
    },
    dispose() {
      cancelAnimationFrame(raf);
      clearTimeout(introFallback);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      resizeObserver.disconnect();
      offPerf();
      web.dispose();
      ai.dispose();
      pad.dispose();
      iso.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
  };
  return instance;
}
