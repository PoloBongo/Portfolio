import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ScrollTrigger, onReady, prefersReducedMotion } from "../Effects/motion";
import { registerLoad } from "../Effects/ready";
import { hudState, subscribeHud } from "../Effects/hudState";
import "../css/Stage.css";

// Annotations de la vue éclatée : pièce de la manette → domaine de compétences
// (dx, dy) = bout du trait par rapport au point ; dir = sens dans lequel la bulle part de ce bout (1 = vers la droite)
const CALLOUTS = [
  { id: "face", title: "Stage.face", tag: "Unity · Unreal · C# · C++", dx: 40, dy: -34, dir: 1 },
  { id: "bumpers", title: "Stage.web", tag: "React · Next.js · Vue · PHP", dx: -10, dy: -96, dir: 1 },
  { id: "sticks", title: "Stage.tools", tag: "Python · MySQL · Git · DevOps", dx: 34, dy: 112, dir: 1 },
  { id: "dpad", title: "Stage.engine", tag: "Vulkan · FMOD · TCP/UDP", dx: -36, dy: 96, dir: -1 },
  { id: "screen", title: "Stage.ai", tag: "LLM · RAG · MCP", dx: -44, dy: -96, dir: -1 },
].map((c) => ({
  ...c,
  len: Math.hypot(c.dx, c.dy),
  ang: `${Math.atan2(c.dy, c.dx)}rad`,
  angFlip: `${Math.atan2(c.dy, -c.dx)}rad`,
}));

// Une bulle peut déborder du cadre de la scène dans la gouttière de la grille, jamais de l'écran
const GUTTER = 8;
const BLEED = 40;

const find = (selector) => document.querySelector(selector);

// Poses clés de la manette le long de la page (section + fraction de la section au centre de l'écran)
function buildKeys() {
  const small = window.innerWidth < 900;
  const anchor = find("[data-stage='skills']");
  return [
    {
      section: find(".hero"),
      f: 0.5,
      x: small ? 0.5 : 0.7,
      y: small ? 0.62 : 0.65,
      size: small ? 0.92 : 0.43,
      rot: [-0.34, -0.5, 0.1],
      explode: 0,
      show: 1,
      floor: 1,
    },
    {
      section: find(".intro"),
      f: 0.5,
      // À gauche sous le texte : la carte du joueur occupe la droite
      x: small ? 0.5 : 0.2,
      y: 0.84,
      size: small ? 0.6 : 0.19,
      rot: [-0.16, 0.6, -0.06],
      explode: 0,
      show: small ? 0.5 : 0.85,
      floor: 0.5,
    },
    { section: find(".work"), f: 0.02, x: 1.1, y: 0.5, size: 0.3, rot: [0.2, 1.3, 0], explode: 0, show: 0, floor: 0 },
    { section: find(".work"), f: 0.92, x: -0.1, y: 0.5, size: 0.3, rot: [0.2, -1.3, 0], explode: 0, show: 0, floor: 0 },
    {
      section: find(".skills"),
      f: 0.14,
      anchor,
      sizeMul: small ? 0.8 : 0.66,
      rot: [-0.8, 0.24, 0.02],
      explode: 1,
      show: 1,
      floor: 0.9,
    },
    {
      section: find(".skills"),
      f: 0.86,
      anchor,
      sizeMul: small ? 0.8 : 0.66,
      rot: [-0.72, -0.22, -0.02],
      explode: 1,
      show: 1,
      floor: 0.9,
    },
    { section: find(".certs"), f: 0.3, x: 0.5, y: 0.5, size: 0.3, rot: [0.1, 0.8, 0], explode: 0, show: 0, floor: 0 },
    { section: find(".footer"), f: 0.2, x: 0.5, y: 0.5, size: 0.3, rot: [0, 0.8, 0], explode: 0, show: 0, floor: 0 },
  ];
}

// Manette 3D : le canvas vit dans le hero (derrière le nom), les annotations dans un calque au-dessus de la page
export default function Stage() {
  const { t } = useTranslation();
  const hostRef = useRef(null);
  const overlayRef = useRef(null);
  const nodes = useRef({});

  useEffect(() => {
    let cancelled = false;
    let stage = null;
    const cleanups = [];
    const reduced = prefersReducedMotion();

    // Largeur des bulles et cadre où elles doivent rester : mesurés ici, jamais dans la boucle d'image
    const box = { k: 1, left: 0, right: window.innerWidth, widths: {}, heights: {}, shifts: {}, flipped: {} };
    const measureBox = () => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      const k = parseFloat(getComputedStyle(overlay).getPropertyValue("--k"));
      box.k = k > 0 ? k : 1;
      const anchor = find("[data-stage='skills']");
      const r = anchor ? anchor.getBoundingClientRect() : null;
      box.left = Math.max(GUTTER, r ? r.left - BLEED : 0);
      box.right = Math.min(window.innerWidth - GUTTER, r ? r.right + BLEED : window.innerWidth);
      CALLOUTS.forEach(({ id }) => {
        const text = nodes.current[id] && nodes.current[id].querySelector(".callout__text");
        if (!text) return;
        box.widths[id] = text.offsetWidth;
        box.heights[id] = text.offsetHeight;
      });
    };
    const sizeObserver = new ResizeObserver(measureBox);
    CALLOUTS.forEach(({ id }) => {
      const text = nodes.current[id] && nodes.current[id].querySelector(".callout__text");
      if (text) sizeObserver.observe(text);
    });
    cleanups.push(() => sizeObserver.disconnect());

    const onProject = (frame) => {
      const overlay = overlayRef.current;
      if (!overlay) return;
      overlay.style.opacity = frame.show.toFixed(3);
      overlay.style.visibility = frame.show > 0.01 ? "visible" : "hidden";
      if (frame.show <= 0.01) return;
      CALLOUTS.forEach(({ id, dx, dy, dir, ang, angFlip }) => {
        const el = nodes.current[id];
        const p = frame.points[id];
        if (!el || !p) return;
        el.style.transform = `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0)`;

        // Bulle ramenée dans le cadre : décalée vers son point, sans le recouvrir si elle est à sa hauteur
        const w = box.widths[id] || 0;
        const level = Math.abs(dy * box.k) < (box.heights[id] || 0) / 2 + 8;
        const place = (sign) => {
          const start = p.x + sign * dx * box.k - (sign * dir < 0 ? w : 0);
          let shift = 0;
          if (start + w > box.right) {
            shift = box.right - (start + w);
            if (level) shift = Math.max(shift, Math.min(0, p.x + 10 - start));
          } else if (start < box.left) {
            shift = box.left - start;
            if (level) shift = Math.min(shift, Math.max(0, p.x - 10 - (start + w)));
          }
          const edge = start + shift;
          return { shift: Math.round(shift), over: Math.max(0, box.left - edge, edge + w - box.right) };
        };

        // Si le décalage ne suffit pas, la bulle passe de l'autre côté du point (seuil de 4 px : pas de va-et-vient)
        const flipped = !!box.flipped[id];
        let best = place(flipped ? -1 : 1);
        if (best.over > 4) {
          const other = place(flipped ? 1 : -1);
          if (other.over === 0) {
            box.flipped[id] = !flipped;
            best = other;
            const sign = flipped ? 1 : -1;
            el.style.setProperty("--dx", `${sign * dx}px`);
            el.style.setProperty("--dir", String(sign * dir));
            el.style.setProperty("--align", sign * dir < 0 ? "right" : "left");
            el.style.setProperty("--ang", flipped ? ang : angFlip);
          }
        }
        if (box.shifts[id] !== best.shift) {
          box.shifts[id] = best.shift;
          el.style.setProperty("--sx", `${best.shift}px`);
        }
      });
    };

    const loading = import("../Effects/stage3d/createStage")
      .then(({ createStage }) => createStage({ host: hostRef.current, getKeys: buildKeys, onProject, reduced }))
      .then((instance) => {
        if (!instance) return;
        if (cancelled) {
          instance.dispose();
          return;
        }
        stage = instance;
        if (process.env.NODE_ENV === "development") window.__stage = instance;

        // L'écran de la manette reprend le nom du niveau et la progression du HUD
        instance.setTitle(hudState.name);
        instance.setXp(hudState.xp);
        cleanups.push(
          subscribeHud((state) => {
            instance.setTitle(state.name);
            instance.setXp(state.xp);
          })
        );

        // Les poses clés dépendent de la mise en page : on les recalcule quand elle change
        let timer = 0;
        const remeasure = () => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            instance.measure();
            measureBox();
          }, 120);
        };
        ScrollTrigger.addEventListener("refresh", remeasure);
        const observer = new ResizeObserver(remeasure);
        observer.observe(document.body);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
        cleanups.push(() => {
          clearTimeout(timer);
          ScrollTrigger.removeEventListener("refresh", remeasure);
          observer.disconnect();
        });

        cleanups.push(onReady(() => instance.intro()));
      })
      .catch(() => {});

    registerLoad(loading);

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      if (stage) stage.dispose();
    };
  }, []);

  return (
    <>
      <div className={`stage${prefersReducedMotion() ? " stage--static" : ""}`} ref={hostRef} aria-hidden="true" />
      {createPortal(
        <div className="stage-overlay" ref={overlayRef} aria-hidden="true">
          {CALLOUTS.map(({ id, title, tag, dx, dy, dir, len, ang }) => (
            <div
              className="callout"
              key={id}
              ref={(el) => {
                nodes.current[id] = el;
              }}
              style={{
                "--dx": `${dx}px`,
                "--dy": `${dy}px`,
                "--len": `${len}px`,
                "--ang": ang,
                "--dir": dir,
                "--align": dir < 0 ? "right" : "left",
              }}
            >
              <i className="callout__dot" />
              <i className="callout__line" />
              <div className="callout__text">
                <strong className="callout__title">{t(title)}</strong>
                <span className="callout__tag mono">{tag}</span>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
