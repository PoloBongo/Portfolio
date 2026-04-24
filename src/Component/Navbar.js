import React, { Suspense, useState, useEffect, useRef } from "react";
import { useLocation, Link, useParams } from "react-router-dom";
import CVArthurCPP from "../Download/CV-Arthur-JV.png";
import CVArthurCPPEN from "../Download/ArthurCVJV-EN.png";
import DropdownTraduction from "./DropdownTraduction.js";
import { Loader } from "./ComponentTraduction";
import { withTranslation, useTranslation } from "react-i18next";

const NavbarT = ({ t, tabIndex }) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const { lang = "fr" } = useParams();
  const pagePath = "/" + (location.pathname.split("/").slice(2).join("/") || "");

  const [menuOpen, setMenuOpen] = useState(false);
  const [showIncomingTitle, setShowIncomingTitle] = useState(false);

  const menuToggleRef = useRef(null);
  const navRef = useRef(null);

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
    "/GameJam": {
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
    "/contactMe": {
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setMenuOpen((prev) => !prev);
    }
  };

  useEffect(() => {
    if (menuOpen && navRef.current) {
      const focusableEls = navRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableEls.length > 0) focusableEls[0].focus();
    }
  }, [menuOpen]);

  const handleNavKeyDown = (e) => {
    if (!menuOpen) return; // focus trap actif seulement si menu ouvert

    if (e.key === "Tab") {
      const focusableEls = navRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusableEls[0];
      const last = focusableEls[focusableEls.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === "Escape") {
      setMenuOpen(false);
      menuToggleRef.current.focus();
    }
  };

  const handleNavClick = (path) => {
    setShowIncomingTitle(path === "/Incoming");
    sessionStorage.setItem("ShowTitleInNavbar", path === "/Incoming" ? "false" : "true");
  };

  const renderNavbarButton = (visible, path, label) => {
    if (!visible) return null;
    return (
      <li className="navbar-item">
        <Link
          className="navbar-link"
          to={`/${lang}${path}`}
          onClick={() => handleNavClick(path)}
          tabIndex={menuOpen ? 0 : -1}
        >
          {t(label)}
        </Link>
      </li>
    );
  };

  const cvToDownload = i18n.language.startsWith("fr")
    ? CVArthurCPP
    : CVArthurCPPEN;
  const isHome = pagePath === "/" || pagePath === "/Arthur" || pagePath === "";

  return (
    <div className="navbar-container">
      <input
        ref={menuToggleRef}
        type="checkbox"
        id="menu-toggle"
        className="menu-toggle"
        checked={menuOpen}
        onChange={() => setMenuOpen((prev) => !prev)}
        tabIndex={-1}
      />
      <label
        htmlFor="menu-toggle"
        role="button"
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex || 0}
        className={`${isHome ? "menu-icon-home" : "menu-icon"}`}
      >
        <span></span>
        <span></span>
        <span></span>
      </label>
      <nav
        ref={navRef}
        className="navbar-vertical"
        onKeyDown={menuOpen ? handleNavKeyDown : undefined}
      >
        <ul>
          <DropdownTraduction tabIndex={menuOpen ? 0 : -1} />
          {renderNavbarButton(
            pageVisibility[pagePath]?.home,
            "",
            "ClassicNavBar.Home"
          )}
          {renderNavbarButton(
            pageVisibility[pagePath]?.unity,
            "/Unity",
            "ClassicNavBar.Unity"
          )}
          {renderNavbarButton(
            pageVisibility[pagePath]?.unreal,
            "/Unreal",
            "ClassicNavBar.Unreal"
          )}
          {renderNavbarButton(
            pageVisibility[pagePath]?.Gamejam,
            "/Gamejam",
            "ClassicNavBar.GameJam"
          )}
          {renderNavbarButton(
            pageVisibility[pagePath]?.videoGame,
            "/ProjectsVideosGames",
            "DropdownProjects.ProjectVideoGames"
          )}
          {renderNavbarButton(
            pageVisibility[pagePath]?.web,
            "/ProjectsWeb",
            "DropdownProjects.ProjectWeb"
          )}
          {renderNavbarButton(
            pageVisibility[pagePath]?.contact,
            "/contactMe",
            "ClassicNavBar.ContactMe"
          )}
          <li className="navbar-item">
            <a
              className="navbar-link"
              href={cvToDownload}
              target="_blank"
              rel="noreferrer"
              tabIndex={menuOpen ? 0 : -1}
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

export default function Navbar(props) {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedNavbar {...props} />
    </Suspense>
  );
}
