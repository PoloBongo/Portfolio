import { WEB_PROJECTS } from "./Projects/projects";
import { AI_PROJECTS } from "./AI/projects";
import { UNITY_PROJECTS } from "./Unity/projects";
import { UNREAL_PROJECTS } from "./Unreal/projects";
import { GAMEJAM_PROJECTS } from "./GameJam/projects";

// Catégories : une page chacune (un « hub » qui liste ses projets). Chaque projet a en plus sa propre page,
// /:lang/work/:slug, où il prend son monde (voir Worlds/).
export const CATEGORIES = [
  { id: "web", path: "/ProjectsWeb", labelKey: "DropdownProjects.ProjectWeb", projects: WEB_PROJECTS },
  { id: "ai", path: "/AI", labelKey: "ClassicNavBar.AI", projects: AI_PROJECTS },
  { id: "unity", path: "/Unity", labelKey: "ClassicNavBar.Unity", projects: UNITY_PROJECTS },
  { id: "unreal", path: "/Unreal", labelKey: "ClassicNavBar.Unreal", projects: UNREAL_PROJECTS },
  { id: "gamejam", path: "/GameJam", labelKey: "ClassicNavBar.GameJam", projects: GAMEJAM_PROJECTS },
];

// Un projet enrichi : slug (= id, identique dans les trois langues), sa catégorie, sa place dans elle
export const WORKS = CATEGORIES.flatMap((category) =>
  category.projects.map((project, index) => ({
    ...project,
    slug: project.id,
    category,
    index,
    count: category.projects.length,
  }))
);

const BY_SLUG = new Map(WORKS.map((work) => [work.slug, work]));

export const getWork = (slug) => BY_SLUG.get(slug) || null;

export const workPath = (lang, slug) => `/${lang}/work/${slug}`;

export const titleOf = (work, t) => (work.titleKey ? t(work.titleKey) : work.title);

// Projet précédent et suivant dans la même catégorie (la liste boucle)
export function neighbours(work) {
  const list = work.category.projects;
  if (list.length < 2) return { prev: null, next: null };
  const around = (step) => getWork(list[(work.index + step + list.length) % list.length].id);
  return { prev: around(-1), next: around(1) };
}
