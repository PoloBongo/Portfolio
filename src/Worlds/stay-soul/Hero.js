import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import dither from "./dither.glsl";
import "./stay-soul.css";

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

// Hero de Stay Soul (M3, la trame) : tout l'écran est le vrai clip du jeu, passé par une trame de Bayer et la palette
// lavande du logo ; elle s'affine en défilant, et le curseur ouvre une fenêtre sur l'image réelle.
// Sans WebGL 2, en mouvement réduit ou avec économie de données : le fond tramé et l'âme pixel d'origine.
export default function StaySoulHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="stay-soul"
        clip="stay-soul"
        frag={dither}
        scroll={1}
        palette={PALETTES["stay-soul"]}
        fonts={FONTS["stay-soul"]}
        hint={t("Worlds.ditherHint")}
        {...props}
      />
    );
  }
  return <SceneHero id="stay-soul" build={build} palette={PALETTES["stay-soul"]} fonts={FONTS["stay-soul"]} {...props} />;
}
