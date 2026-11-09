import React, { Suspense, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Aurora from "../Effects/Aurora";
import { prefersReducedMotion } from "../Effects/motion";
import { onIntroBuild } from "../Effects/intro";
import { registerLoad } from "../Effects/ready";
import { fieldState, subscribeTint, subscribeWarp } from "../Effects/fieldBus";
import "../css/Stage.css";

// La scène ne connaît que deux états de page : l'accueil et les autres (fond seul)
const sceneFor = (pathname) => (pathname.split("/").filter(Boolean).length <= 1 ? "home" : "page");

// Scène 3D persistante : un seul canvas pour tout le site (jamais recréé pendant la navigation), derrière le contenu.
// Elle ne dessine plus que le fond de courbes de niveau, teinté par la page ; les objets 3D de l'accueil sont dans la carte.
function StageInner() {
  const { pathname } = useLocation();
  const home = sceneFor(pathname) === "home";
  const instanceRef = useRef(null);
  const backdropRef = useRef(null);
  const hostRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let stage = null;
    const cleanups = [];
    const reduced = prefersReducedMotion();

    // Le fond (aurore) suit l'intensité demandée par la scène et se révèle avec l'intro
    const onFrame = ({ aurora }) => {
      if (backdropRef.current) backdropRef.current.style.opacity = aurora.toFixed(3);
    };

    const loading = import("../Effects/stage3d/createScene")
      .then(({ createScene }) => createScene({ host: hostRef.current, onFrame, reduced }))
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

        instance.setTint(fieldState.tint.rgb, fieldState.tint.mix);
        cleanups.push(subscribeTint(({ rgb, mix }) => instance.setTint(rgb, mix)));
        cleanups.push(subscribeWarp((amount) => instance.warp(amount)));
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

  // Nouvelle page : la scène se redessine (le fond dépend du défilement)
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
