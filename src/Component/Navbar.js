import React, { Suspense, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CVArthurCPP from "../Download/CV-Arthur-JV.png";
import DropdownTraduction from "./DropdownTraduction.js";
import { Loader } from "./ComponentTraduction";
import { withTranslation } from "react-i18next";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

const NavbarT = ({ t }) => {
  const [showNavbarBool, setShowNavbarBool] = useState(true);
  const [showIncomingTitle, setShowIncomingTitle] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const pageVisibility = {
    "/": {
      home: false,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
    },
    "/Arthur": {
      home: false,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
    },
    "/Unity": {
      home: true,
      unity: false,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
    },
    "/Unreal": {
      home: true,
      unity: true,
      unreal: false,
      Gamejam: true,
      videoGame: true,
      contact: true,
    },
    "/Gamejam": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: false,
      videoGame: true,
      contact: true,
    },
    "/ProjectsVideosGames": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: false,
      contact: true,
    },
    "/contactme": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: false,
    },
    "/Incoming": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
    },
    "/ProjectsWeb": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
    },
  };

  useEffect(() => {
    const storedValue = sessionStorage.getItem("ShowTitleInNavbar");
    setShowIncomingTitle(storedValue === "true");
  }, [location.pathname]);

  const navigateIntoPage = (path) => {
    setShowIncomingTitle(path === "/Incoming");
    sessionStorage.setItem(
      "ShowTitleInNavbar",
      path === "/Incoming" ? "false" : "true"
    );
    navigate(path);
  };

  const renderNavbarButton = (visible, path, label) => {
    if (!visible) return null;
    return (
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage(path)}
      >
        <li className="order-list-navbar-li fontsBold">{t(label)}</li>
      </button>
    );
  };

  return (
    <div className="order-list-navbar-div">
      <div className="titleName">
        <button
          className="noColor fontsRegular btnNavbar submitForm navbar-font"
          onClick={() => navigateIntoPage("/Arthur")}
        >
          <h3 className="sizeArthur fontsRegular flexIMG surbrillance padding-int">
            {t("Home.DeveloperJunior")}
          </h3>
        </button>
      </div>
      <button
        className="btnDownloadCV bubbleHomeNavbarBtn"
        onClick={() => setShowNavbarBool(!showNavbarBool)}
      >
        <div
          className="bubbleHomeNavbar"
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
        className="navbarHome width iconLinkedin navbarHome-add-incoming"
        style={{
          display: showNavbarBool ? "none" : "block",
          maxHeight: showNavbarBool ? "0" : "max-content",
          overflow: "hidden",
          transition: "all 1s ease",
        }}
      >
        <ul className="order-list-navbar-ul">
          <DropdownTraduction />
          {renderNavbarButton(
            pageVisibility[location.pathname]?.home,
            "/Arthur",
            "ClassicNavBar.Home"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.unreal,
            "/Unreal",
            "ClassicNavBar.Unreal"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.Gamejam,
            "/Gamejam",
            "ClassicNavBar.GameJam"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.unity,
            "/Unity",
            "ClassicNavBar.Unity"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.videoGame,
            "/ProjectsVideosGames",
            "DropdownProjects.ProjectVideoGames"
          )}
          <button className="noColor fontsRegular btnNavbar submitForm navbar-font">
            <li className="order-list-navbar-li fontsBold">
              <a
                className="link-navbar fontsRegular"
                href={CVArthurCPP}
                target="_blank"
                rel="noreferrer"
              >
                {t("ClassicNavBar.CV")}
              </a>
            </li>
          </button>
          {renderNavbarButton(
            pageVisibility[location.pathname]?.contact,
            "/contactme",
            "ClassicNavBar.ContactMe"
          )}
        </ul>
        {showIncomingTitle && (
          <ul className="order-list-navbar-ul add-no-margin-incoming align-items-center">
            <button
              className="noColor fontsRegular btnNavbar submitForm navbar-font"
              onClick={() => navigateIntoPage("/Incoming")}
            >
              <li className="order-list-navbar-li fontsBold order-list-navbar-li-add-incoming">
                <div className="width flex-end margin-incoming-title">
                  <FontAwesomeIcon
                    icon={faCircle}
                    beatFade
                    style={{ color: "#63E6BE" }}
                    className="removeMargin"
                  />
                  <h4 className="Home">{t("ClassicNavBar.Incoming")}</h4>
                </div>
              </li>
            </button>
            <button
              className="noColor fontsRegular btnNavbar submitForm navbar-font"
              onClick={() => navigateIntoPage("/ProjectsWeb")}
            >
              <li className="order-list-navbar-li fontsBold order-list-navbar-li-add-incoming">
                <div className="width flex-end margin-incoming-title">
                  <h4 className="Home">{t("DropdownProjects.ProjectWeb")}</h4>
                </div>
              </li>
            </button>
          </ul>
        )}
      </div>
    </div>
  );
};

const TranslatedNavbar = withTranslation()(NavbarT);

export default function Navbar() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedNavbar />
    </Suspense>
  );
}
