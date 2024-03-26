import React, { Suspense, useState } from "react";
import DropdownProject from "./DropdownProject.js";
import DropdownCV from "./DropdownCV.js";
import DropdownTraduction from "./DropdownTraduction.js";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation } from "react-i18next";

const NavbarT = ({ t }) => {
  const [showNavbarBool, setShowNavbarBool] = useState(true);

  const handleNavbarBtnClick = () => {
    setShowNavbarBool(!showNavbarBool);
  };

  return (
    <div className="order-list-navbar-div">
      <div className="titleName">
        <h3 className="sizeArthur">{t("Home.DeveloperJunior")}</h3>
      </div>
      <button
        className="btnDownloadCV bubbleHomeNavbarBtn"
        onClick={handleNavbarBtnClick}
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
        className="navbarHome width"
        style={{
          display: showNavbarBool ? "none" : "block",
          maxHeight: showNavbarBool ? "0" : "max-content",
          overflow: "hidden",
          transition: "all 1s ease",
        }}
      >
        <ul className="order-list-navbar-ul">
          <DropdownTraduction />
          <a className="link-navbar" href="arthur">
            <li className="order-list-navbar-li fontsBold">
              {t("ClassicNavBar.Home")}
            </li>
          </a>
          <DropdownProject />
          <DropdownCV />
          <a className="link-navbar" href="contactme">
            <li className="order-list-navbar-li fontsBold">
              {t("ClassicNavBar.ContactMe")}
            </li>
          </a>
        </ul>
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
