import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./choco-blast.css";

// Hero de Choco Blast : le menu du jeu et du chocolat qui suit le curseur
export default function ChocoBlastHero(props) {
  return <SceneHero id="choco-blast" build={build} palette={PALETTES["choco-blast"]} fonts={FONTS["choco-blast"]} {...props} />;
}
