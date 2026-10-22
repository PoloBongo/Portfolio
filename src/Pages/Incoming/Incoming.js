import React, { Suspense, useRef } from "react";
import { useParams } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import SEO from "../../Component/Layout.js";
import Navbar from "../../Component/Navbar.js";
import Footer from "../../Component/Footer.js";
import FocusLoop from "../../Component/FocusLoop.js";
import PageHero from "../../Component/PageHero.js";
import Reveal from "../../Effects/Reveal";
import { gsap, prefersReducedMotion } from "../../Effects/motion";
import "../../css/Pages.css";

// Image
import backgroundGamingCampus from "../../img/logo-gaming-campus.webp";

// Traduction
import { Loader } from "../../Component/Loader.js";
import { withTranslation } from "react-i18next";

const ITEMS = ["Incoming.1", "Incoming.2", "Incoming.3"];

const IncomingT = ({ t }) => {
  const { lang = "fr" } = useParams();
  const listRef = useRef(null);

  // Le trait de la frise se dessine à mesure qu'on descend
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        listRef.current.querySelector(".timeline__line i"),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: listRef.current,
            start: "top 65%",
            end: "bottom 70%",
            scrub: true,
          },
        }
      );
    },
    { scope: listRef }
  );

  return (
    <div className="page">
      <SEO
        lang={lang}
        path="/Incoming"
        title="Mon programme de cours - Arthur BRU"
        description="Programme de Master 2 (5ème année) d'Arthur BRU en développement jeu vidéo : création de Game Design Document, analyse et gestion de projet, et projet fil rouge d'expérience complète sous Unreal Engine en groupe de 4."
        ogDescription="Programme de Master 2 (5ème année) en développement jeu vidéo : Game Design Document, gestion de projet, et projet fil rouge sous Unreal Engine."
      />
      <FocusLoop>
        <main id="main">
          <PageHero
            eyebrow={t("Incoming.eyebrow")}
            title="2026–2027"
            subtitle={t("Incoming.heading")}
          />
          <section className="container timeline-section" ref={listRef}>
            <Reveal className="timeline__school">
              <img
                src={backgroundGamingCampus}
                alt="Gaming Campus"
                width="552"
                height="223"
                loading="lazy"
              />
            </Reveal>
            <ol className="timeline">
              <span className="timeline__line" aria-hidden="true">
                <i />
              </span>
              {ITEMS.map((key, i) => (
                <Reveal as="li" className="timeline__item" key={key} y={50}>
                  <span className="timeline__dot" aria-hidden="true" />
                  <span className="timeline__num mono">{String(i + 1).padStart(2, "0")}</span>
                  <p className="timeline__text">{t(key)}</p>
                </Reveal>
              ))}
            </ol>
          </section>
        </main>
        <Footer />
        <Navbar />
      </FocusLoop>
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
