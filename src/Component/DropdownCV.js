import React, { Suspense, useState, useRef, useEffect } from "react";
import CVArthurCPP from "../Download/CV-Arthur-JV.png";
import CVArthurCPPEN from "../Download/ArthurCVJV-EN.png";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

// Traduction
import { Loader } from "./ComponentTraduction";
import { useTranslation } from "react-i18next";

import "../css/Home.css";

const DropdownCV = ({ isFixed = false }) => {
  const { t, i18n } = useTranslation();
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

  useEffect(() => {
    setShowDropdown(false);
  }, [i18n.language]);

  const fixedClass = isFixed ? "position-fixed" : "";
  const cvToDownload = i18n.language.startsWith("fr")
    ? CVArthurCPP
    : CVArthurCPPEN;

  return (
    <div ref={dropdownRef}>
      <li className="order-list-navbar-li">
        <ol></ol>
        <button className="dropbtn fontsBold" onClick={toggleDropdown}>
          CV
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
          <a
            className="link-navbar dropdownSize fontsRegular"
            href={cvToDownload}
            target="_blank"
            rel="noreferrer"
          >
            {t("TypeCV.CVJV")}
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

export default function DropdownCVWrapper({ isFixed = false }) {
  return (
    <Suspense fallback={<Loader />}>
      <DropdownCV isFixed={isFixed} />
    </Suspense>
  );
}
