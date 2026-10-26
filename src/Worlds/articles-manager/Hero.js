import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./articles-manager.css";

// Hero de articles-manager : la une d'un quotidien (thème clair)
export default function ArticlesManagerHero(props) {
  return <SceneHero id="articles-manager" build={build} palette={PALETTES["articles-manager"]} fonts={FONTS["articles-manager"]} {...props} />;
}
