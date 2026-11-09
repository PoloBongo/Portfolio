import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import sea from "./sea.glsl";
import "./navy-bongo.css";

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

// Hero de Navy Bongo : tout l'écran est le vrai clip du jeu, le pont du voilier, sous un ciel de plein jour et une mer qui
// brille ; un clic tire le canon.
// Sans WebGL 2, en mouvement réduit ou avec économie de données : le pont d'origine, mer qui houle (scène décorative).
export default function NavyBongoHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="navy-bongo"
        clip="navy-bongo"
        frag={sea}
        palette={PALETTES["navy-bongo"]}
        fonts={FONTS["navy-bongo"]}
        hint={t("Worlds.nb.hint")}
        uniforms={(THREE) => ({ uShot: { value: new THREE.Vector3(0, 0, -10) } })}
        setup={({ uniforms }) => ({
          click(u, v) {
            uniforms.uShot.value.set((u - 0.5) * uniforms.uAsp.value, v - 0.5, uniforms.uT.value);
          },
        })}
        {...props}
      />
    );
  }
  return <SceneHero id="navy-bongo" build={build} palette={PALETTES["navy-bongo"]} fonts={FONTS["navy-bongo"]} {...props} />;
}
