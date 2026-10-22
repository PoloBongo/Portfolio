import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, hasFinePointer } from "./motion";

// L'enfant est légèrement attiré par le curseur quand il en approche.
// Le conteneur (zone de détection) reste fixe : seul l'enfant bouge.
export default function Magnetic({ children, strength = 0.32, className = "" }) {
  const wrapRef = useRef(null);
  const innerRef = useRef(null);

  useGSAP(
    () => {
      if (!hasFinePointer()) return undefined;
      const wrap = wrapRef.current;
      const xTo = gsap.quickTo(innerRef.current, "x", {
        duration: 0.9,
        ease: "elastic.out(1, 0.4)",
      });
      const yTo = gsap.quickTo(innerRef.current, "y", {
        duration: 0.9,
        ease: "elastic.out(1, 0.4)",
      });

      const onMove = (e) => {
        const rect = wrap.getBoundingClientRect();
        xTo((e.clientX - (rect.left + rect.width / 2)) * strength);
        yTo((e.clientY - (rect.top + rect.height / 2)) * strength);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };

      wrap.addEventListener("pointermove", onMove);
      wrap.addEventListener("pointerleave", onLeave);
      return () => {
        wrap.removeEventListener("pointermove", onMove);
        wrap.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: wrapRef }
  );

  return (
    <span className={`magnetic ${className}`} ref={wrapRef}>
      <span className="magnetic__inner" ref={innerRef}>
        {children}
      </span>
    </span>
  );
}
