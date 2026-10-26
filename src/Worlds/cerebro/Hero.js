import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import SplitReveal from "../../Effects/SplitReveal";
import { gsap, EASE, onReady, prefersReducedMotion } from "../../Effects/motion";
import "./cerebro.css";

const PROMPT = "> cerebro --rag --stream";
const SCRAMBLE = "01<>/{}#_";

// Retards (en s) des « jetons » de l'accroche : irréguliers, comme une réponse de modèle en streaming
const TOKEN_AT = [0, 0.11, 0.2, 0.36, 0.45, 0.62, 0.7, 0.86];
const tokens = (text) => text.match(/\S+\s*/g) || [text];

// Hero de Cerebro : une invite de commande, le nom en capitales condensées, l'accroche écrite en streaming,
// puis le schéma animé du pipeline RAG en grand, dans un cadre de console (balayage lumineux).
export default function CerebroHero({ title, tagline, crumb, facts, media }) {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const q = gsap.utils.selector(rootRef);
      const frame = q(".w-cerebro__frame")[0];
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });

      tl.fromTo(q(".work-crumb > *"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0)
        .fromTo(q(".w-cerebro__prompt"), { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.1)
        .to(
          q(".w-cerebro__prompt-text"),
          { duration: 0.9, ease: "none", scrambleText: { text: PROMPT, chars: SCRAMBLE, speed: 0.6, revealDelay: 0.15 } },
          0.1
        )
        .fromTo(q(".w-cerebro__title .split-char"), { yPercent: 118 }, { yPercent: 0, duration: 1.35, stagger: 0.04 }, 0.3);

      q(".w-cerebro__token").forEach((token, k) => {
        tl.fromTo(token, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.95 + TOKEN_AT[k % TOKEN_AT.length]);
      });
      tl.fromTo(q(".w-cerebro__caret"), { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, 0.9)
        .fromTo(q(".work-facts > *"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 1.2)
        .fromTo(
          frame,
          { clipPath: "inset(100% 0% 0% 0% round 22px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 22px)",
            duration: 1.4,
            ease: EASE.inOut,
            onComplete: () => gsap.set(frame, { clearProps: "clipPath" }),
          },
          0.55
        );

      return onReady(() => tl.play());
    },
    { scope: rootRef, dependencies: [title, tagline], revertOnUpdate: true }
  );

  return (
    <header className="w-cerebro" ref={rootRef} data-work-top>
      <div className="container">
        {crumb}
        <p className="w-cerebro__prompt mono" aria-hidden="true">
          <span className="w-cerebro__prompt-text">{PROMPT}</span>
        </p>
        <h1 className="w-cerebro__title">
          <SplitReveal text={title} by="chars" />
        </h1>
        <p className="w-cerebro__tagline">
          <span className="sr-only">{tagline}</span>
          <span aria-hidden="true">
            {tokens(tagline).map((token, k) => (
              <span className="w-cerebro__token" key={`${k}-${token}`}>
                {token}
              </span>
            ))}
            <i className="w-cerebro__caret" />
          </span>
        </p>
        {facts}
      </div>
      <div className="container w-cerebro__scene">
        <div className="case__media case__media--diagram w-cerebro__frame">{media}</div>
      </div>
    </header>
  );
}
