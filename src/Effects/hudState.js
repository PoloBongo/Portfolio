// État partagé du HUD (nom du niveau, progression de lecture) : l'écran de la manette 3D l'affiche
const listeners = new Set();

export const hudState = { name: "", xp: 0 };

export const subscribeHud = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setHud(patch) {
  Object.assign(hudState, patch);
  listeners.forEach((fn) => fn(hudState));
}
