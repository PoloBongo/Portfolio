// Pages du site : menu plein écran, HUD (nom de la section) et raccourcis clavier partagent cette liste.
// Web et IA d'abord, le jeu vidéo regroupé ensuite.
export const NAV_ITEMS = [
  { path: "", label: "ClassicNavBar.Home" },
  { path: "/ProjectsWeb", label: "DropdownProjects.ProjectWeb" },
  { path: "/AI", label: "ClassicNavBar.AI" },
  { path: "/Unity", label: "ClassicNavBar.Unity" },
  { path: "/Unreal", label: "ClassicNavBar.Unreal" },
  { path: "/GameJam", label: "ClassicNavBar.GameJam" },
  { path: "/contactMe", label: "ClassicNavBar.ContactMe" },
];

// Pages hors menu
const EXTRA = [{ path: "/Incoming", label: "ClassicNavBar.Incoming" }];

export const pageLabelKey = (pagePath) => {
  const wanted = (pagePath || "/").toLowerCase();
  // Page d'un projet : « Projets » le temps que son fil d'Ariane (data-hud) prenne le relais
  if (wanted.startsWith("/work/")) return "Hud.work";
  const hit = [...NAV_ITEMS, ...EXTRA].find(({ path }) => (path || "/").toLowerCase() === wanted);
  return hit ? hit.label : null;
};
