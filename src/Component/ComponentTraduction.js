import React, { Suspense, useEffect, useState } from "react";
import { useTranslation, withTranslation } from "react-i18next";
import { useNavigate, useLocation, useParams } from "react-router-dom";

import pikachuLoad from "../img/pikachuForm.webp";

const ComponentTraductionT = ({ t }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { lang: currentLang = "fr" } = useParams();

  const changeLanguage = (newLang) => {
    i18n.changeLanguage(newLang);
    const newPath = location.pathname.replace(`/${currentLang}`, `/${newLang}`);
    navigate(newPath);
  };

  return (
    <div>
      <button
        type="submit"
        style={{ fontWeight: i18n.language === "fr" ? "bold" : "normal" }}
        onClick={() => changeLanguage("fr")}
        className="dropdown-content traductionPojects pointer order-list-navbar-li noMargin"
      >
        {t("DropdownLanguage.FrenchLanguage")}
      </button>
      <button
        type="submit"
        style={{ fontWeight: i18n.language === "en" ? "bold" : "normal" }}
        onClick={() => changeLanguage("en")}
        className="dropdown-content traductionPojects paddingLastLanguage pointer order-list-navbar-li noMargin"
      >
        {t("DropdownLanguage.EnglishLanguage")}
      </button>
      <button
        type="submit"
        style={{ fontWeight: i18n.language === "es" ? "bold" : "normal" }}
        onClick={() => changeLanguage("es")}
        className="dropdown-content traductionPojects paddingLastLanguage pointer order-list-navbar-li noMargin"
      >
        {t("DropdownLanguage.SpanishLanguage")}
      </button>
    </div>
  );
};

const TranslatedLanguage = withTranslation()(ComponentTraductionT);

export default function ComponentTraduction() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedLanguage />
    </Suspense>
  );
}

const Loader = () => {
  const [setLoader, setshowLoader] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setshowLoader(false);
    }, 3000);
  });

  return (
    <div className="Home-header centerLoad">
      {setLoader && (
        <img src={pikachuLoad} alt="submit pikachu load" loading="lazy" />
      )}
    </div>
  );
};
export { Loader };
