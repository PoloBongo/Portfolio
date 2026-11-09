import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import SEO from "./Layout.js";
import Navbar from "./Navbar.js";
import Footer from "./Footer.js";
import FocusLoop from "./FocusLoop.js";
import PageHero from "./PageHero.js";
import ProjectCard from "./ProjectCard.js";
import HubShowcase, { useShowcaseMode } from "./HubShowcase.js";
import RegionThread from "./RegionThread.js";
import { useScrollTo } from "../Effects/SmoothScroll";
import useHashScroll from "../Effects/useHashScroll";
import { getWork } from "../Pages/work";
import "../css/Projects.css";

// Squelette commun des pages de catégorie (Unity / Unreal / Game Jam / Web / IA) : la liste de leurs projets,
// chacun menant à sa page (/work/:slug). Showcase épinglé sur grand écran, grille de cartes sinon (mobile,
// mouvement réduit).
export default function ProjectsPage({ seo, titleKey, subtitleKey, projects }) {
  const { lang = "fr" } = useParams();
  const { t } = useTranslation();
  useHashScroll();
  const showcase = useShowcaseMode();
  const works = projects.map((project) => getWork(project.id));

  // Le fil de la région : projet affiché (showcase : donné par le showcase ; grille : la carte au milieu de l'écran)
  const [active, setActive] = useState(0);
  const hubRef = useRef(null);
  const gridRef = useRef(null);
  const scrollTo = useScrollTo();
  useEffect(() => {
    if (showcase || !gridRef.current) return undefined;
    const cards = [...gridRef.current.querySelectorAll(".proj")];
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(cards.indexOf(entry.target));
        }),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, [showcase, works.length]);
  const select = (i) => {
    if (showcase) {
      if (hubRef.current) hubRef.current.goTo(i);
      return;
    }
    const card = gridRef.current && gridRef.current.querySelectorAll(".proj")[i];
    if (card) scrollTo(card, { duration: 1.2 });
  };

  return (
    <div className="page">
      <SEO lang={lang} {...seo} />
      <FocusLoop>
        <main id="main">
          <PageHero
            eyebrow={`${String(projects.length).padStart(2, "0")} ${t("Work.projects")}`}
            title={t(titleKey)}
            subtitle={subtitleKey ? t(subtitleKey) : undefined}
            back={{ to: `/${lang}#work`, label: t("Hud.work") }}
          />
          <RegionThread works={works} active={active} onSelect={select} />
          {showcase ? (
            <HubShowcase works={works} onActive={setActive} controlRef={hubRef} />
          ) : (
            <section ref={gridRef} className={`cases container${projects.length >= 3 ? " cases--lead" : ""}`}>
              {works.map((work, i) => (
                <ProjectCard key={work.id} work={work} index={i} lead={i === 0} />
              ))}
            </section>
          )}
        </main>
        <Footer />
        <Navbar />
      </FocusLoop>
    </div>
  );
}
