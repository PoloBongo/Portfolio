import React, { Suspense, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Aurora from "../Effects/Aurora";
import { ScrollTrigger, prefersReducedMotion } from "../Effects/motion";
import { onIntroBuild } from "../Effects/intro";
import { registerLoad } from "../Effects/ready";
import { getWork } from "../Pages/work";
import { worldOf } from "../Worlds/config";
import { fieldState, subscribeField, subscribeHero, subscribeTint, subscribeWarp } from "../Effects/fieldBus";
import "../css/Stage.css";

// Annotations de la constellation (section compétences) : un domaine par grappe de points.
// (dx, dy) = bout du trait par rapport au centre de la grappe ; dir = sens dans lequel la bulle part de ce bout (1 = vers la droite)
const CALLOUTS = [
  { id: "web", title: "Stage.web", tag: "React · Next.js · Vue · PHP", dx: -8, dy: -78, dir: 1 },
  { id: "ai", title: "Stage.ai", tag: "LLM · RAG · MCP · n8n", dx: 8, dy: -78, dir: -1 },
  { id: "data", title: "Stage.tools", tag: "Python · MySQL · Git · DevOps", dx: -8, dy: 78, dir: -1 },
  { id: "game", title: "Stage.game", tag: "Unity · Unreal · C++ · C#", dx: 8, dy: 78, dir: 1 },
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

// Boîte des lettres du titre du hero (px écran) : le nuage s'y cale quand il écrit le nom. On mesure les mots
// (leur masque ne bouge pas) et non les lettres, qui montent depuis le bas pendant l'entrée.
function measureNameBox() {
  const words = document.querySelectorAll(".hero__name .split-word");
  if (!words.length) return null;
  let left = Infinity;
  let right = -Infinity;
  let top = Infinity;
  let bottom = -Infinity;
  const tops = new Set();
  words.forEach((word) => {
    const r = word.getBoundingClientRect();
    left = Math.min(left, r.left);
    right = Math.max(right, r.right);
    top = Math.min(top, r.top);
    bottom = Math.max(bottom, r.bottom);
    tops.add(Math.round(r.top / 6));
  });
  if (!(right > left)) return null;
  // Les mots ont la boîte de la ligne, pas celle de l'encre : le dessin des lettres est ~3 % plus étroit
  // et son centre ~0,05 em plus haut (mesuré sur une capture, titre HTML contre nuage)
  const em = parseFloat(getComputedStyle(words[0]).fontSize) || 0;
  return {
    cx: (left + right) / 2,
    cy: (top + bottom) / 2 - em * 0.05,
    w: (right - left) * 0.97,
    h: bottom - top,
    lines: tops.size > 1 ? 2 : 1,
  };
}

// Une forme par page : le nuage reste le même d'une page à l'autre, il change seulement de forme
const PAGE_SHAPES = {
  projectsweb: "browser",
  ai: "network",
  unity: "lattice",
  unreal: "lattice",
  gamejam: "lattice",
  incoming: "lattice",
  contactme: "at",
};

// Poses clés du nuage le long de la page d'accueil (section + fraction de la section au centre de l'écran).
// shape : forme visée (hero = forme du moment, voir fieldBus) ; show : opacité ; flow : agitation ;
// query : sensibilité au curseur ; aurora : intensité du fond.
function buildHomeKeys() {
  const small = window.innerWidth < 900;
  const anchor = find("[data-stage='skills']");

  // Le hero compte trois écrans (un acte par écran, voir Hero.js) : le nuage garde sa pose pendant tout le
  // défilement épinglé, puis passe à la suivante. Hero d'un seul écran : les deux clés se confondent.
  const hero = find(".hero");
  const vh = window.innerHeight;
  const heroHeight = hero ? Math.max(hero.getBoundingClientRect().height, vh) : vh;
  const half = vh / (2 * heroHeight);
  const heroPose = {
    section: hero,
    shape: "hero",
    x: small ? 0.5 : 0.7,
    y: small ? 0.25 : 0.55,
    size: small ? 0.86 : 0.46,
    rot: [0.28, 0, 0],
    show: 1,
    flow: 0.1,
    query: 1,
    aurora: 1,
  };

  return [
    { ...heroPose, f: half },
    { ...heroPose, f: 1 - half },
    {
      section: find(".intro"),
      f: 0.5,
      shape: "lattice",
      x: 0.5,
      y: 0.5,
      size: small ? 1.5 : 1.2,
      rot: [-0.95, 0, 0.06],
      show: small ? 0.26 : 0.36,
      flow: 0.025,
      query: 0.6,
      aurora: 0.3,
    },
    {
      section: find(".work"),
      f: 0.5,
      shape: "work",
      x: 0.5,
      y: 0.5,
      size: small ? 1.3 : 0.98,
      rot: [0.12, 0.16, 0],
      show: small ? 0.34 : 0.5,
      flow: 0.12,
      query: 0,
      aurora: 0.22,
    },
    { section: find(".skills"), f: 0.14, shape: "stack", anchor, sizeMul: 0.98, rot: [0, 0, 0], show: 1, flow: 0.07, query: 0.5, aurora: 0.2 },
    { section: find(".skills"), f: 0.86, shape: "stack", anchor, sizeMul: 0.98, rot: [0, 0, 0], show: 1, flow: 0.07, query: 0.5, aurora: 0.2 },
    {
      section: find(".certs"),
      f: 0.5,
      shape: "sphere",
      x: 0.5,
      y: 0.5,
      size: small ? 0.9 : 0.5,
      rot: [0.32, 0, 0.1],
      show: small ? 0.16 : 0.22,
      flow: 0.1,
      query: 0.6,
      aurora: 0.22,
    },
    {
      section: find(".footer"),
      f: 0.15,
      shape: "at",
      // À droite de « Parlons-en. », au-dessus de la rangée de liens (le glyphe ne doit pas les recouvrir)
      x: small ? 0.5 : 0.6,
      y: small ? 0.42 : 0.395,
      size: small ? 0.8 : 0.3,
      rot: [0, 0, 0],
      show: small ? 0.45 : 0.6,
      flow: 0.09,
      query: 0.6,
      aurora: 0.4,
    },
  ];
}

// Pages de projets, contact, programme : une forme qui se pose à côté du titre, puis s'efface derrière le contenu
function buildPageKeys(shape) {
  return () => {
    const small = window.innerWidth < 900;
    const top = find(".page-hero") || find(".contact") || find("main");
    const body = find(".cases") || top;
    const flat = shape === "lattice";
    const rot = flat ? [-0.95, 0, 0.06] : [0.1, 0, 0];
    const centered = shape === "at";
    return [
      {
        section: top,
        f: 0.5,
        shape,
        x: small ? 0.5 : centered ? 0.5 : 0.76,
        y: small ? 0.3 : 0.46,
        size: small ? (flat ? 1.4 : 0.9) : flat ? 1.2 : centered ? 0.8 : 0.5,
        rot,
        show: centered ? 0.28 : small ? 0.5 : 0.85,
        flow: flat ? 0.03 : 0.1,
        query: 1,
        aurora: 0.55,
      },
      {
        section: body,
        f: 0.1,
        shape,
        x: 0.5,
        y: 0.5,
        size: flat ? 1.2 : small ? 0.9 : 0.6,
        rot,
        show: centered ? 0.2 : 0.14,
        flow: flat ? 0.03 : 0.1,
        query: 0.5,
        aurora: 0.2,
      },
    ];
  };
}

// Pages projet : forme, teinte et pose viennent du monde du projet (Worlds/config.js, champ cloud)
function buildWorkKeys(slug) {
  return () => {
    const world = worldOf(getWork(slug));
    const cloud = world.cloud || {};
    const small = window.innerWidth < 900;
    const top = find("[data-work-top]") || find("main");
    const body = find("[data-work-body]") || top;
    const flat = world.shape === "lattice";
    const rot = cloud.rot || (flat ? [-0.95, 0, 0.06] : [0.1, 0, 0]);
    const flow = cloud.flow ?? 0.1;
    return [
      {
        section: top,
        f: 0.5,
        shape: world.shape,
        x: small ? 0.5 : cloud.x ?? 0.8,
        y: small ? 0.24 : cloud.y ?? 0.46,
        size: small ? 0.8 : cloud.size ?? 0.44,
        rot,
        show: small ? 0.34 : cloud.show ?? 0.85,
        flow,
        query: 1,
        aurora: cloud.aurora ?? 0.55,
      },
      {
        section: body,
        f: 0.1,
        shape: world.shape,
        x: 0.5,
        y: 0.5,
        size: small ? 0.9 : 0.6,
        rot,
        show: 0.1,
        flow,
        query: 0.5,
        aurora: 0.2,
      },
    ];
  };
}

// Page introuvable : le nuage reste en bruit, agité, et réagit au curseur
function buildLostKeys() {
  const small = window.innerWidth < 900;
  return [
    {
      section: find(".notfound"),
      f: 0.5,
      shape: "noise",
      x: 0.5,
      y: 0.5,
      size: small ? 1.3 : 0.95,
      rot: [0.15, 0, 0],
      show: 1,
      flow: 0.5,
      query: 1,
      aurora: 0.5,
    },
  ];
}

// Quelle scène pour quelle route ? (/fr → accueil, /fr/AI → réseau, /fr/work/cerebro → monde du projet,
// route inconnue → bruit)
function sceneFor(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1) return "home";
  const page = segments[1].toLowerCase();
  if (page === "work") return getWork(segments[2]) ? `work:${segments[2]}` : "lost";
  return PAGE_SHAPES[page] ? page : "lost";
}

const SCENES = {
  home: buildHomeKeys,
  lost: buildLostKeys,
};
Object.keys(PAGE_SHAPES).forEach((page) => {
  SCENES[page] = buildPageKeys(PAGE_SHAPES[page]);
});

const keysFor = (scene) => (scene.startsWith("work:") ? buildWorkKeys(scene.slice(5)) : SCENES[scene]);

// Nuage de points persistant : un seul canvas pour tout le site (jamais recréé pendant la navigation), derrière le contenu.
// Les annotations de la constellation et la puce « voisin le plus proche » vivent dans un calque au-dessus de la page.
function StageInner() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const scene = sceneFor(pathname);
  const sceneRef = useRef(scene);
  const instanceRef = useRef(null);
  const backdropRef = useRef(null);
  const hostRef = useRef(null);
  const overlayRef = useRef(null);
  const probeRef = useRef(null);
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

    // Puce « voisin le plus proche » : suit le point étiqueté le plus proche du curseur
    const onProbe = (state) => {
      const el = probeRef.current;
      if (!el) return;
      if (!state.visible) {
        el.classList.remove("is-on");
        return;
      }
      el.querySelector(".probe__label").textContent = state.label;
      el.querySelector(".probe__dist").textContent = state.dist.toFixed(2);
      el.style.transform = `translate3d(${(state.x + 16).toFixed(1)}px, ${(state.y - 42).toFixed(1)}px, 0)`;
      el.classList.add("is-on");
    };

    // Le fond (aurore) suit l'intensité demandée par la pose clé et se révèle avec l'intro
    const onFrame = ({ aurora }) => {
      if (backdropRef.current) backdropRef.current.style.opacity = aurora.toFixed(3);
    };

    const loading = import("../Effects/stage3d/createField")
      .then(({ createField }) =>
        createField({
          host: hostRef.current,
          getKeys: () => keysFor(sceneRef.current)(),
          onProject,
          onProbe,
          onFrame,
          reduced,
          getNameBox: measureNameBox,
        })
      )
      .then((instance) => {
        if (!instance) {
          // Sans WebGL : le fond reste visible, sans nuage
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

        // L'index des projets éclaire la grappe correspondante ; le rôle affiché choisit la forme du hero ;
        // la navigation déclenche un « saut »
        instance.setFocus(fieldState.focus);
        instance.setHeroShape(fieldState.hero);
        instance.setTint(fieldState.tint.rgb, fieldState.tint.mix);
        cleanups.push(subscribeField((index) => instance.setFocus(index)));
        cleanups.push(subscribeHero((shape) => instance.setHeroShape(shape)));
        cleanups.push(subscribeTint(({ rgb, mix }) => instance.setTint(rgb, mix)));
        cleanups.push(subscribeWarp((amount) => instance.warp(amount)));

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

  // Nouvelle page : le nuage lit les poses clés de la nouvelle scène (le DOM de la page est déjà monté)
  useEffect(() => {
    if (instanceRef.current) instanceRef.current.measure();
  }, [scene]);

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
          <div className="probe mono" ref={probeRef} aria-hidden="true">
            <i className="probe__dot" />
            <span className="probe__label" />
            <span className="probe__dist" />
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
