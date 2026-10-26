import backgroundChocoBlast from "../../img/backgroundChocoBlast.webp";
import { unityBuild } from "../unityBuild";

// Jeux de Game Jam, jouables dans la page. alertKey : message affiché avant de lancer le jeu.
export const GAMEJAM_PROJECTS = [
  {
    id: "attraction-flow",
    title: "Attraction Flow",
    tags: "Unity · Mobile · 42 h",
    video: "-F1GZJYqFyw",
    game: unityBuild("BuildAttractionFlowGameJam"),
    alertKey: "GameJam.AttractionFlow.Alert",
    gameLabels: {
      loading: "GameJam.AttractionFlow.LoadingGame",
      inProgress: "GameJam.AttractionFlow.GameInProgress",
    },
    render: (t) => (
      <>
        <p>{t("GameJam.AttractionFlow.Description")}</p>
        <p className="case__tech mono">{t("GameJam.AttractionFlow.technologies")}</p>
      </>
    ),
    links: [
      {
        href: "https://stratix0.itch.io/attraction-flow",
        labelKey: "VideoGamesProjects.viewMoreGame",
        primary: true,
      },
      { href: "https://github.com/PoloBongo/AttractionFlow", labelKey: "VideoGamesProjects.viewMoreCode" },
    ],
  },
  {
    id: "stay-soul",
    title: "Stay Soul",
    tags: "Unity · Game Jam · 42 h",
    // Trailer différent selon la langue du visiteur
    video: { fr: "zU-sBTZ5yp4", en: "qKD15vTFgAM", es: "qKD15vTFgAM" },
    game: unityBuild("BuildStaySoulGameJam"),
    alertKey: "GameJam.StaySoul.Alert",
    render: (t) => (
      <>
        <p>{t("GameJam.StaySoul.Description")}</p>
        <p className="case__tech mono">{t("GameJam.Chocolato.technologies")}</p>
      </>
    ),
    links: [
      { href: "https://46yuu.itch.io/staysoul", labelKey: "VideoGamesProjects.viewMoreGame", primary: true },
      { href: "https://github.com/PoloBongo/Meta_GTech", labelKey: "VideoGamesProjects.viewMoreCode" },
    ],
  },
  {
    id: "choco-blast",
    title: "Choco Blast",
    tags: "Unity · Game Jam · 48 h",
    poster: backgroundChocoBlast,
    alt: "Choco Blast Menu Principal",
    game: unityBuild("BuildChocolatoGameJam"),
    alertKey: "GameJam.Chocolato.Alert",
    render: (t) => (
      <>
        <p>{t("GameJam.Chocolato.Description")}</p>
        <p className="case__tech mono">{t("GameJam.Chocolato.technologies")}</p>
      </>
    ),
    links: [
      {
        href: "https://demonxlegend.itch.io/chocoblast",
        labelKey: "VideoGamesProjects.viewMoreGame",
        primary: true,
      },
      { href: "https://github.com/DemonXlegenD/Chocoblast", labelKey: "VideoGamesProjects.viewMoreCode" },
    ],
  },
];
