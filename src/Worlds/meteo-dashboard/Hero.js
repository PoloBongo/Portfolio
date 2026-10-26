import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./meteo-dashboard.css";

// Hero de meteo-dashboard : une vitre sous la pluie, la buée essuyée par le curseur
export default function MeteoDashboardHero(props) {
  return <SceneHero id="meteo-dashboard" build={build} palette={PALETTES["meteo-dashboard"]} fonts={FONTS["meteo-dashboard"]} {...props} />;
}
