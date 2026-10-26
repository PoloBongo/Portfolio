import React from "react";
import SceneHero from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import build from "./scene";
import "./payment-page.css";

// Hero de payment-page : streetwear et ticket de caisse qui s'imprime
export default function PaymentPageHero(props) {
  return <SceneHero id="payment-page" build={build} palette={PALETTES["payment-page"]} fonts={FONTS["payment-page"]} {...props} />;
}
