import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, EASE, onReady, prefersReducedMotion, hasFinePointer } from "../Effects/motion";
import { UNITY_PROJECTS } from "../Pages/Unity/projects";
import { UNREAL_PROJECTS } from "../Pages/Unreal/projects";
import { GAMEJAM_PROJECTS } from "../Pages/GameJam/projects";
import { JV_PROJECTS } from "../Pages/ProjetctsJV/projects";
import { WEB_PROJECTS } from "../Pages/Projects/projects";
import { AI_PROJECTS } from "../Pages/AI/projects";
import { CERTIFICATES } from "./CertificateCarousel";
import "../css/Card.css";

const PORTRAIT = `${process.env.PUBLIC_URL || ""}/arthur.webp`;
const ROLE_KEYS = ["Hero.roleGame", "Hero.roleWeb", "Hero.roleAI"];

// Les chiffres viennent des données : ils suivent les pages de projets et les certifications sans retouche ici
const PROJECT_COUNT = [UNITY_PROJECTS, UNREAL_PROJECTS, GAMEJAM_PROJECTS, JV_PROJECTS, WEB_PROJECTS, AI_PROJECTS].reduce(
  (total, list) => total + list.length,
  0
);
const STATS = [
  { label: "Card.projects", value: PROJECT_COUNT },
  { label: "Card.certs", value: CERTIFICATES.length },
];

// Largeur de la mosaïque (en pixels) à chaque étape de « chargement » du portrait ; après la dernière, l'image nette
const MOSAIC = [5, 8, 12, 18, 28, 44, 70, 110, 170];
const CORNERS = ["tl", "tr", "bl", "br"];

const pad = (n) => String(n).padStart(2, "0");

const tile = typeof document !== "undefined" ? document.createElement("canvas") : null;

// Peint le portrait en `cells` pixels de large, recadré comme `object-fit: cover`
function paintMosaic(canvas, image, cells) {
  const ratio = canvas.width / canvas.height;
  const srcW = Math.min(image.naturalWidth, image.naturalHeight * ratio);
  const srcH = srcW / ratio;
  tile.width = cells;
  tile.height = Math.max(1, Math.round(cells / ratio));
  tile
    .getContext("2d")
    .drawImage(image, (image.naturalWidth - srcW) / 2, (image.naturalHeight - srcH) / 2, srcW, srcH, 0, 0, tile.width, tile.height);

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tile, 0, 0, canvas.width, canvas.height);
}

// Carte « Joueur 1 » : portrait qui se précise au scroll, identité, chiffres qui montent
export default function PlayerCard() {
  const { t, i18n } = useTranslation();
  const rootRef = useRef(null);
  const roles = ROLE_KEYS.map((key) => t(key)).join(" · ");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const root = rootRef.current;
      const q = gsap.utils.selector(root);
      const frame = q(".card__frame")[0];
      const image = q(".card__img")[0];
      const canvas = q(".card__mosaic")[0];
      const player = q(".card__player")[0];
      const cleanups = [];

      // Entrée : cadre qui se dévoile, textes en cascade, coins de visée, chiffres qui montent
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      tl.fromTo(
        frame,
        { clipPath: "inset(100% 0% 0% 0% round 16px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 16px)",
          duration: 1.3,
          ease: EASE.inOut,
          onComplete: () => gsap.set(frame, { clearProps: "clipPath" }),
        },
        0
      )
        .fromTo(q(".card__head, .card__id > *, .card__stat"), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.4)
        .fromTo(q(".card__corner"), { opacity: 0, scale: 1.9 }, { opacity: 1, scale: 1, duration: 0.8, stagger: 0.06 }, 0.95)
        .to(player, { duration: 1, scrambleText: { text: player.textContent, chars: "01<>/_", speed: 0.5, revealDelay: 0.25 } }, 0.45);

      q(".card__num").forEach((el) => {
        const counter = { v: 0 };
        el.textContent = pad(0);
        tl.to(
          counter,
          { v: Number(el.dataset.value), duration: 1.5, ease: "power2.out", onUpdate: () => (el.textContent = pad(Math.round(counter.v))) },
          0.8
        );
      });

      ScrollTrigger.create({
        trigger: root,
        start: "top 82%",
        once: true,
        onEnter: () => onReady(() => tl.play()),
      });

      // Résolution du portrait : une mosaïque de plus en plus fine pendant que la carte monte dans l'écran
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      let step = -1;
      const paint = () => {
        if (step >= 0 && step < MOSAIC.length && image.naturalWidth) paintMosaic(canvas, image, MOSAIC[step]);
      };
      const fit = () => {
        const rect = frame.getBoundingClientRect();
        canvas.width = Math.max(1, Math.round(rect.width * dpr));
        canvas.height = Math.max(1, Math.round(rect.height * dpr));
        paint();
      };
      const show = (next) => {
        if (next === step) return;
        step = next;
        root.classList.toggle("is-sharp", next >= MOSAIC.length);
        paint();
      };
      const stepFor = (progress) => Math.min(MOSAIC.length, Math.floor(progress * (MOSAIC.length + 1)));

      const resolve = ScrollTrigger.create({
        trigger: frame,
        start: "top 92%",
        end: "top 38%",
        onUpdate: (self) => show(stepFor(self.progress)),
      });
      const ready = () => {
        root.classList.add("is-live");
        fit();
        show(stepFor(resolve.progress));
      };
      if (image.complete && image.naturalWidth) ready();
      else image.addEventListener("load", ready, { once: true });
      const observer = new ResizeObserver(() => {
        if (root.classList.contains("is-live")) fit();
      });
      observer.observe(frame);
      cleanups.push(() => {
        image.removeEventListener("load", ready);
        observer.disconnect();
        root.classList.remove("is-live", "is-sharp");
      });

      // Inclinaison vers le curseur, reflet qui suit (souris uniquement)
      if (hasFinePointer()) {
        const tilt = q(".card__tilt")[0];
        const xTo = gsap.quickTo(tilt, "rotationY", { duration: 0.9, ease: "power3" });
        const yTo = gsap.quickTo(tilt, "rotationX", { duration: 0.9, ease: "power3" });
        const onMove = (e) => {
          const rect = root.getBoundingClientRect();
          const px = (e.clientX - rect.left) / rect.width;
          const py = (e.clientY - rect.top) / rect.height;
          xTo((px - 0.5) * 12);
          yTo((0.5 - py) * 10);
          root.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
          root.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
        };
        const onLeave = () => {
          xTo(0);
          yTo(0);
        };
        root.addEventListener("pointermove", onMove);
        root.addEventListener("pointerleave", onLeave);
        cleanups.push(() => {
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
        });
      }

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: rootRef }
  );

  return (
    <div className="card" ref={rootRef}>
      <div className="card__tilt">
        <header className="card__head mono">
          {/* key : le texte est réécrit par l'effet « décodage », React doit remonter l'élément au changement de langue */}
          <span className="card__player" key={i18n.language}>
            {t("Card.player")}
          </span>
          <span className="card__engine" aria-hidden="true">
            ARTHUR_ENGINE
          </span>
        </header>

        <figure className="card__frame">
          <img className="card__img" src={PORTRAIT} alt={t("Card.alt")} width="800" height="800" loading="lazy" decoding="async" />
          <canvas className="card__mosaic" aria-hidden="true" />
          <span className="card__tint" aria-hidden="true" />
          <span className="card__scan" aria-hidden="true" />
          {CORNERS.map((corner) => (
            <i className={`card__corner card__corner--${corner}`} key={corner} aria-hidden="true" />
          ))}
        </figure>

        <div className="card__id">
          <p className="card__name">Arthur BRU</p>
          <p className="card__roles serif">{roles}</p>
        </div>

        <dl className="card__stats">
          {STATS.map(({ label, value }) => (
            <div className="card__stat" key={label}>
              <dt className="mono">{t(label)}</dt>
              <dd className="card__num" data-value={value}>
                {pad(value)}
              </dd>
            </div>
          ))}
        </dl>

        <span className="card__glare" aria-hidden="true" />
      </div>
    </div>
  );
}
