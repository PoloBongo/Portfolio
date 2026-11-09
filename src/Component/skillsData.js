// Compétences par domaine, avec la preuve : les projets où elles sont VRAIMENT utilisées.
// La preuve vient des technologies indiquées sur chaque projet (champ `tags` de Pages/*/projects.js) : aucune compétence
// n'est rattachée à un projet qui ne la liste pas. `match` : fragments (sans casse) cherchés dans ces `tags`.
// `certs` : indices dans CERTIFICATES (CertificateCarousel.js) quand la compétence est prouvée par un certificat Educative.
// `note` : un texte « sur mon GitHub » (Skills.note.<id>) pour une pratique visible dans mes dépôts publics mais absente du portfolio
// `also` : projets du portfolio dont le dépôt GitHub confirme la compétence alors que leur fiche ne la liste pas
// `all` : utilisée sur tous les projets du portfolio (Git)
// `to` : page de catégorie liée (repli quand aucun projet ne la liste) · `info` : texte déroulant (clé de traduction)

export const DOMAINS = [
  { id: "web", title: "Skills.web", color: "#d9ff4a" },
  { id: "ai", title: "Skills.ai", color: "#63e6be" },
  { id: "tools", title: "Skills.tools", color: "#bc63ff" },
  { id: "game", title: "Skills.game", color: "#ff5fa8" },
];

export const SKILLS = [
  // Web
  { id: "JavaScript", domain: "web", label: "Home.JavaScript", match: ["javascript"], to: "/ProjectsWeb" },
  { id: "TypeScript", note: true, also: ["articles-manager"], domain: "web", label: "Home.TypeScript", match: [], to: "/ProjectsWeb#NextJs" },
  { id: "React", domain: "web", label: "Home.React", match: ["react"] },
  { id: "NextJs", domain: "web", label: "Home.NextJs", match: ["next.js"], to: "/ProjectsWeb#NextJs" },
  { id: "VueJs", domain: "web", label: "Home.VueJs", match: ["vue"], to: "/ProjectsWeb#VueJs" },
  { id: "ChartJs", domain: "web", label: "Home.ChartJs", match: ["chart.js"], to: "/ProjectsWeb#VueJs" },
  { id: "HTML", domain: "web", label: "Home.HTML", match: ["html"], to: "/ProjectsWeb" },
  { id: "CSS", domain: "web", label: "Home.CSS", match: ["css"], to: "/ProjectsWeb" },
  { id: "Bootstrap", note: true, domain: "web", label: "Home.Bootstrap", match: [], to: "/ProjectsWeb" },
  { id: "PHP", domain: "web", label: "Home.PHP", match: ["php"], to: "/ProjectsWeb" },
  // IA & agents
  { id: "LLM", note: true, domain: "ai", name: "LLM", match: ["gpt"], to: "/AI" },
  { id: "RAG", note: true, domain: "ai", name: "RAG", match: ["rag"], to: "/AI" },
  { id: "MCP", domain: "ai", name: "MCP", match: [], certs: [0, 1], to: "/AI" },
  { id: "LangChain", note: true, domain: "ai", name: "LangChain", match: [], certs: [2], to: "/AI" },
  { id: "n8n", domain: "ai", name: "n8n", match: ["n8n"], to: "/AI" },
  { id: "Qdrant", domain: "ai", name: "Qdrant", match: ["qdrant"], to: "/AI" },
  { id: "Ollama", domain: "ai", name: "Ollama", note: true, also: ["seo-autopilot"], match: [], to: "/AI" },
  { id: "Streamlit", note: true, domain: "ai", name: "Streamlit", match: [], certs: [2], to: "/AI" },
  // Données & outils
  { id: "Python", note: true, domain: "tools", label: "Home.Python", match: ["fastapi"], to: "/AI" },
  { id: "MySQL", domain: "tools", label: "Home.MySQL", match: ["mysql"], info: "Home.MySQLDescription" },
  { id: "Git", domain: "tools", label: "Home.Git", all: true, match: [], info: "Home.GitDescription" },
  { id: "DevOps", note: true, domain: "tools", label: "Home.DevOps", match: [], info: "Home.DevOpsDescription" },
  // Jeu vidéo
  { id: "Unity", domain: "game", label: "Home.Unity", match: ["unity"], to: "/Unity" },
  { id: "CSharp", domain: "game", label: "Home.C#", match: ["c#"], to: "/Unity" },
  { id: "Cpp", domain: "game", label: "Home.C++", match: ["c++"], to: "/Unreal" },
  { id: "C", note: true, domain: "game", label: "Home.C", match: [] },
  { id: "LUA", note: true, domain: "game", label: "Home.LUA", match: [] },
];

// Projets d'une compétence : tous les projets dont les technologies contiennent un de ses fragments.
// (« Unity » est aussi dans les projets de game jam ; « C# » est cherché tel quel, jamais dans « C++ ».)
export function projectsFor(skill, works) {
  if (skill.all) return works;
  if (!skill.match.length && !skill.also) return [];
  return works.filter((work) => {
    if (skill.also && skill.also.includes(work.slug)) return true;
    const tags = String(work.tags || "").toLowerCase();
    return skill.match.some((m) => tags.split("·").some((tag) => tag.trim().startsWith(m)));
  });
}
