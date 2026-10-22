import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import SplitReveal from "../Effects/SplitReveal";
import Reveal from "../Effects/Reveal";
import Magnetic from "../Effects/Magnetic";
import { useScrollTo } from "../Effects/SmoothScroll";
import { TLink } from "../Effects/PageTransition";
import { gsap, prefersReducedMotion } from "../Effects/motion";
import "../css/Footer.css";

const EMAIL = "arthur.plfm@gmail.com";

// compact : sans l'appel à contact (page Contact elle-même)
export default function Footer({ compact = false }) {
  const { t } = useTranslation();
  const { lang = "fr" } = useParams();
  const scrollTo = useScrollTo();
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);
  const giantRef = useRef(null);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch (e) {
      const field = document.createElement("textarea");
      field.value = EMAIL;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      document.body.removeChild(field);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Le grand nom monte doucement pendant que le pied de page entre dans l'écran
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        giantRef.current,
        { yPercent: 38 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top bottom",
            end: "bottom bottom",
            scrub: true,
          },
        }
      );
    },
    { scope: rootRef }
  );

  return (
    <footer className={`footer${compact ? " footer--compact" : ""}`} ref={rootRef} data-hud={t("Hud.footer")}>
      <div className="container footer__inner">
        {!compact && (
          <>
            <Reveal className="footer__eyebrow mono eyebrow">{t("ClassicNavBar.ContactMe")}</Reveal>

            <div className="footer__head">
              <h2 className="footer__title">
                <SplitReveal text={t("Footer.title")} as="span" scroll className="footer__line" />
                <SplitReveal
                  text={t("Footer.titleAccent")}
                  as="span"
                  scroll
                  delay={0.15}
                  className="footer__line footer__line--accent serif"
                />
              </h2>

              <Reveal y={50} delay={0.2} className="footer__cta-wrap">
                <Magnetic strength={0.4}>
                  <TLink
                    className="footer__cta"
                    to={`/${lang}/contactMe`}
                    label={t("ClassicNavBar.ContactMe")}
                  >
                    <span>{t("ClassicNavBar.ContactMe")}</span>
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M5 19L19 5M19 5H8M19 5v11"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </TLink>
                </Magnetic>
              </Reveal>
            </div>
          </>
        )}

        <Reveal className="footer__links" stagger={0.08} y={24}>
          <button type="button" className="footer__mail" onClick={copyEmail}>
            <span className="footer__mail-text link-line">{EMAIL}</span>
            <span className="footer__mail-hint mono">
              {copied ? t("Footer.copied") : t("Footer.copy")}
            </span>
          </button>
          <a
            className="footer__link link-line"
            href="https://www.linkedin.com/in/arthur-bru-b71327252/"
            target="_blank"
            rel="noreferrer"
          >
            LinkedIn ↗
          </a>
          <a
            className="footer__link link-line"
            href="https://github.com/PoloBongo"
            target="_blank"
            rel="noreferrer"
          >
            GitHub ↗
          </a>
          <a
            className="footer__link link-line"
            href="https://www.arthur-bru.com"
            target="_blank"
            rel="noreferrer"
          >
            {t("ClassicNavBar.SitePro")} ↗
          </a>
        </Reveal>
        <span className="sr-only" role="status" aria-live="polite">
          {copied ? t("Footer.copied") : ""}
        </span>

        <div className="footer__bar mono">
          <span>
            © {new Date().getFullYear()} Arthur BRU — {t("Footer.rights")}
          </span>
          <button type="button" className="footer__top link-line" onClick={() => scrollTo(0)}>
            {t("Footer.top")} ↑
          </button>
        </div>
      </div>

      <div className="footer__giant" ref={giantRef} aria-hidden="true">
        ARTHUR BRU
      </div>
    </footer>
  );
}
