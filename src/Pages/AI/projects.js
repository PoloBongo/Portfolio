// Projets IA & automatisation. Cerebro n'a pas encore de vidéo : renseigner video quand la démo sera publiée.
export const AI_PROJECTS = [
  {
    id: "cerebro",
    title: "Cerebro",
    i18n: "AIProjects.Cerebro",
    video: null,
    inProgress: true,
    tags: "RAG · FastAPI · Qdrant",
    links: [],
  },
  {
    id: "seo-autopilot",
    title: "SEO Autopilot",
    i18n: "AIProjects.SEOAutopilot",
    video: "7C2_lc6DfLU",
    links: [
      { href: "https://github.com/PoloBongo/n8n-seo-app", label: "n8n SEO App", primary: true },
      { href: "https://github.com/PoloBongo/n8n-seo-docker", label: "Lighthouse Docker" },
    ],
  },
];
