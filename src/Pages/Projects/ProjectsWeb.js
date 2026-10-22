import React, { Suspense } from "react";
import ProjectsPage from "../../Component/ProjectsPage.js";
import { WEB_PROJECTS } from "./projects";

// Traduction
import { Loader } from "../../Component/Loader.js";
import { withTranslation } from "react-i18next";

const ProjectsWebT = ({ t }) => (
  <ProjectsPage
    seo={{
      path: "/ProjectsWeb",
      title: `${t("WebProjects.Title")} - Arthur BRU`,
      description:
        "Projets web d'Arthur BRU : site associatif, CMS Next.js, dashboard météo Vue.js, page de paiement Stripe, e-commerce PHP. React, TypeScript, MySQL.",
      ogTitle: "Projets Web - Arthur BRU",
      ogDescription:
        "Projets web en React, Next.js, Vue.js, PHP : site associatif, CMS, page de paiement Stripe, dashboard météo.",
      structuredData: `{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage",
              "name": "Projets Web - Arthur BRU",
              "url": "https://www.arthur-portfolio.dev/ProjectsWeb",
              "description": "Projets web en React, Next.js, Vue.js, PHP : site associatif, CMS, page de paiement Stripe, dashboard météo.",
              "author": { "@type": "Person", "name": "Arthur BRU" }
            },
            { "@type": "WebSite", "name": "Au fil des images", "description": "Site web pour une association culturelle basée à Tours.", "author": { "@type": "Person", "name": "Arthur BRU" }, "url": "https://www.assoaufildesimages.com" },
            { "@type": "WebSite", "name": "Celtic La Riche Basket", "description": "Site web pour un club de basket.", "author": { "@type": "Person", "name": "Arthur BRU" }, "url": "https://www.celticlarichebasket.fr/" },
            { "@type": "SoftwareApplication", "name": "Meteo Dashboard", "description": "Dashboard météo développé avec Vue.js.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "WebApplication" },
            { "@type": "SoftwareApplication", "name": "Articles Manager Next.js", "description": "CMS de gestion d'articles développé avec Next.js.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "WebApplication" },
            { "@type": "SoftwareApplication", "name": "Page de paiement Stripe", "description": "Page de paiement intégrant Stripe.", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "WebApplication" },
            { "@type": "SoftwareApplication", "name": "Eko", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "WebApplication" },
            { "@type": "SoftwareApplication", "name": "B.A Immobilier", "author": { "@type": "Person", "name": "Arthur BRU" }, "applicationCategory": "WebApplication" },
            { "@type": "WebSite", "name": "Portfolio Arthur BRU", "description": "Portfolio personnel développé avec React.", "author": { "@type": "Person", "name": "Arthur BRU" }, "url": "https://www.arthur-portfolio.dev/" }
          ]
        }`,
    }}
    titleKey="DropdownProjects.ProjectWeb"
    subtitleKey="WebProjects.Title"
    projects={WEB_PROJECTS}
  />
);

const TranslatedHome = withTranslation()(ProjectsWebT);

export default function ProjectsWeb() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
