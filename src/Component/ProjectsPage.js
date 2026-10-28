import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import SEO from "./Layout.js";
import Navbar from "./Navbar.js";
import Footer from "./Footer.js";
import FocusLoop from "./FocusLoop.js";
import PageHero from "./PageHero.js";
import ProjectCard from "./ProjectCard.js";
import useHashScroll from "../Effects/useHashScroll";
import { getWork } from "../Pages/work";
import "../css/Projects.css";

// Squelette commun des pages de catégorie (Unity / Unreal / Game Jam / Web / IA) : la liste de leurs projets,
// chacun menant à sa page (/work/:slug)
export default function ProjectsPage({ seo, titleKey, subtitleKey, projects }) {
  const { lang = "fr" } = useParams();
  const { t } = useTranslation();
  useHashScroll();

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
          <section className={`cases container${projects.length >= 3 ? " cases--lead" : ""}`}>
            {projects.map((project, i) => (
              <ProjectCard key={project.id} work={getWork(project.id)} index={i} lead={i === 0} />
            ))}
          </section>
        </main>
        <Footer />
        <Navbar />
      </FocusLoop>
    </div>
  );
}
