import "../../css/Home.css";
import React, { Suspense, useState, Fragment, useEffect } from "react";
import Navbar from "../../Component/Navbar.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

// Unity
import { Unity, useUnityContext } from "react-unity-webgl";

// image
import backgroundUnityRL from "../../img/backgroundUnityRL.webp";
import backgroundUIUXCook from "../../img/backgroundUIUXCook.webp";
import backgroundAngryBirds from "../../img/backgroundAngryBirds.webp";
import backgroundRATP from "../../img/backgroundRATP.webp";
import backgroundDepthsOfHue from "../../img/backgroundDepthsOfHue.webp";

// Traduction
import { Loader } from "../../Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";

import FocusLoop from "../../Component/FocusLoop.js";

const UnityT = ({ t }) => {
  function handleClickEnterFullscreen() {
    requestFullscreen(true);
  }

  const { unityProvider, loadingProgression, isLoaded, requestFullscreen } =
    useUnityContext({
      loaderUrl: "/BuildUnityRL/Build/public.loader.js",
      dataUrl: "/BuildUnityRL/Build/public.data",
      frameworkUrl: "/BuildUnityRL/Build/public.framework.js",
      codeUrl: "/BuildUnityRL/Build/public.wasm",
    });

  function handleClickEnterFullscreenUIUXCooking() {
    requestFullscreenUIUXCooking(true);
  }

  const {
    unityProvider: unityProviderUIUXCooking,
    loadingProgression: loadingProgressionUIUXCooking,
    isLoaded: isLoadedUIUXCooking,
    requestFullscreen: requestFullscreenUIUXCooking,
  } = useUnityContext({
    loaderUrl: "../BuildUnityUIUXCook/Build/BuildUnityUIUXCook.loader.js",
    dataUrl: "../BuildUnityUIUXCook/Build/BuildUnityUIUXCook.data",
    frameworkUrl: "../BuildUnityUIUXCook/Build/BuildUnityUIUXCook.framework.js",
    codeUrl: "../BuildUnityUIUXCook/Build/BuildUnityUIUXCook.wasm",
  });

  function handleClickEnterFullscreenAngryBirds() {
    requestFullscreenAngryBirds(true);
  }

  const {
    unityProvider: unityProviderAngryBirds,
    loadingProgression: loadingProgressionAngryBirds,
    isLoaded: isLoadedAngryBirds,
    requestFullscreen: requestFullscreenAngryBirds,
  } = useUnityContext({
    loaderUrl: "../BuildUnityAngryBirds/Build/BuildUnityAngryBirds.loader.js",
    dataUrl: "../BuildUnityAngryBirds/Build/BuildUnityAngryBirds.data",
    frameworkUrl:
      "../BuildUnityAngryBirds/Build/BuildUnityAngryBirds.framework.js",
    codeUrl: "../BuildUnityAngryBirds/Build/BuildUnityAngryBirds.wasm",
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

  // cooking game
  const [showUnityPlayUICookingBool, setSUnityPlayUICookingBool] =
    useState(true);
  const [showUICookingBool, setShowUICookingBool] = useState(false);

  const handleNavbarBtnClickPlayUICooking = () => {
    setSUnityPlayUICookingBool(!showUnityPlayUICookingBool);
    if (!showUICookingBool) {
      setShowUICookingBool(showUICookingBool);
    }
  };

  // angrybirds game
  const [showUnityPlayAngryBirdsBool, setSUnityPlayAngryBirdsBool] =
    useState(true);
  const [showAngryBirdsBool, setShowAngryBirdsBool] = useState(false);

  const handleNavbarBtnClickPlayAngryBirds = () => {
    setSUnityPlayAngryBirdsBool(!showUnityPlayAngryBirdsBool);
    if (!showAngryBirdsBool) {
      setShowAngryBirdsBool(showAngryBirdsBool);
    }
  };

  // DepthsOfHue game
  const [showUnityPlayDepthsOfHueBool, setSUnityPlayDepthsOfHueBool] =
    useState(true);
  const [showDepthsOfHueBool, setShowDepthsOfHueBool] = useState(false);

  const handleNavbarBtnClickPlayDepthsOfHue = () => {
    setSUnityPlayDepthsOfHueBool(!showUnityPlayDepthsOfHueBool);
    if (!showDepthsOfHueBool) {
      setShowDepthsOfHueBool(showDepthsOfHueBool);
    }
  };

  const [showProjectsVideoGame, setShowProjectsVideoGame] = useState(false);

  const handleBackBtnClickUnityPage = () => {
    localStorage.setItem("ActiveBtnBackUnityPage", "false");
    localStorage.setItem("ActiveBtnNavbarUnityPage", "false");
    setShowProjectsVideoGame(!showProjectsVideoGame);
  };

  useEffect(() => {
    localStorage.setItem("ActiveBtnNavbarUnityPage", "false");
  }, []);

  return (
    <div className="Home-header overflowHidden fontsRegular">
      <FocusLoop>
        <Navbar tabIndex={17} />
        <div className="traitSeparator" id="blur"></div>
        <div>
          <div className="contactMeFlex align-items-center fixBackBtnUnity">
            {localStorage.getItem("ActiveBtnBackUnityPage") === "true" && (
              <div className="backbtnUnityPage">
                <button
                  className="btnStyleDiscoverProject fontsBold responsive-text-btn"
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
          <div className="grid-gamejam2">
            <div className="marge-contact-play modernEnvelop" id="blur">
              <div className="sizeIconCPlus flexIMG">
                <h3 className="Home width">Depths Of Hue</h3>
              </div>
              <div className="flexIMG width">
                <img
                  style={{
                    display: showUnityPlayDepthsOfHueBool ? "block" : "none",
                    opacity: showUnityPlayDepthsOfHueBool ? "1" : "0",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                  src={backgroundDepthsOfHue}
                  alt="Depths Of Hue Game"
                  className="sizeProjectIMGDepthsOfHue"
                ></img>
              </div>
              {!showUnityPlayDepthsOfHueBool && (
                <>
                  <iframe
                    src="https://www.youtube.com/embed/dlC3tTf1Jlo"
                    title="youtubeVideoPresentation"
                    frameBorder="0"
                    width="560"
                    height="315"
                    allowFullScreen
                    className="iframeYoutube"
                  ></iframe>
                </>
              )}
              <div className="grid-gamejam">
                <p className="text-align-left padding-1vw font-size-large">
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Langage")}
                    </span>{" "}
                    {t("Unity.DepthsOfHue.Langage")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.ToolsUsed")}
                    </span>
                  </p>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t("Unity.DepthsOfHue.ToolsUsed"),
                    }}
                  ></p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Duration")}
                    </span>{" "}
                    {t("Unity.DepthsOfHue.Duration")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Completion")}
                    </span>{" "}
                    {t("Unity.DepthsOfHue.Completion")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.TeamSize")}
                    </span>{" "}
                    {t("Unity.DepthsOfHue.TeamSize")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Role")}
                    </span>{" "}
                    {t("Unity.DepthsOfHue.Role")}
                  </p>
                </p>
                <p className="text-align-left padding-1vw font-size-large">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t("Unity.DepthsOfHue.Description"),
                    }}
                  ></p>
                </p>
              </div>
              <div className="btnDiscoverProject">
                <button
                  onClick={handleNavbarBtnClickPlayDepthsOfHue}
                  tabIndex={1}
                  className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn"
                >
                  {showUnityPlayDepthsOfHueBool
                    ? t("VideoGamesProjects.playVideo")
                    : t("VideoGamesProjects.stopVideo")}
                </button>
                <a
                  href="https://github.com/GamingCampus-MillieBourgois-24-25/grand-projet-commun-depths-of-hue"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={2}
                >
                  <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                    {t("VideoGamesProjects.viewMoreCode")}
                  </button>
                </a>
                <a
                  href="https://arthur-bru.itch.io/depths-of-hue"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={3}
                >
                  <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                    {t("VideoGamesProjects.viewMoreGame")}
                  </button>
                </a>
              </div>
            </div>
          </div>
          <div className="grid-gamejam">
            <div className="marge-contact-play modernEnvelop" id="blur">
              <div className="sizeIconCPlus flexIMG">
                <h3 className="Home width">Shadow Scholar : La fac ultime</h3>
              </div>
              <div className="flexIMG width">
                <iframe
                  src="https://www.youtube.com/embed/IwMvlVfyvs8"
                  title="youtubeVideoPresentation"
                  frameBorder="0"
                  width="560"
                  height="315"
                  allowFullScreen
                  className="iframeYoutube"
                ></iframe>
              </div>
              <p className="text-align-left padding-1vw font-size-large">
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("Unity.ShadowScholar.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.ToolsUsed")}
                  </span>
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.ShadowScholar.ToolsUsed"),
                  }}
                ></p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("Unity.ShadowScholar.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("Unity.ShadowScholar.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("Unity.ShadowScholar.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("Unity.ShadowScholar.Role")}
                </p>
              </p>
              <p className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.ShadowScholar.Description"),
                  }}
                ></p>
              </p>
              <div className="btnDiscoverProject">
                <a
                  href="https://arthur-bru.itch.io/shadow-scholar-la-fac-ultime"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={4}
                  style={{
                    display: "block",
                    opacity: "1",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                >
                  <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                    {t("VideoGamesProjects.viewMoreGame")}
                  </button>
                </a>
              </div>
            </div>
            <div className="marge-contact-play modernEnvelop" id="blur">
              <div className="sizeIconCPlus flexIMG">
                <h3 className="Home width">{t("Unity.RATP.Title")}</h3>
                <div className="width flex-end">
                  <FontAwesomeIcon
                    icon={faCircle}
                    beatFade
                    style={{ color: "#63E6BE" }}
                    className="removeMargin"
                  />
                  <h4 className="Home">{t("Unity.RATP.InProgress")}</h4>
                </div>
              </div>

              <div className="flexIMG width">
                <img
                  src={backgroundRATP}
                  alt="RATP Game"
                  className="sizeProjectIMG imgGameJam"
                ></img>
              </div>
              <p className="text-align-left padding-1vw font-size-large">
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("Unity.RATP.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.ToolsUsed")}
                  </span>
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.RATP.ToolsUsed"),
                  }}
                ></p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("Unity.RATP.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("Unity.RATP.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("Unity.RATP.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("Unity.RATP.Role")}
                </p>
              </p>
              <p className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.RATP.Description"),
                  }}
                  tabIndex={5}
                ></p>
              </p>
            </div>
            <div className="marge-contact-play modernEnvelop" id="blur">
              <div className="sizeIconCPlus flexIMG">
                <h3 className="Home width">Angry Birds</h3>
                {isLoadedAngryBirds && !showUnityPlayAngryBirdsBool && (
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
                    display: showUnityPlayAngryBirdsBool ? "block" : "none",
                    opacity: showUnityPlayAngryBirdsBool ? "1" : "0",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                  src={backgroundAngryBirds}
                  alt="Angry Birds Game"
                  className="sizeProjectIMG imgGameJam"
                ></img>
              </div>
              <Fragment>
                {!showUnityPlayAngryBirdsBool && (
                  <>
                    {loadingProgressionAngryBirds < 1 && (
                      <p>
                        {t("GameJam.Chocolato.LoadingGame")}{" "}
                        {Math.round(loadingProgressionAngryBirds * 100)}%
                      </p>
                    )}
                    <Unity
                      unityProvider={unityProviderAngryBirds}
                      className="width"
                    />
                  </>
                )}
              </Fragment>
              <p className="text-align-left padding-1vw font-size-large">
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("Unity.AngryBirds.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.ToolsUsed")}
                  </span>
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.AngryBirds.ToolsUsed"),
                  }}
                ></p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("Unity.AngryBirds.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("Unity.AngryBirds.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("Unity.AngryBirds.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("Unity.AngryBirds.Role")}
                </p>
              </p>
              <p className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.AngryBirds.Description"),
                  }}
                ></p>
              </p>
              <div className="btnDiscoverProject">
                <button
                  onClick={handleNavbarBtnClickPlayAngryBirds}
                  tabIndex={6}
                  className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn"
                >
                  {showUnityPlayAngryBirdsBool
                    ? t("VideoGamesProjects.playProjects")
                    : t("VideoGamesProjects.stopProjects")}
                </button>
                <button
                  style={{
                    display: showUnityPlayAngryBirdsBool ? "none" : "block",
                    opacity: showUnityPlayAngryBirdsBool ? "0" : "1",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                  onClick={handleClickEnterFullscreenAngryBirds}
                  tabIndex={7}
                  className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn"
                >
                  {t("VideoGamesProjects.fullScreenGame")}
                </button>
                <a
                  href="https://github.com/PoloBongo/AngryBirds"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={8}
                  style={{
                    display: showUnityPlayAngryBirdsBool ? "block" : "none",
                    opacity: showUnityPlayAngryBirdsBool ? "1" : "0",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                >
                  <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                    {t("VideoGamesProjects.viewMoreCode")}
                  </button>
                </a>
              </div>
            </div>
            <div className="marge-contact-play modernEnvelop" id="blur">
              <div className="sizeIconCPlus flexIMG">
                <h3 className="Home width">UI UX Cooking Project</h3>
                {isLoadedUIUXCooking && !showUnityPlayUICookingBool && (
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
                    display: showUnityPlayUICookingBool ? "block" : "none",
                    opacity: showUnityPlayUICookingBool ? "1" : "0",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                  src={backgroundUIUXCook}
                  alt="UI UX Cooking Game"
                  className="sizeProjectIMG imgGameJam"
                ></img>
              </div>
              <Fragment>
                {!showUnityPlayUICookingBool && (
                  <>
                    {loadingProgressionUIUXCooking < 1 && (
                      <p>
                        {t("GameJam.Chocolato.LoadingGame")}{" "}
                        {Math.round(loadingProgressionUIUXCooking * 100)}%
                      </p>
                    )}
                    <Unity
                      unityProvider={unityProviderUIUXCooking}
                      className="width"
                    />
                  </>
                )}
              </Fragment>
              <p className="text-align-left padding-1vw font-size-large">
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("Unity.UIUXCooking.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.ToolsUsed")}
                  </span>
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.UIUXCooking.ToolsUsed"),
                  }}
                ></p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("Unity.UIUXCooking.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("Unity.UIUXCooking.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("Unity.UIUXCooking.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("Unity.UIUXCooking.Role")}
                </p>
              </p>
              <p className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.UIUXCooking.Description"),
                  }}
                ></p>
              </p>
              <div className="btnDiscoverProject">
                <button
                  onClick={handleNavbarBtnClickPlayUICooking}
                  tabIndex={9}
                  className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn"
                >
                  {showUnityPlayUICookingBool
                    ? t("VideoGamesProjects.playProjects")
                    : t("VideoGamesProjects.stopProjects")}
                </button>
                <button
                  style={{
                    display: showUnityPlayUICookingBool ? "none" : "block",
                    opacity: showUnityPlayUICookingBool ? "0" : "1",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                  onClick={handleClickEnterFullscreenUIUXCooking}
                  tabIndex={10}
                  className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn"
                >
                  {t("VideoGamesProjects.fullScreenGame")}
                </button>
                <a
                  href="https://github.com/PoloBongo/UICookProject"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={11}
                  style={{
                    display: showUnityPlayUICookingBool ? "block" : "none",
                    opacity: showUnityPlayUICookingBool ? "1" : "0",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                >
                  <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                    {t("VideoGamesProjects.viewMoreCode")}
                  </button>
                </a>
              </div>
            </div>
            <div className="marge-contact-play modernEnvelop" id="blur">
              <div className="sizeIconCPlus flexIMG">
                <h3 className="Home width">Navy Bongo</h3>
              </div>
              <div className="flexIMG width">
                <iframe
                  src="https://www.youtube.com/embed/YtT03rMnzBg"
                  title="youtubeVideoPresentationNavyBongo"
                  frameBorder="0"
                  width="560"
                  height="315"
                  allowFullScreen
                  className="iframeYoutube"
                ></iframe>
              </div>
              <p className="text-align-left padding-1vw font-size-large">
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("Unity.NavyBongo.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.ToolsUsed")}
                  </span>
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.NavyBongo.ToolsUsed"),
                  }}
                ></p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("Unity.NavyBongo.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("Unity.NavyBongo.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("Unity.NavyBongo.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("Unity.NavyBongo.Role")}
                </p>
              </p>
              <p className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.NavyBongo.Description"),
                  }}
                ></p>
              </p>
              <div className="btnDiscoverProject">
                <a
                  href="https://arthur-bru.itch.io/navy-bongo"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={12}
                  style={{
                    display: "block",
                    opacity: "1",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                >
                  <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                    {t("VideoGamesProjects.viewMoreGame")}
                  </button>
                </a>
                <a
                  href="https://github.com/PoloBongo/NavyBongo"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={13}
                  style={{
                    display: "block",
                    opacity: "1",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                >
                  <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                    {t("VideoGamesProjects.viewMoreCode")}
                  </button>
                </a>
              </div>
            </div>
            {/* flex-column-center */}
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
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("Unity.UnityRL.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.ToolsUsed")}
                  </span>
                </p>
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.UnityRL.ToolsUsed"),
                  }}
                ></p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("Unity.UnityRL.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("Unity.UnityRL.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("Unity.UnityRL.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("Unity.UnityRL.Role")}
                </p>
              </p>
              <p className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("Unity.UnityRL.Description"),
                  }}
                ></p>
              </p>
              <div className="btnDiscoverProject">
                <button
                  style={{
                    display: showUnityPlayBool ? "none" : "block",
                    opacity: showUnityPlayBool ? "0" : "1",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                  onClick={handleClickEnterFullscreen}
                  tabIndex={14}
                  className="btnStyleDiscoverProject fontsBold responsive-text-btn"
                >
                  {t("VideoGamesProjects.fullScreenGame")}
                </button>
                <button
                  onClick={handleNavbarBtnClickPlay}
                  tabIndex={15}
                  className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn"
                >
                  {showUnityPlayBool
                    ? t("VideoGamesProjects.playProjects")
                    : t("VideoGamesProjects.stopProjects")}
                </button>
                <a
                  href="https://p0izon.itch.io/fou2foot"
                  target="_blank"
                  rel="noreferrer"
                  tabIndex={16}
                  style={{
                    display: showUnityPlayBool ? "block" : "none",
                    opacity: showUnityPlayBool ? "1" : "0",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                >
                  <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                    {t("VideoGamesProjects.viewMoreGame")}
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

const TranslatedHome = withTranslation()(UnityT);

export default function UnityPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
