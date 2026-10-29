import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { subscribePerf } from "../perf";
import { buildController } from "./controller";
import { assemble, buildAttention, buildWebPage } from "./objects";
import { createIsolines } from "./isolines";
import { setCursorHint } from "../cursorBus";

// Scène 3D persistante du site (un seul canvas, jamais recréé pendant la navigation), derrière le contenu :
//  - un fond de courbes de niveau (isolignes) teinté par l'acte ou le monde, sur toutes les pages ;
//  - dans le hero, un objet 3D par acte : page web éclatée (Web), attention (IA), manette (Jeu). Le passage d'un acte
//    à l'autre est un « désassemblage » : l'objet qui part se défait pièce par pièce, le suivant se recompose ;
//  - dans la section compétences, la manette en vue éclatée, avec ses annotations (onProject).
//  - ces objets se font tourner à la souris (glisser) et reviennent à leur place par un ressort amorti.
// L'interface reprend celle de l'ancien nuage de points (Stage.js n'a pas changé de contrat).

const FOV = 30;
const DIST = 18;
const MODEL_WIDTH = 8.3; // largeur de la manette dans son repère
const SHAPE_ACT = { browser: 0, network: 1, pad: 2 }; // forme demandée par Hero.js → objet
const TRANSITION = 1.9; // durée du désassemblage (s)
const NEUTRAL = [0.62, 0.34, 0.98];
const PAD_HERO_ROT = [-0.34, -0.5, 0.1];
const PAD_SKILLS_ROT = [-0.8, 0.24, 0.02];
// Rotation à la main : ce qui a son propre geste ne lance jamais une rotation ; ressort de rappel (amortissement ≈ 0,5)
const GRAB_IGNORED = 'a[href], button, input, textarea, select, summary, label, [role="button"], [data-no-grab]';
const SPRING_K = 55;
const SPRING_C = 7.5;
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (t) => t * t * (3 - 2 * t);
const find = (selector) => document.querySelector(selector);
// Réciproque du plafond doux (tanh) : angle brut qui donne l'angle courant
const unclamp = (a, max) => max * Math.atanh(Math.max(-0.98, Math.min(0.98, a / max)));

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
  const pointerState = { x: -1, y: -1, ui: false, inside: false };
  const onMove = (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    pointerState.x = event.clientX;
    pointerState.y = event.clientY;
    pointerState.inside = event.pointerType !== "touch";
    pointerState.ui = event.target instanceof Element && !!event.target.closest(GRAB_IGNORED);
  };
  const onLeave = () => {
    pointerState.inside = false;
  };
  if (!reduced) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
  }

  // ---------- Rotation à la main, avec retour au centre ----------
  // Un ressort amorti par objet (hero, compétences) : pendant le glisser l'angle suit la main à travers un
  // plafond doux (tanh : on peut tourner franchement mais l'objet résiste), au lâcher il repart vers 0 avec l'élan du
  // geste et un léger dépassement. La rotation est faite autour des axes de l'écran, par-dessus la pose de l'objet.
  const makeSpring = (maxYaw, maxPitch) => ({ maxYaw, maxPitch, rawYaw: 0, rawPitch: 0, yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, held: false });
  const springs = { hero: makeSpring(1.25, 0.75), skills: makeSpring(0.9, 0.5) };
  // Zones écran où le glisser prend l'objet (en pixels de la fenêtre), mises à jour par la boucle d'image
  const makeZone = () => ({ on: false, cx: 0, cy: 0, rx: 1, ry: 1 });
  const zones = { hero: makeZone(), skills: makeZone() };
  const zoneKeys = ["hero", "skills"];
  let grab = null;
  let grabAmount = 0;
  let grabLabel = "";
  let lastHint;

  const insideZone = (z, x, y) => {
    const dx = (x - z.cx) / z.rx;
    const dy = (y - z.cy) / z.ry;
    return dx * dx + dy * dy <= 1;
  };
  const zoneAt = (x, y) => zoneKeys.find((key) => zones[key].on && insideZone(zones[key], x, y));

  const stepSpring = (s, dt) => {
    if (s.held) {
      const k = 1 - Math.exp(-dt * 28);
      const ny = s.yaw + (s.maxYaw * Math.tanh(s.rawYaw / s.maxYaw) - s.yaw) * k;
      const np = s.pitch + (s.maxPitch * Math.tanh(s.rawPitch / s.maxPitch) - s.pitch) * k;
      if (dt > 0) {
        s.vYaw += ((ny - s.yaw) / dt - s.vYaw) * 0.35;
        s.vPitch += ((np - s.pitch) / dt - s.vPitch) * 0.35;
      }
      s.yaw = ny;
      s.pitch = np;
      return;
    }
    const steps = Math.max(1, Math.ceil(dt / 0.008));
    const h = dt / steps;
    for (let i = 0; i < steps; i += 1) {
      s.vYaw += (-SPRING_K * s.yaw - SPRING_C * s.vYaw) * h;
      s.vPitch += (-SPRING_K * s.pitch - SPRING_C * s.vPitch) * h;
      s.yaw += s.vYaw * h;
      s.pitch += s.vPitch * h;
    }
    if (Math.abs(s.yaw) + Math.abs(s.pitch) + Math.abs(s.vYaw) + Math.abs(s.vPitch) < 0.0008) {
      s.yaw = 0;
      s.pitch = 0;
      s.vYaw = 0;
      s.vPitch = 0;
    }
  };

  const qYaw = new THREE.Quaternion();
  const qPitch = new THREE.Quaternion();
  // Pose de l'objet puis rotation de l'utilisateur (axes de l'écran) : à appeler une fois la pose posée
  const applySpring = (holder, s, extraYaw = 0) => {
    qYaw.setFromAxisAngle(AXIS_Y, s.yaw + extraYaw);
    qPitch.setFromAxisAngle(AXIS_X, s.pitch);
    holder.quaternion.premultiply(qYaw).premultiply(qPitch);
  };

  const onGrabDown = (event) => {
    // Au doigt rien ne tourne : les objets sont derrière le texte et le défilement prime
    if (reduced || event.pointerType === "touch" || event.button !== 0 || !event.isPrimary || grab) return;
    if (event.target instanceof Element && event.target.closest(GRAB_IGNORED)) return;
    const key = zoneAt(event.clientX, event.clientY);
    if (!key) return;
    grab = { key, id: event.pointerId, x0: event.clientX, y0: event.clientY, x: event.clientX, y: event.clientY, moved: false };
  };
  const onGrabMove = (event) => {
    if (!grab || event.pointerId !== grab.id) return;
    const s = springs[grab.key];
    if (!grab.moved) {
      // Sous 5 px c'est encore un clic ; sur tactile un geste vertical devient un défilement (pointercancel)
      if (Math.hypot(event.clientX - grab.x0, event.clientY - grab.y0) < 5) return;
      grab.moved = true;
      s.held = true;
      s.rawYaw = unclamp(s.yaw, s.maxYaw);
      s.rawPitch = unclamp(s.pitch, s.maxPitch);
      document.documentElement.classList.add("is-grabbing");
    }
    s.rawYaw += (event.clientX - grab.x) * 0.0075;
    s.rawPitch += (event.clientY - grab.y) * 0.0062;
    grab.x = event.clientX;
    grab.y = event.clientY;
    const selection = window.getSelection && window.getSelection();
    if (selection && !selection.isCollapsed) selection.removeAllRanges();
  };
  const endGrab = () => {
    if (!grab) return;
    const done = grab;
    grab = null;
    document.documentElement.classList.remove("is-grabbing");
    if (!done.moved) return;
    const s = springs[done.key];
    s.held = false;
    s.vYaw = clamp(s.vYaw, -9, 9);
    s.vPitch = clamp(s.vPitch, -9, 9);
    // Le clic qui suit un glisser n'en est pas un (lien, copie d'un texte…)
    const swallow = (e) => {
      e.stopPropagation();
      e.preventDefault();
    };
    window.addEventListener("click", swallow, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", swallow, true), 80);
  };
  if (!reduced) {
    window.addEventListener("pointerdown", onGrabDown, { passive: true });
    window.addEventListener("pointermove", onGrabMove, { passive: true });
    window.addEventListener("pointerup", endGrab);
    window.addEventListener("pointercancel", endGrab);
    window.addEventListener("blur", endGrab);
  }

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
    if (!reduced) {
      zoneKeys.forEach((key) => {
        stepSpring(springs[key], dt);
        zones[key].on = false;
      });
      grabAmount += ((grab && grab.moved ? 1 : 0) - grabAmount) * (1 - Math.exp(-dt * 8));
    }

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

    // L'inclinaison au curseur s'efface pendant qu'on tient l'objet : la main commande
    const calm = 1 - 0.9 * grabAmount;
    const tiltX = (pointer.y * 0.12 + Math.sin(time * 0.31) * 0.04) * calm;
    const tiltY = (pointer.x * 0.35 + Math.sin(time * 0.42) * 0.14) * calm;

    if (skillsPresence > 0.01 && skillsRect) {
      // compétences : la manette en vue éclatée, ses annotations suivent ses pièces
      const holder = holders[2];
      place(holder, 2, (skillsRect.left + skillsRect.width / 2) / W, (skillsRect.top + skillsRect.height / 2) / H, (skillsRect.width / W) * (small ? 0.8 : 0.66));
      holder.visible = true;
      holder.rotation.set(PAD_SKILLS_ROT[0] + tiltX * 0.5, PAD_SKILLS_ROT[1] + tiltY * 0.5, PAD_SKILLS_ROT[2]);
      explodeState.explode = smooth(clamp((skillsPresence - 0.2) / 0.8));
      applySpring(holder, springs.skills);
      const zs = zones.skills;
      zs.on = skillsPresence > 0.5 && explodeState.explode > 0.4;
      zs.cx = skillsRect.left + skillsRect.width / 2;
      zs.cy = skillsRect.top + skillsRect.height / 2;
      zs.rx = skillsRect.width * (small ? 0.4 : 0.33);
      zs.ry = Math.min(zs.rx * 0.9, skillsRect.height * 0.46);
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
        applySpring(holder, springs.hero);
      });
      const zh = zones.hero;
      zh.on = state.p >= 0.85 && introValue > 0.9 && to >= 0;
      zh.cx = nx * W;
      zh.cy = ny * H;
      zh.rx = size * W * 0.52;
      zh.ry = Math.min(size * W * 0.42, H * 0.45);
      camera.position.z = DIST - 1.4 * Math.sin(Math.PI * state.p) * (p < 1 ? 1 : 0);
    }
    if (!(heroPresence && state.p < 1)) camera.position.z = DIST;

    // Curseur : « tourner » au-dessus d'un objet qu'on peut prendre (pas par-dessus un lien ou un bouton)
    if (!reduced) {
      const over = !grab && !pointerState.ui && pointerState.inside && !!zoneAt(pointerState.x, pointerState.y);
      const want = over || (grab && grab.moved) ? "drag" : null;
      if (want !== lastHint) {
        lastHint = want;
        setCursorHint(want, grabLabel);
      }
    }

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
    setGrabLabel(text) {
      grabLabel = text;
      lastHint = undefined;
    },
    intro: begin,
    debug() {
      return { act: state.to, from: state.from, p: state.p, intro: introValue, tint: [...tint.now], explode: explodeState.explode, springs, zones, grabbing: !!grab };
    },
    dispose() {
      cancelAnimationFrame(raf);
      clearTimeout(introFallback);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("pointerdown", onGrabDown);
      window.removeEventListener("pointermove", onGrabMove);
      window.removeEventListener("pointerup", endGrab);
      window.removeEventListener("pointercancel", endGrab);
      window.removeEventListener("blur", endGrab);
      document.documentElement.classList.remove("is-grabbing");
      setCursorHint(null);
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
