import React from "react";
import { useTranslation } from "react-i18next";
import SceneHero from "../shared/SceneHero";
import VideoHero from "../shared/VideoHero";
import { PALETTES, FONTS } from "../config";
import { prefersReducedMotion } from "../../Effects/motion";
import { canAutoplayClips } from "../../Pages/clips";
import build from "./scene";
import rain from "./rain.glsl";
import "./meteo-dashboard.css";

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

// Temps réel de Tours (Open-Meteo, sans clé) : code météo WMO → mode du shader (0 pluie, 1 neige, 2 dégagé) et intensité
const TOURS = "https://api.open-meteo.com/v1/forecast?latitude=47.39&longitude=0.69&current=temperature_2m,weather_code&timezone=auto";
const modeOf = (code) => {
  if (code >= 71 && code <= 77) return { mode: 1, int: 0.9, key: "snow" };
  if (code === 85 || code === 86) return { mode: 1, int: 1, key: "snow" };
  if (code >= 95) return { mode: 0, int: 1, key: "storm" };
  if (code >= 61 || (code >= 80 && code <= 82)) return { mode: 0, int: 1, key: "rain" };
  if (code >= 51) return { mode: 0, int: 0.55, key: "drizzle" };
  if (code === 3 || code === 45 || code === 48) return { mode: 0, int: 0.3, key: "cloud" };
  return { mode: 2, int: 0.2, key: "clear" };
};

// Hero de Météo Dashboard (M6, la pluie sur la vitre) : tout l'écran est le vrai clip du projet, son tableau de bord, vu à
// travers une vitre embuée que le curseur essuie. Le temps réel de Tours choisit pluie, neige ou ciel dégagé.
// Sans WebGL 2, en mouvement réduit ou avec économie de données : la vitre sous la pluie d'origine (scène décorative).
export default function MeteoDashboardHero(props) {
  const { t } = useTranslation();
  const video = hasWebGL() && !prefersReducedMotion() && canAutoplayClips();
  if (video) {
    return (
      <VideoHero
        id="meteo-dashboard"
        clip="meteo-dashboard"
        frag={rain}
        scroll={1}
        palette={PALETTES["meteo-dashboard"]}
        fonts={FONTS["meteo-dashboard"]}
        hint={t("Worlds.mt.hint")}
        uniforms={(THREE) => {
          // Buée : une petite texture que le curseur essuie (blanc = vitre claire), sans repousse
          const c = document.createElement("canvas");
          c.width = 256;
          c.height = 144;
          const g = c.getContext("2d");
          g.fillStyle = "#000";
          g.fillRect(0, 0, c.width, c.height);
          const tex = new THREE.CanvasTexture(c);
          tex.colorSpace = THREE.NoColorSpace;
          tex.generateMipmaps = false;
          tex.minFilter = THREE.LinearFilter;
          return { uFog: { value: tex }, uMode: { value: 0 }, uInt: { value: 1 }, _fog: { value: { c, g, tex } } };
        }}
        setup={({ root, uniforms }) => {
          const { c, g, tex } = uniforms._fog.value;
          const label = root.querySelector(".vh__weather b");
          let alive = true;
          fetch(TOURS)
            .then((r) => r.json())
            .then((d) => {
              if (!alive || !d.current) return;
              const m = modeOf(d.current.weather_code);
              uniforms.uMode.value = m.mode;
              uniforms.uInt.value = m.int;
              if (label) label.textContent = `${Math.round(d.current.temperature_2m)}° · ${t(`Worlds.mt.${m.key}`)}`;
            })
            .catch(() => {
              if (label) label.textContent = t("Worlds.mt.rain");
            });
          let lx = -1;
          let ly = -1;
          return {
            frame() {
              const x = uniforms.uM.value.x * c.width;
              const y = (1 - uniforms.uM.value.y) * c.height;
              if (Math.abs(x - lx) + Math.abs(y - ly) < 0.4) return;
              lx = x;
              ly = y;
              const grad = g.createRadialGradient(x, y, 0, x, y, 20);
              grad.addColorStop(0, "rgba(255,255,255,0.55)");
              grad.addColorStop(1, "rgba(255,255,255,0)");
              g.fillStyle = grad;
              g.fillRect(x - 20, y - 20, 40, 40);
              tex.needsUpdate = true;
            },
            dispose() {
              alive = false;
              tex.dispose();
            },
          };
        }}
        {...props}
      >
        <p className="vh__weather mono" aria-hidden="true">
          <span>Tours</span> <b>…</b>
        </p>
      </VideoHero>
    );
  }
  return <SceneHero id="meteo-dashboard" build={build} palette={PALETTES["meteo-dashboard"]} fonts={FONTS["meteo-dashboard"]} {...props} />;
}
