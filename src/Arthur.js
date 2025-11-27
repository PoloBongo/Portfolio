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
import { Helmet, HelmetProvider } from "react-helmet-async";

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
    }, 2950);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => {
        setFade(false);
      }, 1500);
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
    <HelmetProvider>
      <div className="Home">
        <SpeedInsights />
        <Helmet>
          <title>Arthur Portfolio G.Tech</title>
          <meta
            name="description"
            content="Présentation de Arthur en détail avec mes compétences, skills et passions. Gaming Campus, G.Tech"
          />
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
                      <div className="aboutMe">
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
                          ></img>
                        </div>
                        <div className="aboutMeLeftPart">
                          <div className="aboutMeText">
                            <h3 className="removeMargin typingAnimation xx-large">
                              <TypingAnimation />
                            </h3>
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
                                  className="iconLinkedin"
                                  size="xl"
                                />
                              </a>
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
                      </div>
                    </div>

                    <div id="aboutme&skills" className="aboutMePartDescription">
                      <div className="aboutMeTitle">
                        <h3 className="fontsRegular">{t("Home.title2")}</h3>
                      </div>
                      <PopupMySql tabIndex={3} />
                      <h1 className="pDescription centerLoad inherit">
                        © Arthur BRU
                      </h1>
                    </div>
                  </FocusLoop>
                </ParralaxEffect>
              </>
            )}
          </header>
        )}
      </div>
    </HelmetProvider>
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
