import * as THREE from "three";
import { subscribePerf } from "../perf";
import { createIsolines } from "./isolines";

// Scène 3D persistante du site (un seul canvas, jamais recréé pendant la navigation), derrière le contenu :
// un fond de courbes de niveau (isolignes) teinté par la page ou le monde, sur toutes les pages. Les objets 3D de
// l'accueil (page éclatée, attention, manette) vivent désormais dans la carte de l'accueil (Effects/carte/scene.js) :
// cette scène n'en construit plus aucun.

const FOV = 30;
const DIST = 18;
const NEUTRAL = [0.62, 0.34, 0.98];

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export async function createScene({ host, onFrame, reduced = false }) {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
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

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, DIST);

  const iso = createIsolines();
  scene.add(iso.mesh);

  // ---------- Dimensions ----------
  const maxDpr = coarse ? 1.5 : 2;
  let dprCap = maxDpr;
  const applySize = () => {
    const W = Math.max(1, host.clientWidth || window.innerWidth);
    const H = Math.max(1, host.clientHeight || window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
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
  const tint = { rgb: [...NEUTRAL], mix: 0, rgbTo: [...NEUTRAL], mixTo: 0, now: [...NEUTRAL] };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let warpTarget = 0;
  let warpValue = 0;
  let introValue = reduced ? 1 : 0;
  let introTarget = reduced ? 1 : 0;
  let dirty = true;
  let lastScroll = -1;

  const begin = () => {
    introTarget = 1;
    dirty = true;
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

  const onMove = (event) => {
    pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
  };
  if (!reduced) window.addEventListener("pointermove", onMove, { passive: true });

  // ---------- Boucle ----------
  let time = 0;
  let last = performance.now();
  let raf = 0;
  let hidden = false;
  const onVisibility = () => {
    hidden = document.hidden;
    last = performance.now();
  };
  document.addEventListener("visibilitychange", onVisibility);
  const introFallback = setTimeout(begin, 5000);

  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    if (hidden) return;
    const dt = reduced ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;

    const scrollY = window.scrollY;
    const moving = Math.abs(introTarget - introValue) > 0.002 || Math.abs(warpTarget - warpValue) > 0.002 || scrollY !== lastScroll;
    lastScroll = scrollY;
    if (reduced && !dirty && !moving) return;
    dirty = false;

    introValue += (introTarget - introValue) * (reduced ? 1 : 1 - Math.exp(-dt * 2.4));
    warpValue += (warpTarget - warpValue) * (reduced ? 1 : 1 - Math.exp(-dt * 6));
    const kt = reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    for (let i = 0; i < 3; i += 1) tint.rgb[i] += (tint.rgbTo[i] - tint.rgb[i]) * kt;
    tint.mix += (tint.mixTo - tint.mix) * kt;
    for (let i = 0; i < 3; i += 1) tint.now[i] = NEUTRAL[i] + (tint.rgb[i] - NEUTRAL[i]) * tint.mix;
    pointer.x += (pointer.tx - pointer.x) * (reduced ? 0 : 1 - Math.exp(-dt * 4));
    pointer.y += (pointer.ty - pointer.y) * (reduced ? 0 : 1 - Math.exp(-dt * 4));

    const accent = tint.now;
    iso.uniforms.uColor.value.set(accent[0], accent[1], accent[2]);
    iso.uniforms.uTime.value = time;
    iso.uniforms.uPointer.value.set(pointer.x, pointer.y);
    iso.uniforms.uScroll.value = scrollY;
    iso.uniforms.uOpacity.value = 0.55 * introValue;
    iso.uniforms.uSpeed.value = 1 + warpValue * 3;
    camera.fov = FOV + warpValue * 9;
    camera.updateProjectionMatrix();

    if (onFrame) onFrame({ aurora: 0.45 * clamp(introValue / 0.6) });

    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return {
    setTint,
    warp(amount) {
      warpTarget = amount;
      dirty = true;
    },
    measure() {
      dirty = true;
    },
    intro: begin,
    dispose() {
      cancelAnimationFrame(raf);
      clearTimeout(introFallback);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onMove);
      resizeObserver.disconnect();
      offPerf();
      iso.dispose();
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    },
  };
}
