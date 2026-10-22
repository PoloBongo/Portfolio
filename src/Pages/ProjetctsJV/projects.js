import backgroundProjectCustomEngine from "../../img/backgroundCustomEngine.webp";
import backgroundCPPBibliotheque from "../../img/backgroundCPPBibliotheque.webp";
import backgroundProjectLUA from "../../img/backgroundLUA.webp";

// Projets jeu vidéo (C++, C#, LUA). anchor : cible des liens #Cpp / #CSharp / #LUA depuis l'accueil.
// descriptionKey : clé d'un texte seul (projets sans fiche technique) · render : description sur mesure
export const JV_PROJECTS = [
  {
    id: "angine",
    anchor: "Cpp",
    title: "Angine",
    i18n: "VideoGamesProjects.Angine",
    poster: backgroundProjectCustomEngine,
    alt: "Custom Engine",
    links: [
      {
        href: "https://github.com/PoloBongo/custom-engine-cpp",
        labelKey: "VideoGamesProjects.viewMoreCode",
        primary: true,
      },
    ],
  },
  {
    id: "helluva-revenge",
    title: "Helluva Revenge",
    descriptionKey: "VideoGamesProjects.helluvaRevenge",
    video: "xkXIosIVZRE",
    links: [
      {
        href: "https://github.com/DemonXlegenD/Helluva-Revenge",
        labelKey: "VideoGamesProjects.viewMoreCode",
        primary: true,
      },
    ],
  },
  {
    id: "tower-defense",
    title: "Tower Defense",
    descriptionKey: "VideoGamesProjects.towerDefense",
    video: "33BohK7tIfQ",
    links: [
      {
        href: "https://github.com/PoloBongo/CPP_Tower_Defense",
        labelKey: "VideoGamesProjects.viewMoreCode",
        primary: true,
      },
    ],
  },
  {
    id: "cpp-bibliotheque",
    title: "C++ Bibliothèque",
    descriptionKey: "VideoGamesProjects.bibliotheque",
    poster: backgroundCPPBibliotheque,
    alt: "Bibliothèque Cpp",
    links: [
      {
        href: "https://github.com/PoloBongo/CPP_Bibliotheque/",
        labelKey: "VideoGamesProjects.viewMoreCode",
        primary: true,
      },
    ],
  },
  {
    id: "console-tour-par-tour",
    anchor: "CSharp",
    title: "Tour par tour en console",
    descriptionKey: "VideoGamesProjects.CSharpConsole",
    video: "QB-EAMeCPpQ",
    links: [
      {
        href: "https://github.com/PoloBongo/Projet9---CSharp",
        labelKey: "VideoGamesProjects.viewMoreCode",
        primary: true,
      },
    ],
  },
  {
    id: "shoot-em-up",
    title: "Shoot-Em-Up",
    descriptionKey: "VideoGamesProjects.shootEmUp",
    video: "r-x6qlMXgxo",
    links: [
      {
        href: "https://github.com/PoloBongo/Shoot-Em-Up",
        labelKey: "VideoGamesProjects.viewMoreCode",
        primary: true,
      },
    ],
  },
  {
    id: "lua",
    anchor: "LUA",
    title: "Projets LUA",
    poster: backgroundProjectLUA,
    alt: "Shoot-Em-Up Thème Futuriste",
    render: (t) => (
      <p>
        {t("VideoGamesProjects.luaPart1")}
        <a href="https://www.youtube.com/@Polo_Leaks" target="_blank" rel="noreferrer">
          Polo Leaks
        </a>
        {t("VideoGamesProjects.luaPart2")}
      </p>
    ),
    links: [
      {
        href: "https://github.com/PoloBongo/ExampleScriptsLua",
        labelKey: "VideoGamesProjects.viewMoreCode",
        primary: true,
      },
    ],
  },
];
