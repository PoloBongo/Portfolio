import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./ratp.css";

// Hero de ratp : l'affiche du jeu, le quai et son tableau à palettes
export default function RatpHero(props) {
  return <SceneHero id="ratp" build={build} palette={PALETTES["ratp"]} fonts={FONTS["ratp"]} {...props} />;
}
