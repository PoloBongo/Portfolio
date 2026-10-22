import React, { Suspense, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import Button from "./Button";
import Reveal from "../Effects/Reveal";
import SplitReveal from "../Effects/SplitReveal";
import { gsap, EASE, hasFinePointer, prefersReducedMotion } from "../Effects/motion";

export const CERTIFICATES = [
  {
    title: "MCP Fundamentals for Building AI Agents",
    date: "2026-01",
    url: "https://www.educative.io/verify-certificate/JZmo10C1MggP22nLGcyGPOGO9Y1yC3",
  },
  {
    title: "Mastering MCP: Building Advanced Agentic Applications",
    date: "2026-02",
    url: "https://www.educative.io/verify-certificate/KOnpGJIZ6KMQpp4L3cnvYGvG8XxncB",
  },
  {
    title: "Build AI Chatbots with Open-Source LLMs, LangChain, and Streamlit",
    date: "2026-02",
    url: "https://www.educative.io/verify-certificate/EKMzZJK04L2fgP1vB8nQ47uxwAQwQ2JMxTG",
  },
];

const LANG_LOCALE = { fr: "fr-FR", en: "en-US", es: "es-ES" };

const pad = (n) => String(n).padStart(2, "0");

const CertificateCarouselT = ({ t }) => {
  const { lang = "fr" } = useParams();
  const [current, setCurrent] = useState(0);
  const rootRef = useRef(null);
  const cardRef = useRef(null);
  const direction = useRef(1);
  const shown = useRef(0);
  const cert = CERTIFICATES[current];

  const formattedDate = new Date(cert.date + "-01").toLocaleDateString(
    LANG_LOCALE[lang] || "fr-FR",
    { month: "long", year: "numeric" }
  );

  const goTo = (next) => {
    if (next < 0 || next >= CERTIFICATES.length || next === current) return;
    direction.current = next > current ? 1 : -1;
    setCurrent(next);
    // Le focus reste sur le lien du certificat, comme avant
    setTimeout(() => {
      const link = cardRef.current && cardRef.current.querySelector("a");
      if (link) link.focus({ preventScroll: true });
    }, 0);
  };

  // Changement de certificat : le contenu glisse dans le sens de la navigation
  useGSAP(
    () => {
      if (shown.current === current || prefersReducedMotion()) {
        shown.current = current;
        return;
      }
      shown.current = current;
      gsap.fromTo(
        cardRef.current.querySelectorAll("[data-swap]"),
        { x: 80 * direction.current, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.95, ease: EASE.out, stagger: 0.06 }
      );
    },
    { scope: rootRef, dependencies: [current] }
  );

  // Inclinaison 3D de la carte + reflet qui suit le curseur
  useGSAP(
    () => {
      if (!hasFinePointer() || prefersReducedMotion()) return undefined;
      const card = cardRef.current;
      const rotX = gsap.quickTo(card, "rotationX", { duration: 0.7, ease: "power3" });
      const rotY = gsap.quickTo(card, "rotationY", { duration: 0.7, ease: "power3" });
      gsap.set(card, { transformPerspective: 1000 });

      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        rotY(px * 9);
        rotX(-py * 9);
        card.style.setProperty("--gx", `${(px + 0.5) * 100}%`);
        card.style.setProperty("--gy", `${(py + 0.5) * 100}%`);
      };
      const onLeave = () => {
        rotX(0);
        rotY(0);
      };
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      return () => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: rootRef }
  );

  return (
    <section
      className="certs container"
      ref={rootRef}
      aria-label={t("Certificates.title")}
      data-hud={t("Hud.certs")}
    >
      <header className="section-head">
        <Reveal className="mono eyebrow">(03)</Reveal>
        <SplitReveal text={t("Certificates.title")} as="h2" scroll className="section-head__title" />
      </header>

      <Reveal className="certs__stage" y={50}>
        <div className="certs__card-wrap">
          <div className="certs__counter mono" aria-hidden="true">
            <span>{pad(current + 1)}</span> / {pad(CERTIFICATES.length)}
          </div>

          <article className="cert-card" ref={cardRef} aria-live="polite">
            <span className="cert-card__glare" aria-hidden="true" />
            <span className="cert-card__badge mono" data-swap>
              Educative
            </span>
            <h3 className="cert-card__title" data-swap>
              {cert.title}
            </h3>
            <p className="cert-card__date mono" data-swap>
              {t("Certificates.issuedOn")} {formattedDate}
            </p>
            <div className="cert-card__action" data-swap>
              <Button href={cert.url} size="small">
                {t("Certificates.viewCertificate")}
              </Button>
            </div>
          </article>
        </div>

        <div className="certs__nav">
          <button
            type="button"
            className="certs__arrow"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
            aria-label={t("Certificates.prev")}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="certs__dots">
            {CERTIFICATES.map((item, i) => (
              <button
                type="button"
                key={item.url}
                className={`certs__dot${i === current ? " is-active" : ""}`}
                onClick={() => goTo(i)}
                aria-label={`${t("Certificates.cert")} ${i + 1}`}
                aria-current={i === current ? "true" : "false"}
                tabIndex={-1}
              />
            ))}
          </div>
          <button
            type="button"
            className="certs__arrow"
            onClick={() => goTo(current + 1)}
            disabled={current === CERTIFICATES.length - 1}
            aria-label={t("Certificates.next")}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </Reveal>
    </section>
  );
};

const TranslatedCertificateCarousel = withTranslation()(CertificateCarouselT);

export default function CertificateCarousel() {
  return (
    <Suspense fallback={null}>
      <TranslatedCertificateCarousel />
    </Suspense>
  );
}
