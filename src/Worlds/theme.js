import { setFieldTint } from "../Effects/fieldBus";

const NEUTRAL = [0.62, 0.34, 0.98]; // le violet d'origine du nuage

const channels = (value) => {
  const hex = value.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
};
const toHex = (rgb) => `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("")}`;
const darken = (value, amount) => toHex(channels(value).map((c) => c * (1 - amount)));
const withAlpha = (value, alpha) => `rgba(${channels(value).join(", ")}, ${alpha})`;

// Aperçu d'un monde (survol d'une carte) : seul le nuage prend sa couleur, l'interface ne bouge pas
export const previewTint = (world) => setFieldTint(world.tint, world.mix * 0.85);
export const clearTint = () => setFieldTint(NEUTRAL, 0);

// Habille toute l'interface aux couleurs du monde (variables CSS de <html>) et teinte le nuage.
// Renvoie la fonction qui remet les couleurs du site.
export function applyWorld(world) {
  const vars = {
    "--violet": world.accent,
    "--violet-deep": darken(world.accent, 0.4),
    "--violet-soft": withAlpha(world.accent, 0.16),
  };
  if (world.secondary) vars["--mint"] = world.secondary;
  // Monde clair ou à encre propre : texte, filets et halos suivent la couleur d'encre du monde
  if (world.ink) {
    vars["--ink"] = world.ink;
    // Assez opaques pour tenir le contraste AA du petit texte (faits, rang) sur les fonds clairs
    vars["--ink-dim"] = withAlpha(world.ink, 0.78);
    vars["--ink-faint"] = withAlpha(world.ink, 0.7);
    vars["--line"] = withAlpha(world.ink, 0.14);
    vars["--line-strong"] = withAlpha(world.ink, 0.3);
  }
  if (world.bg) {
    vars["--bg"] = world.bg;
    vars["--bg-rgb"] = channels(world.bg).join(", "); // voiles du HUD et du menu
    vars["--bg-raised"] = world.bgRaised || world.bg;
    vars["--bg-sunken"] = world.bgSunken || world.bg;
  }

  const style = document.documentElement.style;
  Object.entries(vars).forEach(([name, value]) => style.setProperty(name, value));
  setFieldTint(world.tint, world.mix);

  return () => {
    Object.keys(vars).forEach((name) => style.removeProperty(name));
    setFieldTint(NEUTRAL, 0);
  };
}
