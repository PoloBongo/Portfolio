import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./unity-rl.css";

// Hero de unity-rl : le terrain de foot sur un toit, en écran partagé
export default function UnityRlHero(props) {
  return <SceneHero id="unity-rl" build={build} palette={PALETTES["unity-rl"]} fonts={FONTS["unity-rl"]} {...props} />;
}
