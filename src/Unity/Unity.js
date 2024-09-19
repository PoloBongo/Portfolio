import "../css/Home.css";
import React, { Suspense, useState, Fragment } from "react";
import Navbar from "../Component/Navbar.js";
import ProjectsVideosGames from "../Projects/ProjectsVideosGames.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

// Unity
import { Unity, useUnityContext } from "react-unity-webgl";

// image
import backgroundUnityRL from "../img/backgroundUnityRL.webp";
import backgroundUnityShadowScholar from "../img/logoShadowScholar2.webp";

// Traduction
import { Loader } from "../Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";

const UnityT = ({ t }) => {
  function handleClickEnterFullscreen() {
    requestFullscreen(true);
  }

  const { unityProvider, loadingProgression, isLoaded, requestFullscreen } =
    useUnityContext({
      loaderUrl: "../BuildUnityRL/Build/public.loader.js",
      dataUrl: "../BuildUnityRL/Build/public.data",
      frameworkUrl: "../BuildUnityRL/Build/public.framework.js",
      codeUrl: "../BuildUnityRL/Build/public.wasm",
    });

  // Unity WebGL
  const [showUnityPlayBool, setSUnityPlayBool] = useState(true);
  const [showChocolatoBool, setShowChocolatoBool] = useState(false);

  const handleNavbarBtnClickPlay = () => {
    setSUnityPlayBool(!showUnityPlayBool);
    if (!showChocolatoBool) {
      setShowChocolatoBool(showChocolatoBool);
    }
  };

  const [showProjectsVideoGame, setShowProjectsVideoGame] = useState(false);

  const handleBackBtnClickUnityPage = () => {
    localStorage.setItem("ActiveBtnBackUnityPage", "false");
    setShowProjectsVideoGame(!showProjectsVideoGame);
  };

  return (
    <>
      {!showProjectsVideoGame ? (
        <div className="Home-header overflowHidden">
          <Navbar />
          <div className="traitSeparator" id="blur"></div>
          <div>
            <div className="contactMeFlex align-items-center">
              {localStorage.getItem("ActiveBtnBackUnityPage") === "true" && (
                <div className="backbtnUnityPage">
                  <button
                    className="btnStyleDiscoverProject fontsBold"
                    onClick={handleBackBtnClickUnityPage}
                  >
                    Back
                  </button>
                </div>
              )}

              <h3 className="fontsBold underline titleUnityPage" id="blur">
                {t("Unity.Title")}
              </h3>
            </div>
            <div className="grid-gamejam">
              <div className="marge-contact-play modernEnvelop" id="blur">
                <div className="sizeIconCPlus flexIMG">
                  <h3 className="Home width">Unity RL</h3>
                  {isLoaded && !showUnityPlayBool && (
                    <div className="width flex-end">
                      <FontAwesomeIcon
                        icon={faCircle}
                        beatFade
                        style={{ color: "#63E6BE" }}
                        className="removeMargin"
                      />
                      <h4 className="Home">
                        {t("GameJam.Chocolato.GameInProgress")}
                      </h4>
                    </div>
                  )}
                </div>

                <div className="flexIMG width">
                  <img
                    style={{
                      display: showUnityPlayBool ? "block" : "none",
                      opacity: showUnityPlayBool ? "1" : "0",
                      overflow: "hidden",
                      transition: "all 1s ease",
                    }}
                    src={backgroundUnityRL}
                    alt="Unity RL Game"
                    className="sizeProjectIMG imgGameJam"
                  ></img>
                </div>
                <Fragment>
                  {!showUnityPlayBool && (
                    <>
                      {loadingProgression < 1 && (
                        <p>
                          {t("GameJam.Chocolato.LoadingGame")}{" "}
                          {Math.round(loadingProgression * 100)}%
                        </p>
                      )}
                      <Unity unityProvider={unityProvider} className="width" />
                    </>
                  )}
                </Fragment>
                <p className="text-align-left padding-1vw font-size-large">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t("VideoGamesProjects.UnityRL"),
                    }}
                  ></p>
                  <strong className="underline">
                    {t("GameJam.Chocolato.technologies")}
                  </strong>
                </p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/MtPoison/UnityRL"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: showUnityPlayBool ? "block" : "none",
                      opacity: showUnityPlayBool ? "1" : "0",
                      overflow: "hidden",
                      transition: "all 1s ease",
                    }}
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                  <button
                    style={{
                      display: showUnityPlayBool ? "none" : "block",
                      opacity: showUnityPlayBool ? "0" : "1",
                      overflow: "hidden",
                      transition: "all 1s ease",
                    }}
                    onClick={handleClickEnterFullscreen}
                    className="btnStyleDiscoverProject fontsBold"
                  >
                    {t("VideoGamesProjects.fullScreenGame")}
                  </button>
                  <button
                    onClick={handleNavbarBtnClickPlay}
                    className="btnStyleDiscoverProject fontsBold marge-contact-play z-index"
                  >
                    {showUnityPlayBool
                      ? t("VideoGamesProjects.playProjects")
                      : t("VideoGamesProjects.stopProjects")}
                  </button>
                </div>
              </div>
              <div className="marge-contact-play modernEnvelop" id="blur">
                <div className="sizeIconCPlus flexIMG">
                  <h3 className="Home width">Shadow Scholar : La fac ultime</h3>
                </div>
                <div className="flexIMG width">
                  <img
                    src={backgroundUnityShadowScholar}
                    alt="Unity Shadow Scholar Logo"
                    className="sizeProjectIMG2 imgGameJam"
                  ></img>
                </div>
                <p className="text-align-left padding-1vw font-size-large">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t("Unity.ShadowScholar.Description"),
                    }}
                  ></p>
                  <strong className="underline">
                    {t("Unity.ShadowScholar.technologies")}
                  </strong>
                </p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/ShadowScholar"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: showUnityPlayBool ? "block" : "none",
                      opacity: showUnityPlayBool ? "1" : "0",
                      overflow: "hidden",
                      transition: "all 1s ease",
                    }}
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                  <a
                    href="https://arthur-bru.itch.io/shadow-scholar-la-fac-ultime"
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: showUnityPlayBool ? "block" : "none",
                      opacity: showUnityPlayBool ? "1" : "0",
                      overflow: "hidden",
                      transition: "all 1s ease",
                    }}
                  >
                    <button className="btnStyleDiscoverProject fontsBold marge-contact-play z-index">
                      {t("VideoGamesProjects.playProjects")}
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <ProjectsVideosGames />
      )}
    </>
  );
};

const TranslatedHome = withTranslation()(UnityT);

export default function UnityPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
