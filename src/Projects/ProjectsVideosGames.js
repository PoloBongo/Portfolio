import React, { Suspense, useEffect, useState } from "react";
import "../css/Home.css";

import backgroundProjectHelluvaRevenge from "../img/backgroundHelluvaRevenge.png";
import backgroundProjectLOL from "../img/backgroundTowerDefenseLOL.jpg";
import backgroundProjectShootEmUp from "../img/shoot-em-up.png";
import backgroundCPPBibliotheque from "../img/backgroundCPPBibliotheque.jpg";
import backgroundCPPJeuTextuel from "../img/backgroundCPPJeuTextuel.png";
import backgroundProjectLUA from "../img/backgroundLUA.png";

import helluvaRevengeVideo from "../video/helluvaRevengePreview.mp4";
import towerDefenseVideo from "../video/TowerDefensePreview.mp4";
import shootEmUpVideo from "../video/shootEmUpPreview.mp4";

import NavbarProjects from "../Component/NavbarProjects";

// Traduction
import { Loader } from "../Component/ComponentTraduction";
import { withTranslation } from "react-i18next";

const ProjectsVideosGamesT = ({ t }) => {
  useEffect(() => {
    // Preview des projects
    const previewContainer = document.querySelectorAll(".preview-div");

    previewContainer.forEach((previewContainers) => {
      const previewVideo = previewContainers.querySelector(".preview-video");
      let savedTime = 0;

      previewContainers.addEventListener("mouseenter", () => {
        if (previewVideo.paused) {
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

    const targetHref1 = document.getElementsByClassName("noColorC");
    const targetHref2 = document.getElementsByClassName("noColorCPlus");
    const targetHref3 = document.getElementsByClassName("noColorPython");
    const targetHref4 = document.getElementsByClassName("noColorLUA");

    // Permet de récupérer ce que je veux de ce qui est visible sur la fenêtre ( ckasse / id / attribute ect...)
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            Array.from(targetHref1).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "C" ? "underline" : "";
            });
            Array.from(targetHref2).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "C++" ? "underline" : "";
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

  return (
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
                <a href="#C++" className="noColorCPlus fontsRegular">
                  {t("BottomNavBarProjects.C++")}
                </a>
              </ul>
              <ul className="backgroundUnderCategory">
                <a href="#C" className="noColorC fontsRegular">
                  {t("BottomNavBarProjects.C")}
                </a>
              </ul>
              <ul className="backgroundUnderCategory">
                <a href="#Python" className="noColorPython fontsRegular">
                  {t("BottomNavBarProjects.Python")}
                </a>
              </ul>
              <ul className="backgroundUnderCategory">
                <a href="#LUA" className="noColorLUA fontsRegular">
                  {t("BottomNavBarProjects.LUA")}
                </a>
              </ul>
            </div>
          </div>
        </div>
        <div className="divGlobalProjects">
          <div className="projects" id="C++">
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
          <div className="projects" id="C++">
            <div className="flexIMG">
              <div className="preview-div">
                <img
                  src={backgroundProjectLOL}
                  alt="Tower Defense Thème Leagues of Legends"
                  className="sizeProjectIMG"
                />
                <video className="preview-video" loop muted>
                  <source src={towerDefenseVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <h4 className="HelluvaRevengeTitle fontsRegular">Tower Defense</h4>
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
          <div className="projects" id="C++">
            <div className="flexIMG">
              <img
                src={backgroundCPPBibliotheque}
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
          <div className="projects" id="C++">
            <div className="flexIMG">
              <img
                src={backgroundCPPJeuTextuel}
                alt="Jeu Textuel en Console"
                className="sizeProjectIMG"
              ></img>
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
          <div className="projects" id="Python">
            <div className="flexIMG">
              <div className="preview-div">
                <img
                  src={backgroundProjectShootEmUp}
                  alt="Shoot-Em-Up Thème Futuriste"
                  className="sizeProjectIMG"
                ></img>
                <video className="preview-video" loop muted>
                  <source src={shootEmUpVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <h4 className="HelluvaRevengeTitle fontsRegular">Shoot-Em-Up</h4>
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
          <div className="projects" id="LUA">
            <div className="flexIMG">
              <img
                src={backgroundProjectLUA}
                alt="Shoot-Em-Up Thème Futuriste"
                className="sizeProjectIMG"
              ></img>
            </div>
            <h4 className="HelluvaRevengeTitle fontsRegular">Projets LUA</h4>
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
