import React, { Suspense, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Aurora from "../Effects/Aurora";
import { ScrollTrigger, prefersReducedMotion } from "../Effects/motion";
import { onIntroBuild } from "../Effects/intro";
import { registerLoad } from "../Effects/ready";
import { fieldState, subscribeHero, subscribeTint, subscribeWarp } from "../Effects/fieldBus";
import "../css/Stage.css";

// Annotations de la manette en vue éclatée (section compétences) : une pièce par domaine.
// (dx, dy) = bout du trait par rapport à la pièce ; dir = sens dans lequel la bulle part de ce bout (1 = vers la droite)
const CALLOUTS = [
  { id: "web", title: "Stage.web", tag: "React · Next.js · Vue · PHP", dx: -10, dy: -96, dir: 1 },
  { id: "ai", title: "Stage.ai", tag: "LLM · RAG · MCP · n8n", dx: -44, dy: -96, dir: -1 },
  { id: "data", title: "Stage.tools", tag: "Python · MySQL · Git · DevOps", dx: -34, dy: 112, dir: -1 },
  { id: "game", title: "Stage.game", tag: "Unity · Unreal · C++ · C#", dx: 46, dy: 64, dir: 1 },
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

// La scène ne connaît que deux états de page : l'accueil (hero et compétences) et les autres (fond seul)
const sceneFor = (pathname) => (pathname.split("/").filter(Boolean).length <= 1 ? "home" : "page");

// Scène 3D persistante : un seul canvas pour tout le site (jamais recréé pendant la navigation), derrière le contenu.
// Les annotations de la manette vivent dans un calque au-dessus de la page.
function StageInner() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const scene = sceneFor(pathname);
  const sceneRef = useRef(scene);
  const instanceRef = useRef(null);
  const backdropRef = useRef(null);
  const hostRef = useRef(null);
  const overlayRef = useRef(null);
  const nodes = useRef({});
  const home = scene === "home";

  sceneRef.current = scene;

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

    // Le fond (aurore) suit l'intensité demandée par la pose clé et se révèle avec l'intro
    const onFrame = ({ aurora }) => {
      if (backdropRef.current) backdropRef.current.style.opacity = aurora.toFixed(3);
    };

    const loading = import("../Effects/stage3d/createScene")
      .then(({ createScene }) =>
        createScene({
          host: hostRef.current,
          onProject,
          onFrame,
          reduced,
          getScene: () => sceneRef.current,
        })
      )
      .then((instance) => {
        if (!instance) {
          // Sans WebGL : le fond reste visible, sans scène 3D
          if (backdropRef.current) backdropRef.current.style.opacity = "0.5";
          return;
        }
        if (cancelled) {
          instance.dispose();
          return;
        }
        stage = instance;
        instanceRef.current = instance;
        if (process.env.NODE_ENV === "development") window.__field = instance;

        // Le rôle affiché choisit l'objet du hero ; la navigation déclenche un « saut »
        instance.setHeroShape(fieldState.hero);
        instance.setTint(fieldState.tint.rgb, fieldState.tint.mix);
        cleanups.push(subscribeHero((shape) => instance.setHeroShape(shape)));
        cleanups.push(subscribeTint(({ rgb, mix }) => instance.setTint(rgb, mix)));
        cleanups.push(subscribeWarp((amount) => instance.warp(amount)));

        // Les éléments suivis (hero, compétences) dépendent de la mise en page : on les relit quand elle change
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

        cleanups.push(onIntroBuild(() => instance.intro()));
      })
      .catch(() => {});

    registerLoad(loading);

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
      instanceRef.current = null;
      if (stage) stage.dispose();
    };
  }, []);

  // Nouvelle page : la scène relit les éléments à suivre (le DOM de la page est déjà monté)
  useEffect(() => {
    if (instanceRef.current) instanceRef.current.measure();
  }, [pathname]);

  return (
    <>
      <div className="backdrop" ref={backdropRef} aria-hidden="true">
        <Aurora className="backdrop__aurora" />
      </div>
      <div
        className={`stage${prefersReducedMotion() ? " stage--static" : ""}${home ? "" : " stage--page"}`}
        ref={hostRef}
        aria-hidden="true"
      />
      {createPortal(
        <>
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
          </div>
        </>,
        document.body
      )}
    </>
  );
}

export default function Stage() {
  return (
    <Suspense fallback={null}>
      <StageInner />
    </Suspense>
  );
}
