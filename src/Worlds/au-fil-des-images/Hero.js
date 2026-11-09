import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import RopeHero from "./RopeHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import build from "./scene";
import "./au-fil-des-images.css";

// Hero d'Au fil des images (W2, le fil est réel) : un vrai fil physique, avec les vraies photos de la boutique de
// l'association pincées dessus, que l'on tire, relâche et secoue en défilant. Sur le dégradé violet et corail du site.
// En mouvement réduit : le fil et les cadres d'origine (scène décorative).
export default function AuFilDesImagesHero(props) {
  const { t } = useTranslation();
  if (!prefersReducedMotion()) {
    return <RopeHero palette={PALETTES["au-fil-des-images"]} fonts={FONTS["au-fil-des-images"]} hint={t("Worlds.fil.hint")} {...props} />;
  }
  return <SceneHero id="au-fil-des-images" build={build} palette={PALETTES["au-fil-des-images"]} fonts={FONTS["au-fil-des-images"]} {...props} />;
}
