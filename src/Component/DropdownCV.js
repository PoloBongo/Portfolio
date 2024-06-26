import React, { Suspense, useState, useRef, useEffect } from "react";
import CVArthurCPP from "../Download/CV-Arthur-JV.png";
import CVArthurWEB from "../Download/CV-Arthur-WEB.pdf";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation } from "react-i18next";

import "../css/Home.css";

const DropdownCVT = ({ t }) => {
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
          CV
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
            href={CVArthurCPP}
            target="_blank"
            rel="noreferrer"
          >
            {t("TypeCV.CVJV")}
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="marginDownloadIcon"
            />
          </a>
          <a
            className="link-navbar dropdownSize fontsRegular"
            href={CVArthurWEB}
            target="_blank"
            rel="noreferrer"
          >
            {t("TypeCV.CVWeb")}
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              className="marginDownloadIcon"
            />
          </a>
        </div>
      )}
    </div>
  );
};

const TranslatedDropdownCV = withTranslation()(DropdownCVT);

export default function DropdownCV() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedDropdownCV />
    </Suspense>
  );
}
