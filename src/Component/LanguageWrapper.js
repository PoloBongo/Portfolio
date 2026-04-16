import { useEffect } from "react";
import { useParams, useNavigate, Outlet } from "react-router-dom";
import i18n from "../i18n";

export const SUPPORTED_LANGS = ["fr", "en", "es"];

export default function LanguageWrapper() {
  const { lang } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!SUPPORTED_LANGS.includes(lang)) {
      navigate("/fr", { replace: true });
      return;
    }
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [lang, navigate]);

  if (!SUPPORTED_LANGS.includes(lang)) return null;
  return <Outlet />;
}
