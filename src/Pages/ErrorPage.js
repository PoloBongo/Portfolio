import React, { Suspense, useRef } from "react";
import { useParams } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import Navbar from "../Component/Navbar";
import FocusLoop from "../Component/FocusLoop";
import Button from "../Component/Button";
import { Loader } from "../Component/Loader";
import { gsap, EASE, onReady, prefersReducedMotion, hasFinePointer } from "../Effects/motion";
import "../css/Pages.css";

const ErrorPageT = ({ t, code = 404 }) => {
  const { lang = "fr" } = useParams();
  const rootRef = useRef(null);
  const digits = String(code).split("");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const q = gsap.utils.selector(rootRef);

      // Entrée : chiffres qui montent, puis texte et bouton (le nuage de points, en bruit, reste derrière)
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      tl.fromTo(q(".notfound__digit"), { yPercent: 120 }, { yPercent: 0, duration: 1.4, stagger: 0.1 }, 0).fromTo(
        q(".notfound__text > *"),
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 1, stagger: 0.1 },
        0.5
      );
      // Le repère (le « 0 ») tombe de haut, rebondit sur la carte, puis oscille doucement, perdu
      const pin = q(".notfound__pin")[0];
      let sway;
      if (pin) {
        gsap.set(pin, { y: -window.innerHeight, opacity: 0, transformOrigin: "50% 100%" });
        tl.to(pin, { opacity: 1, duration: 0.1 }, 0.5)
          .to(pin, { y: 0, duration: 1.5, ease: "bounce.out" }, 0.5)
          .fromTo(q(".notfound__shadow"), { scaleX: 0.2, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 1.5, ease: "bounce.out" }, 0.5)
          .fromTo(q(".notfound__label"), { opacity: 0, y: 10, scale: 0.8 }, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "back.out(2)" }, 1.7);
        sway = gsap.to(pin, { rotation: 5, duration: 1.8, ease: "sine.inOut", yoyo: true, repeat: -1, paused: true });
        tl.add(() => sway.play(), 2.2);
      }
      const cancelReady = onReady(() => tl.play());

      // Les chiffres se déplacent légèrement avec le curseur, à des profondeurs différentes
      let removePointer = () => {};
      if (hasFinePointer()) {
        const setters = q(".notfound__digit-wrap").map((el, i) => ({
          x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }),
          y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }),
          depth: 18 + i * 14,
        }));
        const onMove = (e) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          setters.forEach(({ x, y, depth }) => {
            x(nx * depth);
            y(ny * depth);
          });
        };
        window.addEventListener("pointermove", onMove, { passive: true });
        removePointer = () => window.removeEventListener("pointermove", onMove);
      }

      return () => {
        cancelReady();
        removePointer();
        if (sway) sway.kill();
      };
    },
    { scope: rootRef }
  );

  return (
    <div className="page" ref={rootRef}>
      <FocusLoop>
        <main id="main" className="notfound" data-cursor="query">
          <p className="notfound__code" aria-hidden="true">
            {digits.map((digit, i) =>
              // Le « 0 » du milieu est le repère de la carte : Arthur est perdu, hors carte
              digit === "0" && i === 1 ? (
                <span className="notfound__digit-wrap notfound__digit-wrap--pin" key={i}>
                  <span className="notfound__label">{t("ErrorPage.lost")}</span>
                  <svg className="notfound__pin" viewBox="0 0 100 140" focusable="false">
                    <path
                      d="M50 0C22 0 0 22 0 50c0 38 50 90 50 90s50-52 50-90C100 22 78 0 50 0z"
                      fill="currentColor"
                    />
                    <circle cx="50" cy="50" r="18" fill="var(--bg)" />
                  </svg>
                  <span className="notfound__shadow" />
                </span>
              ) : (
                <span className="notfound__digit-wrap" key={i}>
                  <span className="notfound__digit">{digit}</span>
                </span>
              )
            )}
          </p>
          <div className="notfound__text">
            <h1 className="notfound__title">{t("ErrorPage.title")}</h1>
            <p className="notfound__message">{t("ErrorPage.message")}</p>
            <Button to={`/${lang}`} variant="solid" label={t("ClassicNavBar.Home")}>
              {t("ErrorPage.backHome")}
            </Button>
          </div>
        </main>
        <Navbar />
      </FocusLoop>
    </div>
  );
};

const TranslatedErrorPage = withTranslation()(ErrorPageT);

export default function ErrorPage(props) {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedErrorPage {...props} />
    </Suspense>
  );
}
