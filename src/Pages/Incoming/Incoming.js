import "../../css/Home.css";
import React, { Suspense, useEffect } from "react";
import Navbar from "../../Component/Navbar.js";

// Icon
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle } from "@fortawesome/free-solid-svg-icons";

// Image
import backgroundGamingCampus from "../../img/logo-gaming-campus.webp";

// Traduction
import { Loader } from "../../Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";

const IncomingT = ({ t }) => {
  useEffect(() => {
    sessionStorage.setItem("ShowTitleInNavbar", "false");
  }, []);

  return (
    <div className="Home-header overflowHidden">
      <Navbar />
      <div className="traitSeparator" id="blur"></div>
      <div>
        <div className="contactMeFlex">
          <h3 className="fontsBold underline" id="blur">
            <div className="width flex-end">
              <FontAwesomeIcon
                icon={faCircle}
                beatFade
                style={{ color: "#63E6BE" }}
                className="removeMargin"
              />
              <h4 className="Home">
                Mes projets d'école à venir 2024-2025 ( 3ème année )
              </h4>
              <FontAwesomeIcon
                icon={faCircle}
                beatFade
                style={{ color: "#63E6BE" }}
                className="removeMargin"
              />
            </div>
          </h3>
        </div>
        <div className="grid-incoming">
          <div className="marge-contact-play modernEnvelop" id="blur">
            <div className="flexIMG width">
              <img
                src={backgroundGamingCampus}
                alt="Choco Blast Menu Principal"
                className="sizeProjectIMG imgGameJam"
              ></img>
            </div>
            <div className="overflow-y-incomming">
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.1")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.2")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.3")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.4")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.5")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.6")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.7")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.8")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.9")}
                </button>
              </div>
              <div className="btnDiscoverProject padding-1vw">
                <button className="btnStyleDiscoverProject fontsBold width">
                  {t("Incoming.10")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TranslatedHome = withTranslation()(IncomingT);

export default function Incoming() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
