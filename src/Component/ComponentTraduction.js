import React, { Suspense, useEffect, useState } from "react";
import { useTranslation, withTranslation } from "react-i18next";

import pikachuLoad from "../img/pikachuForm.webp";

// page uses the hook
const ComponentTraductionT = ({ t }) => {
  const { i18n } = useTranslation();

  return (
    <div>
      <button
        type="submit"
        style={{ fontWeight: i18n.language === "fr" ? "bold" : "normal" }}
        onClick={() => i18n.changeLanguage("fr")}
        className="dropdown-content traductionPojects pointer order-list-navbar-li noMargin"
      >
        {t("DropdownLanguage.FrenchLanguage")}
      </button>
      <button
        type="submit"
        style={{ fontWeight: i18n.language === "en" ? "bold" : "normal" }}
        onClick={() => i18n.changeLanguage("en")}
        className="dropdown-content traductionPojects paddingLastLanguage pointer order-list-navbar-li noMargin"
      >
        {t("DropdownLanguage.EnglishLanguage")}
      </button>
      <button
        type="submit"
        style={{ fontWeight: i18n.language === "es" ? "bold" : "normal" }}
        onClick={() => i18n.changeLanguage("es")}
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
