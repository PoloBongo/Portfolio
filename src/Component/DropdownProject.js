import React, { Suspense, useState, useRef, useEffect } from "react";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation } from "react-i18next";

import "../css/Home.css";

const DropdownProjectT = ({ t }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowDropdown(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="dropdown" ref={dropdownRef}>
      <li className="order-list-navbar-li">
        <button className="dropbtn fontsBold" onClick={toggleDropdown}>
          {t("ClassicNavBar.Projects")}
        </button>
      </li>
      {showDropdown && (
        <div
          className="dropdown-content-Projects"
          style={{
            overflow: "hidden",
            animation: `${showDropdown ? "fadeIn" : "fadeOut"} 2s ease`,
          }}
        >
          <a
            className="link-navbar dropdownSize fontsRegular"
            href="ProjectsVideosGames"
          >
            {t("DropdownProjects.ProjectVideoGames")}
          </a>
          <a
            className="link-navbar dropdownSize fontsRegular"
            href="ProjectsWeb"
          >
            {t("DropdownProjects.ProjectWeb")}
          </a>
        </div>
      )}
    </div>
  );
};

const TranslatedDropdownProjects = withTranslation()(DropdownProjectT);

export default function DropdownProject() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedDropdownProjects />
    </Suspense>
  );
}
