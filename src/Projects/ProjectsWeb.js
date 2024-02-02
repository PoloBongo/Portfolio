import React, { Suspense, useEffect, useState } from "react";
import "../css/Home.css";

// Preview Minia Projects
import backgroundProjectCeltic from "../img/backgroundCeltic.webp";
import backgroundProjectEko from "../img/backgroundEko.webp";
import backgroundProjectBAImmobilier from "../img/backgroundBAImmobilier.webp";
import pagePaiement from "../img/pagePaiement.webp";
import backgroundGoudGuys from "../img/backgroundGoudGuys.webp";
// Preview Video Projects
import celticVideo from "./celticLaricheBasketPreview.mp4";
import BAImmobilierVideo from "./BAImmobilierPreview.mp4";
import ekoVideo from "./ekoWebsitePreview.mp4";
import paymentPageVideo from "./paymentPagePreview.mp4";

import NavbarProjects from "../Component/NavbarProjects";

// Traduction
import { Loader } from "../Component/ComponentTraduction";
import { withTranslation } from "react-i18next";

const FLAG_CLASS = "backgroundWeb";

const preloadImage = (url) => {
  const img = new Image();
  img.src = url;
};

const ProjectsWebT = ({ t }) => {
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
        if (!previewVideo.paused) {
          savedTime = previewVideo.currentTime;
          previewVideo.pause();
        }
      });
    });

    const targetHref1 = document.getElementsByClassName("noColorCeltic");
    const targetHref2 = document.getElementsByClassName("noColorEko");
    const targetHref3 = document.getElementsByClassName("noColorPaiement");
    const targetHref4 = document.getElementsByClassName("noColorGoudGuys");
    const targetHref5 = document.getElementsByClassName("noColorBAImmobilier");

    // Permet de récupérer ce que je veux de ce qui est visible sur la fenêtre ( ckasse / id / attribute ect...)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            Array.from(targetHref1).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "Celtic" ? "underline" : "";
            });
            Array.from(targetHref2).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "Eko" ? "underline" : "";
            });
            Array.from(targetHref3).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "Paiement" ? "underline" : "";
            });
            Array.from(targetHref4).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "GoudGuys" ? "underline" : "";
            });
            Array.from(targetHref5).forEach((element) => {
              element.style.textDecoration =
                entry.target.id === "BAImmobilier" ? "underline" : "";
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

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.addedNodes &&
          mutation.addedNodes.length > 0 &&
          mutation.addedNodes[0].classList &&
          mutation.addedNodes[0].classList.contains(FLAG_CLASS)
        ) {
          preloadImage(backgroundProjectCeltic);
          preloadImage(backgroundProjectEko);
          preloadImage(backgroundProjectBAImmobilier);
          preloadImage(pagePaiement);
          preloadImage(backgroundGoudGuys);
        }
      });
    });
    const observerConfig = {
      childList: true,
      subtree: true,
    };

    const targetNode = document.body;

    observer.observe(targetNode, observerConfig);
    return () => {
      observer.disconnect();
    };
  }, []);

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
                <a href="#Celtic" className="noColorCeltic fontsRegular">
                  Celtic La Riche Basket
                </a>
              </ul>
              <ul className="backgroundUnderCategory">
                <a href="#Eko" className="noColorEko fontsRegular">
                  Eko
                </a>
              </ul>
              <ul className="backgroundUnderCategory">
                <a href="#Paiement" className="noColorPaiement fontsRegular">
                  {t("BottomNavBarProjects.PaymentPage")}
                </a>
              </ul>
              <ul className="backgroundUnderCategory">
                <a href="#GoudGuys" className="noColorGoudGuys fontsRegular">
                  Goud Guys
                </a>
              </ul>
              <ul className="backgroundUnderCategory">
                <a
                  href="#BAImmobilier"
                  className="noColorBAImmobilier fontsRegular"
                >
                  B.A Immobilier
                </a>
              </ul>
            </div>
          </div>
        </div>
        <div className="divGlobalProjects">
          <div className="projects" id="Celtic">
            <div className="flexIMG">
              <div className="preview-div">
                <img
                  src={backgroundProjectCeltic}
                  alt="Site Internet Celtic La Riche Basket"
                  className="sizeProjectIMG"
                ></img>{" "}
                <video className="preview-video" loop muted>
                  <source src={celticVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <h4 className="HelluvaRevengeTitle fontsRegular">
              Celtic La Riche Basket
            </h4>
            <p
              className="pDescription fontsLight"
              dangerouslySetInnerHTML={{
                __html: t("WebProjects.Celtic"),
              }}
            ></p>
            <div className="btnDiscoverProject">
              <a
                href="https://www.celticlarichebasket.fr/"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold">
                  {t("WebProjects.learnMore")}
                </button>
              </a>
            </div>
          </div>
          <div className="projects" id="Eko">
            <div className="flexIMG">
              <div className="preview-div">
                <img
                  src={backgroundProjectEko}
                  alt="Site Internet Eko"
                  className="sizeProjectIMG"
                ></img>{" "}
                <video className="preview-video" loop muted>
                  <source src={ekoVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <h4 className="HelluvaRevengeTitle fontsRegular">Eko</h4>
            <p
              className="pDescription fontsLight"
              dangerouslySetInnerHTML={{
                __html: t("WebProjects.Eko"),
              }}
            ></p>
            <div className="btnDiscoverProject">
              <a
                href="https://www.baimmobilier.fr/eko/"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold">
                  {t("WebProjects.learnMore")}
                </button>
              </a>
            </div>
          </div>
          <div className="projects" id="Paiement">
            <div className="flexIMG">
              <div className="preview-div">
                <img
                  src={pagePaiement}
                  alt="Page de Paiement"
                  className="sizeProjectIMG"
                ></img>{" "}
                <video className="preview-video" loop muted>
                  <source src={paymentPageVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <h4 className="HelluvaRevengeTitle fontsRegular">
              {t("BottomNavBarProjects.PaymentPage")}
            </h4>
            <p
              className="pDescription fontsLight"
              dangerouslySetInnerHTML={{
                __html: t("WebProjects.ShoppingSystem"),
              }}
            ></p>
            <div className="btnDiscoverProject">
              <a
                href="https://www.baimmobilier.fr/eko/stripe/categorie_produit/payment_process.php"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold">
                  {t("WebProjects.learnMore")}
                </button>
              </a>
            </div>
          </div>
          <div className="projects" id="GoudGuys">
            <div className="flexIMG">
              <img
                src={backgroundGoudGuys}
                alt="Site Internet Goud Guys"
                className="sizeProjectIMG"
              ></img>
            </div>
            <h4 className="HelluvaRevengeTitle fontsRegular">Goud Guys</h4>
            <p
              className="pDescription fontsLight"
              dangerouslySetInnerHTML={{
                __html: t("WebProjects.GoudGuys"),
              }}
            ></p>
            <div className="btnDiscoverProject">
              <a
                href="https://www.baimmobilier.fr/goodguys/"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold">
                  {t("WebProjects.learnMore")}
                </button>
              </a>
            </div>
          </div>
          <div className="projects" id="BAImmobilier">
            <div className="flexIMG">
              <div className="preview-div">
                <img
                  src={backgroundProjectBAImmobilier}
                  alt="Site Internet B.A Immobilier"
                  className="sizeProjectIMG"
                ></img>{" "}
                <video className="preview-video" loop muted>
                  <source src={BAImmobilierVideo} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <h4 className="HelluvaRevengeTitle fontsRegular">B.A Immobilier</h4>
            <p
              className="pDescription fontsLight"
              dangerouslySetInnerHTML={{
                __html: t("WebProjects.BAImmobilier"),
              }}
            ></p>
            <div className="btnDiscoverProject">
              <a
                href="https://baimmobilier.fr/"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold">
                  {t("WebProjects.learnMore")}
                </button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TranslatedProjectsVideosGames = withTranslation()(ProjectsWebT);

// here app catches the suspense from page in case translations are not yet loaded
export default function ProjectsWeb() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedProjectsVideosGames />
    </Suspense>
  );
}
