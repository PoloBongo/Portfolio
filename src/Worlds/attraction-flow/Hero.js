import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import bubble from "./bubble.glsl";
import "./attraction-flow.css";

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

// Hero d'Attraction Flow (M8, la bulle) : tout l'écran est le vrai clip du jeu mobile (thème clair) ; le curseur pousse une
// bulle-loupe irisée, défiler fait onduler l'image par bandes comme un manège, un clic fait éclater une bulle.
// Sans WebGL 2, en mouvement réduit ou avec économie de données : le parc vu de dessus d'origine.
export default function AttractionFlowHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="attraction-flow"
        clip="attraction-flow"
        frag={bubble}
        palette={PALETTES["attraction-flow"]}
        fonts={FONTS["attraction-flow"]}
        hint={t("Worlds.bubbleHint")}
        uniforms={() => ({ uPopX: { value: 0.5 }, uPopY: { value: 0.5 }, uPopT: { value: -10 } })}
        setup={() => ({
          click(u, v, uniforms) {
            uniforms.uPopX.value = u;
            uniforms.uPopY.value = v;
            uniforms.uPopT.value = uniforms.uT.value;
          },
        })}
        {...props}
      />
    );
  }
  return <SceneHero id="attraction-flow" build={build} palette={PALETTES["attraction-flow"]} fonts={FONTS["attraction-flow"]} {...props} />;
}
