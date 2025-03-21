import "../../css/Home.css";
import React, { Suspense } from "react";
import Navbar from "../../Component/Navbar.js";

// image
import backgroundProjectCustomEngine from "../../img/backgroundCustomEngine.webp";
import backgroundCPPBibliotheque from "../../img/backgroundCPPBibliotheque.webp";
import backgroundProjectLUA from "../../img/backgroundLUA.webp";

// Traduction
import { Loader } from "../../Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";

const JVPageT = ({ t }) => {
  return (
    <div className="Home-header overflowHidden fontsRegular">
      <Navbar />
      <div className="traitSeparator" id="blur"></div>
      <div>
        <div className="contactMeFlex align-items-center fixBackBtnUnity">
          <h3 className="fontsBold underline titleUnityPage" id="blur">
            {t("VideoGamesProjects.Title")}
          </h3>
        </div>
        <div className="grid-gamejam">
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Angine</h3>
            </div>
            <div className="flexIMG width">
              <img
                src={backgroundProjectCustomEngine}
                alt="Custom Engine"
                className="sizeProjectIMG2"
              />
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("VideoGamesProjects.CustomEngine"),
                }}
              ></p>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/custom-engine-cpp"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  opacity: "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Helluva Revenge</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/xkXIosIVZRE"
                title="youtubeVideoPresentation"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("VideoGamesProjects.helluvaRevenge"),
                }}
              ></p>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/DemonXlegenD/Helluva-Revenge"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  opacity: "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Tower Defense</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/33BohK7tIfQ"
                title="youtubeVideoPresentation"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("VideoGamesProjects.towerDefense"),
                }}
              ></p>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/CPP_Tower_Defense"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  opacity: "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">C++ Bibliothèque</h3>
            </div>
            <div className="flexIMG width">
              <img
                src={backgroundCPPBibliotheque}
                loading="lazy"
                alt="Bibliothèque Cpp"
                className="sizeProjectIMG"
              ></img>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("VideoGamesProjects.bibliotheque"),
                }}
              ></p>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/CPP_Bibliotheque/"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  opacity: "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Tour par tour en console</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/QB-EAMeCPpQ"
                title="youtubeVideoPresentation"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("VideoGamesProjects.CSharpConsole"),
                }}
              ></p>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/Projet9---CSharp"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  opacity: "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Shoot-Em-Up</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/r-x6qlMXgxo"
                title="youtubeVideoPresentation"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("VideoGamesProjects.shootEmUp"),
                }}
              ></p>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/Shoot-Em-Up"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  opacity: "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Projets LUA</h3>
            </div>
            <div className="flexIMG width">
              <img
                src={backgroundProjectLUA}
                loading="lazy"
                alt="Shoot-Em-Up Thème Futuriste"
                className="sizeProjectIMG"
              ></img>
            </div>
            <p className="text-align-left padding-1vw font-size-large pDescription fontsLight">
              {t("VideoGamesProjects.luaPart1")}
              <a
                href="https://www.youtube.com/@Polo_Leaks"
                className="link-navbar fontsRegular underline bold"
                target="_blank"
                rel="noreferrer"
              >
                Polo Leaks
              </a>
              {t("VideoGamesProjects.luaPart2")}
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/ExampleScriptsLua"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  opacity: "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TranslatedHome = withTranslation()(JVPageT);

export default function JVPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
