import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import PlanHero from "./PlanHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import build from "./scene";
import "./ba-immobilier.css";

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

// Hero de B.A Immobilier (W1, du plan à la maquette) : le plan d'architecte turquoise sur anthracite devient, au
// défilement, une maquette 3D (murs qui montent, mobilier, caméra qui bascule), les arêtes restent tracées.
// Sans WebGL 2 ou en mouvement réduit : le plan filaire d'origine (scène décorative).
export default function BaImmobilierHero(props) {
  const { t } = useTranslation();
  if (hasWebGL() && !prefersReducedMotion()) {
    return <PlanHero palette={PALETTES["ba-immobilier"]} fonts={FONTS["ba-immobilier"]} hint={t("Worlds.ba.hint")} {...props} />;
  }
  return <SceneHero id="ba-immobilier" build={build} palette={PALETTES["ba-immobilier"]} fonts={FONTS["ba-immobilier"]} {...props} />;
}
