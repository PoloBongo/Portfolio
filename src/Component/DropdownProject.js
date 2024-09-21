import React, { Suspense, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation } from "react-i18next";

import "../css/Home.css";

const DropdownProjectT = ({ t, isFixed = false }) => {
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

  const navigate = useNavigate();

  const goToProjectsVideosGames = () => {
    navigate("/ProjectsVideosGames");
  };

  const goToProjectsWeb = () => {
    navigate("/ProjectsWeb");
  };

  const fixedClass = isFixed ? "position-fixed" : "";

  return (
    <div className="dropdown" ref={dropdownRef}>
      <li className="order-list-navbar-li">
        <button className="dropbtn fontsBold" onClick={toggleDropdown}>
          {t("ClassicNavBar.Projects")}
        </button>
      </li>
      {showDropdown && (
        <div
          className={`dropdown-content-Projects ${fixedClass}`}
          style={{
            overflow: "hidden",
            animation: `${showDropdown ? "fadeIn" : "fadeOut"} 2s ease`,
          }}
        >
          <button
            className="noColor fontsRegular btnNavbarProject submitForm font-weight-100"
            onClick={goToProjectsVideosGames}
          >
            {t("DropdownProjects.ProjectVideoGames")}
          </button>
          <button
            className="noColor fontsRegular btnNavbarProject submitForm font-weight-100"
            onClick={goToProjectsWeb}
          >
            {t("DropdownProjects.ProjectWeb")}
          </button>
        </div>
      )}
    </div>
  );
};

const TranslatedDropdownProjects = withTranslation()(DropdownProjectT);

export default function DropdownProject({ isFixed = false }) {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedDropdownProjects isFixed={isFixed} />
    </Suspense>
  );
}
