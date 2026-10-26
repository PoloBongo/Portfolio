import React, { useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import SplitReveal from "../../Effects/SplitReveal";
import { gsap, EASE, onReady, prefersReducedMotion } from "../../Effects/motion";
import { mountScene } from "./scene";
import "./shared.css";

// Charge une fois les polices Google du monde (le chunk du monde ne les embarque pas)
const loaded = new Set();
function useWorldFonts(href) {
  useEffect(() => {
    if (!href || loaded.has(href)) return;
    loaded.add(href);
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [href]);
}

// Hero d'un monde à scène : titre et accroche posés sur un cadre décoratif 16:10 (la scène du moodboard),
// puis les faits et le média du projet (vidéo ou jeu). Sur petit écran, le texte passe au-dessus du cadre.
//  id : classe .w-<id> du monde ; build : la scène (scene.js) ; palette : [fond, accent, second, surface, encre]
export default function SceneHero({ id, build, palette, fonts, title, tagline, crumb, facts, media, children }) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  useWorldFonts(fonts);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    return mountScene(stage, build, { reduced: prefersReducedMotion() });
  }, [build]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const q = gsap.utils.selector(rootRef);
      const frame = q(".work-stage .case__media")[0];
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      tl.fromTo(q(".work-crumb > *"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0)
        .fromTo(q(".w-stage"), { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 1.4 }, 0.1)
        .fromTo(q(".w-title .split-char"), { yPercent: 118 }, { yPercent: 0, duration: 1.3, stagger: 0.035 }, 0.2)
        .fromTo(q(".w-tagline"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1 }, 0.6)
        .fromTo(q(".work-facts > *"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 0.9)
        .fromTo(
          frame,
          { clipPath: "inset(100% 0% 0% 0% round 22px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 22px)",
            duration: 1.4,
            ease: EASE.inOut,
            onComplete: () => gsap.set(frame, { clearProps: "clipPath" }),
          },
          0.8
        );
      return onReady(() => tl.play());
    },
    { scope: rootRef, dependencies: [title, tagline], revertOnUpdate: true }
  );

  const vars = {};
  palette.forEach((color, i) => {
    vars[`--w${i}`] = color;
  });

  return (
    <header className={`w-hero w-${id}`} ref={rootRef} data-work-top style={vars}>
      <div className="container">{crumb}</div>
      <div className="container">
        <div className="w-wrap">
          <div className="w-copy">
            <h1 className="w-title">
              <SplitReveal text={title} by="chars" />
            </h1>
            <p className="w-tagline">{tagline}</p>
            {children}
          </div>
          <div className="w-stage" ref={stageRef} aria-hidden="true" />
        </div>
      </div>
      <div className="container">{facts}</div>
      <div className="container work-stage">
        <div className="case__media">{media}</div>
      </div>
    </header>
  );
}
