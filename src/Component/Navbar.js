import React, { Suspense, useState, useEffect } from "react";
import DropdownProject from "./DropdownProject.js";
import DropdownCV from "./DropdownCV.js";
import DropdownTraduction from "./DropdownTraduction.js";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation } from "react-i18next";

// Icon
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

const NavbarT = ({ t }) => {
  const [showNavbarBool, setShowNavbarBool] = useState(true);

  const handleNavbarBtnClick = () => {
    setShowNavbarBool(!showNavbarBool);
  };

  useEffect(() => {
    sessionStorage.setItem("ShowTitleInNavbar", "true");
  }, []);

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
          <a className="link-navbar" href="arthur">
            <li className="order-list-navbar-li fontsBold">
              {t("ClassicNavBar.Home")}
            </li>
          </a>
          <a className="link-navbar" href="GameJam">
            <li className="order-list-navbar-li fontsBold">
              {t("ClassicNavBar.GameJam")}
            </li>
          </a>
          <a className="link-navbar" href="Unity">
            <li className="order-list-navbar-li fontsBold">
              {t("ClassicNavBar.Unity")}
            </li>
          </a>
          <DropdownProject isFixed={true} />
          <DropdownCV isFixed={true} />
          <a className="link-navbar" href="contactme">
            <li className="order-list-navbar-li fontsBold">
              {t("ClassicNavBar.ContactMe")}
            </li>
          </a>
        </ul>
        {sessionStorage.getItem("ShowTitleInNavbar") === "true" && (
          <ul className="order-list-navbar-ul add-no-margin-incoming">
            <a className="link-navbar" href="Incoming">
              <li className="order-list-navbar-li fontsBold order-list-navbar-li-add-incoming">
                <div className="width flex-end">
                  <FontAwesomeIcon
                    icon={faCircle}
                    beatFade
                    style={{ color: "#63E6BE" }}
                    className="removeMargin"
                  />
                  <h4 className="Home">{t("ClassicNavBar.Incoming")}</h4>
                </div>
              </li>
            </a>
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
