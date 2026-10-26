import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./au-fil-des-images.css";

// Hero d'Au fil des images : un fil et des cadres suspendus, en thème clair
export default function AuFilHero(props) {
  return <SceneHero id="au-fil-des-images" build={build} palette={PALETTES["au-fil-des-images"]} fonts={FONTS["au-fil-des-images"]} {...props} />;
}
