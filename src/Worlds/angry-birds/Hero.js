import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./angry-birds.css";

// Hero de angry-birds : le jeu tel quel, l'oiseau tiré sur la tour de bois (thème clair)
export default function AngryBirdsHero(props) {
  return <SceneHero id="angry-birds" build={build} palette={PALETTES["angry-birds"]} fonts={FONTS["angry-birds"]} {...props} />;
}
