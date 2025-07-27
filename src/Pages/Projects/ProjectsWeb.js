import "../../css/Home.css";
import React, { Suspense, useEffect } from "react";
import Navbar from "../../Component/Navbar.js";

// image
import backgroundPortfolio from "../../img/backgroundReactPortfolio.webp";

// Traduction
import { Loader } from "../../Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";

const ProjectsWebT = ({ t }) => {
  useEffect(() => {
    const anchor = window.location.hash?.substring(1);
    if (anchor) {
      const el = document.getElementById(anchor);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, []);
  return (
    <div className="Home-header overflowHidden fontsRegular">
      <Navbar />
      <div className="traitSeparator" id="blur"></div>
      <div>
        <div className="contactMeFlex align-items-center fixBackBtnUnity">
          <h3 className="fontsBold underline titleUnityPage" id="blur">
            {t("WebProjects.Title")}
          </h3>
        </div>
        <div className="grid-gamejam2">
          <div className="marge-contact-play modernEnvelop" id="blur">
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Celtic La Riche Basket</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/69aCHSjtFrw"
                title="youtubeVideoPresentationCelticLaRicheBasket"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <div className="grid-gamejam">
              <p className="text-align-left padding-1vw font-size-large">
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Langage")}
                  </span>{" "}
                  {t("WebProjects.CelticLaRicheBasket.Langage")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Duration")}
                  </span>{" "}
                  {t("WebProjects.CelticLaRicheBasket.Duration")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Completion")}
                  </span>{" "}
                  {t("WebProjects.CelticLaRicheBasket.Completion")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.TeamSize")}
                  </span>{" "}
                  {t("WebProjects.CelticLaRicheBasket.TeamSize")}
                </p>
                <p>
                  <span className="colorPurple">
                    {t("VideoGamesProjects.Role")}
                  </span>{" "}
                  {t("WebProjects.CelticLaRicheBasket.Role")}
                </p>
              </p>
              <p className="text-align-left padding-1vw font-size-large">
                <p
                  dangerouslySetInnerHTML={{
                    __html: t("WebProjects.CelticLaRicheBasket.Description"),
                  }}
                ></p>
              </p>
            </div>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/WebSite-Basket"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
              <a
                href="https://www.celticlarichebasket.fr/"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                  {t("WebProjects.aboutWebsite")}
                </button>
              </a>
            </div>
          </div>
        </div>
        <div className="grid-gamejam">
          <div className="marge-contact-play modernEnvelop" id="VueJs">
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Meteo Dashboard</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/Ybs2jAo-N-I"
                title="youtubeVideoPresentation"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Langage")}
                </span>{" "}
                {t("WebProjects.MeteoDashboard.Langage")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Duration")}
                </span>{" "}
                {t("WebProjects.MeteoDashboard.Duration")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Completion")}
                </span>{" "}
                {t("WebProjects.MeteoDashboard.Completion")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.TeamSize")}
                </span>{" "}
                {t("WebProjects.MeteoDashboard.TeamSize")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Role")}
                </span>{" "}
                {t("WebProjects.MeteoDashboard.Role")}
              </p>
            </p>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.MeteoDashboard.Description"),
                }}
              ></p>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/VueJS_MeteoDashboard"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  opacity: "1",
                  overflow: "hidden",
                  transition: "all 1s ease",
                }}
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
              <a
                href="https://polobongo.github.io/VueJS_MeteoDashboard/"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                  {t("WebProjects.aboutWebsite")}
                </button>
              </a>
            </div>
          </div>
          <div className="marge-contact-play modernEnvelop" id="blur">
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">
                {t("WebProjects.PaymentPage.PaymentPageTitle")}
              </h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/le0FzwEJX_I"
                title="youtubeVideoPresentationPaymentPage"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Langage")}
                </span>{" "}
                {t("WebProjects.PaymentPage.Langage")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Duration")}
                </span>{" "}
                {t("WebProjects.PaymentPage.Duration")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Completion")}
                </span>{" "}
                {t("WebProjects.PaymentPage.Completion")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.TeamSize")}
                </span>{" "}
                {t("WebProjects.PaymentPage.TeamSize")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Role")}
                </span>{" "}
                {t("WebProjects.PaymentPage.Role")}
              </p>
            </p>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.PaymentPage.Description"),
                }}
              ></p>
            </p>
          </div>
          <div className="marge-contact-play modernEnvelop" id="blur">
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Eko</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/gKIXjwVwrMg"
                title="youtubeVideoPresentationEkoProject"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Langage")}
                </span>{" "}
                {t("WebProjects.Eko.Langage")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Duration")}
                </span>{" "}
                {t("WebProjects.Eko.Duration")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Completion")}
                </span>{" "}
                {t("WebProjects.Eko.Completion")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.TeamSize")}
                </span>{" "}
                {t("WebProjects.Eko.TeamSize")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Role")}
                </span>{" "}
                {t("WebProjects.Eko.Role")}
              </p>
            </p>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.Eko.Description"),
                }}
              ></p>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://github.com/PoloBongo/eko-commerce-project"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("VideoGamesProjects.viewMoreCode")}
                </button>
              </a>
            </div>
          </div>
          <div className="marge-contact-play modernEnvelop" id="blur">
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">B.A Immobilier</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/mfMnkY3wAvs"
                title="youtubeVideoPresentationEkoProject"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Langage")}
                </span>{" "}
                {t("WebProjects.BAImmobilier.Langage")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Duration")}
                </span>{" "}
                {t("WebProjects.BAImmobilier.Duration")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Completion")}
                </span>{" "}
                {t("WebProjects.BAImmobilier.Completion")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.TeamSize")}
                </span>{" "}
                {t("WebProjects.BAImmobilier.TeamSize")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Role")}
                </span>{" "}
                {t("WebProjects.BAImmobilier.Role")}
              </p>
            </p>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.BAImmobilier.Description"),
                }}
              ></p>
            </p>
          </div>
          <div className="marge-contact-play modernEnvelop" id="blur">
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Portfolio</h3>
            </div>
            <div className="flexIMG width">
              <img
                src={backgroundPortfolio}
                loading="lazy"
                alt="Protfolio Preview"
                className="sizeProjectIMG"
              ></img>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Langage")}
                </span>{" "}
                {t("WebProjects.Portfolio.Langage")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Duration")}
                </span>{" "}
                {t("WebProjects.Portfolio.Duration")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.Completion")}
                </span>{" "}
                {t("WebProjects.Portfolio.Completion")}
              </p>
              <p>
                <span className="colorPurple">
                  {t("VideoGamesProjects.TeamSize")}
                </span>{" "}
                {t("WebProjects.Portfolio.TeamSize")}
              </p>
            </p>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.Portfolio.Description"),
                }}
              ></p>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TranslatedHome = withTranslation()(ProjectsWebT);

export default function ProjectsWeb() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
