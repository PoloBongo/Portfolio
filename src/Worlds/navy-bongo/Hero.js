import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./navy-bongo.css";

// Hero de navy-bongo : le pont du voilier, la mer qui houle et le HUD du jeu
export default function NavyBongoHero(props) {
  return <SceneHero id="navy-bongo" build={build} palette={PALETTES["navy-bongo"]} fonts={FONTS["navy-bongo"]} {...props} />;
}
