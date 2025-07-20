import { Suspense, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { faDatabase } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhp,
  faJs,
  faHtml5,
  faCss3Alt,
  faGitAlt,
  faBootstrap,
  faReact,
} from "@fortawesome/free-brands-svg-icons";

import imgCPlusLangage from "../img/c++Icon.svg";
import imgLuaLangage from "../img/luaIcon.svg";
import imgCLangage from "../img/cIcon.svg";
import imgCSharpLangage from "../img/CSharpIcon.svg";
import imgInfoIcon from "../img/infoIcon.svg";
import imgUnityIcon from "../img/unityIcon.svg";
import imgPythonIcon from "../img/pythonIcon.svg";
import imgTypeScriptIcon from "../img/typescriptIcon.svg";
import imgDevOpsLangage from "../img/DevOpsIcon.svg";
import imgSymphonyLangage from "../img/SymphonyIcon.svg";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation } from "react-i18next";

import "../css/Home.css";

const PopupMySqlT = ({ t }) => {
  const [showSqlBool, setShowSqlBool] = useState(false);
  const [showGitBool, setShowGitBool] = useState(false);
  const [showDevOpsBool, setShowDevOpsBool] = useState(false);
  const displayStatus = useRef(null);
  const MySQLCSS = useRef(null);
  const displayStatusGit = useRef(null);
  const GitCSS = useRef(null);
  const displayStatusDevOps = useRef(null);
  const DEVOPS = useRef(null);
  const [stockString, setStockString] = useState("");

  const CSSPopup = (ref, bool) => {
    if (ref.current) {
      ref.current.style.position = bool ? "absolute" : "relative";
      ref.current.style.zIndex = bool ? "100" : "0";
    }
    const elements = document.querySelectorAll("#blur");
    elements.forEach((element) => {
      if (element) {
        element.style.filter = bool ? "blur(5px)" : "blur(0px)";
      }
    });
  };

  useEffect(() => {
    CSSPopup(MySQLCSS, showSqlBool);
    // eslint-disable-next-line
  }, [showSqlBool]);

  useEffect(() => {
    CSSPopup(GitCSS, showGitBool);
    // eslint-disable-next-line
  }, [showGitBool]);

  useEffect(() => {
    CSSPopup(DEVOPS, showDevOpsBool);
    // eslint-disable-next-line
  }, [showDevOpsBool]);

  const handleSqlBtnClick = () => {
    setShowSqlBool(!showSqlBool);
    if (GitCSS.current) {
      GitCSS.current.style.filter = showSqlBool ? "blur(0px)" : "blur(5px)";
      DEVOPS.current.style.filter = showSqlBool ? "blur(0px)" : "blur(5px)";
    }
  };

  const handleGitBtnClick = () => {
    setShowGitBool(!showGitBool);
    if (MySQLCSS.current) {
      MySQLCSS.current.style.filter = showGitBool ? "blur(0px)" : "blur(5px)";
      DEVOPS.current.style.filter = showGitBool ? "blur(0px)" : "blur(5px)";
    }
  };

  const handleDevOpsBtnClick = () => {
    setShowDevOpsBool(!showDevOpsBool);
    if (DEVOPS.current) {
      MySQLCSS.current.style.filter = showDevOpsBool
        ? "blur(0px)"
        : "blur(5px)";
      GitCSS.current.style.filter = showDevOpsBool ? "blur(0px)" : "blur(5px)";
    }
  };

  const navigate = useNavigate();

  const navigateIntoPage = (string) => {
    setStockString(string);

    if (
      string === "/ProjectsVideosGames" &&
      stockString === "/ProjectsVideosGames"
    ) {
      localStorage.setItem("ActiveBtnNavbarUnityPage", "false");
      window.location.reload();
    }

    if (string === "/Unity") {
      localStorage.setItem("ActiveBtnBackUnityPage", "false");
    }
    navigate(string);
  };

  return (
    <div className="rectangleGlobal">
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/Unity")}
      >
        <div className="rectangleTool surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <img
              src={imgUnityIcon}
              className="iconSpace"
              alt="Unity Custom Engine Icon"
            ></img>
            {t("Home.Unity")}
          </div>
        </div>
      </button>
      <div className="rectangleTool" ref={DEVOPS} id="DevOps">
        <div className="infoIcon">
          <button className="btnNavbarProjects" onClick={handleDevOpsBtnClick}>
            <img
              src={imgInfoIcon}
              className="iconInfoWidth"
              alt="Info Langage Icon"
            ></img>
          </button>
        </div>
        <div className="sizeIconCPlus fontsRegular">
          <img
            src={imgDevOpsLangage}
            className="iconSpace"
            alt="DevOps Icon"
          ></img>
          {t("Home.DevOps")}
        </div>
        <div
          style={
            ({ display: showDevOpsBool ? "block" : "none" },
            {
              overflow: "hidden",
              animation: `${
                showDevOpsBool ? "fadeIn" : "fadeOut"
              } 1s ease forwards`,
            })
          }
          ref={displayStatusDevOps}
        >
          <div>
            <p
              className="sizeMySql fontsLight"
              dangerouslySetInnerHTML={{
                __html: t("Home.DevOpsDescription"),
              }}
            ></p>
          </div>
        </div>
      </div>
      <div className="rectangleTool" id="blur">
        <div className="sizeIconCPlus fontsRegular">
          <img
            src={imgSymphonyLangage}
            className="iconSpace"
            alt="Symphony Langage Icon"
          ></img>
          {t("Home.Symphony")}
        </div>
      </div>
      <div className="rectangleTool" id="blur">
        <div className="sizeIconCPlus fontsRegular">
          <img
            src={imgCLangage}
            className="iconSpace"
            alt="C Langage Icon"
          ></img>
          {t("Home.C")}
        </div>
      </div>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsVideosGames#Cpp")}
      >
        <div className="rectangleTool surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <img
              src={imgCPlusLangage}
              className="iconSpace"
              alt="C++ Langage Icon"
            ></img>
            {t("Home.C++")}
          </div>
        </div>
      </button>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsVideosGames#CSharp")}
      >
        <div className="rectangleTool surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <img
              src={imgCSharpLangage}
              className="iconSpace"
              alt="C# Langage Icon"
            ></img>
            {t("Home.C#")}
          </div>
        </div>
      </button>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsWeb")}
      >
        <div className="rectangleTool surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <FontAwesomeIcon
              icon={faPhp}
              color="#bc63ff"
              className="iconSpace iconResponsive"
            />
            {t("Home.PHP")}
          </div>
        </div>
      </button>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsWeb")}
      >
        <div className="rectangleTool surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <FontAwesomeIcon
              icon={faJs}
              color="#bc63ff"
              className="iconSpace iconResponsive"
            />
            {t("Home.JavaScript")}
          </div>
        </div>
      </button>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsWeb")}
      >
        <div className="rectangleTool fontsRegular surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <FontAwesomeIcon
              icon={faHtml5}
              color="#bc63ff"
              className="iconSpace iconResponsive"
            />
            {t("Home.HTML")}
          </div>
        </div>
      </button>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsWeb")}
      >
        <div className="rectangleTool fontsRegular surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <FontAwesomeIcon
              icon={faCss3Alt}
              color="#bc63ff"
              className="iconSpace iconResponsive"
            />
            {t("Home.CSS")}
          </div>
        </div>
      </button>
      <div className="rectangleTool fontsRegular" ref={MySQLCSS} id="MySql">
        <div className="infoIcon">
          <button className="btnNavbarProjects" onClick={handleSqlBtnClick}>
            <img
              src={imgInfoIcon}
              className="iconInfoWidth"
              alt="Info Langage Icon"
            ></img>
          </button>
        </div>
        <div className="sizeIconCPlus fontsRegular">
          <FontAwesomeIcon
            icon={faDatabase}
            color="#bc63ff"
            className="iconSpace iconResponsive"
          />
          {t("Home.MySQL")}
        </div>
        <div
          style={
            ({ display: showSqlBool ? "block" : "none" },
            {
              animation: `${
                showSqlBool ? "fadeIn" : "fadeOut"
              } 1s ease forwards`,
            })
          }
          className="overflowPopup"
          ref={displayStatus}
        >
          <div>
            <p
              className="sizeMySql fontsLight"
              dangerouslySetInnerHTML={{
                __html: t("Home.MySQLDescription"),
              }}
            ></p>
          </div>
        </div>
      </div>
      <div className="rectangleTool fontsRegular" ref={GitCSS} id="Git">
        <div className="infoIcon">
          <button className="btnNavbarProjects" onClick={handleGitBtnClick}>
            <img
              src={imgInfoIcon}
              className="iconInfoWidth"
              alt="Info Langage Icon"
            ></img>
          </button>
        </div>
        <div className="sizeIconCPlus fontsRegular">
          <FontAwesomeIcon
            icon={faGitAlt}
            color="#bc63ff"
            className="iconSpace iconResponsive"
          />
          {t("Home.Git")}
        </div>
        <div
          style={
            ({ display: showGitBool ? "block" : "none" },
            {
              overflow: "hidden",
              animation: `${
                showGitBool ? "fadeIn" : "fadeOut"
              } 1s ease forwards`,
            })
          }
          ref={displayStatusGit}
        >
          <div>
            <p
              className="sizeMySql fontsLight"
              dangerouslySetInnerHTML={{
                __html: t("Home.GitDescription"),
              }}
            ></p>
          </div>
        </div>
      </div>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsWeb")}
      >
        <div className="rectangleTool fontsRegular surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <FontAwesomeIcon
              icon={faBootstrap}
              color="#bc63ff"
              className="iconSpace iconResponsive"
            />
            {t("Home.Bootstrap")}
          </div>
        </div>
      </button>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsVideosGames#Python")}
      >
        <div className="rectangleTool fontsRegular surbrillance" id="blur">
          <div className="sizeIconCPlus fontsRegular">
            <img
              src={imgPythonIcon}
              className="iconSpace"
              alt="Python Icon"
            ></img>
            {t("Home.Python")}
          </div>
        </div>
      </button>
      <div className="rectangleTool fontsRegular" id="blur">
        <div className="sizeIconCPlus fontsRegular">
          <FontAwesomeIcon
            icon={faReact}
            color="#bc63ff"
            className="iconSpace iconResponsive"
          />
          {t("Home.React")}
        </div>
      </div>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsVideosGames#LUA")}
      >
        <div className="rectangleTool fontsRegular surbrillance" id="blur">
          <div className="sizeIconCPlus">
            <img
              src={imgLuaLangage}
              className="iconSpace"
              alt="Lua Langage Icon"
            ></img>
            {t("Home.LUA")}
          </div>
        </div>
      </button>
      <button
        className="noColor fontsRegular btnNavbar submitForm navbar-font"
        onClick={() => navigateIntoPage("/ProjectsVideosGames#LUA")}
      >
        <div className="rectangleTool fontsRegular surbrillance" id="blur">
          <div className="sizeIconCPlus">
            <img
              src={imgTypeScriptIcon}
              className="iconSpace"
              alt="TypeScript Langage Icon"
            ></img>
            {t("Home.TypeScript")}
          </div>
        </div>
      </button>
    </div>
  );
};

const TranslatedPopupLanguage = withTranslation()(PopupMySqlT);

export default function PopupMySql() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedPopupLanguage />
    </Suspense>
  );
}
