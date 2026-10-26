import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./attraction-flow.css";

// Hero de attraction-flow : le parc vu de dessus, ses allées et ses visiteurs (thème clair)
export default function AttractionFlowHero(props) {
  return <SceneHero id="attraction-flow" build={build} palette={PALETTES["attraction-flow"]} fonts={FONTS["attraction-flow"]} {...props} />;
}
