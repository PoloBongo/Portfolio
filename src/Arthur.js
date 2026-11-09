import React, { Suspense, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./Component/Navbar.js";
import FocusLoop from "./Component/FocusLoop.js";
import CertificateCarousel from "./Component/CertificateCarousel";
import Carte from "./Component/Carte";
import { useScrollTo } from "./Effects/SmoothScroll";
import { onReady } from "./Effects/motion";
// Styles de l'accueil : projets, certificats, bandeau « site pro » (ils étaient importés par l'ancien hero)
import "./css/Landing.css";
import WorkIndex from "./Component/WorkIndex";
import Featured from "./Component/Featured";
import Skills from "./Component/Skills";
import Footer from "./Component/Footer";
import ProBanner from "./Component/ProBanner";

import SEO from "./Component/Layout.js";

// Traduction
import { Loader } from "./Component/Loader.js";
import { withTranslation } from "react-i18next";

// Speed Page
import { SpeedInsights } from "@vercel/speed-insights/react";

// Une seule arrivée sur l'accueil par chargement de page est concernée par l'ancre de l'URL
let hashHandled = false;

const HomeT = () => {
  const { lang = "fr" } = useParams();
  // Chargement direct d'une ancre (/fr#skills) : descend jusqu'à la section une fois la page révélée. Seulement à la première
  // arrivée sur l'accueil : au retour (précédent du navigateur), c'est la position où l'on était qui compte, pas l'ancre.
  const scrollTo = useScrollTo();
  useEffect(() => {
    if (hashHandled) return undefined;
    hashHandled = true;
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return undefined;
    return onReady(() => {
      const el = document.getElementById(id);
      if (el) scrollTo(el, { duration: 1.8 });
    });
  }, [scrollTo]);

  return (
    <div className="landing">
      <SpeedInsights />
      <SEO
        lang={lang}
        title="Portfolio - Arthur BRU | Développeur Web &amp; IA"
        description="Portfolio d'Arthur BRU, développeur Web &amp; IA : applications React / Next.js, pipelines RAG, agents et automatisations n8n. Certifié en IA (MCP, LangChain, Streamlit)."
        ogDescription="Portfolio d'Arthur BRU, développeur Web &amp; IA. Certifié Educative en IA : MCP Fundamentals, LangChain, Streamlit. Découvrez mes projets web, IA &amp; automatisation, ainsi que mes projets Unity et Unreal Engine."
        structuredData={[
          `{
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": "Portfolio - Arthur BRU | Développeur Web & IA",
              "url": "https://www.arthur-portfolio.dev/",
              "description": "Portfolio d'Arthur BRU, développeur Web & IA : applications React / Next.js, pipelines RAG, agents et automatisations n8n. Certifié en IA (MCP, LangChain, Streamlit).",
              "author": { "@type": "Person", "name": "Arthur BRU" }
            }`,
          `{
              "@context": "https://schema.org",
              "@type": "ItemList",
              "name": "Certifications - Arthur BRU",
              "itemListElement": [
                {
                  "@type": "ListItem",
                  "position": 1,
                  "item": {
                    "@type": "EducationalOccupationalCredential",
                    "name": "MCP Fundamentals for Building AI Agents",
                    "credentialCategory": "certificate",
                    "recognizedBy": { "@type": "Organization", "name": "Educative" },
                    "dateCreated": "2026-01",
                    "url": "https://www.educative.io/verify-certificate/JZmo10C1MggP22nLGcyGPOGO9Y1yC3"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 2,
                  "item": {
                    "@type": "EducationalOccupationalCredential",
                    "name": "Mastering MCP: Building Advanced Agentic Applications",
                    "credentialCategory": "certificate",
                    "recognizedBy": { "@type": "Organization", "name": "Educative" },
                    "dateCreated": "2026-02",
                    "url": "https://www.educative.io/verify-certificate/KOnpGJIZ6KMQpp4L3cnvYGvG8XxncB"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 3,
                  "item": {
                    "@type": "EducationalOccupationalCredential",
                    "name": "Build AI Chatbots with Open-Source LLMs, LangChain, and Streamlit",
                    "credentialCategory": "certificate",
                    "recognizedBy": { "@type": "Organization", "name": "Educative" },
                    "dateCreated": "2026-02",
                    "url": "https://www.educative.io/verify-certificate/EKMzZJK04L2fgP1vB8nQ47uxwAQwQ2JMxTG"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 4,
                  "item": {
                    "@type": "EducationalOccupationalCredential",
                    "name": "Claude Code: Workflows and Tools",
                    "credentialCategory": "certificate",
                    "recognizedBy": { "@type": "Organization", "name": "Educative" },
                    "dateCreated": "2026-10",
                    "url": "https://www.educative.io/verify-certificate/X5CJGPVXL6"
                  }
                },
                {
                  "@type": "ListItem",
                  "position": 5,
                  "item": {
                    "@type": "EducationalOccupationalCredential",
                    "name": "Master Claude Certified Architect – Professional Exam (CCAR-P)",
                    "credentialCategory": "certificate",
                    "recognizedBy": { "@type": "Organization", "name": "Educative" },
                    "dateCreated": "2026-10",
                    "url": "https://www.educative.io/verify-certificate/3AKX8ESTA3"
                  }
                }
              ]
            }`,
        ]}
      />
      <FocusLoop>
        <ProBanner />
        <main id="main">
          {/* « La carte » : l'arrivée, le fil du parcours (l'ancienne section « À propos ») et les trois régions */}
          <Carte />
          <WorkIndex />
          <Featured />
          <Skills />
          <CertificateCarousel />
        </main>
        <Footer />
        <Navbar />
      </FocusLoop>
    </div>
  );
};

const TranslatedHome = withTranslation()(HomeT);

export default function Home() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
