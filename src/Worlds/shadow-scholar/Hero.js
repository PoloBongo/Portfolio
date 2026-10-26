import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./shadow-scholar.css";

// Hero de Shadow Scholar : l'emblème du jeu derrière un store, éclairé par le curseur
export default function ShadowScholarHero(props) {
  return <SceneHero id="shadow-scholar" build={build} palette={PALETTES["shadow-scholar"]} fonts={FONTS["shadow-scholar"]} {...props} />;
}
