import React, { Suspense, useEffect, useState, useRef } from "react";
import "../../css/Home.css";
// image
import backgroundProjectCustomEngine from "../../img/backgroundCustomEngine.webp";
import backgroundCPPBibliotheque from "../../img/backgroundCPPBibliotheque.webp";
import backgroundProjectLUA from "../../img/backgroundLUA.webp";
// component
import NavbarProjects from "../../Component/NavbarProjects";
import UnityPage from "../Unity/Unity";
// Icon
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { faArrowDown } from "@fortawesome/free-solid-svg-icons";

// Traduction
import { Loader } from "../../Component/ComponentTraduction";
import { withTranslation } from "react-i18next";

const ProjectsVideoGamesT = ({ t }) => {
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

  useEffect(() => {
    const targetHref2 = document.getElementsByClassName("noColorCPlus");
    const targetHref3 = document.getElementsByClassName("noColorPython");
    const targetHref4 = document.getElementsByClassName("noColorLUA");
    const targetHref5 = document.getElementsByClassName("noColorCSharp");
    const targetHref6 = document.getElementsByClassName("noColorCustomEngine");

    // Permet de récupérer ce que je veux de ce qui est visible sur la fenêtre ( classe / id / attribute ect...)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
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
            Array.from(targetHref6).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "CustomEngine" ? "underline" : "";
            });
          } else {
            entry.target.classList.remove("active");
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

  // const [showVideo, setShowVideo] = useState({});

  // const handlePreviewVideoProjects = (event, index) => {
  //   const previewContainer = event.target.closest(".preview-div");
  //   const video = previewContainer.querySelector(".preview-video");
  //   let savedTime = 0;

  //   if (video.paused && !showVideo[index]) {
  //     video.style.opacity = 1;
  //     video.play();
  //     video.currentTime = savedTime;
  //     setShowVideo((prevState) => ({ ...prevState, [index]: true }));
  //   } else if (!video.paused && showVideo[index]) {
  //     video.style.opacity = 0;
  //     savedTime = video.currentTime;
  //     video.pause();
  //     setShowVideo((prevState) => ({ ...prevState, [index]: false }));
  //   }
  // };

  const [showNavbarBool, setShowNavbarBool] = useState(true);

  const handleNavbarBtnClick = () => {
    setShowNavbarBool(!showNavbarBool);
  };

  const [showUnityPage, setShowUnityPage] = useState(false);

  const handleUnityPagebtnClick = () => {
    localStorage.setItem("ActiveBtnBackUnityPage", "true");
    setShowUnityPage(!showUnityPage);
  };

  useEffect(() => {
    const items = JSON.parse(localStorage.getItem("ActiveBtnNavbarUnityPage"));
    if (items) {
      setShowUnityPage(true);
    } else {
      setShowUnityPage(false);
    }
  }, []);

  const scrollContainerRef = useRef(null);

  const scrollNext = () => {
    if (scrollContainerRef.current) {
      const nextElement = scrollContainerRef.current.querySelector(
        ".projects.active + .projects"
      );
      if (nextElement) {
        nextElement.scrollIntoView({ behavior: "smooth", block: "start" });
        updateActiveProject(nextElement);
      }
    }
  };

  const scrollPrev = () => {
    if (scrollContainerRef.current) {
      const prevElement =
        scrollContainerRef.current.querySelector(
          ".projects.active"
        ).previousElementSibling;
      if (prevElement) {
        prevElement.scrollIntoView({ behavior: "smooth", block: "start" });
        updateActiveProject(prevElement);
      }
    }
  };

  const updateActiveProject = (element) => {
    const allProjects =
      scrollContainerRef.current.querySelectorAll(".projects");
    allProjects.forEach((el) => el.classList.remove("active"));
    element.classList.add("active");
  };

  return (
    <>
      {!showUnityPage ? (
        <div className="Home-header">
          <div className="flex-projects">
            <div className="center-navbar-projects">
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
                      className="noColorCustomEngine fontsRegular"
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
                  <ul>
                    <button
                      className="noColor fontsRegular btnNavbarProject submitForm"
                      onClick={handleUnityPagebtnClick}
                    >
                      {t("BottomNavBarProjects.Unity")}
                    </button>
                  </ul>
                </div>
              </div>
            </div>
            <div className="divGlobalProjects" ref={scrollContainerRef}>
              <div className="projects active CustomEngine" id="CustomEngine">
                <div className="flexIMG">
                  <img
                    src={backgroundProjectCustomEngine}
                    alt="Custom Engine"
                    className="sizeProjectIMG2"
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
                    href="https://github.com/PoloBongo/custom-engine-cpp"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.viewMoreCode")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects C++" id="C++">
                <div className="flexIMG">
                  <div className="preview-div">
                    {/* <img
                      src={backgroundProjectHelluvaRevenge}
                      alt="Helluva Revenge Monde Exploration"
                      className="sizeProjectIMG"
                    /> */}
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
                      {t("VideoGamesProjects.viewMoreCode")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects C++" id="C++">
                <div className="flexIMG">
                  <div className="preview-div">
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
                      {t("VideoGamesProjects.viewMoreCode")}
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
                      {t("VideoGamesProjects.viewMoreCode")}
                    </button>
                  </a>
                </div>
              </div>
              {/* <div className="projects C++" id="C++">
                <div className="flexIMG">
                  <div className="preview-div">
                    <img
                      src={backgroundCPPJeuTextuel}
                      loading="lazy"
                      alt="Jeu Textuel en Console"
                      className="sizeProjectIMG"
                    ></img>
                    <div className="pos-btn-video">
                      <button
                        className="btnStyleDiscoverProject fontsBold"
                        onClick={(event) =>
                          handlePreviewVideoProjects(event, 3)
                        }
                      >
                        {showVideo[3]
                          ? t("VideoGamesProjects.stopVideo")
                          : t("VideoGamesProjects.playVideo")}
                      </button>
                    </div>
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
                    __html: t("VideoGamesProjects.TextuelGameConsole"),
                  }}
                ></p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/CPP_Jeu_Textuel_Console"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <button className="btnStyleDiscoverProject fontsBold">
                      {t("VideoGamesProjects.viewMoreCode")}
                    </button>
                  </a>
                </div>
              </div> */}
              <div className="projects C#" id="C#">
                <div className="flexIMG">
                  <div className="preview-div">
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
                      {t("VideoGamesProjects.viewMoreCode")}
                    </button>
                  </a>
                </div>
              </div>
              <div className="projects Python" id="Python">
                <div className="flexIMG">
                  <div className="preview-div">
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
                      {t("VideoGamesProjects.viewMoreCode")}
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
                      {t("VideoGamesProjects.viewMoreCode")}
                    </button>
                  </a>
                </div>
              </div>
            </div>
            <div className="top-margin-btn-icon">
              <button
                onClick={scrollPrev}
                className="btnStyleDiscoverProject btn-scroll-up-projects"
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </button>
              <button
                onClick={scrollNext}
                className="btnStyleDiscoverProject btn-scroll-up-projects"
              >
                <FontAwesomeIcon icon={faArrowDown} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <UnityPage />
      )}
    </>
  );
};

const TranslatedProjectsVideoGamesPage = withTranslation()(ProjectsVideoGamesT);

export default function ProjectsVideoGames() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedProjectsVideoGamesPage />
    </Suspense>
  );
}
