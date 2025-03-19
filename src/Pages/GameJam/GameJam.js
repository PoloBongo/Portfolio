import "../../css/Home.css";
import React, { Suspense, useState, useRef, useEffect, Fragment } from "react";
import Navbar from "../../Component/Navbar.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

// Unity
import { Unity, useUnityContext } from "react-unity-webgl";

// image
import backgroundChocoBlast from "../../img/backgroundChocoBlast.webp";

// Traduction
import { Loader } from "../../Component/ComponentTraduction.js";
import { withTranslation, useTranslation } from "react-i18next";

const GameJamT = ({ t }) => {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState("");

  useEffect(() => {
    setLanguage(i18n.language);
  }, [i18n.language]);

  const videoUrls = {
    fr: "https://youtube.com/embed/zU-sBTZ5yp4",
    en: "https://youtube.com/embed/qKD15vTFgAM",
    es: "https://youtube.com/embed/qKD15vTFgAM",
  };

  function handleClickEnterFullscreen() {
    requestFullscreen(true);
  }

  function handleClickEnterFullscreenStaySoul() {
    requestFullscreenStaySoul(true);
  }

  const { unityProvider, loadingProgression, isLoaded, requestFullscreen } =
    useUnityContext({
      loaderUrl:
        "../BuildChocolatoGameJam/Build/BuildChocolatoGameJam.loader.js",
      dataUrl: "../BuildChocolatoGameJam/Build/BuildChocolatoGameJam.data",
      frameworkUrl:
        "../BuildChocolatoGameJam/Build/BuildChocolatoGameJam.framework.js",
      codeUrl: "../BuildChocolatoGameJam/Build/BuildChocolatoGameJam.wasm",
    });

  const {
    unityProvider: unityProviderStaySoul,
    loadingProgression: loadingProgressionStaySoul,
    requestFullscreen: requestFullscreenStaySoul,
  } = useUnityContext({
    loaderUrl: "../BuildStaySoulGameJam/Build/BuildStaySoulGameJam.loader.js",
    dataUrl: "../BuildStaySoulGameJam/Build/BuildStaySoulGameJam.data",
    frameworkUrl:
      "../BuildStaySoulGameJam/Build/BuildStaySoulGameJam.framework.js",
    codeUrl: "../BuildStaySoulGameJam/Build/BuildStaySoulGameJam.wasm",
  });

  // Unity WebGL
  const [showUnityPlayBool, setSUnityPlayBool] = useState(true);
  const [showChocolatoBool, setShowChocolatoBool] = useState(false);
  const [activeGameBtn, setActiveGameBtn] = useState(false);
  const displayStatus = useRef(null);
  const Chocolato = useRef(null);

  const handleActiveGameBtn = () => {
    setActiveGameBtn(!activeGameBtn);
    handleNavbarBtnClickPlay();
  };

  const handleNavbarBtnClickPlay = () => {
    setSUnityPlayBool(!showUnityPlayBool);
    if (showChocolatoBool) {
      handleNavbarBtnClickAlert();
    }

    if (!showChocolatoBool) {
      setShowChocolatoBool(showChocolatoBool);
    }

    if (activeGameBtn) {
      setActiveGameBtn(!activeGameBtn);
    }
  };

  const handleNavbarBtnClickAlert = () => {
    setShowChocolatoBool(!showChocolatoBool);
    if (Chocolato.current) {
      Chocolato.current.style.filter = showChocolatoBool
        ? "blur(0px)"
        : "blur(5px)";
    }
  };

  const ChocolatoPopup = (ref, bool) => {
    if (ref.current) {
      ref.current.style.position = bool ? "absolute" : "relative";
      ref.current.style.zIndex = bool ? "100" : "0";
    }
    const elements = document.querySelectorAll("#blur");
    elements.forEach((element) => {
      if (element) {
        element.style.filter = bool ? "blur(5px)" : "blur(0px)";
      }
    });
  };

  // Unity Stay Soul WebGL
  const [showStaySoulUnityPlayBool, setStaySoulUnityPlayBool] = useState(true);
  const [showStaySoulBool, setShowStaySoulBool] = useState(false);
  const [activeGameBtnStaySoul, setActiveGameBtnStaySoul] = useState(false);
  const [removeGameInProgress, setRemoveGameInProgress] = useState(false);
  const displayStatusStaySoul = useRef(null);
  const StaySoul = useRef(null);

  const handleActiveGameBtnStaySoul = () => {
    setActiveGameBtnStaySoul(!activeGameBtnStaySoul);
    handleNavbarBtnClickPlayStaySoul();
  };

  const handleNavbarBtnClickPlayStaySoul = () => {
    setStaySoulUnityPlayBool(!showStaySoulUnityPlayBool);
    setRemoveGameInProgress(!removeGameInProgress);

    if (showStaySoulBool) {
      handleNavbarBtnClickAlertStaySoul();
    }

    if (!showStaySoulBool) {
      setShowStaySoulBool(showStaySoulBool);
    }

    if (activeGameBtnStaySoul) {
      setActiveGameBtnStaySoul(!activeGameBtnStaySoul);
    }
  };

  const handleNavbarBtnClickAlertStaySoul = () => {
    setShowStaySoulBool(!showStaySoulBool);
    if (StaySoul.current) {
      StaySoul.current.style.filter = showStaySoulBool
        ? "blur(0px)"
        : "blur(5px)";
    }
  };

  const StaySoulPopup = (ref, bool) => {
    if (ref.current) {
      ref.current.style.position = bool ? "absolute" : "relative";
      ref.current.style.zIndex = bool ? "100" : "0";
    }
    const elements = document.querySelectorAll("#blur");
    elements.forEach((element) => {
      if (element) {
        element.style.filter = bool ? "blur(5px)" : "blur(0px)";
      }
    });
  };

  // Unity Attraction Flow WebGL
  const [showAttractionFlowUnityPlayBool, setAttractionFlowUnityPlayBool] =
    useState(true);
  const [showAttractionFlowBool, setShowAttractionFlowBool] = useState(false);
  const [activeGameBtnAttractionFlow, setActiveGameBtnAttractionFlow] =
    useState(false);
  const [
    removeGameInProgressAttractionFlow,
    setRemoveGameInProgressAttractionFlow,
  ] = useState(false);
  const displayStatusAttractionFlow = useRef(null);
  const AttractionFlow = useRef(null);

  const handleActiveGameBtnAttractionFlow = () => {
    setActiveGameBtnAttractionFlow(!activeGameBtnAttractionFlow);
    handleNavbarBtnClickPlayAttractionFlow();
  };

  const handleNavbarBtnClickPlayAttractionFlow = () => {
    setAttractionFlowUnityPlayBool(!showAttractionFlowUnityPlayBool);
    setRemoveGameInProgressAttractionFlow(!removeGameInProgressAttractionFlow);

    if (showAttractionFlowBool) {
      handleNavbarBtnClickAlertAttractionFlow();
    }

    if (!showAttractionFlowBool) {
      setShowAttractionFlowBool(showAttractionFlowBool);
    }

    if (activeGameBtnAttractionFlow) {
      setActiveGameBtnAttractionFlow(!activeGameBtnAttractionFlow);
    }
  };

  const handleNavbarBtnClickAlertAttractionFlow = () => {
    setShowAttractionFlowBool(!showAttractionFlowBool);
    if (AttractionFlow.current) {
      AttractionFlow.current.style.filter = showAttractionFlowBool
        ? "blur(0px)"
        : "blur(5px)";
    }
  };

  const AttractionFlowPopup = (ref, bool) => {
    if (ref.current) {
      ref.current.style.position = bool ? "absolute" : "relative";
      ref.current.style.zIndex = bool ? "100" : "0";
    }
    const elements = document.querySelectorAll("#blur");
    elements.forEach((element) => {
      if (element) {
        element.style.filter = bool ? "blur(5px)" : "blur(0px)";
      }
    });
  };

  useEffect(() => {
    ChocolatoPopup(Chocolato, showChocolatoBool);
    StaySoulPopup(StaySoul, showStaySoulBool);
    AttractionFlowPopup(AttractionFlow, showAttractionFlowBool);
    // eslint-disable-next-line
  }, [showChocolatoBool, showStaySoulBool, showAttractionFlowBool]);

  return (
    <div className="Home-header overflowHidden fontsRegular">
      <Navbar />
      <div className="traitSeparator" id="blur"></div>
      <div>
        <div className="contactMeFlex">
          <h3 className="fontsBold underline" id="blur">
            {t("GameJam.Title")}
          </h3>
        </div>
        <div className="grid-gamejam">
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Attraction Flow</h3>
              {isLoaded && !showAttractionFlowUnityPlayBool && (
                <div className="width flex-end">
                  <FontAwesomeIcon
                    icon={faCircle}
                    beatFade
                    style={{ color: "#63E6BE" }}
                    className="removeMargin"
                  />
                  <h4 className="Home">
                    {t("GameJam.AttractionFlow.GameInProgress")}
                  </h4>
                </div>
              )}
            </div>

            <div className="flexIMG width">
              <div
                className="flexIMG width"
                style={{
                  display: showAttractionFlowUnityPlayBool ? "block" : "none",
                  opacity: showAttractionFlowUnityPlayBool ? "1" : "0",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <iframe
                  src="https://youtube.com/embed/-F1GZJYqFyw"
                  title="youtubeVideoPresentation"
                  frameBorder="0"
                  width="560"
                  height="315"
                  allowFullScreen
                  className="iframeYoutube"
                ></iframe>
              </div>
            </div>
            <Fragment>
              {activeGameBtnAttractionFlow && (
                <>
                  {loadingProgression < 1 && (
                    <p>
                      {t("GameJam.AttractionFlow.LoadingGame")}{" "}
                      {Math.round(loadingProgression * 100)}%
                    </p>
                  )}
                  <Unity unityProvider={unityProvider} className="width" />
                </>
              )}
            </Fragment>
            <p className="text-align-left padding-1vw font-size-large">
              {t("GameJam.AttractionFlow.Description")}
              <br></br>
              <strong className="underline">
                {t("GameJam.AttractionFlow.technologies")}
              </strong>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://stratix0.itch.io/attraction-flow"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: showAttractionFlowUnityPlayBool ? "block" : "none",
                  opacity: showAttractionFlowUnityPlayBool ? "1" : "0",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreGame")}
                </button>
              </a>
              <button
                style={{
                  display: showAttractionFlowUnityPlayBool ? "none" : "block",
                  opacity: showAttractionFlowUnityPlayBool ? "0" : "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
                onClick={handleClickEnterFullscreen}
                className="btnStyleDiscoverProject fontsBold responsive-text-btn"
              >
                {t("VideoGamesProjects.fullScreenGame")}
              </button>
              {/* <button
                onClick={
                  showAttractionFlowUnityPlayBool
                    ? handleNavbarBtnClickAlertAttractionFlow
                    : handleNavbarBtnClickPlayAttractionFlow
                }
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showStaySoulUnityPlayBool
                  ? t("VideoGamesProjects.playProjects")
                  : t("VideoGamesProjects.stopProjects")}
              </button> */}
              <a
                href="https://github.com/PoloBongo/AttractionFlow"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: showUnityPlayBool ? "block" : "none",
                  opacity: showUnityPlayBool ? "1" : "0",
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
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Choco Blast</h3>
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
                src={backgroundChocoBlast}
                alt="Choco Blast Menu Principal"
                className="sizeProjectIMG imgGameJam"
              ></img>
            </div>
            <Fragment>
              {activeGameBtn && (
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
              {t("GameJam.Chocolato.Description")}
              <br></br>
              <strong className="underline">
                {t("GameJam.Chocolato.technologies")}
              </strong>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://demonxlegend.itch.io/chocoblast"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: showUnityPlayBool ? "block" : "none",
                  opacity: showUnityPlayBool ? "1" : "0",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreGame")}
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
                className="btnStyleDiscoverProject fontsBold responsive-text-btn"
              >
                {t("VideoGamesProjects.fullScreenGame")}
              </button>
              <button
                onClick={
                  showUnityPlayBool
                    ? handleNavbarBtnClickAlert
                    : handleNavbarBtnClickPlay
                }
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showUnityPlayBool
                  ? t("VideoGamesProjects.playProjects")
                  : t("VideoGamesProjects.stopProjects")}
              </button>
              <a
                href="https://github.com/DemonXlegenD/Chocoblast"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: showUnityPlayBool ? "block" : "none",
                  opacity: showUnityPlayBool ? "1" : "0",
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
          <div
            style={
              ({ display: showChocolatoBool ? "block" : "none" },
              {
                animation: `${
                  showChocolatoBool ? "fadeIn" : "fadeOut"
                } 1s ease forwards`,
                position: "fixed",
                textAlign: "center",
                width: "-webkit-fill-available",
                height: "-webkit-fill-available",
                alignContent: "center",
                zIndex: "10",
              })
            }
            className="overflowPopup backgroundPopupGameJam padding-1vw"
            ref={displayStatus}
          >
            <div>
              <p className="sizeMySql fontsLight text-align-center">
                {t("GameJam.Chocolato.Alert")}
              </p>
              <button
                onClick={handleNavbarBtnClickAlert}
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showChocolatoBool ? t("VideoGamesProjects.stopProjects") : ""}
              </button>
              <button
                onClick={handleActiveGameBtn}
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showChocolatoBool ? t("VideoGamesProjects.playProjects") : ""}
              </button>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Stay Soul</h3>
              {removeGameInProgress && !showStaySoulBool && (
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
              <div
                className="flexIMG width"
                style={{
                  display: showStaySoulUnityPlayBool ? "block" : "none",
                  opacity: showStaySoulUnityPlayBool ? "1" : "0",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <iframe
                  src={videoUrls[language] || videoUrls.en}
                  title="youtubeVideoPresentation"
                  frameBorder="0"
                  width="560"
                  height="315"
                  allowFullScreen
                  className="iframeYoutube"
                ></iframe>
              </div>
            </div>
            <Fragment>
              {activeGameBtnStaySoul && (
                <>
                  {loadingProgressionStaySoul < 1 && (
                    <p>
                      {t("GameJam.Chocolato.LoadingGame")}{" "}
                      {Math.round(loadingProgressionStaySoul * 100)}%
                    </p>
                  )}
                  <Unity
                    unityProvider={unityProviderStaySoul}
                    className="width"
                  />
                </>
              )}
            </Fragment>
            <p className="text-align-left padding-1vw font-size-large">
              {t("GameJam.StaySoul.Description")}
              <br></br>
              <strong className="underline">
                {t("GameJam.Chocolato.technologies")}
              </strong>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://46yuu.itch.io/staysoul"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: showStaySoulUnityPlayBool ? "block" : "none",
                  opacity: showStaySoulUnityPlayBool ? "1" : "0",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreGame")}
                </button>
              </a>
              <button
                style={{
                  display: showStaySoulUnityPlayBool ? "none" : "block",
                  opacity: showStaySoulUnityPlayBool ? "0" : "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
                onClick={handleClickEnterFullscreenStaySoul}
                className="btnStyleDiscoverProject fontsBold responsive-text-btn responsive-text-btn"
              >
                {t("VideoGamesProjects.fullScreenGame")}
              </button>
              <button
                onClick={
                  showStaySoulUnityPlayBool
                    ? handleNavbarBtnClickAlertStaySoul
                    : handleNavbarBtnClickPlayStaySoul
                }
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showStaySoulUnityPlayBool
                  ? t("VideoGamesProjects.playProjects")
                  : t("VideoGamesProjects.stopProjects")}
              </button>
              <a
                href="https://github.com/PoloBongo/Meta_GTech"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: showUnityPlayBool ? "block" : "none",
                  opacity: showUnityPlayBool ? "1" : "0",
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
          <div
            style={
              ({ display: showStaySoulBool ? "block" : "none" },
              {
                animation: `${
                  showStaySoulBool ? "fadeIn" : "fadeOut"
                } 1s ease forwards`,
                position: "fixed",
                textAlign: "center",
                width: "-webkit-fill-available",
                height: "-webkit-fill-available",
                alignContent: "center",
                zIndex: "10",
              })
            }
            className="overflowPopup backgroundPopupGameJam padding-1vw"
            ref={displayStatusStaySoul}
          >
            <div>
              <p className="sizeMySql fontsLight text-align-center">
                {t("GameJam.StaySoul.Alert")}
              </p>
              <button
                onClick={handleNavbarBtnClickAlertStaySoul}
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showStaySoulBool ? t("VideoGamesProjects.stopProjects") : ""}
              </button>
              <button
                onClick={handleActiveGameBtnStaySoul}
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showStaySoulBool ? t("VideoGamesProjects.playProjects") : ""}
              </button>
            </div>
          </div>
          <div
            style={
              ({ display: showAttractionFlowBool ? "block" : "none" },
              {
                animation: `${
                  showAttractionFlowBool ? "fadeIn" : "fadeOut"
                } 1s ease forwards`,
                position: "fixed",
                textAlign: "center",
                width: "-webkit-fill-available",
                height: "-webkit-fill-available",
                alignContent: "center",
                zIndex: "10",
              })
            }
            className="overflowPopup backgroundPopupGameJam padding-1vw"
            ref={displayStatusAttractionFlow}
          >
            <div>
              <p className="sizeMySql fontsLight text-align-center">
                {t("GameJam.StaySoul.Alert")}
              </p>
              <button
                onClick={handleNavbarBtnClickAlertAttractionFlow}
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showAttractionFlowBool
                  ? t("VideoGamesProjects.stopProjects")
                  : ""}
              </button>
              <button
                onClick={handleActiveGameBtnAttractionFlow}
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index responsive-text-btn"
              >
                {showAttractionFlowBool
                  ? t("VideoGamesProjects.playProjects")
                  : ""}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TranslatedHome = withTranslation()(GameJamT);

export default function GameJam() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
