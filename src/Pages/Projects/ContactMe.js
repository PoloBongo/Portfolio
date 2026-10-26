import React, { Suspense, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import emailjs from "emailjs-com";
import SEO from "../../Component/Layout.js";
import Navbar from "../../Component/Navbar";
import Footer from "../../Component/Footer";
import FocusLoop from "../../Component/FocusLoop";
import SplitReveal from "../../Effects/SplitReveal";
import Reveal from "../../Effects/Reveal";
import Magnetic from "../../Effects/Magnetic";
import "../../css/Pages.css";

// Traduction
import { Loader } from "../../Component/Loader";
import { withTranslation } from "react-i18next";

const EMAIL = "arthur.plfm@gmail.com";
const ANIM_MS = 2200;

const Arrow = () => (
  <svg className="btn__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 12L12 4M12 4H5.5M12 4v6.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ContactMeT = ({ t }) => {
  const { lang = "fr" } = useParams();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [formData, setFormData] = useState({
    from_name: "",
    from_prenom: "",
    reply_to: "",
    message: "",
  });
  const timers = useRef([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const later = (fn, ms) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const showNotice = (type) => {
    setNotice(type);
    later(() => setNotice(null), 3200);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.from_name || !formData.from_prenom || !formData.reply_to) {
      return;
    }

    // identifiants emailJS
    const serviceId = "react_contact_detail";
    const templateId = "react_contact_form";
    const userId = "0V7hrtVud6jFHapQ2";

    // L'animation d'envoi dure au minimum ANIM_MS, même si emailJS répond plus vite
    setSending(true);
    const t0 = Date.now();

    emailjs
      .send(serviceId, templateId, formData, userId)
      .then(() => {
        const delay = Math.max(0, ANIM_MS - (Date.now() - t0));
        later(() => {
          setSending(false);
          setFormData({ from_name: "", from_prenom: "", reply_to: "", message: "" });
          showNotice("success");
        }, delay);
      })
      .catch(() => {
        const delay = Math.max(0, ANIM_MS - (Date.now() - t0));
        later(() => {
          setSending(false);
          showNotice("error");
        }, delay);
      });
  };

  return (
    <div className="page">
      <SEO
        lang={lang}
        path="/contactMe"
        title={`${t("ContactMe.title")} - Arthur BRU`}
        description="Contactez Arthur BRU, développeur Web &amp; IA. Envoyez-moi un message directement via ce formulaire de contact."
        ogTitle="Contact - Arthur BRU"
        ogDescription="Contactez Arthur BRU, développeur Web &amp; IA."
        structuredData={`{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Contact - Arthur BRU",
          "url": "https://www.arthur-portfolio.dev/contactMe",
          "description": "Contactez Arthur BRU, développeur Web & IA.",
          "author": { "@type": "Person", "name": "Arthur BRU" }
        }`}
      />
      <FocusLoop>
        <main id="main" className="contact container">
          <div className="contact__intro">
            <Reveal className="mono eyebrow">{t("ClassicNavBar.ContactMe")}</Reveal>
            <h1 className="contact__title">
              <SplitReveal text={t("ContactMe.title")} scroll />
            </h1>
            <Reveal className="contact__lead" delay={0.25}>
              {t("ContactMe.intro")}
            </Reveal>
            <Reveal className="contact__links" delay={0.35} stagger={0.08} y={20}>
              <a className="contact__mail link-line" href={`mailto:${EMAIL}`}>
                {EMAIL}
              </a>
              <span className="contact__socials">
                <a
                  className="link-line"
                  href="https://www.linkedin.com/in/arthur-bru-b71327252/"
                  target="_blank"
                  rel="noreferrer"
                >
                  LinkedIn ↗
                </a>
                <a className="link-line" href="https://github.com/PoloBongo" target="_blank" rel="noreferrer">
                  GitHub ↗
                </a>
              </span>
            </Reveal>
          </div>

          <form className="contact__form" onSubmit={handleSubmit} id="reset-form">
            <Reveal className="field-row" delay={0.2} stagger={0.1} y={30}>
              <div className="field">
                <input
                  type="text"
                  name="from_name"
                  id="name"
                  autoComplete="family-name"
                  placeholder=" "
                  value={formData.from_name}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="name">{t("ContactMe.name")}</label>
              </div>
              <div className="field">
                <input
                  type="text"
                  name="from_prenom"
                  id="prenom"
                  autoComplete="given-name"
                  placeholder=" "
                  onChange={handleChange}
                  value={formData.from_prenom}
                  required
                />
                <label htmlFor="prenom">{t("ContactMe.prenom")}</label>
              </div>
            </Reveal>
            <Reveal className="field" delay={0.3} y={30}>
              <input
                type="email"
                name="reply_to"
                id="mail"
                autoComplete="email"
                placeholder=" "
                value={formData.reply_to}
                onChange={handleChange}
                required
              />
              <label htmlFor="mail">{t("ContactMe.mail")}</label>
            </Reveal>
            <Reveal className="field" delay={0.4} y={30}>
              <textarea
                name="message"
                id="message"
                placeholder=" "
                value={formData.message}
                onChange={handleChange}
                required
              />
              <label htmlFor="message">{t("ContactMe.message")}</label>
            </Reveal>
            <Reveal className="contact__actions" delay={0.5} y={30}>
              <Magnetic>
                <button
                  type="submit"
                  id="last"
                  className={`btn btn--solid contact__submit${sending ? " is-sending" : ""}`}
                  disabled={sending}
                >
                  {sending && <span className="contact__progress" aria-hidden="true" />}
                  <span className="contact__submit-label">
                    {sending ? t("ContactMe.submitInProgress") : t("ContactMe.submit")}
                  </span>
                  {!sending && <Arrow />}
                </button>
              </Magnetic>
            </Reveal>
          </form>
        </main>
        <Footer compact />
        <Navbar />
      </FocusLoop>

      <div
        className={`toast${notice ? " is-visible" : ""}${notice === "error" ? " toast--error" : ""}`}
        role="status"
        aria-live="polite"
      >
        {notice ? t(`ContactMe.${notice}`) : ""}
      </div>
    </div>
  );
};

const TranslatedContactMe = withTranslation()(ContactMeT);

export default function ContactMe() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedContactMe />
    </Suspense>
  );
}
