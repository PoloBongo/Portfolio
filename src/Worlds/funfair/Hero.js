import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import tiltshift from "./tiltshift.glsl";
import "./funfair.css";

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

// Hero de Funfair (M5, la maquette de fête foraine) : tout l'écran est le vrai clip du jeu, vu comme une maquette. Une
// bande nette suit le curseur, le reste est flou et chaque lumière devient un bokeh de fête ; un clic donne un coup de flash.
// Sans WebGL 2, en mouvement réduit ou avec économie de données : la fête foraine d'origine (scène décorative).
export default function FunfairHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="funfair"
        clip="funfair"
        frag={tiltshift}
        palette={PALETTES.funfair}
        fonts={FONTS.funfair}
        hint={t("Worlds.fairHint")}
        uniforms={() => ({ uFlashT: { value: -10 } })}
        setup={() => ({
          click(u, v, uniforms) {
            uniforms.uFlashT.value = uniforms.uT.value;
          },
        })}
        {...props}
      />
    );
  }
  return <SceneHero id="funfair" build={build} palette={PALETTES.funfair} fonts={FONTS.funfair} {...props} />;
}
