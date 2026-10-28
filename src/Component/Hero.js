import React, { useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { GitHubIcon, LinkedInIcon } from "./SocialIcons";
import SplitReveal from "../Effects/SplitReveal";
import Button from "./Button";
import Magnetic from "../Effects/Magnetic";
import { TLink } from "../Effects/PageTransition";
import { peekLanding } from "../Effects/homeReturn";
import { useLenis, useScrollTo } from "../Effects/SmoothScroll";
import { gsap, ScrollTrigger, EASE, onReady, prefersReducedMotion, hasFinePointer } from "../Effects/motion";
import { setFieldTint, setHeroShape, triggerWarp } from "../Effects/fieldBus";
import { play } from "../Effects/sound";
import "../css/Landing.css";

// Le hero est une bande-annonce du site en trois actes, un monde chacun : forme du nuage, couleur, façon d'écrire
// le rôle, page où il mène. La scène est épinglée (CSS sticky) sur trois écrans : le défilement fait avancer les
// actes. Une visite guidée les enchaîne seule la première fois (DWELL secondes chacun, pause possible), puis
// s'arrête ; dès que l'on défile, la main passe au scroll.
const ACTS = [
  { id: "web", roleKey: "Hero.roleWeb", shape: "browser", tint: [0.85, 1, 0.29], color: "#d9ff4a", to: "/ProjectsWeb" },
  { id: "ai", roleKey: "Hero.roleAI", shape: "network", tint: [0.39, 0.9, 0.75], color: "#63e6be", to: "/AI" },
  { id: "game", roleKey: "Hero.roleGame", shape: "pad", tint: [1, 0.37, 0.66], color: "#ff5fa8", to: "/Unity" },
];

const NEUTRAL = [0.62, 0.34, 0.98]; // le violet d'origine du nuage
const DWELL = 8; // durée d'un acte pendant la visite guidée (s)
const SCRAMBLE = "01<>/{}#_";
const PIXEL_BLOCKS = [30, 20, 13, 9, 6, 4, 2.6, 1.6];

// Retards (en s) des « jetons » de l'accroche : irréguliers, comme une réponse de modèle en streaming
const TOKEN_AT = [0, 0.11, 0.2, 0.36, 0.45, 0.62, 0.7, 0.86];

// Graisse des lettres du nom : lourdes au repos, plus fines autour du curseur
const WEIGHT_REST = 760;
const WEIGHT_NEAR = 300;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const words = (text) => text.match(/\S+\s*/g) || [text];

// Une visite guidée, une écriture du nom et une entrée du hero par chargement de page : revenir sur l'accueil
// (précédent du navigateur, lien « Projets ») ne les rejoue pas
let toured = false;
let nameFormed = false;

export default function Hero() {
  const { t } = useTranslation();
  const { lang = "fr" } = useParams();
  const scrollTo = useScrollTo();
  const lenis = useLenis();
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;
  const rootRef = useRef(null);
  const nameRef = useRef(null);

  const roles = ACTS.map((act) => t(act.roleKey));
  const tags = ACTS.map((act) => t(`Hero.tag.${act.id}`));
  const names = ACTS.map((act) => t(`Hero.rail.${act.id}`));
  const staticMode = prefersReducedMotion();

  useGSAP(
    (context, contextSafe) => {
      const root = rootRef.current;
      const q = gsap.utils.selector(root);
      const chars = q(".hero__name .split-char");
      const reduced = prefersReducedMotion();

      // Chaque lettre garde sa largeur de graisse maximale : le poids varie sans décaler la ligne
      const lockWidths = () => {
        chars.forEach((el) => {
          el.style.width = "";
        });
        gsap.set(chars, { "--w": WEIGHT_REST });
        chars.forEach((el) => {
          el.style.width = `${el.getBoundingClientRect().width}px`;
          el.style.textAlign = "center";
        });
      };
      const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      let alive = true;
      fontsReady.then(() => alive && lockWidths());
      window.addEventListener("resize", lockWidths);

      // Mouvement réduit : le hero est une page fixe (les trois rôles côte à côte, sans rail ni visite)
      if (reduced) {
        gsap.set(chars, { "--w": WEIGHT_REST });
        setHeroShape("sphere");
        setFieldTint(NEUTRAL, 0);
        return () => {
          alive = false;
          window.removeEventListener("resize", lockWidths);
        };
      }

      const acts = q(".hero__act");
      const railBtns = q(".hero__rail-btn");
      const railBars = q(".hero__rail-bar");
      const pauseBtn = q(".hero__pause")[0];
      const labels = { pause: t("Hero.pause"), play: t("Hero.play"), replay: t("Hero.replay") };
      const roleOf = (i) => acts[i].querySelector(".hero__role-text");

      // Position où la page va se poser s'il s'agit d'un retour (voir Effects/homeReturn.js)
      const landing = peekLanding();
      const tour = !toured && (landing === null ? window.scrollY : landing) < 4;
      // Déjà vu pendant ce chargement : le hero apparaît d'un coup, dans son état final (pas d'écriture des lettres)
      const skipIntro = toured || nameFormed;

      // Retour sur l'accueil à mi-défilement (précédent du navigateur) : on repart de l'acte où se trouve la page
      const last = ACTS.length - 1;
      const pinned = window.matchMedia("(min-height: 561px)").matches;
      const here = landing === null ? window.scrollY : landing;
      const initialAct = pinned ? clamp(Math.round(here / window.innerHeight), 0, last) : 0;

      let active = -1;
      let mode = "manual"; // « auto » tant que la visite guidée tourne
      let done = false; // la visite est terminée : le bouton propose de la rejouer
      let locked = false; // un défilement programmé est en cours (clic sur le rail)
      let started = false;
      root.removeAttribute("data-started");
      let fade = 0; // 0 → 1 quand le hero quitte l'écran : la teinte du nuage s'efface
      let st = null; // ScrollTrigger du défilement épinglé (absent sur écran trop bas)
      let autoCall = null;
      let barTween = null;
      let enter = null;
      let kick = null;

      gsap.set(acts, { autoAlpha: 0 });
      gsap.set(railBars, { scaleX: 0 });
      setHeroShape(ACTS[initialAct].shape);

      const applyTint = () => {
        const act = ACTS[active >= 0 ? active : initialAct];
        setFieldTint(act.tint, 0.9 * (1 - fade));
      };
      applyTint();

      const paintRail = (i) => {
        railBtns.forEach((btn, k) => {
          btn.classList.toggle("is-active", k === i);
          btn.classList.toggle("is-done", k < i);
          btn.parentElement.classList.toggle("is-active", k === i); // mobile : seul l'acte en cours garde son nom
          if (k === i) btn.setAttribute("aria-current", "true");
          else btn.removeAttribute("aria-current");
        });
      };
      // Chaque barre se remplit sur la plage de défilement de son acte (la première et la dernière, sur une demi-plage)
      const paintBars = (p) =>
        railBars.forEach((bar, k) => {
          const from = k === 0 ? 0 : k - 0.5;
          const to = k === last ? last : k + 0.5;
          gsap.set(bar, { scaleX: clamp((p - from) / (to - from), 0, 1) });
        });
      const setPauseState = (state) => {
        pauseBtn.dataset.state = state;
        pauseBtn.setAttribute("aria-label", labels[state]);
      };
      const clearAuto = () => {
        if (autoCall) autoCall.kill();
        if (barTween) barTween.kill();
        autoCall = null;
        barTween = null;
      };

      // Mosaïque qui se résout : le mot apparaît en gros pixels puis se précise (acte Jeu). Mot sur une seule ligne.
      const pixelResolve = (i) => {
        const role = roleOf(i);
        const cs = getComputedStyle(role);
        const rect = role.getBoundingClientRect();
        const lineHeight = parseFloat(cs.lineHeight) || rect.height;
        if (!rect.width || rect.height > lineHeight * 1.6) return null;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const w = Math.ceil(rect.width);
        const h = Math.ceil(rect.height);
        let canvas = role.querySelector(".hero__pixel");
        if (!canvas) {
          canvas = document.createElement("canvas");
          canvas.className = "hero__pixel";
          canvas.setAttribute("aria-hidden", "true");
          role.appendChild(canvas);
        }
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;

        const src = document.createElement("canvas");
        src.width = canvas.width;
        src.height = canvas.height;
        const sctx = src.getContext("2d");
        sctx.scale(dpr, dpr);
        sctx.fillStyle = ACTS[i].color;
        sctx.textBaseline = "middle";
        sctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        if ("letterSpacing" in sctx) sctx.letterSpacing = cs.letterSpacing;
        sctx.fillText(cs.textTransform === "uppercase" ? roles[i].toUpperCase() : roles[i], 0, h / 2);

        const tile = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const paint = (block) => {
          tile.width = Math.max(1, Math.round(w / block));
          tile.height = Math.max(1, Math.round(h / block));
          tile.getContext("2d").drawImage(src, 0, 0, tile.width, tile.height);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(tile, 0, 0, canvas.width, canvas.height);
        };

        const tl = gsap.timeline();
        tl.set(role, { color: "transparent", textShadow: "none" }, 0);
        PIXEL_BLOCKS.forEach((block, k) => tl.call(() => paint(block), null, k * 0.09));
        tl.call(
          () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            gsap.set(role, { clearProps: "color,textShadow" });
          },
          null,
          PIXEL_BLOCKS.length * 0.09
        );
        return tl;
      };

      // Entrée d'un acte : le rôle s'écrit à la façon de son monde, l'accroche arrive jeton par jeton
      const enterTl = (i) => {
        const el = acts[i];
        const role = roleOf(i);
        const tl = gsap.timeline();
        tl.set(el, { autoAlpha: 1 }, 0);

        const wipe = () =>
          tl.fromTo(
            role,
            { clipPath: "inset(-14% 100% -14% -3%)" },
            {
              clipPath: "inset(-14% -8% -14% -3%)",
              duration: 0.8,
              ease: "steps(9)",
              onComplete: () => gsap.set(role, { clearProps: "clipPath" }),
            },
            0.05
          );

        if (ACTS[i].id === "web") {
          wipe(); // des blocs qui s'ouvrent, comme une maquette qui se pose
        } else if (ACTS[i].id === "ai") {
          // le texte se « décode » depuis du bruit, comme une sortie de modèle
          tl.fromTo(role, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.05).to(
            role,
            { duration: 1.3, ease: "none", scrambleText: { text: roles[i], chars: SCRAMBLE, speed: 0.5, revealDelay: 0.2 } },
            0.05
          );
        } else {
          const pixels = pixelResolve(i);
          if (pixels) tl.add(pixels, 0.05);
          else wipe();
        }

        acts[i].querySelectorAll(".hero__token").forEach((token, k) => {
          tl.fromTo(token, { opacity: 0 }, { opacity: 1, duration: 0.01 }, 0.65 + TOKEN_AT[k % TOKEN_AT.length]);
        });
        tl.fromTo(acts[i].querySelector(".hero__caret"), { visibility: "hidden" }, { visibility: "visible", duration: 0.01 }, 0.6);
        tl.fromTo(acts[i].querySelector(".hero__enter"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8 }, 0.95);
        return tl;
      };

      const scheduleAuto = contextSafe(() => {
        clearAuto();
        if (mode !== "auto") return;
        barTween = gsap.fromTo(railBars[active], { scaleX: 0 }, { scaleX: 1, duration: DWELL, ease: "none" });
        autoCall = gsap.delayedCall(DWELL, () => {
          if (active < last) goTo(active + 1);
          else endTour();
        });
      });

      // Passage à un acte : forme, couleur et petit « saut » du nuage, rôle sortant, rôle entrant
      const goTo = contextSafe((i, { force = false } = {}) => {
        if (i === active && !force) return;
        const prev = active;
        active = i;
        paintRail(i);
        root.dataset.act = String(i);
        if (prev >= 0 && prev < i) gsap.set(railBars[prev], { scaleX: 1 });

        setHeroShape(ACTS[i].shape);
        applyTint();
        gsap.to(root, { "--act": ACTS[i].color, duration: 0.9, ease: "power2.out", overwrite: "auto" });
        if (prev >= 0) {
          triggerWarp(0.4);
          gsap.delayedCall(0.5, () => triggerWarp(0));
          play("reveal");
        }

        if (enter) enter.kill();
        acts.forEach((el, k) => {
          if (k !== i && k !== prev) gsap.set(el, { autoAlpha: 0 });
        });
        const tl = gsap.timeline();
        if (prev >= 0 && prev !== i) tl.to(acts[prev], { autoAlpha: 0, duration: 0.4, ease: "power2.in" }, 0);
        tl.add(enterTl(i), prev >= 0 ? 0.3 : 0);
        enter = tl;
        if (mode === "auto") scheduleAuto();
      });

      const endTour = contextSafe(() => {
        mode = "manual";
        done = true;
        clearAuto();
        setPauseState("replay");
        gsap.set(railBars, { scaleX: 0 });
        goTo(0);
      });

      const startTour = contextSafe(() => {
        done = false;
        mode = "auto";
        setPauseState("pause");
        scheduleAuto();
      });

      // Bouton pause / reprise / relecture
      const onPause = contextSafe(() => {
        if (!started) return;
        if (done || (mode === "manual" && window.scrollY > 4)) {
          // On rejoue depuis le début, en haut de la page
          const l = lenisRef.current;
          if (window.scrollY > 0) {
            if (l) l.scrollTo(0, { immediate: true, force: true });
            else window.scrollTo(0, 0);
          }
          gsap.set(railBars, { scaleX: 0 });
          mode = "auto";
          done = false;
          setPauseState("pause");
          goTo(0, { force: true });
          scheduleAuto();
          return;
        }
        if (mode === "auto") {
          mode = "manual";
          clearAuto();
          setPauseState("play");
        } else {
          startTour();
        }
      });

      // Clic sur le rail : on va à l'acte (et le défilement l'y accompagne, si le hero est épinglé)
      const jump = contextSafe((i) => {
        if (!started) return;
        mode = "manual";
        clearAuto();
        setPauseState(done ? "replay" : "play");
        if (!st) {
          goTo(i);
          return;
        }
        const target = st.start + (i / last) * (st.end - st.start);
        // Le défilement programmé ne doit pas redéclencher des changements d'acte en route
        locked = true;
        gsap.delayedCall(1.25, () => {
          locked = false;
        });
        goTo(i);
        const l = lenisRef.current;
        if (l) l.scrollTo(target, { duration: 1.1, easing: (x) => 1 - Math.pow(1 - x, 3) });
        else window.scrollTo(0, target);
      });

      // Première molette pendant la visite guidée : le scroll se cale sur l'acte affiché, puis prend la main
      const handOver = contextSafe((self) => {
        mode = "manual";
        clearAuto();
        setPauseState("play");
        const delta = window.scrollY - self.start;
        const target = self.start + (Math.max(active, 0) / last) * (self.end - self.start) + delta;
        const l = lenisRef.current;
        if (l) l.scrollTo(target, { immediate: true, force: true });
        else window.scrollTo(0, target);
      });

      const onScrollUpdate = (self) => {
        if (!started) return;
        if (mode === "auto") {
          if (window.scrollY - self.start > 3) handOver(self);
          return;
        }
        const p = self.progress * last;
        paintBars(p);
        if (locked) return;
        const idx = active < 0 || Math.abs(p - active) >= 0.58 ? Math.round(p) : active;
        if (idx !== active) goTo(idx);
      };

      // Un seul écran de hauteur, ou trop bas pour épingler : les actes avancent sans le défilement
      const mm = gsap.matchMedia();
      mm.add("(min-height: 561px)", () => {
        st = ScrollTrigger.create({ trigger: root, start: "top top", end: "bottom bottom", onUpdate: onScrollUpdate });
        return () => {
          st = null;
        };
      });

      // La teinte du monde s'efface quand le hero quitte l'écran
      ScrollTrigger.create({
        trigger: root,
        start: "bottom bottom",
        end: "bottom 30%",
        onUpdate: (self) => {
          fade = self.progress;
          applyTint();
        },
      });

      const removeRail = railBtns.map((btn, i) => {
        const onClick = () => jump(i);
        btn.addEventListener("click", onClick);
        return () => btn.removeEventListener("click", onClick);
      });
      pauseBtn.addEventListener("click", onPause);

      // Entrée : le nuage écrit le nom, puis les lettres du titre montent, puis le premier acte démarre
      const hello = q(".hero__hello")[0];
      const intro = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      intro
        .fromTo(hello, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 0.1)
        .to(
          hello,
          { duration: 1.3, ease: "none", scrambleText: { text: hello.textContent, chars: "01<>/{}#", speed: 0.5, revealDelay: 0.25 } },
          0.1
        )
        .fromTo(chars, { yPercent: 118, "--w": 160 }, { yPercent: 0, "--w": WEIGHT_REST, duration: 1.5, stagger: 0.05 }, 0.12)
        .fromTo(q(".hero__action"), { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1, stagger: 0.09 }, 0.75)
        .fromTo(q(".hero__controls"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 1.1)
        .fromTo(q(".hero__scroll"), { opacity: 0 }, { opacity: 1, duration: 1 }, 1.1)
        .call(
          contextSafe(() => {
            started = true;
            nameFormed = true;
            toured = true;
            root.dataset.started = "1";
            // On part de l'acte où se trouve la page (défilement restauré, ou saisi pendant l'entrée)
            goTo(skipIntro ? initialAct : st ? clamp(Math.round(st.progress * last), 0, last) : 0, { force: true });
            if (tour && window.scrollY < 4) startTour();
            else setPauseState("play");
          }),
          null,
          1.35
        );
      // Retour sur l'accueil : l'entrée est jouée d'un trait (les rappels aussi), sans attendre la porte
      let cancelReady = () => {};
      if (skipIntro) {
        intro.progress(1, false);
      } else {
        cancelReady = onReady(() => {
          kick = gsap.delayedCall(0, () => intro.play());
        });
      }

      // Au scroll, le contenu s'efface en glissant légèrement vers le haut (une fois la scène épinglée libérée)
      gsap.to(q(".hero__content"), {
        yPercent: -14,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: root, start: "bottom bottom", end: "bottom top", scrub: true },
      });

      // Proximité du curseur : la graisse des lettres voisines baisse
      let removePointer = () => {};
      if (hasFinePointer()) {
        const setters = chars.map((el) => gsap.quickTo(el, "--w", { duration: 0.5, ease: "power3" }));
        let frame = 0;
        const onMove = (e) => {
          if (frame) return;
          frame = requestAnimationFrame(() => {
            frame = 0;
            const bounds = nameRef.current.getBoundingClientRect();
            const near = e.clientY > bounds.top - 160 && e.clientY < bounds.bottom + 160;
            chars.forEach((el, i) => {
              if (!near) {
                setters[i](WEIGHT_REST);
                return;
              }
              const rect = el.getBoundingClientRect();
              const dist = Math.abs(e.clientX - (rect.left + rect.width / 2));
              const k = Math.max(0, 1 - dist / (bounds.width * 0.22));
              setters[i](WEIGHT_REST - (WEIGHT_REST - WEIGHT_NEAR) * k * k);
            });
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        removePointer = () => {
          window.removeEventListener("pointermove", onMove);
          cancelAnimationFrame(frame);
        };
      }

      return () => {
        alive = false;
        cancelReady();
        if (kick) kick.kill();
        clearAuto();
        if (enter) enter.kill();
        mm.revert();
        removePointer();
        window.removeEventListener("resize", lockWidths);
        removeRail.forEach((remove) => remove());
        pauseBtn.removeEventListener("click", onPause);
        setFieldTint(NEUTRAL, 0);
      };
    },
    { scope: rootRef, dependencies: [roles.join("|"), tags.join("|")], revertOnUpdate: true }
  );

  return (
    <section
      className={`hero${staticMode ? " hero--static" : ""}`}
      ref={rootRef}
      data-hud={t("Hud.hero")}
      data-cursor="query"
      data-act="0"
    >
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__stage">
        <div className="container hero__inner">
          <div className="hero__content">
            <p className="hero__hello mono">{t("Hero.hello")}</p>

            <h1 className="hero__name" ref={nameRef}>
              <SplitReveal text="Arthur BRU" by="chars" as="span" />
            </h1>

            <div className="hero__roles">
              <span className="sr-only">
                {roles.join(", ")}. {t("Hero.tagline")}
              </span>
              <div className="hero__acts">
                {ACTS.map((act, i) => (
                  <div className={`hero__act hero__act--${act.id}`} key={act.id}>
                    <TLink className="hero__role" to={`/${lang}${act.to}`} label={roles[i]}>
                      <span className="hero__role-text">{roles[i]}</span>
                    </TLink>
                    <p className="hero__tagline mono" aria-hidden="true">
                      {words(tags[i]).map((token, k) => (
                        <span className="hero__token" key={`${k}-${token}`}>
                          {token}
                        </span>
                      ))}
                      <i className="hero__caret" />
                    </p>
                    <TLink className="hero__enter mono" to={`/${lang}${act.to}`} label={roles[i]}>
                      {t(`Hero.enter.${act.id}`)} <span aria-hidden="true">→</span>
                    </TLink>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hero__foot">
            <div className="hero__actions">
              <span className="hero__action">
                <Button
                  variant="solid"
                  href="#skills"
                  arrow={false}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollTo("#skills", { offset: -20 });
                  }}
                >
                  {t("Home.discover")}
                </Button>
              </span>
              <span className="hero__action">
                <Magnetic>
                  <a
                    className="hero__social"
                    href="https://www.linkedin.com/in/arthur-bru-b71327252/"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                  >
                    <LinkedInIcon />
                  </a>
                </Magnetic>
              </span>
              <span className="hero__action">
                <Magnetic>
                  <a
                    className="hero__social"
                    href="https://github.com/PoloBongo"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="GitHub"
                  >
                    <GitHubIcon />
                  </a>
                </Magnetic>
              </span>
            </div>

            <div className="hero__controls">
              <ol className="hero__rail">
                {ACTS.map((act, i) => (
                  <li key={act.id}>
                    <button type="button" className="hero__rail-btn">
                      <span className="hero__rail-n mono">0{i + 1}</span>{" "}
                      <span className="hero__rail-name mono">{names[i]}</span>
                      <i className="hero__rail-bar" />
                    </button>
                  </li>
                ))}
              </ol>
              <button type="button" className="hero__pause" data-state="pause" aria-label={t("Hero.pause")}>
                <svg viewBox="0 0 12 12" aria-hidden="true">
                  <g className="i-pause">
                    <rect x="2" y="1.5" width="2.8" height="9" rx="0.6" />
                    <rect x="7.2" y="1.5" width="2.8" height="9" rx="0.6" />
                  </g>
                  <path className="i-play" d="M3 1.8v8.4L10.2 6z" />
                  <path
                    className="i-replay"
                    d="M2.2 6a3.8 3.8 0 1 0 1.2-2.8M2 1.6v2.2h2.2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="hero__scroll mono" aria-hidden="true">
              <span>{t("Hero.scroll")}</span>
              <i />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
