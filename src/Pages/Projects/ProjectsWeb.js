import "../../css/Home.css";
import React, { Suspense } from "react";
import Navbar from "../../Component/Navbar.js";

// image
import backgroundPortfolio from "../../img/backgroundReactPortfolio.webp";

// Traduction
import { Loader } from "../../Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";

const ProjectsWebT = ({ t }) => {
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
        <div className="grid-gamejam">
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
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
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.Celtic"),
                }}
              ></p>
              <strong className="underline">
                {t("WebProjects.CelticTechno")}
              </strong>
            </p>
            <div className="btnDiscoverProject">
              <a
                href="https://www.celticlarichebasket.fr/"
                target="_blank"
                rel="noreferrer"
              >
                <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                  {t("WebProjects.aboutWebsite")}
                </button>
              </a>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">
                {t("WebProjects.PaymentPageTitle")}
              </h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/le0FzwEJX_I"
                title="youtubeVideoPresentationPaimentProcess"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.ShoppingSystem"),
                }}
              ></p>
              <strong className="underline">
                {t("WebProjects.ShoppingSystemtechno")}
              </strong>
            </p>
            <div className="btnDiscoverProject">
              <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                {t("WebProjects.NoPreview")}
              </button>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
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
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.Eko"),
                }}
              ></p>
              <strong className="underline">
                {t("WebProjects.EkoTechno")}
              </strong>
            </p>
            <div className="btnDiscoverProject">
              <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                {t("WebProjects.NoPreview")}
              </button>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">B.A Immobilier</h3>
            </div>
            <div className="flexIMG width">
              <iframe
                src="https://www.youtube.com/embed/mfMnkY3wAvs"
                title="youtubeVideoPresentationBAImmobilier"
                frameBorder="0"
                width="560"
                height="315"
                allowFullScreen
                className="iframeYoutube"
              ></iframe>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.BAImmobilier"),
                }}
              ></p>
              <strong className="underline">
                {t("WebProjects.BAImmobilierTechno")}
              </strong>
            </p>
            <div className="btnDiscoverProject">
              <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                {t("WebProjects.NoPreview")}
              </button>
            </div>
          </div>
          <div
            className="marge-contact-play modernEnvelop flex-column-center"
            id="blur"
          >
            <div className="sizeIconCPlus flexIMG">
              <h3 className="Home width">Portfolio</h3>
            </div>
            <div className="flexIMG">
              <img
                src={backgroundPortfolio}
                loading="lazy"
                alt="Protfolio Preview"
                className="sizeProjectIMG"
              ></img>
            </div>
            <p className="text-align-left padding-1vw font-size-large">
              <p
                dangerouslySetInnerHTML={{
                  __html: t("WebProjects.ReactPortfolio"),
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
