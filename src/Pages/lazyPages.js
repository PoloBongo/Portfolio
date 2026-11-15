import lazyPreload from "../Effects/lazyPreload";
import { registerPrefetch } from "../Effects/prefetch";
import { preloadWorld } from "../Worlds";

// Pages chargées à la demande : la page projet et le module de son monde, les hubs et le contact (avec emailjs) ne
// pèsent pas dans le bundle principal
export const WorkPage = lazyPreload(() => import("./WorkPage"));
export const ProjectsWeb = lazyPreload(() => import("./Projects/ProjectsWeb"));
export const ContactMe = lazyPreload(() => import("./Projects/ContactMe"));
export const GameJam = lazyPreload(() => import("./GameJam/GameJam"));
export const UnityPage = lazyPreload(() => import("./Unity/Unity"));
export const UnrealPage = lazyPreload(() => import("./Unreal/Unreal"));
export const IncomingPage = lazyPreload(() => import("./Incoming/Incoming"));
export const AIPage = lazyPreload(() => import("./AI/AIPage"));

// Adresse → page (préchargée au survol d'un lien et avant chaque transition, voir Effects/prefetch.js)
const PAGES = {
  ProjectsWeb,
  contactMe: ContactMe,
  GameJam,
  Unity: UnityPage,
  Unreal: UnrealPage,
  Incoming: IncomingPage,
  AI: AIPage,
};
const PAGE_PATH = /^\/(?:fr|en|es)\/([^/?#]+)\/?$/;
registerPrefetch((pathname) => {
  const match = PAGE_PATH.exec(pathname);
  const page = match && PAGES[match[1]];
  return page ? page.preload() : null;
});

// Quelques secondes après l'arrivée, les pages restantes se chargent en tâche de fond (petits morceaux) : un retour
// arrière vers un hub n'affiche jamais d'écran de chargement
if (typeof window !== "undefined") {
  const tout = () => Object.values(PAGES).forEach((page) => page.preload().catch(() => {}));
  window.setTimeout(() => ("requestIdleCallback" in window ? window.requestIdleCallback(tout, { timeout: 4000 }) : tout()), 6000);
}

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
