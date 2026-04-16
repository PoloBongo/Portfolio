import "./css/Home.css";
import React, { Suspense, useEffect, useState, useRef, lazy } from "react";
import ScreenSize from "./Component/ScreenSize.js";
import Navbar from "./Component/Navbar.js";
import TypingAnimation from "./Component/TextTyping.js";
import PopupMySql from "./Component/PopupLanguage.js";
import Load from "./Component/Load.js";
import Fade from "./Component/Fade.js";
import FocusLoop from "./Component/FocusLoop.js";

import imgProgrammer from "./img/programmer.svg";

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

const ParralaxEffect = lazy(() => import("./Effects/ParallaxEffect"));

const HomeT = ({ t }) => {
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
      const cleanUp = ScreenSize();
      sessionStorage.setItem("AntiPikachu", "true");
      return () => {
        cleanUp();
      };
    }
  }, [fade]);

  return (
    <div className="Home">
        <SpeedInsights />
        <Helmet>
          <title>Portfolio - Arthur BRU | Développeur Web &amp; Jeu Vidéo</title>
          <meta
            name="description"
            content="Portfolio d'Arthur BRU, développeur Web &amp; Jeu Vidéo. Bachelor en développement informatique option jeu vidéo. Compétences en Unity, Unreal Engine, C++, React."
          />
          <link rel="alternate" hreflang="fr" href="https://www.arthur-portfolio.dev/" />
          <link rel="alternate" hreflang="en" href="https://www.arthur-portfolio.dev/" />
          <link rel="alternate" hreflang="es" href="https://www.arthur-portfolio.dev/" />
          <link rel="alternate" hreflang="x-default" href="https://www.arthur-portfolio.dev/" />
          <meta property="og:title" content="Portfolio - Arthur BRU | Développeur Web &amp; Jeu Vidéo" />
          <meta property="og:description" content="Portfolio d'Arthur BRU, développeur Web &amp; Jeu Vidéo. Découvrez mes projets Unity, Unreal Engine, Game Jam et web." />
          <meta property="og:url" content="https://www.arthur-portfolio.dev/" />
          <meta property="og:image" content="https://www.arthur-portfolio.dev/arthur.webp" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="Portfolio - Arthur BRU | Développeur Web &amp; Jeu Vidéo" />
          <meta name="twitter:description" content="Portfolio d'Arthur BRU, développeur Web &amp; Jeu Vidéo. Découvrez mes projets Unity, Unreal Engine, Game Jam et web." />
          <meta name="twitter:image" content="https://www.arthur-portfolio.dev/arthur.webp" />
          <script type="application/ld+json">{`{
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Portfolio - Arthur BRU | Développeur Web & Jeu Vidéo",
            "url": "https://www.arthur-portfolio.dev/",
            "description": "Portfolio d'Arthur BRU, développeur Web & Jeu Vidéo. Compétences en Unity, Unreal Engine, C++, React.",
            "author": { "@type": "Person", "name": "Arthur BRU" }
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
                      <Navbar tabIndex={21} />
                      <main className="aboutMe">
                        <div className="aboutMeRightPart">
                          {/* <iframe
                          src="https://www.youtube.com/embed/IwMvlVfyvs8"
                          title="youtubeVideoPresentation"
                          frameBorder="0"
                          width="560"
                          height="315"
                          allowFullScreen
                          className="iframeYoutube"
                        ></iframe> */}
                          <img
                            src={imgProgrammer}
                            alt="imgProg"
                            className="sizeProjectIMG imgProg"
                            fetchpriority="high"
                          ></img>
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
                      <PopupMySql tabIndex={3} />
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
