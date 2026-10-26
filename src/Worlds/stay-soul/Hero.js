import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./stay-soul.css";

// Hero de Stay Soul : le logo pixel, l'âme suit le curseur
export default function StaySoulHero(props) {
  return <SceneHero id="stay-soul" build={build} palette={PALETTES["stay-soul"]} fonts={FONTS["stay-soul"]} {...props} />;
}
