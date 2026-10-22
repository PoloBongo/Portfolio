// Images par seconde mesurées par le HUD : la scène 3D s'en sert pour ajuster sa résolution
const listeners = new Set();

export const perf = { fps: 60 };

export const subscribePerf = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function setFps(value) {
  perf.fps = value;
  listeners.forEach((fn) => fn(value));
}
