import React, { Suspense, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

  const navigate = useNavigate();

  const navigateIntoPage = (string) => {
    if (string != "Incoming") {
      sessionStorage.setItem("ShowTitleInNavbar", "true");
    }
    navigate(string);
  };

  const [showIncomingTitle, setShowIncomingTitle] = useState(false);
  useEffect(() => {
    const storedValue = sessionStorage.getItem("ShowTitleInNavbar");
    if (storedValue === "true") {
      setShowIncomingTitle(true);
    } else if (storedValue === "false") {
      setShowIncomingTitle(false);
    }
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
          <button
            className="noColor fontsRegular btnNavbar submitForm navbar-font"
            onClick={() => navigateIntoPage("/arthur")}
          >
            <li className="order-list-navbar-li fontsBold">
              {t("ClassicNavBar.Home")}
            </li>
          </button>
          <div className="dropdown">
            <button
              className="noColor fontsRegular btnNavbar submitForm navbar-font"
              onClick={() => navigateIntoPage("/Gamejam")}
            >
              <li className="order-list-navbar-li fontsBold">
                {t("ClassicNavBar.GameJam")}
              </li>
            </button>
          </div>
          <button
            className="noColor fontsRegular btnNavbar submitForm navbar-font"
            onClick={() => navigateIntoPage("/Unity")}
          >
            <li className="order-list-navbar-li fontsBold">
              {t("ClassicNavBar.Unity")}
            </li>
          </button>
          <DropdownProject isFixed={true} />
          <DropdownCV isFixed={true} />
          <div className="dropdown">
            <button
              className="noColor fontsRegular btnNavbar submitForm navbar-font"
              onClick={() => navigateIntoPage("/contactme")}
            >
              <li className="order-list-navbar-li fontsBold">
                {t("ClassicNavBar.ContactMe")}
              </li>
            </button>
          </div>
        </ul>
        {showIncomingTitle && (
          <ul className="order-list-navbar-ul add-no-margin-incoming">
            <button
              className="noColor fontsRegular btnNavbar submitForm navbar-font"
              onClick={() => navigateIntoPage("/Incoming")}
            >
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
            </button>
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
