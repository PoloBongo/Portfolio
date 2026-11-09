import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import SplitReveal from "../../Effects/SplitReveal";
import { gsap, EASE, onReady, prefersReducedMotion } from "../../Effects/motion";
import { useWorldFonts } from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import SeoEditor from "./SeoEditor";
import "./seo-autopilot.css";

// Hero de SEO Autopilot : l'éditeur de workflow n8n du projet, vivant (nœuds déplaçables, fils qui voient passer des
// paquets, « Exécuter » qui joue le pipeline jusqu'au rapport), en thème clair.
export default function SeoAutopilotHero({ title, tagline, crumb, facts, media }) {
  const rootRef = useRef(null);
  useWorldFonts(FONTS["seo-autopilot"]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const q = gsap.utils.selector(rootRef);
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      tl.fromTo(q(".work-crumb > *"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0)
        .fromTo(q(".seo-hero__title .split-char"), { yPercent: 118 }, { yPercent: 0, duration: 1.2, stagger: 0.03 }, 0.15)
        .fromTo(q(".seo-hero__tagline"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.9 }, 0.5)
        .fromTo(q(".seo-ed"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1 }, 0.6)
        .fromTo(q(".work-facts > *"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 1);
      return onReady(() => tl.play());
    },
    { scope: rootRef, dependencies: [title, tagline], revertOnUpdate: true }
  );

  const vars = {};
  PALETTES["seo-autopilot"].forEach((color, i) => {
    vars[`--w${i}`] = color;
  });

  return (
    <header className="seo-hero" ref={rootRef} data-work-top style={vars}>
      <div className="container seo-hero__top">
        {crumb}
        <h1 className="seo-hero__title">
          <SplitReveal text={title} by="chars" />
        </h1>
        <p className="seo-hero__tagline">{tagline}</p>
      </div>
      <div className="container">
        <SeoEditor />
      </div>
      <div className="container">{facts}</div>
      <div className="container work-stage">
        <div className="case__media">{media}</div>
      </div>
    </header>
  );
}
