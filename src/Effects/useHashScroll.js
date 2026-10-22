import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useScrollTo } from "./SmoothScroll";
import { onReady } from "./motion";

// Descend jusqu'à l'ancre de l'URL (#VueJs…) une fois la page révélée
export default function useHashScroll() {
  const { hash } = useLocation();
  const scrollTo = useScrollTo();

  useEffect(() => {
    if (!hash) return undefined;
    const id = decodeURIComponent(hash.slice(1));
    return onReady(() => {
      const el = document.getElementById(id);
      // Lenis tient déjà compte du scroll-margin-top de la cible (voir .case)
      if (el) scrollTo(el, { duration: 1.8 });
    });
  }, [hash, scrollTo]);
}
