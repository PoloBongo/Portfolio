import { Suspense, useState } from "react";
import "../../css/Home.css";
import { useParams } from "react-router-dom";
import Navbar from "../../Component/Navbar";
import { Helmet } from "react-helmet-async";
import emailjs from "emailjs-com";
import pikachuForm from "../../img/pikachuForm.webp";

// Traduction
import { Loader } from "../../Component/ComponentTraduction";
import { withTranslation } from "react-i18next";

import FocusLoop from "../../Component/FocusLoop";

const ContactMeT = ({ t }) => {
  const { lang = "fr" } = useParams();
  const [showGif, setShowGif] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.from_name || !formData.from_prenom || !formData.reply_to) {
      return;
    }

    // identifiants emailJS
    const serviceId = "react_contact_detail";
    const templateId = "react_contact_form";
    const userId = "0V7hrtVud6jFHapQ2";

    const ANIM_MS = 3000;
    setShowGif(true);
    const t0 = Date.now();

    emailjs
      .send(serviceId, templateId, formData, userId)
      .then(() => {
        const delay = Math.max(0, ANIM_MS - (Date.now() - t0));
        setTimeout(() => {
          setShowGif(false);
          setFormData({ from_name: "", from_prenom: "", reply_to: "", message: "" });
          document.getElementById("reset-form").reset();
          setNotificationMessage("Mail envoyé avec succès!");
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 2000);
        }, delay);
      })
      .catch(() => {
        const delay = Math.max(0, ANIM_MS - (Date.now() - t0));
        setTimeout(() => {
          setShowGif(false);
          setNotificationMessage("Échec de l'envoi du mail.");
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 2000);
        }, delay);
      });
  };

  const [formData, setFormData] = useState({
    from_name: "",
    from_prenom: "",
    reply_to: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="Home-header overflowHidden">
      <Helmet>
        <title>{t("ContactMe.title")} - Arthur BRU</title>
        <meta name="description" content="Contactez Arthur BRU, développeur Web &amp; Jeu Vidéo. Envoyez-moi un message directement via ce formulaire de contact." />
        <link rel="canonical" href={`https://www.arthur-portfolio.dev/${lang}/contactMe`} />
        <link rel="alternate" hreflang="fr" href="https://www.arthur-portfolio.dev/fr/contactMe" />
        <link rel="alternate" hreflang="en" href="https://www.arthur-portfolio.dev/en/contactMe" />
        <link rel="alternate" hreflang="es" href="https://www.arthur-portfolio.dev/es/contactMe" />
        <link rel="alternate" hreflang="x-default" href="https://www.arthur-portfolio.dev/fr/contactMe" />
        <meta property="og:title" content="Contact - Arthur BRU" />
        <meta property="og:description" content="Contactez Arthur BRU, développeur Web &amp; Jeu Vidéo." />
        <meta property="og:url" content={`https://www.arthur-portfolio.dev/${lang}/contactMe`} />
        <meta property="og:image" content="https://www.arthur-portfolio.dev/arthur.webp" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Contact - Arthur BRU" />
        <meta name="twitter:description" content="Contactez Arthur BRU, développeur Web &amp; Jeu Vidéo." />
        <meta name="twitter:image" content="https://www.arthur-portfolio.dev/arthur.webp" />
        <script type="application/ld+json">{`{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Contact - Arthur BRU",
          "url": "https://www.arthur-portfolio.dev/contactMe",
          "description": "Contactez Arthur BRU, développeur Web & Jeu Vidéo.",
          "author": { "@type": "Person", "name": "Arthur BRU" }
        }`}</script>
      </Helmet>
      <FocusLoop>
        <Navbar tabIndex={6} />
        <div className="traitSeparator"></div>
        <div className="align-form-contact">
          <div className="contact-card">
            <div className="contact-card-header">
              <svg
                className="contact-card-icon"
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              <h1 className="fontsBold">{t("ContactMe.title")}</h1>
              <a href="mailto:arthur.plfm@gmail.com" className="contact-card-email">
                arthur.plfm@gmail.com
              </a>
            </div>
            <form onSubmit={handleSubmit} id="reset-form">
              <div className="contact-form-row">
                <div className="contact-form-field">
                  <input
                    type="text"
                    name="from_name"
                    id="name"
                    placeholder=" "
                    value={formData.from_name}
                    onChange={handleChange}
                    tabIndex={1}
                    required
                  />
                  <label htmlFor="name">{t("ContactMe.name")}</label>
                </div>
                <div className="contact-form-field">
                  <input
                    type="text"
                    name="from_prenom"
                    id="prenom"
                    placeholder=" "
                    onChange={handleChange}
                    value={formData.from_prenom}
                    tabIndex={2}
                    required
                  />
                  <label htmlFor="prenom">{t("ContactMe.prenom")}</label>
                </div>
              </div>
              <div className="contact-form-field">
                <input
                  type="email"
                  name="reply_to"
                  id="mail"
                  placeholder=" "
                  value={formData.reply_to}
                  onChange={handleChange}
                  tabIndex={3}
                  required
                />
                <label htmlFor="mail">{t("ContactMe.mail")}</label>
              </div>
              <div className="contact-form-field">
                <textarea
                  name="message"
                  id="message"
                  placeholder=" "
                  value={formData.message}
                  onChange={handleChange}
                  tabIndex={4}
                  required
                />
                <label htmlFor="message">{t("ContactMe.message")}</label>
              </div>
              <button type="submit" tabIndex={5} id="last" disabled={showGif}>
                {showGif ? (
                  <img
                    src={pikachuForm}
                    alt="submit pikachu load"
                    className="gifForm"
                    style={{
                      overflow: "hidden",
                      animation: "fadeBongo 3s ease-in-out forwards",
                    }}
                    loading="lazy"
                  />
                ) : (
                  t("ContactMe.submit")
                )}
              </button>
            </form>
          </div>
        </div>
      </FocusLoop>
      {showNotification && (
        <div className="notification fontsRegular">{notificationMessage}</div>
      )}
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
