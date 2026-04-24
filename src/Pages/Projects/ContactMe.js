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

    setShowGif(true);

    emailjs
      .send(serviceId, templateId, formData, userId)
      .then((response) => {
        setNotificationMessage("Mail envoyé avec succès!");
        setShowNotification(true);
        setTimeout(() => {
          setShowGif(false);
          setFormData({
            from_name: "",
            from_prenom: "",
            reply_to: "",
            message: "",
          });
          document.getElementById("reset-form").reset();
          setShowNotification(false);
        }, 6000);
      })
      .catch((error) => {
        setNotificationMessage("Échec de l'envoi du mail.");
        setShowNotification(true);
        setTimeout(() => {
          setShowGif(false);
          setShowNotification(false);
          document.getElementById("reset-form").reset();
        }, 6000);
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
          <div className="contactMeFlex">
            <h1 className="fontsBold">{t("ContactMe.title")}</h1>
          </div>
          <div className="flex-contact">
            <div className="separatorContact"></div>
            <div className="flex-contact-div margin-contact-div">
              <form onSubmit={handleSubmit} id="reset-form">
                <div className="flex-part-form">
                  <div className="flex-row-part-form-nom-prenom">
                    <div className="flex-part-form iconSpace2">
                      <label htmlFor="name" className="fontsRegular display-remove">
                        {t("ContactMe.name")} :
                      </label>
                      <div className="borderRGBForm">
                        <input
                          type="text"
                          name="from_name"
                          id="name"
                          placeholder="Saisissez votre Nom"
                          value={formData.from_name}
                          onChange={handleChange}
                          tabIndex={1}
                          required
                        ></input>
                      </div>
                    </div>
                    <div className="flex-part-form prenom">
                      <label htmlFor="prenom" className="fontsRegular display-remove">
                        {t("ContactMe.prenom")} :
                      </label>
                      <div className="borderRGBForm">
                        <input
                          type="text"
                          name="from_prenom"
                          id="prenom"
                          placeholder="Saisissez votre Prénom"
                          onChange={handleChange}
                          value={formData.from_prenom}
                          tabIndex={2}
                          required
                        ></input>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-part-form">
                  <label htmlFor="mail" className="fontsRegular display-remove">
                    {t("ContactMe.mail")} :
                  </label>
                  <div className="borderRGBForm">
                    <input
                      type="email"
                      name="reply_to"
                      id="mail"
                      placeholder="Saisissez votre Mail"
                      value={formData.reply_to}
                      onChange={handleChange}
                      tabIndex={3}
                      required
                    ></input>
                  </div>
                </div>
                <div className="flex-part-form">
                  <label htmlFor="message" className="fontsRegular display-remove">
                    {t("ContactMe.message")} :
                  </label>
                  <div className="borderRGBForm">
                    <textarea
                      placeholder="Votre Message"
                      name="message"
                      id="message"
                      value={formData.message}
                      onChange={handleChange}
                      tabIndex={4}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="flex-part-form margin-submit-form-contact">
                  <button
                    type="submit"
                    tabIndex={5}
                    onClick={(e) => handleSubmit(e)}
                    className="submitForm relativePosition"
                    id="last"
                  >
                    {showGif ? (
                      <img
                        src={pikachuForm}
                        alt="submit pikachu load"
                        className="gifForm"
                        style={{
                          overflow: "hidden",
                          animation: "fadeBongo 7s ease-in-out forwards",
                        }}
                        loading="lazy"
                      />
                    ) : (
                      t("ContactMe.submit")
                    )}
                  </button>
                </div>
              </form>
            </div>
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
