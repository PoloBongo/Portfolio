import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { flushSync } from "react-dom";
import { Link, useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useLenis } from "./SmoothScroll";
import { gsap, EASE, lockGate, prefersReducedMotion } from "./motion";
import { play } from "./sound";
import { triggerWarp } from "./fieldBus";
import { prefetch } from "./prefetch";
import { transitionOf } from "../Worlds/transitions";
import { expectLanding, isHome, landingFor, rememberHome, setLanding } from "./homeReturn";

// Les 17 genres de transition (une dizaine de Ko) ne sont chargés qu'au premier survol d'un lien vers un monde,
// ou au début de la première transition
const loadGenres = () => import("./worldTransition");

const BARS = Array.from({ length: 5 });
const TransitionContext = createContext({ navigateTo: null, prefetch: null });

export const useTransition = () => useContext(TransitionContext);

// Point d'où part la transition : le clic, ou le centre du lien quand il vient du clavier
const originOf = (e) => {
  if (e.detail === 0 && e.currentTarget) {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  return { x: e.clientX, y: e.clientY };
};

// Lien interne qui joue la transition avant de changer de route. Le survol, le focus et le début du toucher
// préchargent la page visée (voir Effects/prefetch.js).
export function TLink({ to, label, onClick, onPointerEnter, onFocus, onTouchStart, children, ...rest }) {
  const { navigateTo, prefetch: warm } = useTransition();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    if (e.defaultPrevented || !navigateTo) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (rest.target === "_blank") return;
    e.preventDefault();
    navigateTo(to, { label, origin: originOf(e) });
  };

  const preload = (handler) => (e) => {
    if (handler) handler(e);
    if (warm) warm(to);
  };

  return (
    <Link
      to={to}
      onClick={handleClick}
      onPointerEnter={preload(onPointerEnter)}
      onFocus={preload(onFocus)}
      onTouchStart={preload(onTouchStart)}
      {...rest}
    >
      {children}
    </Link>
  );
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Transition entre « mondes » (pages projet) : l'ancien décor se tend (le nuage s'étire), puis la transition
// signature du monde (Worlds/transitions.js, Effects/worldTransition.js) change la page ; cercle depuis le clic
// par défaut. Nuage et couleurs du nouveau monde sont déjà en place (View Transitions).
const WORLD_ANTICIPATION = 260; // ms

const WORK_PATH = /^\/(?:fr|en|es)\/work\//;

// Pose la page à l'endroit voulu tout de suite (retour à l'accueil : section visée ou position laissée), puis la
// position attendue par le hero est oubliée
const jumpTo = (y, scroller) => {
  window.scrollTo(0, y);
  if (scroller) scroller.scrollTo(y, { immediate: true, force: true });
  setLanding(null);
};

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

  // Rideau de cinq colonnes : le contenu change pendant qu'il couvre l'écran
  const playCurtain = useCallback(
    async (to, label, unlock) => {
      const { navigate: go } = live.current;
      labelRef.current.textContent = label;
      play("whoosh");
      triggerWarp(1);
      await cover();

      const swapped = new Promise((resolve) => {
        pendingSwap.current = resolve;
      });
      const target = new URL(to, window.location.origin);
      setLanding(expectLanding(target));
      go(to);
      window.scrollTo(0, 0);
      if (live.current.lenis) live.current.lenis.scrollTo(0, { immediate: true, force: true });
      await Promise.race([swapped, wait(1500)]);
      jumpTo(landingFor(target), live.current.lenis);

      // Le scroll reprend avant la révélation : redémarrer Lenis plus tard annulerait un défilement
      // vers une ancre lancé par la nouvelle page (useHashScroll)
      if (live.current.lenis) live.current.lenis.start();
      play("reveal");
      triggerWarp(0);
      await reveal(unlock);
    },
    [cover, reveal]
  );

  // Transition « monde » : cercle qui s'ouvre depuis le clic. Pas de requestAnimationFrame dans le callback de
  // la View Transition (le rendu y est suspendu : il ne se déclencherait qu'après le délai de 4 s du navigateur).
  const playWorld = useCallback(async (to, origin, unlock) => {
    const { navigate: go, location: here } = live.current;
    const html = document.documentElement;
    // Le monde visé donne le genre de la transition ; en sortant d'un monde vers une page ordinaire, c'est le sien
    const signature = transitionOf(to) || transitionOf(here.pathname);
    const accent = getComputedStyle(html).getPropertyValue("--violet").trim() || "#bc63ff";

    // Pendant que l'ancien décor se tend, la page visée et son monde se chargent (1,8 s au plus)
    html.classList.add("is-world");
    play("whoosh");
    triggerWarp(1);
    const [{ playGenre }] = await Promise.all([loadGenres(), Promise.race([prefetch(to), wait(1800)]), wait(WORLD_ANTICIPATION)]);

    await playGenre({
      genre: signature ? signature.genre : "iris",
      options: signature || {},
      colors: signature ? signature.colors : [accent, "#63e6be", "#0a0a0f"],
      origin,
      unlock,
      swap: () => {
        const target = new URL(to, window.location.origin);
        html.classList.remove("is-world");
        setLanding(expectLanding(target));
        flushSync(() => go(to));
        jumpTo(landingFor(target), live.current.lenis);
      },
      onStart: () => {
        play("reveal");
        triggerWarp(0);
      },
    });
  }, []);

  const navigateTo = useCallback(
    async (to, { label = "", origin } = {}) => {
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
        if (isHome(here.pathname)) rememberHome(window.scrollY);
        setLanding(expectLanding(target));
        flushSync(() => go(to));
        jumpTo(landingFor(target), live.current.lenis);
        return;
      }

      // Entrer dans un monde, en sortir ou passer de l'un à l'autre : transition « monde » si le navigateur sait
      // les faire (sinon rideau)
      const world =
        typeof document.startViewTransition === "function" &&
        (WORK_PATH.test(here.pathname) || WORK_PATH.test(target.pathname));

      // On quitte l'accueil : on retient où l'on était pour y revenir (précédent du navigateur)
      if (isHome(here.pathname)) rememberHome(window.scrollY);

      busy.current = true;
      const unlock = lockGate();
      document.documentElement.classList.add("is-switching");
      try {
        if (scroller) scroller.stop();
        if (world) await playWorld(to, origin, unlock);
        else await playCurtain(to, label, unlock);
      } finally {
        triggerWarp(0);
        unlock();
        document.documentElement.classList.remove("is-switching", "is-world");
        if (live.current.lenis) live.current.lenis.start();
        busy.current = false;
      }
    },
    [playCurtain, playWorld]
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
    jumpTo(landingFor(new URL(window.location.href), { back: true }), live.current.lenis);

    reveal(unlock).finally(() => {
      unlock();
      busy.current = false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  // Debug (dev seulement) : window.__navigateTo("/fr/work/funfair", { origin: { x, y } }) ; window.__vtSlow = 6 ralentit
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return undefined;
    window.__navigateTo = navigateTo;
    return () => {
      delete window.__navigateTo;
    };
  }, [navigateTo]);

  const warm = useCallback((to) => {
    try {
      const { pathname } = new URL(to, window.location.origin);
      prefetch(pathname);
      if (WORK_PATH.test(pathname)) loadGenres();
    } catch (e) {
      // adresse invalide : rien à précharger
    }
  }, []);

  const value = useMemo(() => ({ navigateTo, prefetch: warm }), [navigateTo, warm]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <div className="vt-fx" aria-hidden="true" />
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
