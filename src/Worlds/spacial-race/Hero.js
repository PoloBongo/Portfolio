import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./spacial-race.css";

// Hero de spacial-race : la route sous la neige, la gravité qui s'inverse (thème clair)
export default function SpacialRaceHero(props) {
  return <SceneHero id="spacial-race" build={build} palette={PALETTES["spacial-race"]} fonts={FONTS["spacial-race"]} {...props} />;
}
