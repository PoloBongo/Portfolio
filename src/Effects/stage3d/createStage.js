import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { gsap } from "../motion";
import { subscribePerf } from "../perf";
import { playNote } from "../sound";
import { setCursorOverride } from "../Cursor";
import { buildController, COLORS } from "./controller";

const FOV = 30;
const DIST = 18;
const MODEL_WIDTH = 8.3;
const FLOOR_Y = -3.25;
const FIELDS = ["nx", "ny", "size", "rx", "ry", "rz", "explode", "show", "floor"];
const GLYPHS = { "face-top": "●", "face-right": "○", "face-bottom": "▬", "face-left": "^" };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const INTERACTIVE = 'a, button, input, textarea, select, summary, [role="button"], [data-cursor]';

const FLOOR_VERTEX = `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Sol de « viewport » : grille fine + grille majeure fondues en cercle, anneau qui s'étend à chaque pression
const FLOOR_FRAGMENT = `
uniform float uTime;
uniform float uOpacity;
uniform float uRadius;
uniform float uPulse;
uniform vec3 uColor;
varying vec3 vPos;

float gridLine(vec2 p, float cell) {
  vec2 q = p / cell;
  vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
  return 1.0 - clamp(min(g.x, g.y), 0.0, 1.0);
}

void main() {
  vec2 p = vPos.xy;
  float d = length(p);
  float fine = gridLine(p, 1.0);
  float major = gridLine(p, 5.0);
  float fade = 1.0 - smoothstep(uRadius * 0.22, uRadius, d);

  float idleR = mod(uTime * 1.6, uRadius);
  float idle = smoothstep(0.5, 0.0, abs(d - idleR)) * (1.0 - idleR / uRadius) * 0.35;

  float pulseR = uPulse * uRadius * 0.9;
  float pulse = smoothstep(0.7, 0.0, abs(d - pulseR)) * (1.0 - uPulse) * step(uPulse, 0.999) * 0.9;

  float a = (fine * 0.2 + major * 0.5 + idle + pulse) * fade * uOpacity;
  gl_FragColor = vec4(uColor, a);
  #include <colorspace_fragment>
}
`;

function radialTexture(stops) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const g = canvas.getContext("2d");
  const gradient = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
  g.fillStyle = gradient;
  g.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Scène 3D de l'accueil : manette procédurale posée sur un sol de viewport, pilotée par le scroll.
// getKeys() renvoie les poses clés (section + fraction + position/rotation/éclatement) ;
// onProject() reçoit à chaque image la position écran des pièces annotées.
export async function createStage({ host, getKeys, onProject, reduced = false }) {
  // La police mono sert aux textures peintes en canvas (écran, marquages)
  if (document.fonts && document.fonts.load) {
    try {
      await Promise.race([
        document.fonts.load('600 16px "JetBrains Mono Variable"'),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch (e) {
      // police indisponible : repli monospace
    }
  }

  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const canvas = document.createElement("canvas");
  canvas.className = "stage__canvas";
  host.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !coarse,
      alpha: true,
      powerPreference: "high-performance",
    });
  } catch (e) {
    host.removeChild(canvas);
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 2.4, DIST);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld(true);

  // Reflets : pièce d'éclairage de studio, puis deux lumières colorées pour détacher la silhouette
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.5;
  if (room.dispose) room.dispose();
  pmrem.dispose();

  const rim = new THREE.DirectionalLight(0xb98cff, 3.4);
  rim.position.set(-7, 5, -5);
  scene.add(rim);
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(5, 7, 9);
  scene.add(key);
  const under = new THREE.PointLight(COLORS.violet, 45, 30, 2);
  under.position.set(0, -2.5, 4);
  scene.add(under);

  // ---------- Objets ----------
  const stageGroup = new THREE.Group();
  scene.add(stageGroup);
  const controller = buildController();
  stageGroup.add(controller.root);

  const floorMat = new THREE.ShaderMaterial({
    vertexShader: FLOOR_VERTEX,
    fragmentShader: FLOOR_FRAGMENT,
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uRadius: { value: 12 },
      uPulse: { value: 1 },
      uColor: { value: new THREE.Color(COLORS.violet) },
    },
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12, 96), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = FLOOR_Y;
  stageGroup.add(floor);

  const glowTexture = radialTexture([
    [0, "rgba(255,255,255,0.9)"],
    [0.4, "rgba(255,255,255,0.28)"],
    [1, "rgba(255,255,255,0)"],
  ]);
  const underGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(11, 5.5),
    new THREE.MeshBasicMaterial({
      map: glowTexture,
      color: COLORS.violet,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  underGlow.rotation.x = -Math.PI / 2;
  underGlow.position.y = FLOOR_Y + 0.02;
  stageGroup.add(underGlow);

  // Poussière en suspension (desktop seulement)
  let dust = null;
  if (!coarse) {
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 2] = -12 + Math.random() * 20;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    dust = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.12,
        map: glowTexture,
        color: 0xcaa6ff,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    scene.add(dust);
  }

  // ---------- Dimensions ----------
  let W = 1;
  let H = 1;
  let dpr = 1;
  const maxDpr = coarse ? 1.5 : 2;
  const targetDpr = Math.min(window.devicePixelRatio || 1, maxDpr);
  dpr = targetDpr;

  // ---------- Poses clés pilotées par le scroll ----------
  let table = [];
  const measure = () => {
    const vh = window.innerHeight;
    table = getKeys()
      .filter((k) => k.section)
      .map((k) => {
        const rect = k.section.getBoundingClientRect();
        return { ...k, at: rect.top + window.scrollY + k.f * rect.height - vh / 2 };
      })
      .sort((a, b) => a.at - b.at);
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
    out.explode = k.explode;
    out.show = k.show;
    out.floor = k.floor;
  };

  const makeState = () => ({ nx: 0.7, ny: 0.5, size: 0.5, rx: 0, ry: 0, rz: 0, explode: 0, show: 0, floor: 0 });
  const cur = makeState();
  const tgt = makeState();
  const keyA = makeState();
  const keyB = makeState();
  const FALLBACK = { x: 0.7, y: 0.5, size: 0.5, rot: [-0.34, -0.5, 0.1], explode: 0, show: 1, floor: 1 };

  const sampleInto = (s, out) => {
    const n = table.length;
    if (n === 0) {
      keyInto(FALLBACK, out);
      return;
    }
    if (s <= table[0].at) {
      keyInto(table[0], out);
      return;
    }
    if (s >= table[n - 1].at) {
      keyInto(table[n - 1], out);
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
  };

  // Position écran normalisée → plan z = 0, échelle pour occuper une fraction `size` de la largeur
  const ray = new THREE.Raycaster();
  ray.params.Line.threshold = 0.04;
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const toPoint = new THREE.Vector3();
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

  // ---------- Pointeur ----------
  const pointer = { nx: 0.5, ny: 0.5, tx: 0, ty: 0, sx: 0, sy: 0, moved: false, active: false, target: null };
  const drag = { on: false, x: 0, y: 0, rx: 0, ry: 0, vx: 0, vy: 0 };
  let hovered = null;
  let highlight = null;
  let pulse = 1;
  let introValue = reduced ? 1 : 0;

  const setHovered = (part) => {
    if (part === hovered) return;
    if (hovered) hovered.hoverTarget = 0;
    hovered = part;
    if (part) part.hoverTarget = 1;
    setCursorOverride(part ? "play" : null, part ? "Press" : "");
  };

  const pick = (objects) => {
    ndc.set(pointer.nx * 2 - 1, -(pointer.ny * 2 - 1));
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(objects, true);
    return hits.length ? hits[0] : null;
  };

  const onMove = (e) => {
    pointer.nx = e.clientX / W;
    pointer.ny = e.clientY / H;
    pointer.target = e.target;
    pointer.active = true;
    pointer.moved = true;
    if (e.pointerType === "touch") return;
    pointer.tx = clamp((pointer.nx - 0.5) * 2, -1, 1);
    pointer.ty = clamp((pointer.ny - 0.5) * 2, -1, 1);
    if (drag.on) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag.x = e.clientX;
      drag.y = e.clientY;
      drag.ry += dx * 0.012;
      drag.rx = clamp(drag.rx + dy * 0.01, -1.1, 1.1);
      drag.vy = dx * 0.012 * 60;
    }
  };

  const press = (part) => {
    part.press = 1;
    playNote(part.note == null ? 0 : part.note);
    controller.screen.flash(GLYPHS[part.name] || part.name.slice(0, 2).toUpperCase(), elapsed);
    pulse = 0;
    window.dispatchEvent(new CustomEvent("stage:press", { detail: { part: part.name } }));
  };

  const onDown = (e) => {
    if (e.button > 0 || cur.show < 0.5 || !stageGroup.visible) return;
    if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
    pointer.nx = e.clientX / W;
    pointer.ny = e.clientY / H;
    const buttonHit = pick(controller.pressables);
    if (buttonHit) {
      press(buttonHit.object.userData.part);
      return;
    }
    if (e.pointerType !== "touch" && pick([controller.group])) {
      drag.on = true;
      drag.x = e.clientX;
      drag.y = e.clientY;
      document.body.classList.add("is-dragging");
    }
  };

  const onUp = () => {
    if (!drag.on) return;
    drag.on = false;
    document.body.classList.remove("is-dragging");
  };

  const onLeave = () => {
    pointer.tx = 0;
    pointer.ty = 0;
    pointer.active = false;
    setHovered(null);
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
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    measure();
  };

  // ---------- Boucle ----------
  let elapsed = 0;
  let wasVisible = false;
  let disposed = false;
  let lowStreak = 0;
  const v = new THREE.Vector3();
  const frame = { show: 0, points: {} };
  const controls = { explode: 0, highlight: null };
  Object.keys(controller.anchors).forEach((name) => {
    frame.points[name] = { x: 0, y: 0 };
  });

  const update = (dt, rendering = true) => {
    sampleInto(window.scrollY, tgt);
    const follow = reduced ? 1 : 1 - Math.exp(-dt * 6);
    for (let f = 0; f < FIELDS.length; f += 1) {
      const name = FIELDS[f];
      cur[name] += (tgt[name] - cur[name]) * follow;
    }

    pointer.sx += (pointer.tx - pointer.sx) * (1 - Math.exp(-dt * 4));
    pointer.sy += (pointer.ty - pointer.sy) * (1 - Math.exp(-dt * 4));

    // Inertie du glisser, puis retour doux vers la pose pilotée par le scroll
    if (!drag.on) {
      drag.ry += drag.vy * dt;
      drag.vy *= Math.exp(-dt * 3.5);
      const back = 1 - Math.exp(-dt * 1.6);
      drag.rx -= drag.rx * back;
      drag.ry -= drag.ry * back;
    }

    place(cur.nx, cur.ny, cur.size);
    const intro = easeInOut(clamp(introValue));
    const scale = placement.scale * clamp(cur.show) * intro;
    stageGroup.position.copy(placement.pos);
    stageGroup.scale.setScalar(Math.max(scale, 0.0001));
    stageGroup.visible = scale > 0.004;

    const calm = reduced ? 0 : 1;
    controller.group.rotation.set(
      cur.rx + pointer.sy * 0.16 + Math.sin(elapsed * 0.7) * 0.03 * calm + drag.rx,
      cur.ry + pointer.sx * 0.34 + (1 - intro) * 2.6 + drag.ry,
      cur.rz + Math.sin(elapsed * 0.55) * 0.02 * calm - pointer.sx * 0.04
    );
    controller.root.position.y = Math.sin(elapsed * 0.9) * 0.14 * calm;

    // Survol des boutons 3D (le pointeur reste inerte sur les liens de la page)
    if (pointer.moved && !reduced) {
      pointer.moved = false;
      const overLink = pointer.target instanceof Element && pointer.target.closest(INTERACTIVE);
      if (stageGroup.visible && cur.show > 0.5 && !drag.on && !overLink) {
        const result = pick(controller.pressables);
        setHovered(result ? result.object.userData.part : null);
      } else if (!drag.on) {
        setHovered(null);
      }
    }

    controls.explode = cur.explode;
    controls.highlight = highlight;
    controller.update(dt, elapsed, controls);
    controller.root.updateMatrixWorld(true);

    floorMat.uniforms.uTime.value = elapsed;
    floorMat.uniforms.uOpacity.value = clamp(cur.floor);
    if (pulse < 1) pulse = Math.min(1, pulse + dt * 1.1);
    floorMat.uniforms.uPulse.value = pulse;
    underGlow.material.opacity = clamp(cur.floor) * (0.34 + cur.explode * 0.12 + (1 - pulse) * 0.3);
    floor.visible = cur.floor > 0.01;
    underGlow.visible = floor.visible;

    if (dust) {
      dust.visible = stageGroup.visible;
      dust.rotation.y = elapsed * 0.012;
      dust.position.x = pointer.sx * -0.35;
      dust.position.y = pointer.sy * 0.2;
    }

    if (onProject) {
      frame.show = clamp((cur.explode - 0.75) / 0.25) * clamp(cur.show) * intro;
      const names = Object.keys(controller.anchors);
      for (let i = 0; i < names.length; i += 1) {
        controller.anchors[names[i]].getWorldPosition(v);
        v.project(camera);
        frame.points[names[i]].x = (v.x * 0.5 + 0.5) * W;
        frame.points[names[i]].y = (-v.y * 0.5 + 0.5) * H;
      }
      onProject(frame);
    }

    if (!rendering) return;
    if (stageGroup.visible) {
      if (!wasVisible) canvas.style.visibility = "visible";
      renderer.render(scene, camera);
      wasVisible = true;
    } else if (wasVisible) {
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

  // Qualité adaptative : si le rendu tombe sous 38 i/s plusieurs mesures de suite, on baisse la résolution
  const stopPerf = subscribePerf((fps) => {
    lowStreak = fps < 38 ? lowStreak + 1 : 0;
    if (lowStreak >= 3 && dpr > 1) {
      dpr = Math.max(1, dpr - 0.25);
      lowStreak = 0;
      renderer.setPixelRatio(dpr);
      renderer.setSize(W, H, false);
    }
  });

  // ---------- Démarrage ----------
  resize();
  controller.update(0, 0, { explode: 0 });
  stageGroup.visible = true;
  stageGroup.scale.setScalar(0.0001);
  try {
    await renderer.compileAsync(scene, camera);
  } catch (e) {
    // la compilation à la volée du premier rendu prend le relais
  }
  if (disposed) return null;
  introValue = reduced ? 1 : 0;
  sampleInto(window.scrollY, cur);
  update(0.016);

  const listeners = [];
  const listen = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  };

  listen(window, "resize", resize);
  if (!reduced) {
    listen(window, "pointermove", onMove, { passive: true });
    listen(window, "pointerdown", onDown);
    listen(window, "pointerup", onUp);
    listen(window, "pointercancel", onUp);
    listen(document.documentElement, "mouseleave", onLeave);
    gsap.ticker.add(tick);
  } else {
    update(0.016);
  }

  const api = {
    measure,
    // Aides au debug (console) : window.__stage.debug() / .settle() (converge sans attendre le lissage)
    settle: () => {
      for (let i = 0; i < 40; i += 1) update(0.1, false);
      update(0.016);
    },
    debug: () => ({
      W,
      H,
      dpr,
      cur: { ...cur },
      tgt: { ...tgt },
      table: table.map((k) => ({ at: Math.round(k.at), f: k.f, anchor: !!k.anchor })),
      scale: placement.scale,
      pos: placement.pos.toArray(),
      scrollY: window.scrollY,
      points: JSON.parse(JSON.stringify(frame.points)),
      hovered: hovered ? hovered.name : null,
    }),
    // Entrée en scène : la manette arrive en tournant quand le rideau du préloader se lève
    intro: () => {
      if (reduced) return;
      const progress = { v: 0 };
      gsap.to(progress, {
        v: 1,
        duration: 2.2,
        ease: "power2.out",
        onUpdate: () => {
          introValue = progress.v;
        },
      });
    },
    setTitle: (title) => controller.screen.setTitle(title),
    setXp: (xp) => controller.screen.setXp(xp),
    setHighlight: (name) => {
      highlight = name;
    },
    dispose: () => {
      disposed = true;
      gsap.ticker.remove(tick);
      stopPerf();
      listeners.forEach((off) => off());
      setCursorOverride(null);
      document.body.classList.remove("is-dragging");
      controller.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const list = Array.isArray(object.material) ? object.material : [object.material];
          list.forEach((m) => m.dispose());
        }
      });
      glowTexture.dispose();
      if (scene.environment) scene.environment.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
  };
  return api;
}
