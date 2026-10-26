import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./ba-immobilier.css";

// Hero de ba-immobilier : anthracite et turquoise, plan d'architecte filaire
export default function BaImmobilierHero(props) {
  return <SceneHero id="ba-immobilier" build={build} palette={PALETTES["ba-immobilier"]} fonts={FONTS["ba-immobilier"]} {...props} />;
}
