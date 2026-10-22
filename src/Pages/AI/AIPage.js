import React, { Suspense } from "react";
import ProjectsPage from "../../Component/ProjectsPage.js";
import { AI_PROJECTS } from "./projects";

// Traduction
import { Loader } from "../../Component/Loader.js";
import { withTranslation } from "react-i18next";

const AIPageT = ({ t }) => (
  <ProjectsPage
    seo={{
      path: "/AI",
      title: `${t("AIProjects.Title")} - Arthur BRU`,
      description:
        "Projets IA d'Arthur BRU : Cerebro (RAG multimodal, FastAPI, Qdrant, Mistral-7B) et SEO Autopilot (n8n, Lighthouse, GPT, Ollama, AWS S3). AI Engineer.",
      ogTitle: "AI & Automation Projects - Arthur BRU",
      ogDescription:
        "Projets IA : Cerebro (RAG multimodal, FastAPI, Qdrant) et SEO Autopilot (n8n, Lighthouse, GPT, Ollama, S3).",
      structuredData: `{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "name": "AI & Automation Projects - Arthur BRU",
              "url": "https://www.arthur-portfolio.dev/AI",
              "description": "Projets IA : Cerebro (RAG multimodal, FastAPI, Qdrant) et SEO Autopilot (n8n, Lighthouse, GPT, Ollama, S3).",
              "author": { "@type": "Person", "name": "Arthur BRU" }
            },
            { "@type": "SoftwareApplication", "name": "Cerebro", "description": "Application RAG multimodal avec Laravel 12, FastAPI et Qdrant.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "WebApplication" },
            { "@type": "SoftwareApplication", "name": "SEO Autopilot", "description": "Automatisation de rapports SEO avec n8n, Lighthouse, GPT et Ollama.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "WebApplication" }
          ]
        }`,
    }}
    titleKey="ClassicNavBar.AI"
    subtitleKey="AIProjects.Title"
    projects={AI_PROJECTS}
  />
);

const TranslatedAIPage = withTranslation()(AIPageT);

export default function AIPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedAIPage />
    </Suspense>
  );
}
