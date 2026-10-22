import React, { Suspense } from "react";
import ProjectsPage from "../../Component/ProjectsPage.js";
import { GAMEJAM_PROJECTS } from "./projects";

// Traduction
import { Loader } from "../../Component/Loader.js";
import { withTranslation } from "react-i18next";

const GameJamT = ({ t }) => (
  <ProjectsPage
    seo={{
      path: "/GameJam",
      title: `${t("GameJam.Title")} - Arthur BRU`,
      description:
        "Découvrez mes participations aux Game Jam : Chocolato, StaySoul et AttractionFlow — des jeux créés en 42 à 48 heures avec Unity, jouables dans le navigateur.",
      ogTitle: "Game Jam - Arthur BRU",
      ogDescription:
        "Jeux de Game Jam créés en 42 à 48 heures avec Unity : Chocolato, StaySoul et AttractionFlow.",
      structuredData: `{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "name": "Game Jam - Arthur BRU",
              "url": "https://www.arthur-portfolio.dev/GameJam",
              "description": "Jeux de Game Jam créés en 42 à 48 heures avec Unity : Attraction Flow, Stay Soul et Choco Blast.",
              "author": { "@type": "Person", "name": "Arthur BRU" }
            },
            { "@type": "VideoGame", "name": "Attraction Flow", "description": "Jeu créé en 48 heures lors d'une Game Jam avec Unity.", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "Stay Soul", "description": "Jeu créé en 48 heures lors d'une Game Jam avec Unity.", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "Choco Blast", "description": "Jeu créé en 42 heures lors d'une Game Jam avec Unity.", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" }
          ]
        }`,
    }}
    titleKey="ClassicNavBar.GameJam"
    subtitleKey="GameJam.Title"
    projects={GAMEJAM_PROJECTS}
  />
);

const TranslatedHome = withTranslation()(GameJamT);

export default function GameJam() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
