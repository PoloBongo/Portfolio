import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./ui-ux-cooking.css";

// Hero de ui-ux-cooking : la cuisine low-poly et sa poêle qui flambe (thème clair)
export default function UiUxCookingHero(props) {
  return <SceneHero id="ui-ux-cooking" build={build} palette={PALETTES["ui-ux-cooking"]} fonts={FONTS["ui-ux-cooking"]} {...props} />;
}
