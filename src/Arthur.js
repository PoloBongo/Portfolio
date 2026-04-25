import "./css/Home.css";
import React, { Suspense, useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import Navbar from "./Component/Navbar.js";
import TypingAnimation from "./Component/TextTyping.js";
import PopupMySql from "./Component/PopupLanguage.js";
import Load from "./Component/Load.js";
import Fade from "./Component/Fade.js";
import FocusLoop from "./Component/FocusLoop.js";
import CertificateCarousel from "./Component/CertificateCarousel";
import ParralaxEffect from "./Effects/ParallaxEffect";

// Balise React
import { Helmet } from "react-helmet-async";

// Tout les imports d'icon / logo / images
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faSquareGithub } from "@fortawesome/free-brands-svg-icons";

// Traduction
import { Loader } from "./Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";

// Speed Page
import { SpeedInsights } from "@vercel/speed-insights/react";

const HomeT = ({ t }) => {
  const { lang = "fr" } = useParams();
  const [loading, setLoading] = useState(true);
  const [fade, setFade] = useState(true);

  const alreadyLoad = useRef(sessionStorage.getItem("alreadyLoad"));

  useEffect(() => {
    const currentAlreadyLoad = alreadyLoad.current;
    if (currentAlreadyLoad === null) {
      setLoading(true);
      setFade(true);
      sessionStorage.setItem("alreadyLoad", "true");
    } else {
      setLoading(false);
      setFade(false);
    }
  }, [alreadyLoad]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        setFade(false);
      }, 800);
    }
  }, [loading]);

  useEffect(() => {
    if (!fade) {
      sessionStorage.setItem("AntiPikachu", "true");
    }
  }, [fade]);

  return (
    <div className="Home">
        <SpeedInsights />
        <Helmet>
          <title>Portfolio - Arthur BRU | Développeur Web &amp; Jeu Vidéo</title>
          <meta
            name="description"
            content="Portfolio d'Arthur BRU, développeur Web &amp; Jeu Vidéo. Certifié en IA (MCP, LangChain, Streamlit). Compétences en Unity, Unreal Engine, C++, React."
          />
          <link rel="canonical" href={`https://www.arthur-portfolio.dev/${lang}`} />
          <link rel="alternate" hreflang="fr" href="https://www.arthur-portfolio.dev/fr" />
          <link rel="alternate" hreflang="en" href="https://www.arthur-portfolio.dev/en" />
          <link rel="alternate" hreflang="es" href="https://www.arthur-portfolio.dev/es" />
          <link rel="alternate" hreflang="x-default" href="https://www.arthur-portfolio.dev/fr" />
          <meta property="og:title" content="Portfolio - Arthur BRU | Développeur Web &amp; Jeu Vidéo" />
          <meta property="og:description" content="Portfolio d'Arthur BRU, développeur Web &amp; Jeu Vidéo. Certifié Educative en IA : MCP Fundamentals, LangChain, Streamlit. Découvrez mes projets Unity, Unreal Engine, Game Jam et web." />
          <meta property="og:url" content={`https://www.arthur-portfolio.dev/${lang}`} />
          <meta property="og:image" content="https://www.arthur-portfolio.dev/arthur.webp" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="Portfolio - Arthur BRU | Développeur Web &amp; Jeu Vidéo" />
          <meta name="twitter:description" content="Portfolio d'Arthur BRU, développeur Web &amp; Jeu Vidéo. Certifié Educative en IA : MCP Fundamentals, LangChain, Streamlit. Découvrez mes projets Unity, Unreal Engine, Game Jam et web." />
          <meta name="twitter:image" content="https://www.arthur-portfolio.dev/arthur.webp" />
          <script type="application/ld+json">{`{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Portfolio - Arthur BRU | Développeur Web & Jeu Vidéo",
            "url": "https://www.arthur-portfolio.dev/",
            "description": "Portfolio d'Arthur BRU, développeur Web & Jeu Vidéo. Certifié en IA (MCP, LangChain, Streamlit). Compétences en Unity, Unreal Engine, C++, React.",
            "author": { "@type": "Person", "name": "Arthur BRU" }
          }`}</script>
          <script type="application/ld+json">{`{
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
          }`}</script>
        </Helmet>
        {loading && sessionStorage.getItem("AntiPikachu") === null ? (
          <Load />
        ) : (
          <header className="Home-header overflow-x-Hidden">
            {fade ? (
              <Fade />
            ) : (
              <>
                <ParralaxEffect>
                  <FocusLoop>
                    <div className="takeSize">
                      <Navbar tabIndex={27} />
                      <main className="aboutMe">
                        <div className="aboutMeRightPart">
                          <CertificateCarousel />
                        </div>
                        <div className="aboutMeLeftPart">
                          <div className="aboutMeText">
                            <h1 className="removeMargin typingAnimation xx-large">
                              <TypingAnimation />
                            </h1>
                          </div>
                          <div className="presentationFlex">
                            <p className="presentationText fontsLight">
                              {t("Home.info")}
                            </p>
                            <div className="RedirectionIcon">
                              <a
                                href="https://www.linkedin.com/in/arthur-bru-b71327252/"
                                target="_blank"
                                rel="noreferrer"
                                tabIndex={1}
                                aria-label="En savoir plus sur mon Linkedin"
                              >
                                <FontAwesomeIcon
                                  icon={faLinkedin}
                                  color="#bc63ff"
                                  size="xl"
                                />
                              </a>
                              <span className="iconLinkedin"></span>
                              <a
                                href="https://github.com/PoloBongo"
                                target="_blank"
                                rel="noreferrer"
                                tabIndex={2}
                                aria-label="En savoir plus sur mon Github"
                              >
                                <FontAwesomeIcon
                                  icon={faSquareGithub}
                                  color="#bc63ff"
                                  size="xl"
                                />
                              </a>
                            </div>
                            <div className="btnDiscover">
                              <a
                                href="#aboutme&skills"
                                className="btnStyleDiscover fontsRegular"
                                tabIndex={3}
                              >
                                {t("Home.discover")}
                              </a>
                            </div>
                          </div>
                        </div>
                      </main>
                    </div>

                    <section id="aboutme&skills" className="aboutMePartDescription">
                      <div className="aboutMeTitle">
                        <h2 className="fontsRegular">{t("Home.title2")}</h2>
                      </div>
                      <PopupMySql tabIndex={9} />
                      <p className="pDescription centerLoad inherit">
                        © Arthur BRU
                      </p>
                    </section>
                  </FocusLoop>
                </ParralaxEffect>
              </>
            )}
          </header>
        )}
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
