import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import slots from "./slots.glsl";
import "./inventory.css";

let webgl = null;
const hasWebGL = () => {
  if (webgl === null) {
    try {
      webgl = !!document.createElement("canvas").getContext("webgl2");
    } catch (e) {
      webgl = false;
    }
  }
  return webgl;
};

// Hero d'Inventory (M7, les emplacements) : tout l'écran est le vrai clip du jeu rangé dans une grille d'emplacements d'inventaire ;
// la case visée s'allume, défiler range le sac (les cases se rejoignent), un clic ramasse (onde dorée).
// Sans WebGL 2, en mouvement réduit ou avec économie de données : les ruines et la barre d'objets d'origine.
export default function InventoryHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="inventory"
        clip="inventory"
        frag={slots}
        scroll={1}
        palette={PALETTES.inventory}
        fonts={FONTS.inventory}
        hint={t("Worlds.slotsHint")}
        uniforms={() => ({ uPickX: { value: 0.5 }, uPickY: { value: 0.5 }, uPickT: { value: -10 } })}
        setup={() => ({
          click(u, v, uniforms) {
            uniforms.uPickX.value = u;
            uniforms.uPickY.value = v;
            uniforms.uPickT.value = uniforms.uT.value;
          },
        })}
        {...props}
      />
    );
  }
  return <SceneHero id="inventory" build={build} palette={PALETTES.inventory} fonts={FONTS.inventory} {...props} />;
}
