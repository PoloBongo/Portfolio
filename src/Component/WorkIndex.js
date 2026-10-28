import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { TLink } from "../Effects/PageTransition";
import SplitReveal from "../Effects/SplitReveal";
import Reveal from "../Effects/Reveal";
import { gsap, ScrollTrigger, EASE, hasFinePointer } from "../Effects/motion";
import { setFieldFocus } from "../Effects/fieldBus";

import { clipPoster, clipSrc, canAutoplayClips } from "../Pages/clips";
import { UNITY_PROJECTS } from "../Pages/Unity/projects";
import { UNREAL_PROJECTS } from "../Pages/Unreal/projects";
import { GAMEJAM_PROJECTS } from "../Pages/GameJam/projects";
import { WEB_PROJECTS } from "../Pages/Projects/projects";
import { AI_PROJECTS } from "../Pages/AI/projects";
import { getWork } from "../Pages/work";
import ProjectCard from "./ProjectCard";

// Sélection affichée sous l'index : web et IA d'abord, deux jeux ensuite. Chaque carte mène à la page du projet.
const FEATURED = ["cerebro", "seo-autopilot", "au-fil-des-images", "articles-manager", "depths-of-hue", "funfair"];

// Un accès par page de projets : aperçu flottant au survol, nombre de projets lu dans les données des pages.
// sub : lignes secondaires (jeu vidéo), plus discrètes et regroupées sous un intitulé.
// clip : la boucle vidéo (public/clips, 1280×720) qui illustre la ligne au survol.
const SECTIONS = [
  { path: "/ProjectsWeb", label: "DropdownProjects.ProjectWeb", tags: "Next.js · React · Vue", count: WEB_PROJECTS.length, clip: "au-fil-des-images" },
  { path: "/AI", label: "ClassicNavBar.AI", tags: "RAG · n8n · LLM", count: AI_PROJECTS.length, clip: "seo-autopilot" },
  { path: "/Unity", label: "ClassicNavBar.Unity", tags: "C# · WebGL", count: UNITY_PROJECTS.length, clip: "depths-of-hue", sub: true },
  { path: "/Unreal", label: "ClassicNavBar.Unreal", tags: "Blueprint · C++", count: UNREAL_PROJECTS.length, clip: "funfair", sub: true },
  { path: "/GameJam", label: "ClassicNavBar.GameJam", tags: "48h · Unity", count: GAMEJAM_PROJECTS.length, clip: "attraction-flow", sub: true },
];
const FIRST_SUB = SECTIONS.findIndex((section) => section.sub);

export default function WorkIndex() {
  const { t } = useTranslation();
  const { lang = "fr" } = useParams();
  const rootRef = useRef(null);
  const previewRef = useRef(null);

  // Une ligne survolée (ou focalisée au clavier) éclaire sa grappe dans le nuage de points
  useEffect(() => {
    const rows = Array.from(rootRef.current.querySelectorAll(".work__link"));
    const off = () => setFieldFocus(-1);
    const removers = rows.map((row, i) => {
      const on = () => setFieldFocus(i);
      row.addEventListener("pointerenter", on);
      row.addEventListener("pointerleave", off);
      row.addEventListener("focus", on);
      row.addEventListener("blur", off);
      return () => {
        row.removeEventListener("pointerenter", on);
        row.removeEventListener("pointerleave", off);
        row.removeEventListener("focus", on);
        row.removeEventListener("blur", off);
      };
    });
    return () => {
      removers.forEach((remove) => remove());
      setFieldFocus(-1);
    };
  }, []);

  useGSAP(
    () => {
      if (!hasFinePointer()) return undefined;
      const root = rootRef.current;
      const preview = previewRef.current;
      const images = preview.querySelectorAll(".work__preview-img");
      const videos = Array.from(images).map((layer) => layer.querySelector("video"));
      const canPlay = canAutoplayClips();

      // Les aperçus ne sont chargés que lorsque la section approche de l'écran
      gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.7, opacity: 0, display: "none" });
      ScrollTrigger.create({
        trigger: root,
        start: "top bottom+=500",
        once: true,
        onEnter: () => gsap.set(preview, { display: "block" }),
      });
      const xTo = gsap.quickTo(preview, "x", { duration: 0.6, ease: "power3" });
      const yTo = gsap.quickTo(preview, "y", { duration: 0.6, ease: "power3" });
      const rotTo = gsap.quickTo(preview, "rotation", { duration: 0.5, ease: "power3" });

      let lastX = 0;
      const onMove = (e) => {
        xTo(e.clientX);
        yTo(e.clientY);
        rotTo(gsap.utils.clamp(-9, 9, (e.clientX - lastX) * 0.35));
        lastX = e.clientX;
      };

      // La boucle vidéo ne se charge qu'à la première intention (survol), une seule joue à la fois
      const play = (index) => {
        videos.forEach((video, i) => {
          if (!video) return;
          if (i !== index) {
            video.pause();
            return;
          }
          if (!video.src) video.src = clipSrc(SECTIONS[i].clip);
          video.play().catch(() => {});
        });
      };

      const show = (index) => {
        if (canPlay) play(index);
        images.forEach((img, i) => {
          gsap.to(img, {
            clipPath: i === index ? "inset(0% 0% 0% 0%)" : "inset(0% 0% 100% 0%)",
            duration: 0.7,
            ease: EASE.out,
            overwrite: true,
          });
        });
        gsap.to(preview, { scale: 1, opacity: 1, duration: 0.6, ease: EASE.out, overwrite: "auto" });
      };
      const hide = () => {
        gsap.to(preview, { scale: 0.7, opacity: 0, duration: 0.5, ease: EASE.out, overwrite: "auto" });
        gsap.delayedCall(0.5, () => videos.forEach((video) => video && video.pause()));
      };

      const rows = Array.from(root.querySelectorAll(".work__link"));
      const handlers = rows.map((row, i) => {
        const enter = () => show(i);
        row.addEventListener("pointerenter", enter);
        row.addEventListener("pointerleave", hide);
        return { row, enter };
      });

      root.addEventListener("pointermove", onMove);
      gsap.set(images, { clipPath: "inset(0% 0% 100% 0%)" });

      return () => {
        root.removeEventListener("pointermove", onMove);
        handlers.forEach(({ row, enter }) => {
          row.removeEventListener("pointerenter", enter);
          row.removeEventListener("pointerleave", hide);
        });
      };
    },
    { scope: rootRef }
  );

  return (
    <section className="work container" id="work" ref={rootRef} data-hud={t("Hud.work")}>
      <header className="section-head">
        <Reveal className="mono eyebrow">(01)</Reveal>
        <SplitReveal text={t("Work.title")} as="h2" scroll className="section-head__title" />
      </header>

      <ul className="work__list">
        {SECTIONS.map(({ path, label, tags, count, sub }, i) => (
          <React.Fragment key={path}>
            {i === FIRST_SUB && (
              <Reveal as="li" className="work__group mono" y={16}>
                {t("Work.game")}
              </Reveal>
            )}
            <Reveal as="li" className={`work__row${sub ? " work__row--sub" : ""}`} delay={i * 0.04} y={30}>
              <TLink className="work__link" to={`/${lang}${path}`} label={t(label)}>
                <span className="work__num mono">{String(i + 1).padStart(2, "0")}</span>
                <span className="work__name">{t(label)}</span>
                <span className="work__tags mono">{tags}</span>
                <span className="work__count mono">
                  {String(count).padStart(2, "0")} {t("Work.projects")}
                </span>
                <svg className="work__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 19L19 5M19 5H8M19 5v11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </TLink>
            </Reveal>
          </React.Fragment>
        ))}
      </ul>

      <div className="work__featured">
        <Reveal className="work__featured-head mono eyebrow">{t("Work.featured")}</Reveal>
        <div className="cases work__cards">
          {FEATURED.map((slug, i) => (
            <ProjectCard key={slug} work={getWork(slug)} index={i} rank={i + 1} />
          ))}
        </div>
      </div>

      <div className="work__preview" ref={previewRef} aria-hidden="true">
        {SECTIONS.map(({ path, clip }) => (
          <div className="work__preview-img" key={path}>
            <img src={clipPoster(clip)} alt="" loading="lazy" decoding="async" />
            <video muted loop playsInline preload="none" tabIndex={-1} />
          </div>
        ))}
      </div>
    </section>
  );
}
