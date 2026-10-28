import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { TLink } from "../Effects/PageTransition";
import { useLenis } from "../Effects/SmoothScroll";
import { ScrollTrigger, onReady } from "../Effects/motion";
import { hasClip, clipSrc, clipPoster, canAutoplayClips } from "../Pages/clips";
import { posterOf } from "../Pages/media";
import { titleOf, workPath } from "../Pages/work";
import { worldOf } from "../Worlds/config";
import { previewTint, clearTint } from "../Worlds/theme";
import "../css/Showcase.css";

const pad = (n) => String(n).padStart(2, "0");
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Showcase épinglé : tant que l'écran est assez grand, le mouvement permis et WebGL2 disponible, la liste des projets
// d'une catégorie est une scène fixe de (N - 1) × 80 % d'écran de défilement. Le cadre média est un canvas WebGL
// (Effects/stage3d/showcaseGL.js) : le passage d'un projet au suivant, tiré au hasard parmi quatre transitions en
// shaders, est lié au défilement. Le titre monte dans son masque, le fond prend la couleur du monde.
// Sinon (mobile, mouvement réduit, sans WebGL2) : la grille de cartes (ProjectCard).
const QUERY = "(min-width: 900px) and (min-height: 560px) and (prefers-reduced-motion: no-preference)";

// WebGL2 disponible ? Testé une fois ; le contexte d'essai est aussitôt libéré
let webgl2 = null;
const hasWebGL2 = () => {
  if (webgl2 === null) {
    try {
      const gl = document.createElement("canvas").getContext("webgl2");
      webgl2 = !!gl;
      const lose = gl && gl.getExtension("WEBGL_lose_context");
      if (lose) lose.loseContext();
    } catch (e) {
      webgl2 = false;
    }
  }
  return webgl2;
};

export function useShowcaseMode() {
  const [on, setOn] = useState(() => typeof window !== "undefined" && window.matchMedia(QUERY).matches && hasWebGL2());
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const update = () => setOn(mq.matches && hasWebGL2());
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return on;
}

// Vignette dessinée pour un projet sans affiche (Cerebro) ou dont l'image ne se charge pas : fond à la couleur du monde,
// trame, titre et technologies
function placeholderCanvas(title, tags, accent) {
  const c = document.createElement("canvas");
  c.width = 1280;
  c.height = 720;
  const g = c.getContext("2d");
  g.fillStyle = "#12121a";
  g.fillRect(0, 0, c.width, c.height);
  const glow = g.createRadialGradient(c.width * 0.3, c.height * 0.2, 0, c.width * 0.3, c.height * 0.2, c.width * 0.85);
  glow.addColorStop(0, `${accent}77`);
  glow.addColorStop(1, "#12121a00");
  g.fillStyle = glow;
  g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = "rgba(243,240,234,0.05)";
  g.lineWidth = 1;
  for (let x = 0; x <= c.width; x += 44) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x, c.height);
    g.stroke();
  }
  for (let y = 0; y <= c.height; y += 44) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(c.width, y);
    g.stroke();
  }
  g.fillStyle = "#f3f0ea";
  g.font = '700 132px "Bricolage Grotesque Variable", system-ui, sans-serif';
  g.textBaseline = "middle";
  g.fillText(title, 84, c.height / 2 - 20);
  g.fillStyle = "rgba(243,240,234,0.6)";
  g.font = '500 30px "JetBrains Mono Variable", ui-monospace, monospace';
  g.fillText((tags || "").toUpperCase(), 88, c.height / 2 + 80);
  return c;
}

// Un projet est « avant » (déjà passé), « active » ou « after » (à venir) par rapport au projet affiché
const stateOf = (i, active) => (i === active ? "active" : i < active ? "before" : "after");

export default function HubShowcase({ works }) {
  const { t, i18n } = useTranslation();
  const { lang = "fr" } = useParams();
  const { hash } = useLocation();
  const lenis = useLenis();
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const posRef = useRef(0);
  const [active, setActive] = useState(0);
  const n = works.length;
  const language = (i18n.language || "fr").slice(0, 2);

  // Position de défilement d'un projet : milieu de sa plage
  const goTo = (i, duration = 1.4) => {
    const root = rootRef.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const pin = root.firstElementChild;
    const step = n > 1 ? (root.offsetHeight - pin.offsetHeight) / (n - 1) : 0;
    const y = Math.round(top + i * step + 1);
    if (lenis) lenis.scrollTo(y, { duration });
    else window.scrollTo({ top: y, behavior: "smooth" });
  };

  useGSAP(
    () => {
      const root = rootRef.current;
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          root.style.setProperty("--p", self.progress.toFixed(4));
          posRef.current = self.progress * (n - 1);
          setActive(clamp(Math.floor(self.progress * (n - 1) + 0.5), 0, n - 1));
        },
      });
      return () => trigger.kill();
    },
    { scope: rootRef, dependencies: [n] }
  );

  // Ancre de l'URL (#VueJs…) : on tombe directement sur ce projet
  useEffect(() => {
    if (!hash) return undefined;
    const id = decodeURIComponent(hash.slice(1));
    const i = works.findIndex((work) => work.anchor === id);
    if (i < 0) return undefined;
    return onReady(() => goTo(i, 1.8));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  // Seul l'extrait du projet affiché joue, et seulement quand la scène est à l'écran
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, []);
  // Le cadre média : un canvas WebGL, chargé à la demande (le code Three.js de la scène est déjà dans un morceau à part)
  const items = useMemo(
    () =>
      works.map((work) => {
        const clip = hasClip(work.id);
        const accent = worldOf(work).accent;
        return {
          poster: clip ? clipPoster(work.id) : posterOf(work, language),
          clip: clip && canAutoplayClips() ? clipSrc(work.id) : null,
          accent,
          fallback: () => placeholderCanvas(titleOf(work, t), work.tags, accent),
        };
      }),
    [works, language, t]
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;
  useEffect(() => {
    let cancelled = false;
    let gl = null;
    import("../Effects/stage3d/showcaseGL")
      .then(({ createShowcaseGL }) => {
        if (cancelled) return;
        gl = createShowcaseGL({ canvas: canvasRef.current, items: itemsRef.current, getPos: () => posRef.current });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (gl) gl.dispose();
    };
  }, []);

  // Le fond du site prend aussi la teinte du monde affiché, tant que la scène est à l'écran
  useEffect(() => {
    if (inView && works[active]) previewTint(worldOf(works[active]));
    else clearTint();
  }, [active, inView, works]);
  useEffect(() => clearTint, []);

  return (
    <section
      className="showcase"
      ref={rootRef}
      style={{ "--n": n, "--p": 0 }}
      aria-label={t("Work.projects")}
      data-active={active}
    >
      <div className="showcase__pin">
        <div className="showcase__glows" aria-hidden="true">
          {works.map((work, i) => (
            <i className="sc-glow" key={work.id} data-state={stateOf(i, active)} style={{ "--card": worldOf(work).accent }} />
          ))}
        </div>

        <div className="container showcase__grid">
          <nav className="sc-rail mono" aria-label={t("Work.projects")}>
            <p className="sc-count">
              {pad(active + 1)} / {pad(n)}
            </p>
            <i className="sc-rail__track" aria-hidden="true">
              <i className="sc-rail__bar" />
            </i>
            <ol>
              {works.map((work, i) => (
                <li key={work.id} style={{ "--card": worldOf(work).accent }}>
                  <button
                    type="button"
                    aria-current={i === active ? "true" : undefined}
                    onClick={() => goTo(i)}
                    data-cursor="view"
                  >
                    <span className="n">{pad(i + 1)}</span>
                    <span className="t">{titleOf(work, t)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <div className="sc-stage" style={{ "--card": worldOf(works[active]).accent }}>
            <canvas className="sc-gl" ref={canvasRef} aria-hidden="true" />
            <TLink
              className="sc-media__link"
              to={workPath(lang, works[active].slug)}
              label={titleOf(works[active], t)}
              tabIndex={-1}
              aria-hidden="true"
              data-cursor="view"
            />
          </div>

          <div className="sc-info">
            {works.map((work, i) => {
              const title = titleOf(work, t);
              const year = work.i18n && i18n.exists(`${work.i18n}.Completion`) ? t(`${work.i18n}.Completion`) : null;
              return (
                <article
                  className="sc-item"
                  key={work.id}
                  data-state={stateOf(i, active)}
                  style={{ "--card": worldOf(work).accent, zIndex: i + 1 }}
                >
                  <p className="sc-num" aria-hidden="true">
                    {pad(i + 1)}
                  </p>
                  <div className="sc-text">
                    <p className="sc-meta mono">
                      {[year, work.tags].filter(Boolean).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </p>
                    <h2 className={`sc-title${title.length > 20 ? " sc-title--long" : ""}`}>
                      <TLink className="sc-title__link" to={workPath(lang, work.slug)} label={title}>
                        {title}
                      </TLink>
                    </h2>
                    <p className="sc-tagline">{t(`Work.Tagline.${work.slug}`)}</p>
                  </div>
                  <TLink
                    className="sc-cta mono"
                    to={workPath(lang, work.slug)}
                    label={title}
                    tabIndex={-1}
                    aria-hidden="true"
                    data-cursor="view"
                  >
                    {t("Work.view")} <span className="sc-cta__arrow">→</span>
                  </TLink>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
