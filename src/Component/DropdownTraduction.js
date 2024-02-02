import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";

// country flag
import France from "../img/flag/france.webp";
import Anglais from "../img/flag/anglais.webp";
import Espagne from "../img/flag/espagne.webp";

// Traduction
import ComponentTraductionProject from "./ComponentTraduction";

import "../css/Home.css";

const FLAG_CLASS = "flag";
const FADE_DURATION = "2s";

const getFlag = (language) => {
  switch (language) {
    case "fr":
      return France;
    case "en":
      return Anglais;
    case "es":
      return Espagne;
    default:
      return France;
  }
};

const preloadImage = (url) => {
  const img = new Image();
  img.src = url;
};

const DropdownTraduction = () => {
  const { i18n } = useTranslation();
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
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.addedNodes &&
          mutation.addedNodes.length > 0 &&
          mutation.addedNodes[0].classList &&
          mutation.addedNodes[0].classList.contains(FLAG_CLASS)
        ) {
          preloadImage(France);
          preloadImage(Anglais);
          preloadImage(Espagne);
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
    <div className="dropdown" ref={dropdownRef}>
      <li className="order-list-navbar-li">
        <button
          className="dropbtn fontsBold displayBtn"
          onClick={toggleDropdown}
        >
          <img src={getFlag(i18n.language)} alt="Drapeaux" loading="lazy"></img>
        </button>
      </li>
      {showDropdown && (
        <div
          className="dropdown-content"
          style={{
            overflow: "hidden",
            animation: `${
              showDropdown ? "fadeIn" : "fadeOut"
            } ${FADE_DURATION} ease`,
          }}
        >
          <ComponentTraductionProject />
        </div>
      )}
    </div>
  );
};

export default DropdownTraduction;
