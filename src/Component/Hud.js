import React, { Suspense, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { TLink } from "../Effects/PageTransition";
import { gsap, EASE, onReady, hasFinePointer } from "../Effects/motion";
import { isSoundOn, setSound, subscribeSound, play } from "../Effects/sound";
import { setFps } from "../Effects/perf";
import { setHud } from "../Effects/hudState";
import { pageLabelKey } from "./navItems";
import "../css/Hud.css";

const LANGS = ["fr", "en", "es"];
const pad = (n, size = 2) => String(n).padStart(size, "0");

const ZONE = (() => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop().replace(/_/g, " ");
  } catch (e) {
    return "";
  }
})();

function useSoundState() {
  const [on, setOn] = useState(isSoundOn());
  useEffect(() => subscribeSound(() => setOn(isSoundOn())), []);
  return on;
}

// Habillage « moteur de jeu » : coins de cadre, barre d'état (niveau, XP au scroll, FPS, heure, son)
function HudInner() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const rootRef = useRef(null);
  const nameRef = useRef(null);
  const previousName = useRef(null);
  const [scene, setScene] = useState({ index: 0, name: "" });
  const soundOn = useSoundState();

  const segments = pathname.split("/").filter(Boolean);
  const lang = LANGS.includes(segments[0]) ? segments[0] : (i18n.language || "fr").slice(0, 2);
  const labelKey = pageLabelKey("/" + segments.slice(1).join("/"));
  const pageName = labelKey ? t(labelKey) : t("Hud.lost");
  const levelName = scene.name || pageName;

  // Entrée du HUD quand le rideau du préloader s'ouvre
  useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef);
      gsap.set(q(".hud__corner"), { opacity: 0 });
      gsap.set(q(".hud__logo, .hud__item"), { opacity: 0, y: 12 });
      const cancel = onReady(() => {
        gsap
          .timeline({ defaults: { ease: EASE.out } })
          .to(q(".hud__corner"), { opacity: 1, duration: 1.2, stagger: 0.08 }, 0)
          .to(q(".hud__logo, .hud__item"), { opacity: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.25);
      });
      return cancel;
    },
    { scope: rootRef }
  );

  // Horloge, FPS et coordonnées du pointeur : écrits directement dans le DOM, sans rendu React
  useEffect(() => {
    const root = rootRef.current;
    const clockEl = root.querySelector("[data-clock]");
    const fpsEl = root.querySelector("[data-fps]");
    const posEl = root.querySelector("[data-pos]");

    const tickClock = () => {
      const d = new Date();
      clockEl.textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };
    tickClock();
    const clock = setInterval(tickClock, 1000);

    let frames = 0;
    let last = performance.now();
    const onTick = () => {
      frames += 1;
      const now = performance.now();
      if (now - last < 500) return;
      const elapsed = now - last;
      const fps = Math.min(144, Math.round((frames * 1000) / elapsed));
      frames = 0;
      last = now;
      // Onglet resté en arrière-plan : la mesure n'est pas représentative
      if (document.hidden || elapsed > 1500) return;
      fpsEl.textContent = pad(fps);
      setFps(fps);
    };
    gsap.ticker.add(onTick);

    let removePointer = () => {};
    if (hasFinePointer()) {
      let frame = 0;
      let x = 0;
      let y = 0;
      const write = () => {
        frame = 0;
        posEl.textContent = `${pad(Math.round(x), 4)}·${pad(Math.round(y), 4)}`;
      };
      const onMove = (e) => {
        x = e.clientX;
        y = e.clientY;
        if (!frame) frame = requestAnimationFrame(write);
      };
      window.addEventListener("pointermove", onMove, { passive: true });
      removePointer = () => {
        window.removeEventListener("pointermove", onMove);
        cancelAnimationFrame(frame);
      };
    }

    return () => {
      clearInterval(clock);
      gsap.ticker.remove(onTick);
      removePointer();
    };
  }, []);

  // XP = progression de lecture de la page ; niveau = section au centre de l'écran
  useEffect(() => {
    const root = rootRef.current;
    const xpEl = root.querySelector(".hud__xp");
    const xpNum = root.querySelector("[data-xp]");

    let raf = 0;
    const read = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      xpEl.style.setProperty("--xp", p.toFixed(4));
      xpNum.textContent = pad(Math.round(p * 100), 3);
      setHud({ xp: p });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    read();

    let observer = null;
    let items = [];
    const sync = () => {
      if (observer) observer.disconnect();
      items = Array.from(document.querySelectorAll("[data-hud]"));
      if (items.length === 0) {
        setScene((current) => (current.name ? { index: 0, name: "" } : current));
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = items.indexOf(entry.target);
            if (index >= 0) setScene({ index, name: entry.target.dataset.hud });
          });
        },
        { rootMargin: "-48% 0px -48% 0px" }
      );
      items.forEach((el) => observer.observe(el));
    };

    let debounce = 0;
    const mutations = new MutationObserver(() => {
      clearTimeout(debounce);
      debounce = setTimeout(sync, 250);
    });
    const host = document.getElementById("root");
    if (host) mutations.observe(host, { childList: true, subtree: true });
    setScene({ index: 0, name: "" });
    sync();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
      clearTimeout(debounce);
      mutations.disconnect();
      if (observer) observer.disconnect();
    };
  }, [pathname]);

  // Le nom du niveau se « décode » à chaque changement de section
  useEffect(() => {
    const el = nameRef.current;
    if (!el) return;
    setHud({ name: levelName });
    if (previousName.current === null) {
      previousName.current = levelName;
      el.textContent = levelName;
      return;
    }
    if (previousName.current === levelName) return;
    previousName.current = levelName;
    play("tick");
    gsap.to(el, {
      duration: 0.7,
      ease: "none",
      scrambleText: { text: levelName, chars: "01<>/#_", speed: 0.7 },
    });
  }, [levelName]);

  return (
    <div className="hud" ref={rootRef} aria-hidden="true">
      <i className="hud__corner hud__corner--tl" />
      <i className="hud__corner hud__corner--tr" />
      <i className="hud__corner hud__corner--bl" />
      <i className="hud__corner hud__corner--br" />

      <TLink className="hud__logo" to={`/${lang}`} label="" tabIndex={-1}>
        <span>AB</span>
      </TLink>

      <div className="hud__bar">
        <div className="hud__item hud__level">
          <span className="hud__tag">{t("Hud.level")}</span>
          <span className="hud__level-num">{pad(scene.index + 1)}</span>
          <span className="hud__sep">/</span>
          <span className="hud__level-name" ref={nameRef} />
        </div>

        <div className="hud__item hud__xp-wrap">
          <span className="hud__tag">XP</span>
          <span className="hud__xp">
            <i className="hud__xp-track" />
            <i className="hud__xp-fill" />
          </span>
          <span className="hud__num" data-xp>
            000
          </span>
        </div>

        <div className="hud__item hud__stats">
          <span className="hud__stat hud__stat--pos">
            <span className="hud__tag">XY</span>
            <span data-pos>0000·0000</span>
          </span>
          <span className="hud__stat hud__stat--fps">
            <span className="hud__tag">FPS</span>
            <span data-fps>60</span>
          </span>
          <span className="hud__stat hud__stat--clock">
            <span data-clock>00:00:00</span>
            {ZONE && <span className="hud__zone">{ZONE}</span>}
          </span>
          <button
            type="button"
            className={`hud__sound${soundOn ? " is-on" : ""}`}
            tabIndex={-1}
            data-sound-skip
            onClick={() => setSound(!isSoundOn())}
          >
            <span className="hud__eq">
              <i />
              <i />
              <i />
              <i />
            </span>
            <span>{t(soundOn ? "Hud.soundOn" : "Hud.soundOff")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Hud() {
  return (
    <Suspense fallback={null}>
      <HudInner />
    </Suspense>
  );
}
