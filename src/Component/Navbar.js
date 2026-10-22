import React, { Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import { withTranslation } from "react-i18next";
import CVArthurCPP from "../Download/CV-Arthur-JV.png";
import CVArthurCPPEN from "../Download/ArthurCVJV-EN.png";
import { TLink } from "../Effects/PageTransition";
import { useLenis } from "../Effects/SmoothScroll";
import { gsap, EASE, prefersReducedMotion } from "../Effects/motion";
import { isSoundOn, play, setSound, subscribeSound } from "../Effects/sound";
import { getTabbables } from "./FocusLoop";
import { NAV_ITEMS as ITEMS } from "./navItems";
import Button from "./Button";
import "../css/Navbar.css";

const CLOSED = "circle(0% at calc(100% - 52px) 46px)";
const OPEN = "circle(150% at calc(100% - 52px) 46px)";

const LANGS = [
  { code: "fr", label: "DropdownLanguage.FrenchLanguage" },
  { code: "en", label: "DropdownLanguage.EnglishLanguage" },
  { code: "es", label: "DropdownLanguage.SpanishLanguage" },
];

const NavbarT = ({ t, i18n }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { lang = "fr" } = useParams();
  const lenis = useLenis();

  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(isSoundOn());
  const rootRef = useRef(null);
  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const tlRef = useRef(null);
  const wasOpen = useRef(open);

  useEffect(() => subscribeSound(() => setSoundOn(isSoundOn())), []);

  // Petit son à l'ouverture / fermeture (pas au premier rendu)
  useEffect(() => {
    if (wasOpen.current === open) return;
    wasOpen.current = open;
    play(open ? "open" : "close");
  }, [open]);

  const pagePath = "/" + (location.pathname.split("/").slice(2).join("/") || "");
  const onIncoming = pagePath.toLowerCase() === "/incoming";
  const cv = i18n.language.startsWith("fr") ? CVArthurCPP : CVArthurCPPEN;

  // Panneau : cercle qui s'ouvre depuis le bouton, liens qui montent un à un
  useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef);
      const panel = panelRef.current;
      gsap.set(panel, { clipPath: CLOSED, visibility: "hidden" });

      const tl = gsap.timeline({
        paused: true,
        onReverseComplete: () => gsap.set(panel, { visibility: "hidden" }),
      });
      tl.set(panel, { visibility: "visible" })
        .to(panel, { clipPath: OPEN, duration: 0.95, ease: EASE.inOut })
        .fromTo(
          q(".menu__link-inner"),
          { yPercent: 118 },
          { yPercent: 0, duration: 0.95, ease: EASE.out, stagger: 0.055 },
          0.3
        )
        .fromTo(
          q(".menu__reveal"),
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 0.85, ease: EASE.out, stagger: 0.07 },
          0.5
        );
      tlRef.current = tl;
    },
    { scope: rootRef }
  );

  useEffect(() => {
    const tl = tlRef.current;
    if (!tl) return;
    if (prefersReducedMotion()) {
      tl.progress(open ? 1 : 0);
      if (!open) gsap.set(panelRef.current, { visibility: "hidden" });
    } else if (open) {
      tl.timeScale(1).play();
    } else {
      tl.timeScale(1.5).reverse();
    }
  }, [open]);

  // Page figée derrière le menu
  useEffect(() => {
    if (!open) return undefined;
    if (lenis) lenis.stop();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      if (lenis) lenis.start();
    };
  }, [open, lenis]);

  // Focus sur le premier lien à l'ouverture
  useEffect(() => {
    if (!open) return undefined;
    const id = setTimeout(() => {
      const first = rootRef.current.querySelector(".menu__link");
      if (first) first.focus({ preventScroll: true });
    }, 80);
    return () => clearTimeout(id);
  }, [open]);

  const onKeyDown = (e) => {
    if (!open) return;
    if (e.key === "Escape") {
      setOpen(false);
      toggleRef.current.focus();
      return;
    }
    if (e.key === "Tab") {
      const items = getTabbables(rootRef.current);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const changeLanguage = (code) => {
    if (code === lang) return;
    i18n.changeLanguage(code);
    navigate(
      location.pathname.replace(/^\/(fr|en|es)/, `/${code}`) + location.search + location.hash
    );
  };

  return (
    <div
      className="menu"
      ref={rootRef}
      data-open={open}
      {...(open ? { "data-focus-trap": "" } : {})}
      onKeyDown={onKeyDown}
    >
      <button
        ref={toggleRef}
        type="button"
        className="menu__toggle"
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={t(open ? "Menu.close" : "Menu.open")}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="menu__toggle-label" aria-hidden="true">
          <span>{t("Menu.open")}</span>
          <span>{t("Menu.close")}</span>
        </span>
        <span className="menu__toggle-icon" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>

      <nav id="site-menu" ref={panelRef} className="menu__panel" aria-label={t("Menu.nav")}>
        <ul className="menu__list">
          {ITEMS.map(({ path, label }, i) => {
            const active =
              path === ""
                ? pagePath === "/"
                : pagePath.toLowerCase() === path.toLowerCase();
            return (
              <li className="menu__item" key={label}>
                <TLink
                  className="menu__link"
                  to={`/${lang}${path}`}
                  label={t(label)}
                  aria-current={active ? "page" : undefined}
                >
                  <span className="menu__link-inner">
                    <span className="menu__num" aria-hidden="true">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="menu__text">{t(label)}</span>
                  </span>
                </TLink>
              </li>
            );
          })}
        </ul>

        <div className="menu__aside">
          <div className="menu__group menu__reveal">
            <span className="mono menu__label">{t("Menu.language")}</span>
            <div className="menu__lang" role="group" aria-label={t("Menu.language")}>
              {LANGS.map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  lang={code}
                  className={`menu__lang-btn${code === lang ? " is-active" : ""}`}
                  aria-pressed={code === lang}
                  aria-label={t(label)}
                  onClick={() => changeLanguage(code)}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          <div className="menu__group menu__reveal">
            <a className="menu__small link-line" href={cv} target="_blank" rel="noreferrer">
              {t("ClassicNavBar.CV")} ↗
            </a>
            {!onIncoming && (
              <TLink
                className="menu__small link-line"
                to={`/${lang}/Incoming`}
                label={t("ClassicNavBar.Incoming")}
              >
                {t("ClassicNavBar.Incoming")}
              </TLink>
            )}
          </div>

          <div className="menu__group menu__reveal">
            <span className="mono menu__label">{t("Hud.sound")}</span>
            <button
              type="button"
              className="menu__small menu__sound link-line"
              aria-pressed={soundOn}
              data-sound-skip
              onClick={() => setSound(!isSoundOn())}
            >
              {t(soundOn ? "Hud.soundOn" : "Hud.soundOff")}
            </button>
          </div>

          <div className="menu__group menu__reveal">
            <span className="mono menu__label">{t("Menu.social")}</span>
            <a
              className="menu__small link-line"
              href="https://www.linkedin.com/in/arthur-bru-b71327252/"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn ↗
            </a>
            <a
              className="menu__small link-line"
              href="https://github.com/PoloBongo"
              target="_blank"
              rel="noreferrer"
            >
              GitHub ↗
            </a>
          </div>

          <div className="menu__reveal">
            <Button variant="solid" href="https://www.arthur-bru.com">
              {t("ClassicNavBar.SitePro")}
            </Button>
          </div>
        </div>
      </nav>
    </div>
  );
};

const TranslatedNavbar = withTranslation()(NavbarT);

export default function Navbar(props) {
  return (
    <Suspense fallback={null}>
      <TranslatedNavbar {...props} />
    </Suspense>
  );
}
