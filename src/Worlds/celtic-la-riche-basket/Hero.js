import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./celtic-la-riche-basket.css";

// Hero de celtic-la-riche-basket : l'affiche de club et son ballon qui rebondit
export default function CelticLaRicheBasketHero(props) {
  return <SceneHero id="celtic-la-riche-basket" build={build} palette={PALETTES["celtic-la-riche-basket"]} fonts={FONTS["celtic-la-riche-basket"]} {...props} />;
}
