import { Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../Component/Navbar";
import { Loader } from "../Component/ComponentTraduction";
import { withTranslation } from "react-i18next";
import "../css/Home.css";

const ErrorPageT = ({ t, code = 404 }) => {
  const { lang = "fr" } = useParams();

  return (
    <div className="Home-header overflowHidden">
      <Navbar tabIndex={2} />
      <div className="error-page">
        <span className="error-code">{code}</span>
        <h1 className="error-title">{t("ErrorPage.title")}</h1>
        <p className="error-message">{t("ErrorPage.message")}</p>
        <Link to={`/${lang}`} className="error-btn" tabIndex={1}>
          {t("ErrorPage.backHome")}
        </Link>
      </div>
    </div>
  );
};

const TranslatedErrorPage = withTranslation()(ErrorPageT);

export default function ErrorPage(props) {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedErrorPage {...props} />
    </Suspense>
  );
}
