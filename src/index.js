import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./css/Design.css";
import "./css/Shell.css";
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
import AIPage from "./Pages/AI/AIPage";
import ErrorPage from "./Pages/ErrorPage";
import Arthur from "./Arthur";
import reportWebVitals from "./reportWebVitals";
import LanguageWrapper, { SUPPORTED_LANGS } from "./Component/LanguageWrapper";
import SmoothScroll from "./Effects/SmoothScroll";
import PageTransition from "./Effects/PageTransition";
import Preloader from "./Effects/Preloader";
import Cursor from "./Effects/Cursor";
import Hud from "./Component/Hud";
import { initSound, initUiSounds } from "./Effects/sound";
import i18n from "./i18n";

import "./i18n";

// Sons d'interface (désactivés par défaut) : l'AudioContext n'est créé qu'au premier geste
initSound();
initUiSounds();

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
        <SmoothScroll>
          <PageTransition>
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
              <Route path="/AI" element={<LangRedirect page="AI" />} />

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
                <Route path="AI" element={<AIPage />} />
                <Route path="*" element={<ErrorPage />} />
              </Route>
              <Route path="*" element={<ErrorPage />} />
            </Routes>

            {/* Couches globales : intro, HUD, curseur, grain */}
            <Preloader />
            <Hud />
            <Cursor />
            <div className="grain" aria-hidden="true" />
          </PageTransition>
        </SmoothScroll>
      </Router>
    </HelmetProvider>
  </React.StrictMode>
);

reportWebVitals();
