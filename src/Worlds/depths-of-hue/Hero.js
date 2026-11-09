import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import dive from "./dive.glsl";
import "./depths-of-hue.css";

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

// Profondeur affichée, en mètres, pour le fond de la plongée
const MAX_DEPTH = 300;

// Hero de Depths Of Hue (M2, la plongée) : tout l'écran est le vrai clip du jeu sous l'eau. Le défilement épinglé est la
// profondeur (le rouge disparaît d'abord), la couleur ne revient qu'autour du curseur, un clic lance une onde de couleur.
// Sans WebGL 2, en mouvement réduit ou avec économie de données : la coursive du sous-marin (scène décorative d'origine).
export default function DepthsHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="depths-of-hue"
        clip="depths-of-hue"
        frag={dive}
        scroll={1.6}
        palette={PALETTES["depths-of-hue"]}
        fonts={FONTS["depths-of-hue"]}
        hint={t("Worlds.diveHint")}
        uniforms={(THREE) => ({ uPulse: { value: new THREE.Vector3(0, 0, -10) } })}
        setup={({ root, uniforms }) => {
          const depth = root.querySelector(".vh__depth");
          return {
            frame({ p }) {
              if (depth) depth.textContent = `\u2212 ${Math.round(p * MAX_DEPTH)} m`;
            },
            click(u, v) {
              uniforms.uPulse.value.set((u - 0.5) * uniforms.uAsp.value, v - 0.5, uniforms.uT.value);
            },
          };
        }}
        {...props}
      >
        <p className="vh__depth mono" aria-hidden="true">
          {"\u2212 0 m"}
        </p>
      </VideoHero>
    );
  }
  return <SceneHero id="depths-of-hue" build={build} palette={PALETTES["depths-of-hue"]} fonts={FONTS["depths-of-hue"]} {...props} />;
}
