import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { Link, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useLenis } from "./SmoothScroll";
import { gsap, EASE, lockGate, prefersReducedMotion } from "./motion";
import { play } from "./sound";

const BARS = Array.from({ length: 5 });
const TransitionContext = createContext({ navigateTo: null });

export const useTransition = () => useContext(TransitionContext);

// Lien interne qui joue le rideau de transition avant de changer de route
export function TLink({ to, label, onClick, children, ...rest }) {
  const { navigateTo } = useTransition();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented || !navigateTo) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target === "_blank") return;
    e.preventDefault();
    navigateTo(to, { label });
  };

  return (
    <Link to={to} onClick={handleClick} {...rest}>
      {children}
    </Link>
  );
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function PageTransition({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const navType = useNavigationType();
  const lenis = useLenis();

  const rootRef = useRef(null);
  const labelRef = useRef(null);
  const busy = useRef(false);
  const pendingSwap = useRef(null);
  const firstRender = useRef(true);

  // Valeurs courantes lues par les callbacks sans les recréer à chaque rendu
  const live = useRef({});
  live.current = { navigate, location, lenis };

  const layers = () => {
    const root = rootRef.current;
    return {
      root,
      all: root.querySelectorAll(".curtain__bar"),
      violet: root.querySelectorAll(".curtain__layer--violet .curtain__bar"),
      dark: root.querySelectorAll(".curtain__layer--dark .curtain__bar"),
    };
  };

  useEffect(() => {
    gsap.set(labelRef.current, { yPercent: 115 });
  }, []);

  const cover = useCallback(
    () =>
      new Promise((resolve) => {
        const { root, all, violet, dark } = layers();
        gsap
          .timeline({ onComplete: resolve })
          .set(root, { visibility: "visible", pointerEvents: "all" })
          .set(all, { transformOrigin: "50% 100%" })
          .fromTo(
            violet,
            { scaleY: 0 },
            { scaleY: 1, duration: 0.65, ease: EASE.inOut, stagger: { each: 0.05, from: "center" } }
          )
          .fromTo(
            dark,
            { scaleY: 0 },
            { scaleY: 1, duration: 0.65, ease: EASE.inOut, stagger: { each: 0.05, from: "center" } },
            0.1
          )
          .fromTo(
            labelRef.current,
            { yPercent: 115 },
            { yPercent: 0, duration: 0.55, ease: EASE.out },
            0.42
          );
      }),
    []
  );

  const reveal = useCallback(
    (onStart) =>
      new Promise((resolve) => {
        const { root, all, violet, dark } = layers();
        gsap
          .timeline({
            onComplete: () => {
              gsap.set(root, { visibility: "hidden", pointerEvents: "none" });
              resolve();
            },
          })
          .to(labelRef.current, { yPercent: -115, duration: 0.4, ease: EASE.inOut })
          .set(all, { transformOrigin: "50% 0%" }, 0.22)
          .to(
            dark,
            { scaleY: 0, duration: 0.7, ease: EASE.inOut, stagger: { each: 0.05, from: "edges" } },
            0.22
          )
          .to(
            violet,
            { scaleY: 0, duration: 0.7, ease: EASE.inOut, stagger: { each: 0.05, from: "edges" } },
            0.32
          )
          .add(() => {
            if (onStart) onStart();
          }, 0.5);
      }),
    []
  );

  const navigateTo = useCallback(
    async (to, { label = "" } = {}) => {
      if (busy.current) return;
      const { navigate: go, location: here, lenis: scroller } = live.current;
      const target = new URL(to, window.location.origin);

      if (target.pathname === here.pathname && target.search === here.search) {
        if (target.hash) go(to);
        else if (scroller) scroller.scrollTo(0, { duration: 1.2 });
        else window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (prefersReducedMotion()) {
        go(to);
        window.scrollTo(0, 0);
        return;
      }

      busy.current = true;
      const unlock = lockGate();
      document.documentElement.classList.add("is-switching");
      try {
        if (scroller) scroller.stop();
        labelRef.current.textContent = label;
        play("whoosh");
        await cover();

        const swapped = new Promise((resolve) => {
          pendingSwap.current = resolve;
        });
        go(to);
        window.scrollTo(0, 0);
        if (scroller) scroller.scrollTo(0, { immediate: true, force: true });
        await Promise.race([swapped, wait(1500)]);

        // Le scroll reprend avant la révélation : redémarrer Lenis plus tard annulerait un défilement
        // vers une ancre lancé par la nouvelle page (useHashScroll)
        if (live.current.lenis) live.current.lenis.start();
        play("reveal");
        await reveal(unlock);
      } finally {
        unlock();
        document.documentElement.classList.remove("is-switching");
        if (live.current.lenis) live.current.lenis.start();
        busy.current = false;
      }
    },
    [cover, reveal]
  );

  // La nouvelle route est montée : on laisse deux images + les polices avant de rouvrir le rideau
  useEffect(() => {
    if (!pendingSwap.current) return;
    const resolve = pendingSwap.current;
    pendingSwap.current = null;
    const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(() => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  }, [location.key]);

  // Retour / avant du navigateur : le contenu a déjà changé, on le masque puis on le révèle
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (navType !== "POP" || busy.current || prefersReducedMotion()) return;

    busy.current = true;
    const unlock = lockGate();
    const { root, all } = layers();
    labelRef.current.textContent = "";
    gsap.set(root, { visibility: "visible", pointerEvents: "all" });
    gsap.set(all, { scaleY: 1, transformOrigin: "50% 0%" });
    window.scrollTo(0, 0);
    if (live.current.lenis) live.current.lenis.scrollTo(0, { immediate: true, force: true });

    reveal(unlock).finally(() => {
      unlock();
      busy.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  const value = useMemo(() => ({ navigateTo }), [navigateTo]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div className="curtain" ref={rootRef} aria-hidden="true">
        <div className="curtain__layer curtain__layer--violet">
          {BARS.map((_, i) => (
            <span className="curtain__bar" key={i} />
          ))}
        </div>
        <div className="curtain__layer curtain__layer--dark">
          {BARS.map((_, i) => (
            <span className="curtain__bar" key={i} />
          ))}
        </div>
        <div className="curtain__label">
          <span ref={labelRef} />
        </div>
      </div>
    </TransitionContext.Provider>
  );
}
