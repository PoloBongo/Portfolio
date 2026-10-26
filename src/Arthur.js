import React, { Suspense } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./Component/Navbar.js";
import FocusLoop from "./Component/FocusLoop.js";
import CertificateCarousel from "./Component/CertificateCarousel";
import Hero from "./Component/Hero";
import Intro from "./Component/Intro";
import WorkIndex from "./Component/WorkIndex";
import Skills from "./Component/Skills";
import Footer from "./Component/Footer";
import ProBanner from "./Component/ProBanner";
import Marquee from "./Effects/Marquee";

import SEO from "./Component/Layout.js";

// Traduction
import { Loader } from "./Component/Loader.js";
import { withTranslation } from "react-i18next";

// Speed Page
import { SpeedInsights } from "@vercel/speed-insights/react";

const MARQUEE_ITEMS = ["React", "Next.js", "TypeScript", "Python", "LLM", "RAG", "MCP", "n8n", "Vue.js", "Docker"];

const HomeT = () => {
  const { lang = "fr" } = useParams();

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
                }
              ]
            }`,
        ]}
      />
      <FocusLoop>
        <ProBanner />
        <main id="main">
          <Hero />
          <Marquee items={MARQUEE_ITEMS} />
          <Intro />
          <WorkIndex />
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
