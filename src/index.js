import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ProjectsWeb from "./Pages/Projects/ProjectsWeb";
import ProjectsVideosGames from "./Pages/ProjetctsJV/JVPage";
import ContactMe from "./Pages/Projects/ContactMe";
import GameJam from "./Pages/GameJam/GameJam";
import UnityPage from "./Pages/Unity/Unity";
import UnrealPage from "./Pages/Unreal/Unreal";
import IncomingPage from "./Pages/Incoming/Incoming";
import ErrorPage from "./Pages/ErrorPage";
import "./index.css";
import Arthur from "./Arthur";
import reportWebVitals from "./reportWebVitals";
import LanguageWrapper, { SUPPORTED_LANGS } from "./Component/LanguageWrapper";
import i18n from "./i18n";

import "./i18n";

let keyboardNavActive = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && !keyboardNavActive) {
    keyboardNavActive = true;
    document.body.classList.add("keyboard-nav");
    e.preventDefault();
  }
});
document.addEventListener("mousedown", () => {
  keyboardNavActive = false;
  document.body.classList.remove("keyboard-nav");
});

function LangRedirect({ page }) {
  const navigate = useNavigate();

  useEffect(() => {
    const detected = i18n.language?.split("-")[0];
    const lang = SUPPORTED_LANGS.includes(detected) ? detected : "fr";
    navigate(page ? `/${lang}/${page}` : `/${lang}`, { replace: true });
  }, [navigate, page]);

  return null;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <Routes>
          {/* Root + legacy redirects → /:lang équivalent */}
          <Route path="/" element={<LangRedirect />} />
          <Route path="/arthur" element={<LangRedirect />} />
          <Route path="/GameJam" element={<LangRedirect page="GameJam" />} />
          <Route path="/Unity" element={<LangRedirect page="Unity" />} />
          <Route path="/Unreal" element={<LangRedirect page="Unreal" />} />
          <Route path="/Incoming" element={<LangRedirect page="Incoming" />} />
          <Route path="/ProjectsWeb" element={<LangRedirect page="ProjectsWeb" />} />
          <Route path="/ProjectsVideosGames" element={<LangRedirect page="ProjectsVideosGames" />} />
          <Route path="/contactMe" element={<LangRedirect page="contactMe" />} />

          {/* Routes avec préfixe langue */}
          <Route path="/:lang" element={<LanguageWrapper />}>
            <Route index element={<Arthur />} />
            <Route path="GameJam" element={<GameJam />} />
            <Route path="Unity" element={<UnityPage />} />
            <Route path="Unreal" element={<UnrealPage />} />
            <Route path="Incoming" element={<IncomingPage />} />
            <Route path="ProjectsWeb" element={<ProjectsWeb />} />
            <Route path="ProjectsVideosGames" element={<ProjectsVideosGames />} />
            <Route path="contactMe" element={<ContactMe />} />
            <Route path="*" element={<ErrorPage />} />
          </Route>
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </HelmetProvider>
  </React.StrictMode>
);

reportWebVitals();
