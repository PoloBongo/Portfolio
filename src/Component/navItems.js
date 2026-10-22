// Pages du site : menu plein écran, HUD (nom du niveau) et raccourcis clavier partagent cette liste
export const NAV_ITEMS = [
  { path: "", label: "ClassicNavBar.Home" },
  { path: "/Unity", label: "ClassicNavBar.Unity" },
  { path: "/Unreal", label: "ClassicNavBar.Unreal" },
  { path: "/GameJam", label: "ClassicNavBar.GameJam" },
  { path: "/ProjectsVideosGames", label: "DropdownProjects.ProjectVideoGames" },
  { path: "/ProjectsWeb", label: "DropdownProjects.ProjectWeb" },
  { path: "/AI", label: "ClassicNavBar.AI" },
  { path: "/contactMe", label: "ClassicNavBar.ContactMe" },
];

// Pages hors menu
const EXTRA = [{ path: "/Incoming", label: "ClassicNavBar.Incoming" }];

export const pageLabelKey = (pagePath) => {
  const wanted = (pagePath || "/").toLowerCase();
  const hit = [...NAV_ITEMS, ...EXTRA].find(({ path }) => (path || "/").toLowerCase() === wanted);
  return hit ? hit.label : null;
};
