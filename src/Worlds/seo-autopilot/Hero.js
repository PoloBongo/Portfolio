import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./seo-autopilot.css";

// Hero de SEO Autopilot : l'éditeur de nœuds de son workflow n8n, en thème clair
export default function SeoAutopilotHero(props) {
  return <SceneHero id="seo-autopilot" build={build} palette={PALETTES["seo-autopilot"]} fonts={FONTS["seo-autopilot"]} {...props} />;
}
