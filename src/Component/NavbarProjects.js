import React, { Suspense, useState } from "react";
// import DropdownProject from "./DropdownProject";
// import DropdownCV from "./DropdownCV";
import CVArthurCPP from "../Download/CV-Arthur-JV.png";
import DropdownTraduction from "./DropdownTraduction";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation } from "react-i18next";

const NavbarProjectsT = ({ t }) => {
  const [showNavbarBool, setShowNavbarBool] = useState(false);

  const handleNavbarBtnClick = () => {
    setShowNavbarBool(!showNavbarBool);
  };

  const handleUnityPagebtnClick = () => {
    localStorage.setItem("ActiveBtnNavbarUnityPage", "true");
  };

  return (
    <div>
      <button className="btnNavbarProjects" onClick={handleNavbarBtnClick}>
        <h5 id="navbarHomeBtn" className="sizeCategoryProjectGames fontsBold">
          Navbar
        </h5>
      </button>
      <div
        style={{
          opacity: showNavbarBool ? 1 : 0,
          visibility: showNavbarBool ? "visible" : "hidden",
          maxHeight: showNavbarBool ? "200px" : "0",
          transition: "all 0.5s ease-in-out",
        }}
        className="dropdown-content-NProjects overflowNavbarProjects scroll-bar-navbar-projects"
      >
        <ul className="dropdownProjectPadding">
          <DropdownTraduction />
        </ul>
        <ul className="backgroundUnderCategory">
          <a href="/" className="noColorNavbar fontsBold">
            {t("ClassicNavBar.Home")}
          </a>
        </ul>
        <ul className="backgroundUnderCategory">
          <a className="noColorNavbar fontsBold" href="GameJam">
            {t("ClassicNavBar.GameJam")}
          </a>
        </ul>
        <ul className="backgroundUnderCategory">
          <button
            className="noColor fontsRegular btnNavbarProject submitForm"
            onClick={handleUnityPagebtnClick}
          >
            <a href="ProjectsVideosGames" className="noColorNavbar fontsBold">
              {t("BottomNavBarProjects.Unity")}
            </a>
          </button>
        </ul>
        <ul className="backgroundUnderCategory">
          <a className="noColorNavbar fontsBold" href="Unreal">
            {t("ClassicNavBar.Unreal")}
          </a>
        </ul>
        {/* <ul className="dropdownProjectPadding">
          <DropdownProject isFixed={false} />
        </ul> */}
        {/* <ul className="dropdownProjectPadding">
          <DropdownCV isFixed={false} />
        </ul> */}
        <ul className="backgroundUnderCategory">
          <a
            className="noColorNavbar fontsBold"
            href={CVArthurCPP}
            target="_blank"
            rel="noreferrer"
          >
            {t("TopNavBarProjects.CV")}
          </a>
        </ul>
        <ul className="backgroundUnderCategory">
          <a href="contactme" className="noColorNavbar fontsBold">
            {t("ClassicNavBar.ContactMe")}
          </a>
        </ul>
      </div>
    </div>
  );
};

const TranslatedNavbarProjects = withTranslation()(NavbarProjectsT);

export default function NavbarProjects() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedNavbarProjects />
    </Suspense>
  );
}
