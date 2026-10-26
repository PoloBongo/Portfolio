import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./funfair.css";

// Hero de Funfair : la fête foraine de nuit, la guirlande s'allume près du curseur
export default function FunfairHero(props) {
  return <SceneHero id="funfair" build={build} palette={PALETTES.funfair} fonts={FONTS.funfair} {...props} />;
}
