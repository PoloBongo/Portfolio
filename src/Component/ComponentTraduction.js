import React, { Suspense, useEffect, useState } from "react";
import { useTranslation, withTranslation } from "react-i18next";

import pikachuLoad from "../img/pikachuForm.webp";

const FLAG_CLASS = "pikachuForm";

const preloadImage = (url) => {
  const img = new Image();
  img.src = url;
};

// page uses the hook
const ComponentTraductionT = ({ t }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.addedNodes &&
          mutation.addedNodes.length > 0 &&
          mutation.addedNodes[0].classList &&
          mutation.addedNodes[0].classList.contains(FLAG_CLASS)
        ) {
          preloadImage(pikachuLoad);
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
      {setLoader && <img src={pikachuLoad} alt="submit pikachu load" />}
    </div>
  );
};
export { Loader };
