import { Suspense, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { withTranslation } from "react-i18next";
import "../css/Home.css";

const CERTIFICATES = [
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

const CertificateCarouselT = ({ t }) => {
  const { lang = "fr" } = useParams();
  const [current, setCurrent] = useState(0);
  const certLinkRef = useRef(null);
  const cert = CERTIFICATES[current];

  const formattedDate = new Date(cert.date + "-01").toLocaleDateString(
    LANG_LOCALE[lang] || "fr-FR",
    { month: "long", year: "numeric" }
  );

  const handleNext = () => {
    setCurrent((c) => c + 1);
    setTimeout(() => certLinkRef.current?.focus(), 0);
  };

  const handlePrev = () => {
    setCurrent((c) => c - 1);
    setTimeout(() => certLinkRef.current?.focus(), 0);
  };

  return (
    <section className="certificate-section" aria-label={t("Certificates.title")}>
      <h2 className="fontsRegular certificate-section-title">
        {t("Certificates.title")}
      </h2>
      <div className="certificate-carousel-wrapper">
        <button
          className="carousel-btn"
          onClick={handlePrev}
          disabled={current === 0}
          aria-label={t("Certificates.prev")}
          tabIndex={current > 0 ? 6 : -1}
        >
          ‹
        </button>
        <div className="certificate-card">
          <span className="certificate-badge">Educative</span>
          <h3 className="certificate-title fontsRegular">{cert.title}</h3>
          <p className="certificate-date fontsLight">
            {t("Certificates.issuedOn")} {formattedDate}
          </p>
          <a
            ref={certLinkRef}
            href={cert.url}
            target="_blank"
            rel="noreferrer"
            className="certificate-link fontsRegular"
            tabIndex={4}
          >
            {t("Certificates.viewCertificate")}
          </a>
        </div>
        <button
          className="carousel-btn"
          onClick={handleNext}
          disabled={current === CERTIFICATES.length - 1}
          aria-label={t("Certificates.next")}
          tabIndex={5}
        >
          ›
        </button>
      </div>
      <div className="carousel-dots">
        {CERTIFICATES.map((_, i) => (
          <button
            key={i}
            className={`carousel-dot${i === current ? " active" : ""}`}
            onClick={() => setCurrent(i)}
            aria-label={`${t("Certificates.cert")} ${i + 1}`}
            aria-current={i === current ? "true" : "false"}
            tabIndex={-1}
          />
        ))}
      </div>
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
