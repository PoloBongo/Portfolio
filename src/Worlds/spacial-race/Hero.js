import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { gsap, prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import gravity from "./gravity.glsl";
import "./spacial-race.css";

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

// Hero de Spacial Race (M4, la gravité s'inverse) : tout l'écran est le vrai clip de la course, des traits de vitesse
// filent depuis le centre (la molette leur donne de la vitesse), et un clic, ou le bouton, retourne l'image en perspective
// comme la route du jeu. Sans WebGL 2, en mouvement réduit ou avec économie de données : la route d'origine.
export default function SpacialRaceHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="spacial-race"
        clip="spacial-race"
        frag={gravity}
        palette={PALETTES["spacial-race"]}
        fonts={FONTS["spacial-race"]}
        hint={t("Worlds.gravityHint")}
        uniforms={(THREE) => ({ uFlip: { value: 0 } })}
        setup={({ root, uniforms }) => {
          const state = root.querySelector(".vh__gravity-state");
          const btn = root.querySelector(".vh__gravity");
          let flipped = false;
          const toggle = () => {
            flipped = !flipped;
            if (state) state.textContent = t(flipped ? "Worlds.gravityFlipped" : "Worlds.gravityNormal");
            if (btn) btn.setAttribute("aria-pressed", String(flipped));
            gsap.to(uniforms.uFlip, { value: flipped ? 1 : 0, duration: 1.1, ease: "back.inOut(1.2)", overwrite: true });
          };
          if (btn) btn.addEventListener("click", toggle);
          return {
            click: toggle,
            dispose() {
              if (btn) btn.removeEventListener("click", toggle);
              gsap.killTweensOf(uniforms.uFlip);
            },
          };
        }}
        {...props}
      >
        <button type="button" className="vh__gravity mono" aria-pressed="false">
          <span>{t("Worlds.gravity")}</span> <b className="vh__gravity-state">{t("Worlds.gravityNormal")}</b>
        </button>
      </VideoHero>
    );
  }
  return <SceneHero id="spacial-race" build={build} palette={PALETTES["spacial-race"]} fonts={FONTS["spacial-race"]} {...props} />;
}
