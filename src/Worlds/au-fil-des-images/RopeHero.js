import React, { useEffect, useRef } from "react";
import { hasFinePointer } from "../../Effects/motion";
import { useWorldFonts } from "../shared/SceneHero";
import "../shared/videoHero.css";

// W2 · le fil est réel. Une corde simulée (Verlet, 46 points, 8 itérations de contrainte) tendue entre deux points, avec
// les vraies photos de la boutique de l'association accrochées par des pinces : les cadres se balancent avec leur inertie,
// le fil se tire à la souris ou au doigt et se relâche, et le défilement rapide le secoue. Canvas 2D, sans dépendance.
const PHOTOS = [
  ["gourde", "Gourde", "7 €"],
  ["casquette", "Casquette", "10 €"],
  ["sac", "Sac", "18 €"],
  ["tshirt", "T-shirt", "19,50 €"],
  ["jogging", "Jogging", "27 €"],
];
const COUNT = 46;
const SLOTS = [6, 14, 22, 30, 38]; // point de la corde où chaque cadre est pincé
const BASE = `${process.env.PUBLIC_URL || ""}/aufil`;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function RopeHero({ palette, fonts, title, tagline, crumb, facts, media, hint }) {
  const rootRef = useRef(null);
  const pinRef = useRef(null);
  const canvasRef = useRef(null);
  const zoneRef = useRef(null);
  useWorldFonts(fonts);

  useEffect(() => {
    const root = rootRef.current;
    const pin = pinRef.current;
    const canvas = canvasRef.current;
    const zone = zoneRef.current;
    if (!root || !pin || !canvas || !zone) return undefined;
    const g = canvas.getContext("2d");
    const imgs = PHOTOS.map(([f]) => {
      const im = new Image();
      im.src = `${BASE}/${f}.webp`;
      return im;
    });

    let pts = [];
    let frames = [];
    let W = 1;
    let H = 1;
    let dpr = 1;
    let held = -1;
    const pointer = { x: 0, y: 0, inside: false };
    let lastY = window.scrollY;
    let vel = 0;

    const reset = () => {
      pts = [];
      const y0 = H * 0.17;
      for (let i = 0; i < COUNT; i += 1) {
        const x = -30 + (i / (COUNT - 1)) * (W + 60);
        const sag = Math.sin((i / (COUNT - 1)) * Math.PI) * H * 0.045;
        pts.push({ x, y: y0 + sag, px: x, py: y0 + sag, pin: i === 0 || i === COUNT - 1 });
      }
      frames = SLOTS.map((at, i) => ({ at, a: 0, v: 0, tilt: (i % 2 ? 1 : -1) * 0.05 }));
    };
    const seg = () => ((W + 60) / (COUNT - 1)) * 1.015;
    const step = (push) => {
      pts.forEach((q, i) => {
        if (q.pin || i === held) return;
        const vx = (q.x - q.px) * 0.985;
        const vy = (q.y - q.py) * 0.985;
        q.px = q.x;
        q.py = q.y;
        q.x += vx + push * Math.sin(i * 0.5) * 0.4;
        q.y += vy + 0.42;
      });
      const rest = seg();
      for (let n = 0; n < 8; n += 1) {
        for (let i = 0; i < COUNT - 1; i += 1) {
          const a = pts[i];
          const b = pts[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) || 1;
          const diff = (d - rest) / d / 2;
          if (!a.pin && i !== held) {
            a.x += dx * diff;
            a.y += dy * diff;
          }
          if (!b.pin && i + 1 !== held) {
            b.x -= dx * diff;
            b.y -= dy * diff;
          }
        }
      }
    };

    const toLocal = (e) => {
      const r = pin.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    };
    const onMove = (e) => {
      toLocal(e);
      pointer.inside = true;
    };
    const onLeave = () => {
      pointer.inside = false;
    };
    const onDown = (e) => {
      toLocal(e);
      let best = -1;
      let dist = 60;
      pts.forEach((q, i) => {
        const d = Math.hypot(q.x - pointer.x, q.y - pointer.y);
        if (d < dist && !q.pin) {
          dist = d;
          best = i;
        }
      });
      held = best;
      if (held >= 0) zone.setPointerCapture(e.pointerId);
    };
    const onUp = () => {
      held = -1;
    };
    zone.addEventListener("pointermove", onMove);
    zone.addEventListener("pointerleave", onLeave);
    zone.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    const measure = () => {
      const r = pin.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      dpr = Math.min(window.devicePixelRatio || 1, hasFinePointer() ? 2 : 1.5);
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      reset();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(pin);

    const draw = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W, H);
      // les deux crochets
      g.fillStyle = "#2b1650";
      [pts[0], pts[COUNT - 1]].forEach((q) => {
        g.beginPath();
        g.arc(q.x, q.y, 6, 0, Math.PI * 2);
        g.fill();
      });
      // le fil
      g.strokeStyle = "#fff3e0";
      g.lineWidth = 2.8;
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < COUNT - 1; i += 1) {
        g.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2);
      }
      g.stroke();
      // les cadres, pincés sur le fil, qui se balancent
      const fw = clamp(W * 0.15, 118, 180);
      const iw = fw - 16;
      const ih = iw * (66 / 164);
      const fh = ih + 52;
      frames.forEach((f, k) => {
        const q = pts[f.at];
        const r = pts[f.at + 1];
        const slope = Math.atan2(r.y - q.y, r.x - q.x);
        const ax = (q.x - q.px) * 0.018;
        f.v += -f.a * 0.045 - ax - f.v * 0.04 + slope * 0.012;
        f.a = clamp(f.a + f.v, -0.9, 0.9);
        g.save();
        g.translate(q.x, q.y);
        g.rotate(f.a + f.tilt);
        g.fillStyle = "#2b1650";
        g.fillRect(-4, -8, 8, 22);
        g.shadowColor = "rgba(43,22,80,.4)";
        g.shadowBlur = 24;
        g.shadowOffsetY = 14;
        g.fillStyle = "#fffaf2";
        g.fillRect(-fw / 2, 10, fw, fh);
        g.shadowColor = "transparent";
        const im = imgs[k];
        if (im.complete && im.naturalWidth) g.drawImage(im, 0, 0, 164, 66, -iw / 2, 18, iw, ih);
        g.fillStyle = "#2b1650";
        g.font = `italic 600 ${Math.round(fw * 0.1)}px Fraunces, Georgia, serif`;
        g.textBaseline = "middle";
        g.fillText(PHOTOS[k][1], -iw / 2, 18 + ih + 16);
        g.fillStyle = "#ff5a36";
        g.font = `600 ${Math.round(fw * 0.085)}px Figtree, system-ui, sans-serif`;
        g.textAlign = "right";
        g.fillText(PHOTOS[k][2], iw / 2, 18 + ih + 16);
        g.textAlign = "left";
        g.restore();
      });
    };

    let raf = 0;
    let visible = true;
    let t0 = 0;
    const frame = (now) => {
      raf = 0;
      if (!visible || document.hidden) return;
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      const y = window.scrollY;
      vel += (clamp((y - lastY) * 0.02, -3, 3) - vel) * 0.25;
      lastY = y;
      step(vel * 2.4 + Math.sin(t * 1.3) * 0.08);
      if (held >= 0) {
        pts[held].x = pointer.x;
        pts[held].y = pointer.y;
      } else if (pointer.inside) {
        pts.forEach((q) => {
          if (q.pin) return;
          const d = Math.hypot(q.x - pointer.x, q.y - pointer.y);
          if (d < 70) q.x += ((q.x - pointer.x) / (d + 1)) * 0.8;
        });
      }
      draw();
      root.classList.add("is-live");
      raf = requestAnimationFrame(frame);
    };
    const run = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
        if (visible) run();
      },
      { threshold: 0 }
    );
    io.observe(root);
    const onVis = () => run();
    document.addEventListener("visibilitychange", onVis);
    run();

    return () => {
      if (raf) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      zone.removeEventListener("pointermove", onMove);
      zone.removeEventListener("pointerleave", onLeave);
      zone.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const vars = { "--len": 1 };
  palette.forEach((color, i) => {
    vars[`--w${i}`] = color;
  });

  return (
    <header className="vh-root w-au-fil-des-images-video" data-work-top style={vars}>
      <div className="vh vh--rope" ref={rootRef}>
        <div className="vh__pin" ref={pinRef}>
          <canvas className="vh__canvas" ref={canvasRef} aria-hidden="true" />
          {/* Zone où l'on attrape le fil : le bas de la page reste libre pour le défilement au doigt */}
          <div className="vh__ropezone" ref={zoneRef} aria-hidden="true" />
          <div className="vh__crumb container">{crumb}</div>
          <div className="vh__copy container">
            <h1 className="vh__title">{title}</h1>
            <p className="vh__tagline">{tagline}</p>
            {hint && <p className="vh__hint mono">{hint}</p>}
          </div>
        </div>
      </div>
      <div className="container">{facts}</div>
      <div className="container work-stage">
        <div className="case__media">{media}</div>
      </div>
    </header>
  );
}
