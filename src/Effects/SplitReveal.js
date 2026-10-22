import React, { useMemo, useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, EASE, onReady, prefersReducedMotion } from "./motion";

// Découpe un texte en mots (ou lettres) sous masque. React garde la main sur le DOM :
// le texte reste traduisible, et un lecteur d'écran lit la copie masquée visuellement.
// scroll : le texte se révèle tout seul à l'entrée dans le viewport.
// Sinon l'animation est pilotée par le parent via .split-word__inner / .split-char.
export default function SplitReveal({
  text,
  as: Tag = "span",
  by = "words",
  className = "",
  scroll = false,
  delay = 0,
  ...rest
}) {
  const ref = useRef(null);
  const words = useMemo(() => text.split(" "), [text]);

  useGSAP(
    () => {
      if (!scroll || prefersReducedMotion()) return;
      const targets = ref.current.querySelectorAll(
        by === "chars" ? ".split-char" : ".split-word__inner"
      );
      const tween = gsap.fromTo(
        targets,
        { yPercent: 118 },
        {
          yPercent: 0,
          duration: 1.15,
          delay,
          ease: EASE.out,
          stagger: by === "chars" ? 0.035 : 0.075,
          paused: true,
        }
      );
      ScrollTrigger.create({
        trigger: ref.current,
        start: "top 92%",
        once: true,
        onEnter: () => onReady(() => tween.play()),
      });
    },
    { scope: ref, dependencies: [text, scroll], revertOnUpdate: true }
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => (
          <React.Fragment key={`${i}-${word}`}>
            <span className="split-word">
              {by === "chars" ? (
                Array.from(word).map((char, j) => (
                  <span className="split-char" key={j}>
                    {char}
                  </span>
                ))
              ) : (
                <span className="split-word__inner">{word}</span>
              )}
            </span>
            {i < words.length - 1 ? " " : null}
          </React.Fragment>
        ))}
      </span>
    </Tag>
  );
}
