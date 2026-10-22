import React from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "./Layout.js";
import Navbar from "./Navbar.js";
import Footer from "./Footer.js";
import FocusLoop from "./FocusLoop.js";
import PageHero from "./PageHero.js";
import ProjectCase from "./ProjectCase.js";
import useHashScroll from "../Effects/useHashScroll";
import "../css/Projects.css";

// Squelette commun des pages Unity / Unreal / Game Jam / Jeu vidéo / Web / IA
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
          />
          <section className="cases container">
            {projects.map((project, i) => (
              <ProjectCase key={project.id} project={project} index={i + 1} />
            ))}
          </section>
        </main>
        <Footer />
        <Navbar />
      </FocusLoop>
    </div>
  );
}
