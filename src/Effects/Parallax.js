import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "./motion";

// Le contenu défile un peu moins vite que la page (image à l'intérieur d'un cadre).
// amount : décalage maximal en % de la hauteur du cadre.
export default function Parallax({ children, amount = 9, className = "" }) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        innerRef.current,
        { y: () => -wrapRef.current.offsetHeight * (amount / 100) },
        {
          y: () => wrapRef.current.offsetHeight * (amount / 100),
          ease: "none",
          scrollTrigger: {
            trigger: wrapRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
            invalidateOnRefresh: true,
          },
        }
      );
    },
    { scope: wrapRef }
  );

  return (
    <div className={`parallax ${className}`} ref={wrapRef}>
      <div
        className="parallax__inner"
        ref={innerRef}
        style={{ inset: `${-amount}% 0` }}
      >
        {children}
      </div>
    </div>
  );
}
