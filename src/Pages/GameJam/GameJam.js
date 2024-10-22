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
import { withTranslation } from "react-i18next";

const GameJamT = ({ t }) => {
  function handleClickEnterFullscreen() {
    requestFullscreen(true);
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

  useEffect(() => {
    ChocolatoPopup(Chocolato, showChocolatoBool);
    // eslint-disable-next-line
  }, [showChocolatoBool]);

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
          <div className="marge-contact-play modernEnvelop" id="blur">
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
            {/* <Unity
              style={{
                display: showUnityPlayBool ? "none" : "block",
                opacity: showUnityPlayBool ? "0" : "1",
                width: "-webkit-fill-available",
                overflow: "hidden",
                transition: "all 1s ease",
              }}
              unityProvider={unityProvider}
            /> */}

            <Fragment>
              {/* {isLoaded ? (
                <div className="flexIMG">
                  <Unity
                    unityProvider={unityProvider}
                    style={{
                      visibility:
                        isLoaded && !showUnityPlayBool ? "visible" : "hidden",
                    }}
                    className="width"
                  />
                </div>
              ) : (
                <p>
                  Loading Application... {Math.round(loadingProgression * 100)}%
                </p>
              )} */}
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
                className="btnStyleDiscoverProject fontsBold"
              >
                {t("VideoGamesProjects.fullScreenGame")}
              </button>
              <button
                onClick={
                  showUnityPlayBool
                    ? handleNavbarBtnClickAlert
                    : handleNavbarBtnClickPlay
                }
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index"
              >
                {showUnityPlayBool
                  ? t("VideoGamesProjects.playProjects")
                  : t("VideoGamesProjects.stopProjects")}
              </button>
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
                onClick={handleActiveGameBtn}
                className="btnStyleDiscoverProject fontsBold marge-contact-play z-index"
              >
                {showChocolatoBool ? t("VideoGamesProjects.playProjects") : ""}
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
