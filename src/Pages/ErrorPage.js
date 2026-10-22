import React, { Suspense, useRef } from "react";
import { useParams } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import Navbar from "../Component/Navbar";
import FocusLoop from "../Component/FocusLoop";
import Button from "../Component/Button";
import { Loader } from "../Component/Loader";
import { gsap, EASE, onReady, prefersReducedMotion, hasFinePointer } from "../Effects/motion";
import pikachuWait from "../img/pikachuWait.webp";
import "../css/Pages.css";

const ErrorPageT = ({ t, code = 404 }) => {
  const { lang = "fr" } = useParams();
  const rootRef = useRef(null);
  const digits = String(code).split("");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const q = gsap.utils.selector(rootRef);

      // Entrée : chiffres qui montent, texte puis bouton, Pikachu qui se faufile en bas
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      tl.fromTo(q(".notfound__digit"), { yPercent: 120 }, { yPercent: 0, duration: 1.4, stagger: 0.1 }, 0)
        .fromTo(q(".notfound__text > *"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.5)
        .fromTo(q(".notfound__pika"), { yPercent: 105 }, { yPercent: 38, duration: 1.4 }, 1.2);
      const cancelReady = onReady(() => tl.play());

      // Petit mouvement de balancier de Pikachu
      gsap.to(q(".notfound__pika"), {
        rotation: 3,
        transformOrigin: "50% 100%",
        duration: 2.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });

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
      };
    },
    { scope: rootRef }
  );

  return (
    <div className="page" ref={rootRef}>
      <FocusLoop>
        <main id="main" className="notfound">
          <p className="notfound__code" aria-hidden="true">
            {digits.map((digit, i) => (
              <span className="notfound__digit-wrap" key={i}>
                <span className="notfound__digit">{digit}</span>
              </span>
            ))}
          </p>
          <div className="notfound__text">
            <h1 className="notfound__title">{t("ErrorPage.title")}</h1>
            <p className="notfound__message">{t("ErrorPage.message")}</p>
            <Button to={`/${lang}`} variant="solid" label={t("ClassicNavBar.Home")}>
              {t("ErrorPage.backHome")}
            </Button>
          </div>
          <img
            className="notfound__pika"
            src={pikachuWait}
            alt=""
            width="200"
            height="209"
            aria-hidden="true"
          />
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
