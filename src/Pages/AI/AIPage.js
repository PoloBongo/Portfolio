import "../../css/Home.css";
import React, { Suspense } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../Component/Navbar.js";
import SEO from "../../Component/Layout.js";

import { Loader } from "../../Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";
import FocusLoop from "../../Component/FocusLoop.js";

const AIPageT = ({ t }) => {
  const { lang = "fr" } = useParams();
  return (
    <div className="Home-header overflowHidden fontsRegular">
      <SEO
        lang={lang}
        path="/AI"
        title={`${t("AIProjects.Title")} - Arthur BRU`}
        description="Projets IA d'Arthur BRU : Cerebro (RAG multimodal, FastAPI, Qdrant, Mistral-7B) et SEO Autopilot (n8n, Lighthouse, GPT, Ollama, AWS S3). AI Engineer."
        ogTitle="AI & Automation Projects - Arthur BRU"
        ogDescription="Projets IA : Cerebro (RAG multimodal, FastAPI, Qdrant) et SEO Autopilot (n8n, Lighthouse, GPT, Ollama, S3)."
        structuredData={`{
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
        }`}
      />
      <FocusLoop>
        <Navbar tabIndex={4} />
        <div className="traitSeparator" id="blur"></div>
        <div>
          <div className="contactMeFlex align-items-center fixBackBtnUnity">
            <h1 className="fontsBold underline titleUnityPage" id="blur">
              {t("AIProjects.Title")}
            </h1>
          </div>
          <div className="grid-gamejam2">
            <div className="marge-contact-play modernEnvelop" id="blur" style={{ position: "relative" }}>
              <span className="wip-badge" style={{ position: "absolute", top: "12px", right: "12px" }}>
                <span className="wip-badge-dot"></span>
                {t("AIProjects.InProgress")}
              </span>
              <div className="sizeIconCPlus flexIMG">
                <h3 className="Home width">Cerebro</h3>
              </div>
              <div className="flexIMG width">
                <iframe
                  src="https://www.youtube.com/embed/CEREBRO_VIDEO_ID"
                  title="Cerebro - RAG App Demo"
                  frameBorder="0"
                  width="560"
                  height="315"
                  allowFullScreen
                  className="iframeYoutube"
                ></iframe>
              </div>
              <div className="text-align-left padding-1vw font-size-large">
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("AIProjects.Cerebro.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.ToolsUsed")}
                  </span>
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("AIProjects.Cerebro.ToolsUsed"),
                  }}
                ></p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("AIProjects.Cerebro.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("AIProjects.Cerebro.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("AIProjects.Cerebro.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("AIProjects.Cerebro.Role")}
                </p>
              </div>
              <div className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("AIProjects.Cerebro.Description"),
                  }}
                ></p>
              </div>
            </div>
          </div>
          <div className="grid-gamejam">
            <div className="marge-contact-play modernEnvelop" id="blur">
              <div className="sizeIconCPlus flexIMG">
                <h3 className="Home width">SEO Autopilot</h3>
              </div>
              <div className="flexIMG width">
                <iframe
                  src="https://www.youtube.com/embed/7C2_lc6DfLU"
                  title="SEO Autopilot - Demo"
                  frameBorder="0"
                  width="560"
                  height="315"
                  allowFullScreen
                  className="iframeYoutube"
                ></iframe>
              </div>
              <div className="text-align-left padding-1vw font-size-large">
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("AIProjects.SEOAutopilot.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.ToolsUsed")}
                  </span>
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("AIProjects.SEOAutopilot.ToolsUsed"),
                  }}
                ></p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("AIProjects.SEOAutopilot.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("AIProjects.SEOAutopilot.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("AIProjects.SEOAutopilot.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("AIProjects.SEOAutopilot.Role")}
                </p>
              </div>
              <div className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("AIProjects.SEOAutopilot.Description"),
                  }}
                ></p>
              </div>
              <div className="btnDiscoverProject">
                <a
                  href="https://github.com/PoloBongo/n8n-seo-app"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={5}
                  style={{ display: "block", opacity: "1", overflow: "hidden", transition: "all 1s ease" }}
                >
                  <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                    n8n SEO App
                  </button>
                </a>
                <span className="marge-contact-play"></span>
                <a
                  href="https://github.com/PoloBongo/n8n-seo-docker"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={6}
                  style={{ display: "block", opacity: "1", overflow: "hidden", transition: "all 1s ease" }}
                >
                  <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                    Lighthouse Docker
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </FocusLoop>
    </div>
  );
};

const TranslatedAIPage = withTranslation()(AIPageT);

export default function AIPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedAIPage />
    </Suspense>
  );
}
