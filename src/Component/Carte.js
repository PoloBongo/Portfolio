import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollTrigger, onReady, prefersReducedMotion } from "../Effects/motion";
import { useScrollTo } from "../Effects/SmoothScroll";
import { TLink } from "../Effects/PageTransition";
import "../css/Carte.css";

// Étapes du parcours, dans l'ordre du fil (les mêmes clés que Effects/carte/terrain.js)
const STEP_KEYS = ["lycee", "bachelor", "equipe", "master", "basket"];

// Les trois régions où le fil se divise : même ordre que Effects/carte/terrain.js, mêmes pages que l'ancien hero
const REGION_LINKS = [
  { id: "web", to: "/ProjectsWeb", color: "#d9ff4a" },
  { id: "ai", to: "/AI", color: "#63e6be" },
  { id: "game", to: "/Unity", color: "#ff5fa8" },
];

// Refonte « La carte » · tranches 1 et 2 : le nom, la carte qui se soulève, le repère « Arthur est ici » qui tombe sur le
// lycée, la bienvenue, puis le fil du parcours (les étapes de l'ancienne section « À propos »). La scène est un seul
// canvas piloté par le défilement (section épinglée en CSS sticky) ; tout le texte est du HTML par-dessus.
// Chargée à part de la page : Three.js n'est pas dans le bundle principal.
export default function Carte() {
  const { t } = useTranslation();
  const { lang = "fr" } = useParams();
  const scrollTo = useScrollTo();
  const scrollToRef = useRef(scrollTo);
  scrollToRef.current = scrollTo;
  const sectionRef = useRef(null);
  const hostRef = useRef(null);
  const layerRef = useRef(null);
  const nameRef = useRef(null);
  const helloRef = useRef(null);
  const hereRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const host = hostRef.current;
    const reduced = prefersReducedMotion();
    let dead = false;
    let scene = null;
    const cleanups = [];

    // Clic sur un nœud du fil : on défile jusqu'à la progression demandée (0 → 1 sur la section)
    const onSeek = (progress) => {
      const top = section.getBoundingClientRect().top + window.scrollY;
      scrollToRef.current(top + progress * (section.offsetHeight - window.innerHeight), { duration: 1.8 });
    };

    import("../Effects/carte/scene").then(({ createCarte }) => {
      if (dead) return;
      scene = createCarte(host, { name: nameRef.current, hello: helloRef.current, here: hereRef.current, root: layerRef.current, onSeek }, { reduced });
      cleanups.push(() => scene.dispose());

      const size = () => {
        const r = host.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) scene.resize(Math.round(r.width), Math.round(r.height));
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(host);
      cleanups.push(() => ro.disconnect());

      // Mouvement réduit : une image fixe (le repère posé, la bienvenue visible), sans défilement épinglé
      if (reduced) {
        scene.start();
        scene.setProgress(1);
        return;
      }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => scene.setProgress(self.progress),
      });
      cleanups.push(() => trigger.kill());
      scene.setProgress(trigger.progress);

      // Aucun calcul tant que la section n'est pas à l'écran
      const io = new IntersectionObserver(([entry]) => scene.run(entry.isIntersecting), { threshold: 0 });
      io.observe(section);
      cleanups.push(() => io.disconnect());

      // Le nom n'apparaît qu'une fois le préchargeur et le rideau de page ouverts
      cleanups.push(onReady(() => scene.start()));
    });

    return () => {
      dead = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const steps = STEP_KEYS.map((key) => ({
    key,
    tag: t(`Carte.step.${key}.tag`),
    kick: t(`Carte.step.${key}.kick`),
    title: t(`Carte.step.${key}.title`),
    text: t(`Carte.step.${key}.text`),
    list: t(`Carte.step.${key}.list`, { returnObjects: true, defaultValue: [] }),
  }));

  return (
    <section ref={sectionRef} className="carte" aria-labelledby="carte-nom" data-hud={t("Hud.hero")}>
      <div className="carte__stick">
        <div ref={hostRef} className="carte__gl" />
        <div ref={layerRef} className="carte__text">
          <svg className="carte__lead" aria-hidden="true">
            <line x1="0" y1="0" x2="0" y2="0" />
            <circle r="4" />
          </svg>
          <div ref={nameRef} className="carte__name">
            <span className="mono">Portfolio · 2026</span>
            <h1 id="carte-nom">Arthur BRU</h1>
            <p className="carte__roles">
              {t("Hero.roleWeb")} · {t("Hero.roleAI")} · {t("Hero.roleGame")}
            </p>
            <em className="mono">{t("Carte.scroll")}</em>
          </div>
          <div ref={hereRef} className="carte__here">
            {t("Carte.here")}
          </div>
          <div ref={helloRef} className="carte__hello">
            <img className="carte__face" src="/arthur.webp" alt={t("Carte.photoAlt")} width="72" height="72" />
            <strong>{t("Carte.helloTitle")}</strong>
            <span>{t("Carte.helloText")}</span>
          </div>
          {steps.map((s) => (
            <div className="carte__card" key={s.key}>
              <span className="mono">{s.kick}</span>
              <b>{s.title}</b>
              <span className="carte__card-text">{s.text}</span>
              {s.list.length > 0 && (
                <ul>
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {steps.map((s) => (
            <button type="button" className="carte__tag" key={s.key} tabIndex={-1}>
              {s.tag}
            </button>
          ))}
          <div className="carte__head">
            <span className="mono">{t("Carte.headKick")}</span>
            <strong>{t("Carte.headTitle")}</strong>
          </div>
          {REGION_LINKS.map((r) => (
            <div className="carte__region" key={r.id} style={{ "--c": r.color }}>
              <b>{t(`Carte.region.${r.id}`)}</b>
              <span>{t(`Hero.tag.${r.id}`)}</span>
              <TLink className="mono" to={`/${lang}${r.to}`} label={t(`Carte.region.${r.id}`)}>
                {t(`Hero.enter.${r.id}`)} →
              </TLink>
            </div>
          ))}
          <nav className="carte__thread" aria-label={t("Carte.navLabel")}>
            <span className="carte__rail">
              <i />
            </span>
            <button type="button" className="carte__knot">
              <span>{t("Carte.navHello")}</span>
            </button>
            {steps.map((s) => (
              <button type="button" className="carte__knot" key={s.key}>
                <span>{s.tag}</span>
              </button>
            ))}
            <button type="button" className="carte__knot carte__knot--end">
              <span>{t("Carte.navProjects")}</span>
            </button>
          </nav>
        </div>
      </div>
      {/* Mouvement réduit : les étapes en liste, sans défilement épinglé (masquée sinon) */}
      <ol className="carte__static">
        {steps.map((s) => (
          <li key={s.key}>
            <span className="mono">{s.kick}</span>
            <b>{s.title}</b>
            <span>{s.text}</span>
            {s.list.length > 0 && (
              <ul>
                {s.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>
      <ul className="carte__static carte__static--links">
        {REGION_LINKS.map((r) => (
          <li key={r.id}>
            <TLink to={`/${lang}${r.to}`} label={t(`Carte.region.${r.id}`)}>
              {t(`Carte.region.${r.id}`)} · {t(`Hero.enter.${r.id}`)} →
            </TLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
