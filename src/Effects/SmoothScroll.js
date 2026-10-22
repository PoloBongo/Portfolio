import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";

const LenisContext = createContext(null);

export const useLenis = () => useContext(LenisContext);

// Défilement vers une ancre / un élément / une position, lissé si Lenis est actif
export function useScrollTo() {
  const lenis = useLenis();
  return useCallback(
    (target, options = {}) => {
      if (lenis) {
        lenis.scrollTo(target, {
          duration: 1.4,
          easing: (t) => 1 - Math.pow(1 - t, 4),
          ...options,
        });
        return;
      }
      const behavior = prefersReducedMotion() ? "auto" : "smooth";
      if (typeof target === "number") {
        window.scrollTo({ top: target, behavior });
        return;
      }
      const el = typeof target === "string" ? document.querySelector(target) : target;
      if (el) el.scrollIntoView({ behavior, block: "start" });
    },
    [lenis]
  );
}

export default function SmoothScroll({ children }) {
  const [lenis, setLenis] = useState(null);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const instance = new Lenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      smoothWheel: true,
      autoRaf: false,
    });
    instance.on("scroll", ScrollTrigger.update);
    // Aide au debug : window.lenis.scrollTo(...) depuis la console
    if (process.env.NODE_ENV === "development") window.lenis = instance;

    const tick = (time) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
    };
  }, []);

  // Les positions des ScrollTrigger dépendent des polices et des images
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    window.addEventListener("load", refresh);
    return () => window.removeEventListener("load", refresh);
  }, []);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
