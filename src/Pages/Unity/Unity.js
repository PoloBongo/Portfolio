import React, { Suspense } from "react";
import ProjectsPage from "../../Component/ProjectsPage.js";
import { UNITY_PROJECTS } from "./projects";

// Traduction
import { Loader } from "../../Component/Loader.js";
import { withTranslation } from "react-i18next";

const UnityT = ({ t }) => (
  <ProjectsPage
    seo={{
      path: "/Unity",
      title: `${t("Unity.Title")} - Arthur BRU`,
      description:
        "Découvrez mes projets Unity en C# : Depths of Hue, ShadowScholar, RATP, NavyBongo, AngryBirds et plus. Certains jeux sont jouables directement dans le navigateur.",
      ogTitle: "Projets Unity - Arthur BRU",
      ogDescription:
        "Projets Unity en C# : Depths of Hue, ShadowScholar, RATP, NavyBongo. Jeux jouables dans le navigateur.",
      structuredData: `{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "name": "Projets Unity - Arthur BRU",
              "url": "https://www.arthur-portfolio.dev/Unity",
              "description": "Projets Unity en C# : Depths of Hue, ShadowScholar, RATP, NavyBongo, AngryBirds. Jeux jouables dans le navigateur.",
              "author": { "@type": "Person", "name": "Arthur BRU" }
            },
            { "@type": "VideoGame", "name": "Depths Of Hue", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "Shadow Scholar : La fac ultime", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "RATP Simulator", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "Angry Birds", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "UI UX Cooking Project", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "Navy Bongo", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" },
            { "@type": "VideoGame", "name": "Unity RL", "author": { "@type": "Person", "name": "Arthur BRU" }, "gamePlatform": "Unity WebGL", "applicationCategory": "Game" }
          ]
        }`,
    }}
    titleKey="ClassicNavBar.Unity"
    subtitleKey="Unity.Title"
    projects={UNITY_PROJECTS}
  />
);

const TranslatedHome = withTranslation()(UnityT);

export default function UnityPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
