// Chargements à attendre avant que le préloader s'ouvre (scène 3D de l'accueil, etc.).
// Un composant déclare sa promesse avec registerLoad ; le préloader attend whenLoaded.
const pending = new Set();

export function registerLoad(promise) {
  const tracked = Promise.resolve(promise).catch(() => {});
  pending.add(tracked);
  tracked.then(() => pending.delete(tracked));
  return tracked;
}

export const whenLoaded = () => Promise.all([...pending]);
