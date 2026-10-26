import lazyPreload from "../Effects/lazyPreload";
import { registerPrefetch } from "../Effects/prefetch";
import { preloadWorld } from "../Worlds";

// Pages chargées à la demande : la page projet et le module de son monde ne pèsent pas dans le bundle principal
export const WorkPage = lazyPreload(() => import("./WorkPage"));

const WORK_PATH = /^\/(?:fr|en|es)\/work\/([^/?#]+)/;
const cache = new Map();

// Charge la page projet et son monde avant d'y aller (une seule fois par projet)
registerPrefetch((pathname) => {
  const match = WORK_PATH.exec(pathname);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  if (!cache.has(slug)) cache.set(slug, Promise.all([WorkPage.preload(), preloadWorld(slug)]));
  return cache.get(slug);
});
