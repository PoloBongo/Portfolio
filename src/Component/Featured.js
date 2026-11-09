import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TLink } from "../Effects/PageTransition";
import { useScrollTo } from "../Effects/SmoothScroll";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../Effects/motion";
import { hasClip, clipSrc, clipPoster, canAutoplayClips } from "../Pages/clips";
import { posterOf } from "../Pages/media";
import { getWork, titleOf, workPath } from "../Pages/work";
import { worldOf } from "../Worlds/config";
import "../css/Featured.css";

// « Le fil des lieux » : la sélection de projets en défilement épinglé horizontal. Chaque projet est un lieu sur le fil,
// montré en grand (sa boucle vidéo joue), avec un compteur, le fil de navigation et un mini-plan qui situe sa région
// (mêmes couleurs que la carte de l'accueil). Sur petit écran et en mouvement réduit : une simple pile verticale.
const FEATURED = ["cerebro", "seo-autopilot", "au-fil-des-images", "articles-manager", "depths-of-hue", "funfair"];

// Catégorie de projet → région de la carte
const REGION_OF = { web: "web", ai: "ai", unity: "game", unreal: "game", gamejam: "game" };
const REGIONS = {
  web: { color: "#d9ff4a", x: 20, y: 40 },
  ai: { color: "#63e6be", x: 60, y: 14 },
  game: { color: "#ff5fa8", x: 100, y: 38 },
};
const FORK = { x: 60, y: 84 };

// Défilement épinglé seulement si la fenêtre est assez grande ; sinon (petit écran, fenêtre très basse) : pile verticale
const PINNED = "(min-width: 901px) and (min-height: 561px)";

const pad = (n) => String(n).padStart(2, "0");
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Petit plan : le fil se divise vers les trois régions, celle du projet affiché est allumée
function MiniPlan({ region, label }) {
  return (
    <svg className="fil__plan" viewBox="0 0 120 92" role="img" aria-label={label}>
      {Object.entries(REGIONS).map(([id, r]) => {
        const on = id === region;
        return (
          <g key={id}>
            <path
              d={`M${FORK.x} ${FORK.y} Q${(FORK.x + r.x) / 2} ${(FORK.y + r.y) / 2 + 10} ${r.x} ${r.y}`}
              fill="none"
              stroke={on ? r.color : "rgba(243,240,234,0.22)"}
              strokeWidth={on ? 2.2 : 1.2}
              style={{ transition: "stroke 0.4s, stroke-width 0.4s" }}
            />
            <circle cx={r.x} cy={r.y} r={on ? 6 : 3.5} fill={on ? r.color : "rgba(243,240,234,0.3)"} style={{ transition: "r 0.4s, fill 0.4s" }} />
            {on && <circle className="fil__plan-wave" cx={r.x} cy={r.y} r="6" fill="none" stroke={r.color} strokeWidth="1.5" />}
          </g>
        );
      })}
      <circle cx={FORK.x} cy={FORK.y} r="3" fill="#f3f0ea" />
    </svg>
  );
}

export default function Featured() {
  const { t, i18n } = useTranslation();
  const { lang = "fr" } = useParams();
  const scrollTo = useScrollTo();
  const scrollToRef = useRef(scrollTo);
  scrollToRef.current = scrollTo;
  const sectionRef = useRef(null);
  const trackRef = useRef(null);
  const videos = useRef([]);
  const [index, setIndex] = useState(0);

  const works = useMemo(() => FEATURED.map(getWork).filter(Boolean), []);
  const n = works.length;
  const language = (i18n.language || "fr").slice(0, 2);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    const panels = Array.from(track.children);
    const reduced = prefersReducedMotion();
    const wide = window.matchMedia(PINNED);
    const clipsOk = canAutoplayClips() && !reduced;
    let trigger = null;
    let observer = null;
    let current = -1;
    const vids = videos.current;

    // Une seule boucle joue à la fois ; elle ne se charge qu'à son tour
    const activate = (i) => {
      if (i === current) return;
      current = i;
      setIndex(i);
      vids.forEach((video, k) => {
        if (!video) return;
        if (k === i && clipsOk) {
          if (!video.src) video.src = clipSrc(works[k].id);
          video.play().catch(() => {});
        } else video.pause();
      });
    };

    const clear = () => {
      if (trigger) trigger.kill();
      if (observer) observer.disconnect();
      trigger = null;
      observer = null;
      gsap.set(track, { clearProps: "transform" });
      gsap.set(panels, { clearProps: "opacity,transform" });
    };

    const layout = () => {
      clear();
      if (wide.matches && !reduced) {
        // Défilement épinglé : la piste glisse, le projet le plus proche du centre est l'actif
        const onUpdate = (self) => {
          const f = self.progress * (n - 1);
          gsap.set(track, { xPercent: (-f * 100) / n });
          panels.forEach((panel, i) => {
            const d = Math.abs(f - i);
            gsap.set(panel, { opacity: 1 - clamp(d * 0.9, 0, 0.9), scale: 1 - 0.06 * Math.min(d, 1) });
          });
          activate(clamp(Math.round(f), 0, n - 1));
        };
        trigger = ScrollTrigger.create({ trigger: section, start: "top top", end: "bottom bottom", onUpdate });
        onUpdate(trigger);
      } else {
        // Pile verticale : la vidéo joue pour le projet bien visible
        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) activate(panels.indexOf(entry.target));
            });
          },
          { threshold: 0.6 }
        );
        panels.forEach((panel) => observer.observe(panel));
      }
    };

    layout();
    wide.addEventListener("change", layout);
    return () => {
      wide.removeEventListener("change", layout);
      clear();
      vids.forEach((video) => video && video.pause());
    };
  }, [n, works]);

  // Un clic sur un nœud du fil mène au projet : en défilement épinglé on vise sa position, en pile le panneau lui-même
  const go = (i) => {
    const section = sectionRef.current;
    if (window.matchMedia(PINNED).matches && !prefersReducedMotion()) {
      const top = section.getBoundingClientRect().top + window.scrollY;
      scrollToRef.current(top + (i / (n - 1)) * (section.offsetHeight - window.innerHeight), { duration: 1.4 });
    } else {
      scrollToRef.current(trackRef.current.children[i], { duration: 1.2 });
    }
  };

  const active = works[index] || works[0];
  const activeRegion = REGION_OF[active.category.id] || "web";

  return (
    <section ref={sectionRef} className="fil" style={{ "--n": n }} aria-label={t("Work.featured")}>
      <div className="fil__stick">
        <header className="fil__top">
          <span className="mono eyebrow">{t("Work.featured")}</span>
          <span className="fil__count mono" aria-hidden="true">
            <b>{pad(index + 1)}</b> / {pad(n)}
          </span>
        </header>

        <nav className="fil__thread" aria-label={t("Carte.navLabel")}>
          <span className="fil__rail" aria-hidden="true">
            <i style={{ transform: `scaleX(${n > 1 ? index / (n - 1) : 0})` }} />
          </span>
          {works.map((work, i) => (
            <button
              type="button"
              key={work.slug}
              className={`fil__knot${i <= index ? " is-done" : ""}${i === index ? " is-cur" : ""}`}
              style={{ left: `${(n > 1 ? (i / (n - 1)) * 100 : 0).toFixed(2)}%`, "--c": REGIONS[REGION_OF[work.category.id] || "web"].color }}
              aria-label={titleOf(work, t)}
              aria-current={i === index ? "true" : undefined}
              onClick={() => go(i)}
            >
              <span className="mono">{pad(i + 1)}</span>
            </button>
          ))}
        </nav>

        <div className="fil__viewport">
          <div className="fil__track" ref={trackRef}>
            {works.map((work, i) => {
              const world = worldOf(work);
              const title = titleOf(work, t);
              const clip = hasClip(work.id);
              const poster = clip ? clipPoster(work.id) : posterOf(work, language);
              const year = work.i18n && i18n.exists(`${work.i18n}.Completion`) ? t(`${work.i18n}.Completion`) : null;
              const region = REGIONS[REGION_OF[work.category.id] || "web"];
              return (
                <article className="fil__panel" key={work.slug} style={{ "--card": world.accent, "--c": region.color }} data-lift>
                  <div className="fil__media" aria-hidden="true">
                    {poster ? (
                      <img src={poster} alt="" loading="lazy" decoding="async" />
                    ) : (
                      <div className="fil__placeholder">
                        <span className="serif">{title}</span>
                        <span className="mono">{work.tags}</span>
                      </div>
                    )}
                    {clip && (
                      <video
                        ref={(el) => {
                          videos.current[i] = el;
                        }}
                        muted
                        loop
                        playsInline
                        preload="none"
                        tabIndex={-1}
                        onPlaying={(e) => e.currentTarget.classList.add("is-ready")}
                      />
                    )}
                  </div>
                  <div className="fil__info">
                    <p className="fil__meta mono">
                      <span className="fil__num">{pad(i + 1)}</span>
                      {[year, work.tags].filter(Boolean).map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </p>
                    <h3 className="fil__title">
                      <TLink to={workPath(lang, work.slug)} label={title}>
                        {title}
                      </TLink>
                    </h3>
                    <p className="fil__tagline">{t(`Work.Tagline.${work.slug}`)}</p>
                    <TLink className="fil__cta mono" to={workPath(lang, work.slug)} label={title} tabIndex={-1} aria-hidden="true">
                      {t("Work.view")} →
                    </TLink>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <footer className="fil__foot">
          <MiniPlan region={activeRegion} label={t(`Carte.region.${activeRegion}`)} />
          <span className="fil__region mono" style={{ color: REGIONS[activeRegion].color }}>
            {t(`Carte.region.${activeRegion}`)}
          </span>
        </footer>
      </div>
    </section>
  );
}
