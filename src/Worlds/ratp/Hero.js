import React from "react";
import { useWorldFonts } from "../shared/SceneHero";
import { PALETTES, FONTS } from "../config";
import affiche from "../../img/backgroundRATP.webp";
import FlapBoard from "./FlapBoard";
import "./ratp.css";

// Hero de RATP : l'affiche du jeu elle-même en tête de page (elle porte déjà le titre, Unity et mon nom), puis le titre en
// texte réel, l'accroche et les faits. En complément (W3) : un vrai tableau d'affichage mécanique, palette par palette, et
// la ligne de métro qui se dessine au défilement. L'ancienne scène décorative a été retirée à la demande d'Arthur.
export default function RatpHero({ title, tagline, crumb, facts }) {
  useWorldFonts(FONTS["ratp"]);
  const vars = {};
  PALETTES["ratp"].forEach((color, i) => {
    vars[`--w${i}`] = color;
  });
  return (
    <>
      <header className="rt-cover" data-work-top style={vars}>
        <div className="container rt-cover__crumb">{crumb}</div>
        <div className="container">
          <img className="rt-cover__img" src={affiche} alt={title} width="1274" height="718" decoding="async" />
        </div>
        <div className="container rt-cover__text">
          <h1>{title}</h1>
          <p>{tagline}</p>
        </div>
        <div className="container">{facts}</div>
      </header>
      <FlapBoard />
    </>
  );
}
