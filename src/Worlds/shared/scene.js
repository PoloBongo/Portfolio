// Moteur de scène des mondes : une scène est une fonction (stage, outils) qui remplit un cadre en unités cqw
// (HTML décoratif, CSS animé, canvas 2D). Le moteur ne fait tourner que les scènes visibles, suit le pointeur
// (variables --mx / --my pour les révélations en CSS) et range tout au démontage.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const channels = (hex) => {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
export const rgba = (hex, alpha) => `rgba(${channels(hex).join(",")},${alpha})`;

// Pastille lumineuse (sprite radial), à dessiner avec drawImage
export function sprite(hex, size = 48) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.16, rgba(hex, 1));
  gr.addColorStop(0.4, rgba(hex, 0.45));
  gr.addColorStop(1, rgba(hex, 0));
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  return c;
}

// Trame de Bayer 4×4 (dithering)
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

// Monte une scène. build(stage, tools) est appelée une fois ; renvoie la fonction de nettoyage.
export function mountScene(stage, build, { reduced = false } = {}) {
  const items = [];
  const timers = [];
  const cleanups = [];
  let visible = false;
  let raf = 0;
  const pointerState = { x: 0, y: 0, on: false };

  const onMove = (e) => {
    const r = stage.getBoundingClientRect();
    pointerState.x = e.clientX - r.left;
    pointerState.y = e.clientY - r.top;
    pointerState.on = true;
  };
  const onLeave = () => {
    pointerState.on = false;
  };
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerleave", onLeave);

  // Pointeur de la scène en px ; sans survol (et au toucher) il flâne seul pour que l'effet se voie
  const pointer = (t) => {
    const r = stage.getBoundingClientRect();
    if (pointerState.on) return { x: pointerState.x, y: pointerState.y, w: r.width, h: r.height, on: true };
    return {
      x: r.width * (0.5 + 0.3 * Math.sin(t * 0.00055)),
      y: r.height * (0.5 + 0.22 * Math.sin(t * 0.00083 + 1.3)),
      w: r.width,
      h: r.height,
      on: false,
    };
  };

  const frame = (fn) => {
    items.push(fn);
    return fn;
  };

  // Canvas 2D plein cadre ; draw(ctx, largeur, hauteur, t, pointeur). Il faut l'effacer soi-même.
  const loop = (draw, parent = stage) => {
    const canvas = document.createElement("canvas");
    canvas.className = "w-cv";
    canvas.setAttribute("aria-hidden", "true");
    parent.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    const fit = () => {
      const r = stage.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = r.width;
      h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduced) draw(ctx, w, h, 2400, pointer(2400));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(stage);
    cleanups.push(() => ro.disconnect());
    frame((t) => draw(ctx, w, h, t, pointer(t)));
    return canvas;
  };

  // Intervalle qui ne tourne que si la scène est visible et le mouvement autorisé
  const every = (fn, ms) => {
    if (reduced) return;
    const id = window.setInterval(() => {
      if (visible && !document.hidden) fn();
    }, ms);
    timers.push(id);
  };

  const tick = (t) => {
    raf = 0;
    if (!visible) return;
    const p = pointer(t);
    stage.style.setProperty("--mx", `${p.x.toFixed(1)}px`);
    stage.style.setProperty("--my", `${p.y.toFixed(1)}px`);
    items.forEach((fn) => fn(t));
    raf = requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      stage._vis = visible;
      if (visible && !raf && !reduced) raf = requestAnimationFrame(tick);
    },
    { rootMargin: "120px" }
  );
  io.observe(stage);

  const tools = { loop, frame, every, pointer, sprite, rgba, clamp, ease, BAYER, RM: reduced };
  build(stage, tools);

  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
    timers.forEach((id) => clearInterval(id));
    cleanups.forEach((fn) => fn());
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerleave", onLeave);
    stage.innerHTML = "";
  };
}
