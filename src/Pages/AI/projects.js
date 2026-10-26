// Projets IA & automatisation. Cerebro n'a pas encore de vidéo : son cadre affiche le schéma animé de son
// pipeline RAG (diagram: "rag"). Renseigner video quand la démo sera publiée.
export const AI_PROJECTS = [
  {
    id: "cerebro",
    title: "Cerebro",
    i18n: "AIProjects.Cerebro",
    video: null,
    diagram: "rag",
    inProgress: true,
    tags: "RAG · FastAPI · Qdrant",
    links: [],
  },
  {
    id: "seo-autopilot",
    title: "SEO Autopilot",
    tags: "n8n · Lighthouse · GPT",
    i18n: "AIProjects.SEOAutopilot",
    video: "7C2_lc6DfLU",
    links: [
      { href: "https://github.com/PoloBongo/n8n-seo-app", label: "n8n SEO App", primary: true },
      { href: "https://github.com/PoloBongo/n8n-seo-docker", label: "Lighthouse Docker" },
    ],
  },
];
