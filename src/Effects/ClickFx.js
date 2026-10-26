import { useEffect } from "react";
import { prefersReducedMotion } from "./motion";
import { worldFx } from "../Worlds";

// Effets de clic des mondes : chaque monde a son geste (voir Worlds/<id>/fx.js). Un clic (ou un toucher) sur la page
// lance spawn(x, y, outils) qui ajoute des « effets » : { dur (s), draw(ctx, t 0→1, now) }. Un seul canvas plein
// écran, créé au montage, qui ne tourne que tant qu'un effet est vivant. Les liens sont laissés à leur transition.

const IGNORED = "a[href], [data-no-fx], input, textarea, select, iframe, video";

export function mountClickFx(spawn) {
  const canvas = document.createElement("canvas");
  canvas.className = "click-fx";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  const effects = [];
  let raf = 0;
  let W = 0;
  let H = 0;

  const fit = () => {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  fit();

  const tick = (now) => {
    ctx.clearRect(0, 0, W, H);
    for (let i = effects.length - 1; i >= 0; i--) {
      const e = effects[i];
      const t = (now - e.t0) / (e.dur * 1000);
      if (t >= 1) {
        effects.splice(i, 1);
        continue;
      }
      ctx.save();
      e.draw(ctx, Math.max(0, t), now);
      ctx.restore();
    }
    raf = effects.length ? requestAnimationFrame(tick) : 0;
  };

  const add = (effect) => {
    effects.push({ ...effect, t0: performance.now() });
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const fire = (x, y) => spawn(x, y, { add, W, H });

  const onDown = (e) => {
    if (e.button !== 0 || (e.target.closest && e.target.closest(IGNORED))) return;
    fire(e.clientX, e.clientY);
  };

  window.addEventListener("pointerdown", onDown);
  window.addEventListener("resize", fit);
  // Debug (dev) : window.__clickFx(x, y) lance l'effet du monde à cet endroit
  if (process.env.NODE_ENV === "development") window.__clickFx = fire;

  return () => {
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("resize", fit);
    cancelAnimationFrame(raf);
    canvas.remove();
    if (process.env.NODE_ENV === "development") delete window.__clickFx;
  };
}

// À poser dans une page projet : charge l'effet du monde (chunk du monde) et l'écoute
export default function ClickFx({ slug }) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let off = null;
    let alive = true;
    worldFx(slug).then((spawn) => {
      if (alive && spawn) off = mountClickFx(spawn);
    });
    return () => {
      alive = false;
      if (off) off();
    };
  }, [slug]);
  return null;
}
