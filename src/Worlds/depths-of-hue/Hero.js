import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./depths-of-hue.css";

// Hero de Depths Of Hue : la coursive du sous-marin, la couleur revient sous le curseur
export default function DepthsHero(props) {
  return <SceneHero id="depths-of-hue" build={build} palette={PALETTES["depths-of-hue"]} fonts={FONTS["depths-of-hue"]} {...props} />;
}
