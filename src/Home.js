import "./css/Home.css";
import React, { Suspense, useEffect, useState, useRef } from "react";
import ScreenSize from "./Component/ScreenSize.js";
import Navbar from "./Component/Navbar.js";
import TypingAnimation from "./Component/TextTyping.js";
import PopupMySql from "./Component/PopupLanguage.js";
import Load from "./Component/Load.js";
import Fade from "./Component/Fade.js";

// Tout les imports d'icon / logo / images
import imgProgrammer from "./img/programmer.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLinkedin, faSquareGithub } from "@fortawesome/free-brands-svg-icons";

// Traduction
import { Loader } from "./Component/ComponentTraduction";
import { withTranslation } from "react-i18next";

// Speed Page
import { SpeedInsights } from "@vercel/speed-insights/next";

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
    <div className="Home">
      <SpeedInsights />
      {loading && sessionStorage.getItem("AntiPikachu") === null ? (
        <Load />
      ) : (
        <header className="Home-header">
          {fade ? (
            <Fade />
          ) : (
            <>
              <div className="takeSize">
                <Navbar />
                <div className="aboutMe">
                  <div className="aboutMeRightPart">
                    <div className="imagePlacement">
                      <img
                        className="imageSize"
                        src={imgProgrammer}
                        alt="Programmation"
                      ></img>
                    </div>
                  </div>
                  <div className="aboutMeLeftPart">
                    <div className="aboutMeText">
                      <h3 className="removeMargin typingAnimation">
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
                        >
                          <FontAwesomeIcon
                            icon={faSquareGithub}
                            color="#bc63ff"
                            size="xl"
                          />
                        </a>
                      </div>
                      <div className="btnDiscover">
                        <a href="#aboutme&skills">
                          <button className="btnStyleDiscover fontsRegular">
                            {t("Home.discover")}
                          </button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="aboutme&skills" className="aboutMePartDescription">
                <div className="aboutMeTitle">
                  <h3 className="fontsRegular">{t("Home.title1")}</h3>
                </div>
                <p className="paragrapheAboutMe fontsLight">
                  {t("Home.aboutMe")}
                </p>
                <div className="aboutMeTitle">
                  <h3 className="fontsRegular">{t("Home.title2")}</h3>
                </div>
                <PopupMySql />
              </div>
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
