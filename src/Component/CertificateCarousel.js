import React, { Suspense, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { withTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import Button from "./Button";
import Reveal from "../Effects/Reveal";
import SplitReveal from "../Effects/SplitReveal";
import { gsap, EASE, hasFinePointer, prefersReducedMotion } from "../Effects/motion";
import "../css/Passport.css";
import { CERTIFICATES } from "./certificatesData";

// « Passeport de tampons » : une page de passeport où chaque certificat est un tampon qui s'imprime au défilement.
// (Le fichier garde son nom d'origine : Skills.js importe CERTIFICATES d'ici.)
export { CERTIFICATES };

const LANG_LOCALE = { fr: "fr-FR", en: "en-US", es: "es-ES" };
// Inclinaison de chaque tampon : posés à la main, jamais bien droits
const TILT = [-7, 5, -3, 8, -5];

const pad = (n) => String(n).padStart(2, "0");

// Le tampon : deux anneaux, le nom courbé en haut, la date en bas, le sigle au centre
function Stamp({ cert, index }) {
  const date = new Date(cert.date + "-01");
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const label = `${month} ${date.getFullYear()} · EDUCATIVE`;
  const id = `stamp-${index}`;
  return (
    <svg className="stamp__svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      <defs>
        <path id={`${id}-top`} d="M 32,100 A 68,68 0 0 1 168,100" />
        <path id={`${id}-bot`} d="M 18,100 A 82,82 0 0 0 182,100" />
      </defs>
      <g filter="url(#stamp-rough)" fill="none" stroke="currentColor">
        <circle cx="100" cy="100" r="95" strokeWidth="3.5" />
        <circle cx="100" cy="100" r="88" strokeWidth="1.2" />
        <circle cx="100" cy="100" r="60" strokeWidth="2.2" />
        <text className="stamp__arc" fill="currentColor" stroke="none" textAnchor="middle">
          <textPath href={`#${id}-top`} startOffset="50%">
            {cert.short.toUpperCase()}
          </textPath>
        </text>
        <text className="stamp__arc stamp__arc--small" fill="currentColor" stroke="none" textAnchor="middle">
          <textPath href={`#${id}-bot`} startOffset="50%">
            {label}
          </textPath>
        </text>
        <text className="stamp__no" x="100" y="78" fill="currentColor" stroke="none" textAnchor="middle">
          N°{pad(index + 1)}
        </text>
        <text
          className="stamp__abbr"
          x="100"
          y="118"
          fill="currentColor"
          stroke="none"
          textAnchor="middle"
          fontSize={cert.abbr.length > 3 ? 31 : 42}
        >
          {cert.abbr}
        </text>
        <path d="M 62,134 H 138" strokeWidth="1.4" />
      </g>
    </svg>
  );
}

const CertificateCarouselT = ({ t }) => {
  const { lang = "fr" } = useParams();
  const [current, setCurrent] = useState(0);
  const rootRef = useRef(null);
  const sheetRef = useRef(null);
  const detailRef = useRef(null);
  const stamped = useRef(false);
  const shown = useRef(0);
  const cert = CERTIFICATES[current];

  const formattedDate = new Date(cert.date + "-01").toLocaleDateString(LANG_LOCALE[lang] || "fr-FR", {
    month: "long",
    year: "numeric",
  });

  const choose = (i) => {
    if (i === current) return;
    setCurrent(i);
  };

  // Les tampons s'impriment un à un quand la page du passeport arrive : ils tombent de haut, rebondissent, une éclaboussure
  // d'encre part du bord, la page encaisse le coup.
  useGSAP(
    () => {
      const stamps = gsap.utils.toArray(".stamp", rootRef.current);
      if (prefersReducedMotion()) return undefined;
      gsap.set(stamps, { opacity: 0, scale: 1.9, rotation: (i) => TILT[i] + 18 });
      const tl = gsap.timeline({
        paused: true,
        onComplete: () => {
          stamped.current = true;
        },
      });
      stamps.forEach((el, i) => {
        const at = i * 0.42;
        tl.to(el, { opacity: 1, duration: 0.12 }, at)
          .to(el, { scale: 1, rotation: TILT[i], duration: 0.42, ease: "back.out(2.6)" }, at)
          .fromTo(
            el.querySelector(".stamp__ink"),
            { scale: 0.7, opacity: 0.55 },
            { scale: 1.55, opacity: 0, duration: 0.7, ease: "power2.out" },
            at + 0.28
          )
          .fromTo(sheetRef.current, { y: 0 }, { y: 4, duration: 0.06, yoyo: true, repeat: 1, ease: "power1.inOut" }, at + 0.3);
      });
      const trigger = gsap.timeline({
        scrollTrigger: { trigger: sheetRef.current, start: "top 72%", once: true, onEnter: () => tl.play() },
      });
      return () => {
        trigger.kill();
        tl.kill();
      };
    },
    { scope: rootRef }
  );

  // Le contenu du détail glisse quand on change de tampon, et le tampon choisi est « re-pressé »
  useGSAP(
    () => {
      if (shown.current === current || prefersReducedMotion()) {
        shown.current = current;
        return;
      }
      shown.current = current;
      gsap.fromTo(
        detailRef.current.querySelectorAll("[data-swap]"),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: EASE.out, stagger: 0.06 }
      );
      if (stamped.current) {
        const el = rootRef.current.querySelectorAll(".stamp")[current];
        gsap.fromTo(el, { scale: 1.16 }, { scale: 1, duration: 0.5, ease: "back.out(2.6)" });
      }
    },
    { scope: rootRef, dependencies: [current] }
  );

  const fine = typeof window !== "undefined" && hasFinePointer();

  return (
    <section className="certs container" ref={rootRef} aria-label={t("Certificates.title")} data-hud={t("Hud.certs")}>
      <header className="section-head">
        <Reveal className="mono eyebrow">(03)</Reveal>
        <SplitReveal text={t("Certificates.title")} as="h2" scroll className="section-head__title" />
      </header>

      {/* Filtre d'encre usée, partagé par les tampons : bord rongé et petits manques */}
      <svg className="passport__defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="stamp-rough" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" result="shape" />
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="9" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1" result="holes" />
          <feComposite in="shape" in2="holes" operator="in" />
        </filter>
      </svg>

      <Reveal className="passport" y={50}>
        <div className="passport__sheet" ref={sheetRef}>
          <div className="passport__top mono" aria-hidden="true">
            <span>{t("Certificates.passport")}</span>
            <span>
              {pad(current + 1)} / {pad(CERTIFICATES.length)}
            </span>
          </div>

          <div className="passport__stamps" role="group" aria-label={t("Certificates.hint")}>
            {CERTIFICATES.map((item, i) => (
              <button
                type="button"
                key={item.url}
                className={`stamp${i === current ? " is-active" : ""}`}
                style={{ "--tone": item.tone, "--tilt": `${TILT[i]}deg` }}
                onClick={() => choose(i)}
                onFocus={() => choose(i)}
                onPointerEnter={fine ? () => choose(i) : undefined}
                aria-pressed={i === current}
                aria-label={`${item.title}, ${t("Certificates.issuedOn")} ${new Date(item.date + "-01").toLocaleDateString(
                  LANG_LOCALE[lang] || "fr-FR",
                  { month: "long", year: "numeric" }
                )}`}
              >
                <span className="stamp__ink" aria-hidden="true" />
                <Stamp cert={item} index={i} />
              </button>
            ))}
          </div>
        </div>

        <article className="passport__detail" ref={detailRef} aria-live="polite">
          <span className="passport__badge mono" data-swap>
            Educative · N°{pad(current + 1)}
          </span>
          <h3 className="passport__title" data-swap>
            {cert.title}
          </h3>
          <p className="passport__date mono" data-swap>
            {t("Certificates.issuedOn")} {formattedDate}
          </p>
          <div className="passport__action" data-swap>
            <Button href={cert.url} size="small">
              {t("Certificates.viewCertificate")}
            </Button>
          </div>
        </article>
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
