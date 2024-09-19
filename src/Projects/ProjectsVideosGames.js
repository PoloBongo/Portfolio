import React, { Fragment, Suspense, useEffect, useState } from "react";
import "../css/Home.css";
// image
import backgroundProjectCustomEngine from "../img/backgroundCustomEngine.webp";
import backgroundProjectHelluvaRevenge from "../img/backgroundHelluvaRevenge.webp";
import backgroundProjectLOL from "../img/backgroundTowerDefenseLOL.webp";
import backgroundProjectShootEmUp from "../img/shoot-em-up.webp";
import backgroundCPPBibliotheque from "../img/backgroundCPPBibliotheque.webp";
import backgroundCPPJeuTextuel from "../img/backgroundCPPJeuTextuel.webp";
import backgroundProjectLUA from "../img/backgroundLUA.webp";
import backgroundCSharpConsole from "../img/backgroundCSharpConsole.webp";
import backgroundUnityRL from "../img/backgroundUnityRL.webp";
// video
import helluvaRevengeVideo from "./helluvaRevengePreview.mp4";
import towerDefenseVideo from "./TowerDefensePreview.mp4";
import shootEmUpVideo from "./shootEmUpPreview.mp4";
import jeuTextuelPreview from "./jeuTextuelPreview.mp4";
import CSharpConsoleVideo from "./CSharpConsoleVideo.mp4";
// component
import NavbarProjects from "../Component/NavbarProjects";
import UnityPage from "../Unity/Unity";

import { Unity, useUnityContext } from "react-unity-webgl";

// Traduction
import { Loader } from "../Component/ComponentTraduction";
import { withTranslation } from "react-i18next";

const ProjectsVideosGamesT = ({ t }) => {
  const [cPlusPlusT, setCPlusPlusT] = useState(0);
  const [luaT, setLuaT] = useState(0);
  const [cSharpT, setCSharpT] = useState(0);
  const [pythonT, setPythonT] = useState(0);
  const [customEngine, setCustomEngine] = useState(0);

  useEffect(() => {
    setCPlusPlusT(Array.from(document.getElementsByClassName("C++")).length);
    setLuaT(Array.from(document.getElementsByClassName("LUA")).length);
    setCSharpT(Array.from(document.getElementsByClassName("C#")).length);
    setPythonT(Array.from(document.getElementsByClassName("Python")).length);
    setCustomEngine(
      Array.from(document.getElementsByClassName("CustomEngine")).length
    );
  }, []);

  // Unity
  const { unityProvider, loadingProgression, requestFullscreen } =
    useUnityContext({
      loaderUrl: "../BuildUnityRL/Build/public.loader.js",
      dataUrl: "../BuildUnityRL/Build/public.data",
      frameworkUrl: "../BuildUnityRL/Build/public.framework.js",
      codeUrl: "../BuildUnityRL/Build/public.wasm",
    });

  function handleClickEnterFullscreen() {
    requestFullscreen(true);
  }

  useEffect(() => {
    // Preview des projects
    const previewContainer = document.querySelectorAll(".preview-div");

    previewContainer.forEach((previewContainers) => {
      const previewVideo = previewContainers.querySelector(".preview-video");
      let savedTime = 0;

      previewVideo.addEventListener("loadedmetadata", () => {
        if (previewVideo.paused) {
          previewVideo.play();
          previewVideo.currentTime = savedTime;
        }
      });

      previewContainers.addEventListener("mouseenter", () => {
        if (previewVideo.paused || previewVideo.ended) {
          previewVideo.play();
          previewVideo.currentTime = savedTime;
        }
      });

      previewContainers.addEventListener("mouseleave", () => {
        if (!previewVideo.paused && !previewVideo.ended) {
          savedTime = previewVideo.currentTime;
          previewVideo.pause();
        }
      });
    });

    // const targetHref1 = document.getElementsByClassName("noColorC");
    const targetHref2 = document.getElementsByClassName("noColorCPlus");
    const targetHref3 = document.getElementsByClassName("noColorPython");
    const targetHref4 = document.getElementsByClassName("noColorLUA");
    const targetHref5 = document.getElementsByClassName("noColorCSharp");

    // Permet de récupérer ce que je veux de ce qui est visible sur la fenêtre ( ckasse / id / attribute ect...)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Array.from(targetHref1).forEach((element) => {
            //   element.style.textDecoration =
            //     entry.target.id === "C" ? "underline" : "";
            // });
            Array.from(targetHref2).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "C++" ? "underline" : "";
            });
            Array.from(targetHref5).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "C#" ? "underline" : "";
            });
            Array.from(targetHref3).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "Python" ? "underline" : "";
            });
            Array.from(targetHref4).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "LUA" ? "underline" : "";
            });
          }
        });
      },
      { threshold: 0.5 }
    );

    const projects = document.querySelectorAll(".projects");
    projects.forEach((project) => {
      observer.observe(project);
    });

    return () => {
      projects.forEach((project) => {
        observer.unobserve(project);
      });
    };
  }, []);

  const [showNavbarBool, setShowNavbarBool] = useState(true);

  const handleNavbarBtnClick = () => {
    setShowNavbarBool(!showNavbarBool);
  };

  const [showUnityPage, setShowUnityPage] = useState(false);

  const handleUnityPagebtnClick = () => {
    localStorage.setItem("ActiveBtnBackUnityPage", "true");
    setShowUnityPage(!showUnityPage);
  };

  // Unity WebGL
  const [showUnityPlayBool, setSUnityPlayBool] = useState(true);
  const [activeGameBtn, setActiveGameBtn] = useState(false);

  const handleActiveGameBtn = () => {
    setActiveGameBtn(!activeGameBtn);
    setSUnityPlayBool(!showUnityPlayBool);
  };

  return (
    <>
      {!showUnityPage ? (
        <div className="Home-header">
          <div className="flex-projects">
            <div>
              <button className="btnDownloadCV" onClick={handleNavbarBtnClick}>
                <div
                  className="bubbleProjectNavbar"
                  style={{
                    width: showNavbarBool ? "50px" : "25px",
                    height: showNavbarBool ? "50px" : "25px",
                    zIndex: "1000",
                    overflow: "hidden",
                    transition: "all 1s ease",
                  }}
                ></div>
              </button>
              <div
                className="navbarProject"
                style={{
                  display: showNavbarBool ? "none" : "block",
                  maxHeight: showNavbarBool ? "0" : "max-content",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <div className="categoryProject">
                  <NavbarProjects />
                  <h5 className="sizeCategoryProjectGames fontsBold">
                    {t("BottomNavBarProjects.Category")}
                  </h5>
                  <ul className="backgroundUnderCategory">
                    <a
                      href="#CustomEngine"
                      className="noColorCPlus fontsRegular"
                    >
                      {t("BottomNavBarProjects.CustomEngine")}&nbsp;
                      <strong className="green">({customEngine})</strong>
                    </a>
                  </ul>
                  <ul className="backgroundUnderCategory">
                    <a href="#C++" className="noColorCPlus fontsRegular">
                      {t("BottomNavBarProjects.C++")}&nbsp;
                      <strong className="green">({cPlusPlusT})</strong>
                    </a>
                  </ul>
                  <ul className="backgroundUnderCategory">
                    <a href="#C#" className="noColorCSharp fontsRegular">
                      {t("BottomNavBarProjects.CSharp")}&nbsp;
                      <strong className="green">({cSharpT})</strong>
                    </a>
                  </ul>
                  {/* <ul className="backgroundUnderCategory">
                <a href="#C" className="noColorC fontsRegular">
                  {t("BottomNavBarProjects.C")}
                </a>
              </ul> */}
                  <ul className="backgroundUnderCategory">
                    <a href="#Python" className="noColorPython fontsRegular">
                      {t("BottomNavBarProjects.Python")}&nbsp;
                      <strong className="green">({pythonT})</strong>
                    </a>
                  </ul>
                  <ul className="backgroundUnderCategory">
                    <a href="#LUA" className="noColorLUA fontsRegular">
                      {t("BottomNavBarProjects.LUA")}&nbsp;
                      <strong className="green">({luaT})</strong>
                    </a>
                  </ul>
                  <ul className="backgroundUnderCategory">
                    <button
                      className="noColorLUA fontsRegular btnNavbarProject submitForm"
                      onClick={handleUnityPagebtnClick}
                    >
                      {t("BottomNavBarProjects.Unity")}
                    </button>
                  </ul>
                </div>
              </div>
            </div>
            <div className="divGlobalProjects">
              <div className="projects CustomEngine" id="CustomEngine">
                <div className="flexIMG">
                  <img
                    src={backgroundProjectCustomEngine}
                    alt="Custom Engine"
                    className="sizeProjectIMG3"
                  />
                </div>
                <h4 className="HelluvaRevengeTitle fontsRegular">Angine</h4>
                <p
                  className="pDescription fontsLight"
                  dangerouslySetInnerHTML={{
                    __html: t("VideoGamesProjects.CustomEngine"),
                  }}
                ></p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/GamingCampus-AdrienBourgois/engine-mmaqjlkf"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects C++" id="C++">
                <div className="flexIMG">
                  <div className="preview-div">
                    <img
                      src={backgroundProjectHelluvaRevenge}
                      alt="Helluva Revenge Monde Exploration"
                      className="sizeProjectIMG"
                    />
                    <video className="preview-video" loop muted>
                      <source src={helluvaRevengeVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
                <h4 className="HelluvaRevengeTitle fontsRegular">
                  Helluva Revenge
                </h4>
                <p
                  className="pDescription fontsLight"
                  dangerouslySetInnerHTML={{
                    __html: t("VideoGamesProjects.helluvaRevenge"),
                  }}
                ></p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/DemonXlegenD/Helluva-Revenge"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects C++" id="C++">
                <div className="flexIMG">
                  <div className="preview-div">
                    <img
                      src={backgroundProjectLOL}
                      loading="lazy"
                      alt="Tower Defense Thème Leagues of Legends"
                      className="sizeProjectIMG"
                    />
                    <video loading="lazy" className="preview-video" loop muted>
                      <source src={towerDefenseVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
                <h4 className="HelluvaRevengeTitle fontsRegular">
                  Tower Defense
                </h4>
                <p
                  className="pDescription fontsLight"
                  dangerouslySetInnerHTML={{
                    __html: t("VideoGamesProjects.towerDefense"),
                  }}
                ></p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/CPP_Tower_Defense"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects C++" id="C++">
                <div className="flexIMG">
                  <img
                    src={backgroundCPPBibliotheque}
                    loading="lazy"
                    alt="Bibliothèque C++"
                    className="sizeProjectIMG"
                  ></img>
                </div>
                <h4 className="HelluvaRevengeTitle  fontsRegular">
                  C++ Bibliothèque
                </h4>
                <p
                  className="pDescription fontsLight"
                  dangerouslySetInnerHTML={{
                    __html: t("VideoGamesProjects.bibliotheque"),
                  }}
                ></p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/CPP_Bibliotheque/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects C++" id="C++">
                <div className="flexIMG">
                  <div className="preview-div">
                    <img
                      src={backgroundCPPJeuTextuel}
                      loading="lazy"
                      alt="Jeu Textuel en Console"
                      className="sizeProjectIMG"
                    ></img>
                    <video loading="lazy" className="preview-video" loop muted>
                      <source src={jeuTextuelPreview} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
                <h4 className="HelluvaRevengeTitle fontsRegular">
                  Jeu Textuel - Console
                </h4>
                <p
                  className="pDescription fontsLight"
                  dangerouslySetInnerHTML={{
                    __html: t("VideoGamesProjects.textuelGameConsole"),
                  }}
                ></p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/CPP_Jeu_Textuel_Console"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects C#" id="C#">
                <div className="flexIMG">
                  <div className="preview-div">
                    <img
                      src={backgroundCSharpConsole}
                      loading="lazy"
                      alt="Tour par tour en console"
                      className="sizeProjectIMG"
                    ></img>
                    <video loading="lazy" className="preview-video" loop muted>
                      <source src={CSharpConsoleVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
                <h4 className="HelluvaRevengeTitle fontsRegular">
                  Tour par tour en console
                </h4>
                <p
                  className="pDescription fontsLight"
                  dangerouslySetInnerHTML={{
                    __html: t("VideoGamesProjects.CSharpConsole"),
                  }}
                ></p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/Projet9---CSharp"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects C#" id="C#">
                <div className="aboutMeTitle">
                  <img
                    style={{
                      display: showUnityPlayBool ? "block" : "none",
                      opacity: showUnityPlayBool ? "1" : "0",
                      overflow: "hidden",
                      transition: "all 1s ease",
                    }}
                    src={backgroundUnityRL}
                    loading="lazy"
                    alt="Unity jeu de balle"
                    className="sizeProjectIMG"
                  ></img>
                </div>
                <div className="aboutMeTitle">
                  <Fragment>
                    {activeGameBtn && (
                      <>
                        {loadingProgression < 1 && (
                          <p className="width flexIMG">
                            {t("GameJam.Chocolato.LoadingGame")}{" "}
                            {Math.round(loadingProgression * 100)}%
                          </p>
                        )}
                        <Unity
                          unityProvider={unityProvider}
                          className="width"
                        />
                      </>
                    )}
                  </Fragment>
                </div>
                <h4 className="HelluvaRevengeTitle fontsRegular">Unity</h4>
                <p
                  className="pDescription fontsLight"
                  dangerouslySetInnerHTML={{
                    __html: t("VideoGamesProjects.UnityRL"),
                  }}
                ></p>
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
                    onClick={handleActiveGameBtn}
                    className="btnStyleDiscoverProject fontsBold marge-contact-play"
                  >
                    {showUnityPlayBool
                      ? t("VideoGamesProjects.playProjects")
                      : t("VideoGamesProjects.stopProjects")}
                  </button>
                </div>
              </div>
              <div className="projects Python" id="Python">
                <div className="flexIMG">
                  <div className="preview-div">
                    <img
                      src={backgroundProjectShootEmUp}
                      loading="lazy"
                      alt="Shoot-Em-Up Thème Futuriste"
                      className="sizeProjectIMG"
                    ></img>
                    <video loading="lazy" className="preview-video" loop muted>
                      <source src={shootEmUpVideo} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
                <h4 className="HelluvaRevengeTitle fontsRegular">
                  Shoot-Em-Up
                </h4>
                <p
                  className="pDescription fontsLight"
                  dangerouslySetInnerHTML={{
                    __html: t("VideoGamesProjects.shootEmUp"),
                  }}
                ></p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/Shoot-Em-Up"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects LUA" id="LUA">
                <div className="flexIMG">
                  <img
                    src={backgroundProjectLUA}
                    loading="lazy"
                    alt="Shoot-Em-Up Thème Futuriste"
                    className="sizeProjectIMG"
                  ></img>
                </div>
                <h4 className="HelluvaRevengeTitle fontsRegular">
                  Projets LUA
                </h4>
                <p className="pDescription fontsLight">
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
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.learnMore")}
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <UnityPage />
      )}
    </>
  );
};

const TranslatedProjectsVideosGames = withTranslation()(ProjectsVideosGamesT);

export default function ProjectsVideosGames() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedProjectsVideosGames />
    </Suspense>
  );
}
