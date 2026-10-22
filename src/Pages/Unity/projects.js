import backgroundUnityRL from "../../img/backgroundUnityRL.webp";
import backgroundUIUXCook from "../../img/backgroundUIUXCook.webp";
import backgroundAngryBirds from "../../img/backgroundAngryBirds.webp";
import backgroundRATP from "../../img/backgroundRATP.webp";
import backgroundDepthsOfHue from "../../img/backgroundDepthsOfHue.webp";
import { unityBuild } from "../unityBuild";

// Projets Unity. game : build WebGL jouable dans la page · hintKey : conseil affiché sur la vignette
export const UNITY_PROJECTS = [
  {
    id: "depths-of-hue",
    title: "Depths Of Hue",
    i18n: "Unity.DepthsOfHue",
    poster: backgroundDepthsOfHue,
    alt: "Depths Of Hue Game",
    video: "dlC3tTf1Jlo",
    links: [
      { href: "https://arthur-bru.itch.io/depths-of-hue", labelKey: "VideoGamesProjects.viewMoreGame", primary: true },
      {
        href: "https://github.com/GamingCampus-MillieBourgois-24-25/grand-projet-commun-depths-of-hue",
        labelKey: "VideoGamesProjects.viewMoreCode",
      },
    ],
  },
  {
    id: "shadow-scholar",
    title: "Shadow Scholar : La fac ultime",
    i18n: "Unity.ShadowScholar",
    video: "IwMvlVfyvs8",
    links: [
      {
        href: "https://arthur-bru.itch.io/shadow-scholar-la-fac-ultime",
        labelKey: "VideoGamesProjects.viewMoreGame",
        primary: true,
      },
    ],
  },
  {
    id: "ratp",
    titleKey: "Unity.RATP.Title",
    i18n: "Unity.RATP",
    poster: backgroundRATP,
    alt: "RATP Game",
    links: [],
  },
  {
    id: "angry-birds",
    title: "Angry Birds",
    i18n: "Unity.AngryBirds",
    poster: backgroundAngryBirds,
    alt: "Angry Birds Game",
    game: unityBuild("BuildUnityAngryBirds"),
    hintKey: "Unity.AngryBirds.Alert",
    links: [{ href: "https://github.com/PoloBongo/AngryBirds", labelKey: "VideoGamesProjects.viewMoreCode" }],
  },
  {
    id: "ui-ux-cooking",
    title: "UI UX Cooking Project",
    i18n: "Unity.UIUXCooking",
    poster: backgroundUIUXCook,
    alt: "UI UX Cooking Game",
    game: unityBuild("BuildUnityUIUXCook"),
    hintKey: "Unity.UIUXCooking.Alert",
    links: [{ href: "https://github.com/PoloBongo/UICookProject", labelKey: "VideoGamesProjects.viewMoreCode" }],
  },
  {
    id: "navy-bongo",
    title: "Navy Bongo",
    i18n: "Unity.NavyBongo",
    video: "YtT03rMnzBg",
    links: [
      { href: "https://arthur-bru.itch.io/navy-bongo", labelKey: "VideoGamesProjects.viewMoreGame", primary: true },
      { href: "https://github.com/PoloBongo/NavyBongo", labelKey: "VideoGamesProjects.viewMoreCode" },
    ],
  },
  {
    id: "unity-rl",
    title: "Unity RL",
    i18n: "Unity.UnityRL",
    poster: backgroundUnityRL,
    alt: "Unity RL Game",
    game: unityBuild("BuildUnityRL", "public"),
    links: [{ href: "https://p0izon.itch.io/fou2foot", labelKey: "VideoGamesProjects.viewMoreGame", primary: true }],
  },
];
