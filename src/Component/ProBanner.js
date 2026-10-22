import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, EASE, onReady, prefersReducedMotion } from "../Effects/motion";

const STORAGE_KEY = "hideProBanner";

// Bandeau discret vers le site pro (freelance). Fermable, mémorisé dans localStorage.
export default function ProBanner() {
  const { t } = useTranslation();
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch (e) {
      return true;
    }
  });

  useGSAP(
    () => {
      if (!visible) return undefined;
      // Hors du haut de page, le bandeau se range pour ne pas gêner la lecture
      ScrollTrigger.create({
        start: 140,
        end: "max",
        onToggle: (self) => ref.current.classList.toggle("is-away", self.isActive),
      });
      if (prefersReducedMotion()) return undefined;
      const tween = gsap.fromTo(
        ref.current,
        { y: -70, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, delay: 1.1, ease: EASE.out, paused: true }
      );
      return onReady(() => tween.play());
    },
    { scope: ref, dependencies: [visible] }
  );

  const close = () => {
    const done = () => {
      setVisible(false);
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch (e) {
        // stockage indisponible : le bandeau reviendra à la prochaine visite
      }
    };
    if (prefersReducedMotion()) {
      done();
      return;
    }
    gsap.to(ref.current, { y: -70, opacity: 0, duration: 0.6, ease: EASE.inOut, onComplete: done });
  };

  if (!visible) return null;

  return (
    <div className="pro-banner" ref={ref}>
      <a
        className="pro-banner__link"
        href="https://www.arthur-bru.com"
        target="_blank"
        rel="noopener noreferrer"
      >
        {t("Home.proRedirect")}
        <span aria-hidden="true"> ↗</span>
      </a>
      <button
        type="button"
        className="pro-banner__close"
        onClick={close}
        aria-label={t("Home.proRedirectClose")}
        title={t("Home.proRedirectClose")}
      >
        ×
      </button>
    </div>
  );
}
