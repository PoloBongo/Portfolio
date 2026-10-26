import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./portfolio.css";

// Hero de portfolio : le site qui se décrit lui-même (nuage de points violet)
export default function PortfolioHero(props) {
  return <SceneHero id="portfolio" build={build} palette={PALETTES["portfolio"]} fonts={FONTS["portfolio"]} {...props} />;
}
