import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import lamp from "./lamp.glsl";
import "./shadow-scholar.css";

let webgl = null;
const hasWebGL = () => {
  if (webgl === null) {
    try {
      webgl = !!document.createElement("canvas").getContext("webgl2");
    } catch (e) {
      webgl = false;
    }
  }
  return webgl;
};

// Hero de Shadow Scholar (M1, la lampe torche) : tout l'écran est le vrai clip du jeu dans le noir, le curseur est une lampe
// et le titre ne se lit que dans le faisceau. Sans WebGL 2, en mouvement réduit ou avec économie de données : l'emblème
// du jeu derrière un store, éclairé par le curseur (scène décorative d'origine).
export default function ShadowScholarHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="shadow-scholar"
        clip="shadow-scholar"
        frag={lamp}
        lit
        palette={PALETTES["shadow-scholar"]}
        fonts={FONTS["shadow-scholar"]}
        hint={t("Worlds.lampHint")}
        {...props}
      />
    );
  }
  return <SceneHero id="shadow-scholar" build={build} palette={PALETTES["shadow-scholar"]} fonts={FONTS["shadow-scholar"]} {...props} />;
}
