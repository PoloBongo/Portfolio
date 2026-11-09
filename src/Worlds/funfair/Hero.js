import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import FerrisWheel from "./FerrisWheel";
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

// Hero de Funfair : la cover est la grande roue du jeu en 3D (modèle exporté d'Unreal), qui tourne au défilement.
// Sans WebGL 2 : la fête foraine d'origine (scène décorative).
export default function FunfairHero(props) {
  if (hasWebGL()) return <FerrisWheel palette={PALETTES.funfair} {...props} />;
  return <SceneHero id="funfair" build={build} palette={PALETTES.funfair} fonts={FONTS.funfair} {...props} />;
}
