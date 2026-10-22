import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, EASE, onReady, prefersReducedMotion } from "./motion";

// Apparition au scroll : glissement vertical + fondu, déclenché une seule fois.
// stagger > 0 : les enfants directs entrent les uns après les autres.
export default function Reveal({
  as: Tag = "div",
  children,
  className = "",
  y = 36,
  delay = 0,
  duration = 1.1,
  stagger = 0,
  start = "top 90%",
  ...rest
}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const targets = stagger ? ref.current.children : ref.current;
      const tween = gsap.fromTo(
        targets,
        { y, opacity: 0 },
        { y: 0, opacity: 1, duration, delay, stagger, ease: EASE.out, paused: true }
      );
      ScrollTrigger.create({
        trigger: ref.current,
        start,
        once: true,
        onEnter: () => onReady(() => tween.play()),
      });
    },
    { scope: ref }
  );

  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
