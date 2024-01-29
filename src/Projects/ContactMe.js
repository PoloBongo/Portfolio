import React, { Suspense, useState } from "react";
import "../css/Home.css";
import Navbar from "../Component/Navbar";
import emailjs from "emailjs-com";
import pikachuForm from "../img/pikachuForm.gif";

// Traduction
import { Loader } from "../Component/ComponentTraduction";
import { withTranslation } from "react-i18next";

const ContactMeT = ({ t }) => {
  const [showGif, setShowGif] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.from_name || !formData.from_prenom || !formData.reply_to) {
      console.log("Veuillez remplir tous les champs obligatoires.");
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
        console.log("mail send", response);
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
          setShowNotification(false);
        }, 7000);
      })
      .catch((error) => {
        console.error("mail failed", error);
        setNotificationMessage("Échec de l'envoi du mail.");
        setShowNotification(true);

        setTimeout(() => {
          setShowGif(false);
          setShowNotification(false);
        }, 7000);
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
    <div className="Home-header">
      <Navbar />
      <div>
        <div className="contactMeFlex">
          <h3 className="fontsBold">{t("ContactMe.title")}</h3>
        </div>
        <div className="flex-contact">
          <div className="separatorContact"></div>
          <div className="flex-contact-div margin-contact-div">
            <form onSubmit={handleSubmit}>
              <div className="flex-part-form">
                <div className="flex-row-part-form-nom-prenom">
                  <div className="flex-part-form">
                    <label className="fontsRegular display-remove">
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
                        required
                      ></input>
                    </div>
                  </div>
                  <div className="flex-part-form prenom">
                    <label className="fontsRegular display-remove">
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
                        required
                      ></input>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-part-form">
                <label className="fontsRegular display-remove">
                  {t("ContactMe.mail")} :
                </label>
                <div className="borderRGBForm">
                  <input
                    type="mail"
                    name="reply_to"
                    id="mail"
                    placeholder="Saisissez votre Mail"
                    value={formData.reply_to}
                    onChange={handleChange}
                    required
                  ></input>
                </div>
              </div>
              <div className="flex-part-form">
                <label className="fontsRegular display-remove">
                  {t("ContactMe.message")} :
                </label>
                <div className="borderRGBForm">
                  <textarea
                    placeholder="Votre Message"
                    name="message"
                    id="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="flex-part-form">
                <button
                  type="submit"
                  className="submitForm relativePosition"
                  onClick={(e) => handleSubmit(e)}
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
