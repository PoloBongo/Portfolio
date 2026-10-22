import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { GitHubIcon, LinkedInIcon } from "./SocialIcons";
import Aurora from "../Effects/Aurora";
import SplitReveal from "../Effects/SplitReveal";
import Stage from "./Stage";
import Button from "./Button";
import Magnetic from "../Effects/Magnetic";
import { useScrollTo } from "../Effects/SmoothScroll";
import { gsap, EASE, onReady, prefersReducedMotion, hasFinePointer } from "../Effects/motion";
import "../css/Landing.css";

const ROLE_KEYS = ["Hero.roleGame", "Hero.roleWeb", "Hero.roleAI"];

// Graisse des lettres du nom : lourdes au repos, plus fines autour du curseur
const WEIGHT_REST = 760;
const WEIGHT_NEAR = 300;

export default function Hero() {
  const { t } = useTranslation();
  const scrollTo = useScrollTo();
  const rootRef = useRef(null);
  const nameRef = useRef(null);

  const roles = ROLE_KEYS.map((key) => t(key));
  const rolesLoop = [...roles, roles[0]];

  useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef);
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

      if (reduced) {
        gsap.set(chars, { "--w": WEIGHT_REST });
        return () => {
          alive = false;
          window.removeEventListener("resize", lockWidths);
        };
      }

      // Entrée : rideau levé, les lettres montent en s'épaississant
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      const hello = q(".hero__hello")[0];
      tl.fromTo(q(".hero__bg"), { opacity: 0 }, { opacity: 1, duration: 2, ease: "power2.out" }, 0)
        .fromTo(hello, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 0.1)
        .to(
          hello,
          {
            duration: 1.3,
            ease: "none",
            scrambleText: { text: hello.textContent, chars: "01<>/{}#", speed: 0.5, revealDelay: 0.25 },
          },
          0.1
        )
        .fromTo(
          chars,
          { yPercent: 118, "--w": 160 },
          { yPercent: 0, "--w": WEIGHT_REST, duration: 1.5, stagger: 0.05 },
          0.12
        )
        .fromTo(q(".hero__roles"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1 }, 0.55)
        .fromTo(
          q(".hero__action"),
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.09 },
          0.75
        )
        .fromTo(q(".hero__scroll"), { opacity: 0 }, { opacity: 1, duration: 1 }, 1.1);
      const cancelReady = onReady(() => tl.play());

      // Mots-clés qui défilent l'un après l'autre
      const list = q(".hero__roles-list")[0];
      const steps = rolesLoop.length;
      const loop = gsap.timeline({ repeat: -1, delay: 1.6 });
      for (let i = 1; i < steps; i += 1) {
        loop.to(
          list,
          { yPercent: -(100 / steps) * i, duration: 0.9, ease: EASE.inOut },
          i === 1 ? 0.6 : "+=1.7"
        );
      }

      // Au scroll, le contenu s'efface en glissant légèrement vers le haut
      gsap.to(q(".hero__content"), {
        yPercent: -14,
        opacity: 0.15,
        ease: "none",
        scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
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
        removePointer();
        window.removeEventListener("resize", lockWidths);
      };
    },
    { scope: rootRef, dependencies: [roles.join("|")], revertOnUpdate: true }
  );

  return (
    <section className="hero" ref={rootRef} data-hud={t("Hud.hero")}>
      <Aurora className="hero__bg" />
      <div className="hero__shade" aria-hidden="true" />
      <Stage />

      <div className="container hero__inner">
        <div className="hero__content">
          <p className="hero__hello mono">{t("Hero.hello")}</p>

          <h1 className="hero__name" ref={nameRef}>
            <SplitReveal text="Arthur BRU" by="chars" as="span" />
          </h1>

          <div className="hero__roles serif">
            <span className="sr-only">{roles.join(", ")}</span>
            <ul className="hero__roles-list" aria-hidden="true">
              {rolesLoop.map((role, i) => (
                <li key={`${i}-${role}`}>{role}</li>
              ))}
            </ul>
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

          <div className="hero__scroll mono" aria-hidden="true">
            <span>{t("Hero.scroll")}</span>
            <i />
          </div>
        </div>
      </div>
    </section>
  );
}
