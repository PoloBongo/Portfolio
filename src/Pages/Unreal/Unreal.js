import React, { Suspense } from "react";
import ProjectsPage from "../../Component/ProjectsPage.js";
import { UNREAL_PROJECTS } from "./projects";

// Traduction
import { Loader } from "../../Component/Loader.js";
import { withTranslation } from "react-i18next";

const UnrealT = ({ t }) => (
  <ProjectsPage
    seo={{
      path: "/Unreal",
      title: `${t("Unreal.Title")} - Arthur BRU`,
      description:
        "Découvrez mes projets Unreal Engine 5 : Funfair (fête foraine interactive), SpacialRace et un système d'inventaire complet en C++ et Blueprint.",
      ogTitle: "Projets Unreal Engine - Arthur BRU",
      ogDescription:
        "Découvrez mes projets Unreal Engine 5 : Funfair, SpacialRace et un système d'inventaire en C++ et Blueprint.",
      structuredData: `{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "name": "Projets Unreal Engine - Arthur BRU",
              "url": "https://www.arthur-portfolio.dev/Unreal",
              "description": "Projets Unreal Engine 5 : Funfair, SpacialRace et un système d'inventaire en C++ et Blueprint.",
              "author": { "@type": "Person", "name": "Arthur BRU" }
            },
            { "@type": "VideoGame", "name": "Funfair", "description": "Fête foraine interactive réalisée avec Unreal Engine 5.", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "PC", "applicationCategory": "Game", "url": "https://arthur-bru.itch.io/carnival-unreal-engine-5" },
            { "@type": "VideoGame", "name": "Spacial Race", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "PC", "applicationCategory": "Game" },
            { "@type": "SoftwareApplication", "name": "Inventory Demo", "description": "Système d'inventaire complet en C++ et Blueprint pour Unreal Engine 5.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "DeveloperApplication" }
          ]
        }`,
    }}
    titleKey="ClassicNavBar.Unreal"
    subtitleKey="Unreal.Title"
    projects={UNREAL_PROJECTS}
  />
);

const TranslatedHome = withTranslation()(UnrealT);

export default function UnrealPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
