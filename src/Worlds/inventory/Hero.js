import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./inventory.css";

// Hero de inventory : les ruines de grès, le mannequin et la barre d'objets
export default function InventoryHero(props) {
  return <SceneHero id="inventory" build={build} palette={PALETTES["inventory"]} fonts={FONTS["inventory"]} {...props} />;
}
