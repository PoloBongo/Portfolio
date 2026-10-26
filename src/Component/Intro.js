import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import Reveal from "../Effects/Reveal";
import ProfileCard from "./ProfileCard";
import { gsap, prefersReducedMotion } from "../Effects/motion";

// Présentation : le texte s'allume mot après mot pendant le défilement, la carte de profil à côté
export default function Intro() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const text = t("Home.info");
  const words = text.split(" ");

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        rootRef.current.querySelectorAll(".intro__word"),
        // 0.37 : le texte non encore « allumé » reste lisible (contraste 3:1 sur ce corps de texte)
        { opacity: 0.37 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.12,
          scrollTrigger: {
            trigger: rootRef.current.querySelector(".intro__text"),
            start: "top 82%",
            end: "bottom 48%",
            scrub: true,
          },
        }
      );
    },
    { scope: rootRef, dependencies: [text], revertOnUpdate: true }
  );

  return (
    <section className="intro container" ref={rootRef} data-hud={t("Hud.intro")}>
      <Reveal className="intro__label mono eyebrow">{t("Home.title1")}</Reveal>
      <div className="intro__grid">
        <div className="intro__main">
          <p className="intro__text">
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
              {words.map((word, i) => (
                <React.Fragment key={`${i}-${word}`}>
                  <span className="intro__word">{word}</span>
                  {i < words.length - 1 ? " " : null}
                </React.Fragment>
              ))}
            </span>
          </p>
          <Reveal as="p" className="intro__bio" start="top 88%">
            {t("Home.aboutMe")}
          </Reveal>
        </div>
        <ProfileCard />
      </div>
    </section>
  );
}
