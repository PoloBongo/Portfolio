import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import SplitReveal from "../Effects/SplitReveal";
import { TLink } from "../Effects/PageTransition";
import { gsap, EASE, onReady, prefersReducedMotion } from "../Effects/motion";

// En-tête commun aux pages de projets : grand titre qui monte lettre par lettre, trait qui se dessine.
// `back` ({ to, label }) ajoute un lien de retour au-dessus du titre.
export default function PageHero({ eyebrow, title, subtitle, back }) {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const q = gsap.utils.selector(rootRef);
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      tl.fromTo(q(".page-hero__top > *"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0)
        .fromTo(
          q(".page-hero__title .split-char"),
          { yPercent: 118 },
          { yPercent: 0, duration: 1.35, stagger: 0.04 },
          0.1
        )
        .fromTo(q(".page-hero__sub"), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1 }, 0.6)
        .fromTo(q(".page-hero__line"), { scaleX: 0 }, { scaleX: 1, duration: 1.7, ease: EASE.inOut }, 0.4);
      return onReady(() => tl.play());
    },
    { scope: rootRef, dependencies: [title], revertOnUpdate: true }
  );

  return (
    <header className="page-hero" ref={rootRef}>
      <div className="container">
        <div className="page-hero__top">
          {back && (
            <TLink className="page-hero__back mono link-line" to={back.to} label={back.label}>
              <span aria-hidden="true">←</span> {back.label}
            </TLink>
          )}
          <p className="page-hero__eyebrow mono eyebrow">{eyebrow}</p>
        </div>
        <h1 className="page-hero__title">
          <SplitReveal text={title} by="chars" />
        </h1>
        {subtitle && <p className="page-hero__sub serif">{subtitle}</p>}
        <div className="page-hero__line" aria-hidden="true" />
      </div>
    </header>
  );
}
