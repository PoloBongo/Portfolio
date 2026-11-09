import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import FlapBoard from "./FlapBoard";
import "./ratp.css";

// Hero de ratp : l'affiche du jeu, le quai et son tableau à palettes. En complément de la scène (W3) : un vrai tableau
// d'affichage mécanique, palette par palette, et la ligne de métro qui se dessine au défilement.
export default function RatpHero(props) {
  return (
    <>
      <SceneHero id="ratp" build={build} palette={PALETTES["ratp"]} fonts={FONTS["ratp"]} {...props} />
      <FlapBoard />
    </>
  );
}
