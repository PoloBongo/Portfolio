import React, { Suspense } from "react";
import ProjectsPage from "../../Component/ProjectsPage.js";
import { JV_PROJECTS } from "./projects";

// Traduction
import { Loader } from "../../Component/Loader.js";
import { withTranslation } from "react-i18next";

const JVPageT = ({ t }) => (
  <ProjectsPage
    seo={{
      path: "/ProjectsVideosGames",
      title: `${t("VideoGamesProjects.Title")} - Arthur BRU`,
      description:
        "Projets jeu vidéo d'Arthur BRU en C++, C# et LUA : moteur custom, bibliothèques, Tower Defense, Platformer 2D. Réalisés en équipe ou en solo.",
      ogTitle: "Projets Jeu Vidéo - Arthur BRU",
      ogDescription:
        "Projets jeu vidéo en C++, C# et LUA : moteur custom, bibliothèques, Tower Defense, Platformer 2D.",
      structuredData: `{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "name": "Projets Jeu Vidéo - Arthur BRU",
              "url": "https://www.arthur-portfolio.dev/ProjectsVideosGames",
              "description": "Projets jeu vidéo en C++, C# et LUA : moteur custom, bibliothèques, Tower Defense, Platformer 2D.",
              "author": { "@type": "Person", "name": "Arthur BRU" }
            },
            { "@type": "SoftwareApplication", "name": "Angine", "description": "Moteur de jeu vidéo custom développé en C++.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "DeveloperApplication", "url": "https://github.com/PoloBongo/custom-engine-cpp" },
            { "@type": "VideoGame", "name": "Helluva Revenge", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "PC", "applicationCategory": "Game", "url": "https://github.com/DemonXlegenD/Helluva-Revenge" },
            { "@type": "VideoGame", "name": "Tower Defense", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "PC", "applicationCategory": "Game" },
            { "@type": "SoftwareApplication", "name": "C++ Bibliothèque", "description": "Bibliothèques C++ développées en équipe.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "DeveloperApplication" },
            { "@type": "VideoGame", "name": "Tour par tour en console", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "PC", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "Shoot-Em-Up", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "PC", "applicationCategory": "Game" },
            { "@type": "SoftwareApplication", "name": "Projets LUA", "description": "Projets développés en LUA.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "DeveloperApplication" }
          ]
        }`,
    }}
    titleKey="DropdownProjects.ProjectVideoGames"
    subtitleKey="VideoGamesProjects.Title"
    projects={JV_PROJECTS}
  />
);

const TranslatedHome = withTranslation()(JVPageT);

export default function JVPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
