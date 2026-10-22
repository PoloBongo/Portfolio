import React, { useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { TLink } from "../Effects/PageTransition";
import SplitReveal from "../Effects/SplitReveal";
import Reveal from "../Effects/Reveal";
import { gsap, ScrollTrigger, EASE, hasFinePointer } from "../Effects/motion";

import imgUnity from "../img/backgroundDepthsOfHue.webp";
import imgGameJam from "../img/backgroundChocoBlast.webp";
import imgEngine from "../img/backgroundCustomEngine.webp";
import imgWeb from "../img/backgroundReactPortfolio.webp";
import { UNITY_PROJECTS } from "../Pages/Unity/projects";
import { UNREAL_PROJECTS } from "../Pages/Unreal/projects";
import { GAMEJAM_PROJECTS } from "../Pages/GameJam/projects";
import { JV_PROJECTS } from "../Pages/ProjetctsJV/projects";
import { WEB_PROJECTS } from "../Pages/Projects/projects";
import { AI_PROJECTS } from "../Pages/AI/projects";

const yt = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Un accès par page de projets : aperçu flottant au survol, nombre de projets lu dans les données des pages
const SECTIONS = [
  { path: "/Unity", label: "ClassicNavBar.Unity", tags: "C# · WebGL", count: UNITY_PROJECTS.length, img: imgUnity },
  { path: "/Unreal", label: "ClassicNavBar.Unreal", tags: "Blueprint · C++", count: UNREAL_PROJECTS.length, img: yt("suI8_LCzjSI") },
  { path: "/GameJam", label: "ClassicNavBar.GameJam", tags: "48h · Unity", count: GAMEJAM_PROJECTS.length, img: imgGameJam },
  { path: "/ProjectsVideosGames", label: "DropdownProjects.ProjectVideoGames", tags: "C++ · Vulkan · Lua", count: JV_PROJECTS.length, img: imgEngine },
  { path: "/ProjectsWeb", label: "DropdownProjects.ProjectWeb", tags: "Next.js · React · Vue", count: WEB_PROJECTS.length, img: imgWeb },
  { path: "/AI", label: "ClassicNavBar.AI", tags: "RAG · n8n · LLM", count: AI_PROJECTS.length, img: yt("7C2_lc6DfLU") },
];

export default function WorkIndex() {
  const { t } = useTranslation();
  const { lang = "fr" } = useParams();
  const rootRef = useRef(null);
  const previewRef = useRef(null);

  useGSAP(
    () => {
      if (!hasFinePointer()) return undefined;
      const root = rootRef.current;
      const preview = previewRef.current;
      const images = preview.querySelectorAll(".work__preview-img");

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

      const show = (index) => {
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
        {SECTIONS.map(({ path, label, tags, count }, i) => (
          <Reveal as="li" className="work__row" key={path} delay={i * 0.04} y={30}>
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
        ))}
      </ul>

      <div className="work__preview" ref={previewRef} aria-hidden="true">
        {SECTIONS.map(({ path, img }) => (
          <img className="work__preview-img" key={path} src={img} alt="" loading="lazy" />
        ))}
      </div>
    </section>
  );
}
