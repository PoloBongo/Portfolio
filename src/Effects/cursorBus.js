// Indice de curseur donné par la scène 3D : quand le pointeur est au-dessus d'un objet qu'on peut faire tourner,
// le curseur du site prend l'état « drag » (et son libellé) même si le DOM sous le pointeur n'a rien demandé.
// Cursor.js s'abonne et le restitue ; null = on revient à ce que dit le DOM.
let hint = null;
const subscribers = new Set();

export function setCursorHint(state, text = "") {
  const next = state ? { state, text } : null;
  if ((hint && next && hint.state === next.state && hint.text === next.text) || (!hint && !next)) return;
  hint = next;
  subscribers.forEach((fn) => fn(hint));
}

export function subscribeCursorHint(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}
