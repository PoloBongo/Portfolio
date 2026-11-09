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

// Hero de Navy Bongo (du soleil à la tempête) : tout l'écran est le vrai clip du jeu, le pont du voilier. Le défilement
// épinglé fait passer le temps du beau temps à la tempête (ciel, mer, pluie, éclairs, tangage) et un clic tire le canon.
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
        scroll={1.8}
        palette={PALETTES["navy-bongo"]}
        fonts={FONTS["navy-bongo"]}
        hint={t("Worlds.nb.hint")}
        uniforms={(THREE) => ({ uShot: { value: new THREE.Vector3(0, 0, -10) } })}
        setup={({ root, uniforms }) => {
          const label = root.querySelector(".vh__weather b");
          let last = -1;
          return {
            frame({ p }) {
              const k = p < 0.3 ? 0 : p < 0.65 ? 1 : 2;
              if (label && k !== last) {
                last = k;
                label.textContent = t(["Worlds.nb.calm", "Worlds.nb.swell", "Worlds.nb.storm"][k]);
              }
            },
            click(u, v) {
              uniforms.uShot.value.set((u - 0.5) * uniforms.uAsp.value, v - 0.5, uniforms.uT.value);
            },
          };
        }}
        {...props}
      >
        <p className="vh__weather mono" aria-hidden="true">
          <span>{t("Worlds.nb.weather")}</span> <b>{t("Worlds.nb.calm")}</b>
        </p>
      </VideoHero>
    );
  }
  return <SceneHero id="navy-bongo" build={build} palette={PALETTES["navy-bongo"]} fonts={FONTS["navy-bongo"]} {...props} />;
}
