import React, { Suspense, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CVArthurCPP from "../Download/CV-Arthur-JV.png";
import CVArthurCPPEN from "../Download/ArthurCVJV-EN.png";
import DropdownTraduction from "./DropdownTraduction.js";
import { Loader } from "./ComponentTraduction";
import { withTranslation, useTranslation } from "react-i18next";

const NavbarT = ({ t, tabIndex }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

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

  const renderNavbarButton = (visible, path, label) => {
    if (!visible) return null;
    return (
      <li className="navbar-item">
        <button
          className="navbar-link"
          onClick={() => navigateIntoPage(path)}
          tabIndex={menuOpen ? 0 : -1}
        >
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
            pageVisibility[location.pathname]?.home,
            "/Arthur",
            "ClassicNavBar.Home"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.unity,
            "/Unity",
            "ClassicNavBar.Unity"
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
            pageVisibility[location.pathname]?.videoGame,
            "/ProjectsVideosGames",
            "DropdownProjects.ProjectVideoGames"
          )}
          {renderNavbarButton(
            pageVisibility[location.pathname]?.web,
            "/ProjectsWeb",
            "DropdownProjects.ProjectWeb"
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
