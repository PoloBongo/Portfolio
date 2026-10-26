import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./eko.css";

// Hero de eko : une forêt dans la brume, plans en parallaxe
export default function EkoHero(props) {
  return <SceneHero id="eko" build={build} palette={PALETTES["eko"]} fonts={FONTS["eko"]} {...props} />;
}
