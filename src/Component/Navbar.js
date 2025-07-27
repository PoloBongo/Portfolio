import React, { Suspense, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CVArthurCPP from "../Download/CV-Arthur-JV.png";
import CVArthurCPPEN from "../Download/ArthurCVJV-EN.png";
import DropdownTraduction from "./DropdownTraduction.js";
import { Loader } from "./ComponentTraduction";
import { withTranslation, useTranslation } from "react-i18next";

const NavbarT = ({ t }) => {
  const { i18n } = useTranslation();
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
      web: true,
    },
    "/Arthur": {
      home: false,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
      web: true,
    },
    "/Unity": {
      home: true,
      unity: false,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
      web: true,
    },
    "/Unreal": {
      home: true,
      unity: true,
      unreal: false,
      Gamejam: true,
      videoGame: true,
      contact: true,
      web: true,
    },
    "/Gamejam": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: false,
      videoGame: true,
      contact: true,
      web: true,
    },
    "/ProjectsVideosGames": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: false,
      contact: true,
      web: true,
    },
    "/contactme": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: false,
      web: true,
    },
    "/Incoming": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
      web: true,
    },
    "/ProjectsWeb": {
      home: true,
      unity: true,
      unreal: true,
      Gamejam: true,
      videoGame: true,
      contact: true,
      web: false,
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
      <li className="navbar-item">
        <button className="navbar-link" onClick={() => navigateIntoPage(path)}>
          {t(label)}
        </button>
      </li>
    );
  };

  const cvToDownload = i18n.language.startsWith("fr")
    ? CVArthurCPP
    : CVArthurCPPEN;

  const isHome = location.pathname === "/" || location.pathname === "/Arthur";

  return (
    <div className="navbar-container">
      <input type="checkbox" id="menu-toggle" className="menu-toggle" />
      <label
        htmlFor="menu-toggle"
        className={`${isHome ? "menu-icon-home" : "menu-icon"}`}
      >
        <span></span>
        <span></span>
        <span></span>
      </label>
      <nav className="navbar-vertical">
        <ul>
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
            pageVisibility[location.pathname]?.unity,
            "/Unity",
            "ClassicNavBar.Unity"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.Gamejam,
            "/Gamejam",
            "ClassicNavBar.GameJam"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.web,
            "/ProjectsWeb",
            "DropdownProjects.ProjectWeb"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.videoGame,
            "/ProjectsVideosGames",
            "DropdownProjects.ProjectVideoGames"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.contact,
            "/contactme",
            "ClassicNavBar.ContactMe"
          )}
          <li className="navbar-item">
            <a
              className="navbar-link"
              href={cvToDownload}
              target="_blank"
              rel="noreferrer"
            >
              {t("ClassicNavBar.CV")}
            </a>
          </li>
          {showIncomingTitle &&
            renderNavbarButton(true, "/Incoming", "ClassicNavBar.Incoming")}
        </ul>
      </nav>
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
