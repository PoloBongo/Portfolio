import "../../css/Home.css";
import React, { Suspense } from "react";
import Navbar from "../../Component/Navbar.js";

// Traduction
import { Loader } from "../../Component/ComponentTraduction.js";
import { withTranslation } from "react-i18next";

import FocusLoop from "../../Component/FocusLoop.js";

const UnrealT = ({ t }) => {
  return (
    <>
      <div className="Home-header overflowHidden fontsRegular">
        <FocusLoop>
          <Navbar tabIndex={5} />
          <div className="traitSeparator" id="blur"></div>
          <div>
            <div className="contactMeFlex align-items-center fixBackBtnUnity">
              <h3 className="fontsBold underline titleUnityPage" id="blur">
                {t("Unreal.Title")}
              </h3>
            </div>
            <div className="grid-gamejam2">
              <div
                className="marge-contact-play modernEnvelop flex-column-center"
                id="blur"
              >
                <div className="sizeIconCPlus flexIMG">
                  <h3 className="Home width">Funfair</h3>
                </div>
                <div className="flexIMG width">
                  <iframe
                    src="https://www.youtube.com/embed/suI8_LCzjSI"
                    title="youtubeVideoPresentationFunfair"
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
                      {t("Unreal.Funfair.Langage")}
                    </p>
                    <p>
                      <span className="colorPurple">
                        {t("VideoGamesProjects.ToolsUsed")}
                      </span>
                    </p>
                    <p
                      dangerouslySetInnerHTML={{
                        __html: t("Unreal.Funfair.ToolsUsed"),
                      }}
                    ></p>
                    <p>
                      <span className="colorPurple">
                        {t("VideoGamesProjects.Duration")}
                      </span>{" "}
                      {t("Unreal.Funfair.Duration")}
                    </p>
                    <p>
                      <span className="colorPurple">
                        {t("VideoGamesProjects.Completion")}
                      </span>{" "}
                      {t("Unreal.Funfair.Completion")}
                    </p>
                    <p>
                      <span className="colorPurple">
                        {t("VideoGamesProjects.TeamSize")}
                      </span>{" "}
                      {t("Unreal.Funfair.TeamSize")}
                    </p>
                    <p>
                      <span className="colorPurple">
                        {t("VideoGamesProjects.Role")}
                      </span>{" "}
                      {t("Unreal.Funfair.Role")}
                    </p>
                  </p>
                  <p className="text-align-left padding-1vw font-size-large">
                    <p
                      dangerouslySetInnerHTML={{
                        __html: t("Unreal.Funfair.Description"),
                      }}
                    ></p>
                  </p>
                </div>
                <div className="btnDiscoverProject">
                  <a
                    href="https://arthur-bru.itch.io/carnival-unreal-engine-5"
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={1}
                  >
                    <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                      {t("VideoGamesProjects.viewMoreGame")}
                    </button>
                  </a>
                  <a
                    href="https://github.com/PoloBongo/Funfair_UE5"
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={2}
                  >
                    <button className="btnStyleDiscoverProject fontsBold marge-contact-play responsive-text-btn">
                      {t("VideoGamesProjects.viewMoreCode")}
                    </button>
                  </a>
                </div>
              </div>
            </div>
            <div className="grid-gamejam">
              <div
                className="marge-contact-play modernEnvelop flex-column-center"
                id="blur"
              >
                <div className="sizeIconCPlus flexIMG">
                  <h3 className="Home width">Spacial Race</h3>
                </div>
                <div className="flexIMG width">
                  <iframe
                    src="https://www.youtube.com/embed/2Ptn12UQuUs"
                    title="youtubeVideoPresentationAttractionFlow"
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
                    {t("Unreal.SpacialRace.Langage")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.ToolsUsed")}
                    </span>
                  </p>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t("Unreal.SpacialRace.ToolsUsed"),
                    }}
                  ></p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Duration")}
                    </span>{" "}
                    {t("Unreal.SpacialRace.Duration")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Completion")}
                    </span>{" "}
                    {t("Unreal.SpacialRace.Completion")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.TeamSize")}
                    </span>{" "}
                    {t("Unreal.SpacialRace.TeamSize")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Role")}
                    </span>{" "}
                    {t("Unreal.SpacialRace.Role")}
                  </p>
                </p>
                <p className="text-align-left padding-1vw font-size-large">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t("Unreal.SpacialRace.Description"),
                    }}
                  ></p>
                </p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/SpacialRaceUE5"
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={3}
                  >
                    <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                      {t("VideoGamesProjects.viewMoreCode")}
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
                    {t("Unreal.InventoryDemo.Title")}
                  </h3>
                </div>
                <div className="flexIMG width">
                  <iframe
                    src="https://www.youtube.com/embed/kWMr7oxRCWQ"
                    title="youtubeVideoPresentationInventorySystem"
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
                    {t("Unreal.InventoryDemo.Langage")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.ToolsUsed")}
                    </span>
                  </p>
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t("Unreal.InventoryDemo.ToolsUsed"),
                    }}
                  ></p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Duration")}
                    </span>{" "}
                    {t("Unreal.InventoryDemo.Duration")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Completion")}
                    </span>{" "}
                    {t("Unreal.InventoryDemo.Completion")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.TeamSize")}
                    </span>{" "}
                    {t("Unreal.InventoryDemo.TeamSize")}
                  </p>
                  <p>
                    <span className="colorPurple">
                      {t("VideoGamesProjects.Role")}
                    </span>{" "}
                    {t("Unreal.InventoryDemo.Role")}
                  </p>
                </p>
                <p className="text-align-left padding-1vw font-size-large">
                  <p
                    dangerouslySetInnerHTML={{
                      __html: t("Unreal.InventoryDemo.Description"),
                    }}
                  ></p>
                </p>
                <div className="btnDiscoverProject">
                  <a
                    href="https://github.com/PoloBongo/Reap-the-Undead/tree/DropItemProject"
                    target="_blank"
                    rel="noreferrer"
                    tabIndex={4}
                  >
                    <button className="btnStyleDiscoverProject fontsBold z-index responsive-text-btn">
                      {t("VideoGamesProjects.viewMoreCode")}
                    </button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </FocusLoop>
      </div>
    </>
  );
};

const TranslatedHome = withTranslation()(UnrealT);

export default function UnrealPage() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedHome />
    </Suspense>
  );
}
