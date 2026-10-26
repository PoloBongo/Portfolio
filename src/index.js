import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./css/Design.css";
import "./css/Shell.css";
import React, { Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ProjectsWeb from "./Pages/Projects/ProjectsWeb";
import ContactMe from "./Pages/Projects/ContactMe";
import GameJam from "./Pages/GameJam/GameJam";
import UnityPage from "./Pages/Unity/Unity";
import UnrealPage from "./Pages/Unreal/Unreal";
import IncomingPage from "./Pages/Incoming/Incoming";
import AIPage from "./Pages/AI/AIPage";
import ErrorPage from "./Pages/ErrorPage";
import { WorkPage } from "./Pages/lazyPages";
import { Loader } from "./Component/Loader";
import Arthur from "./Arthur";
import reportWebVitals from "./reportWebVitals";
import LanguageWrapper, { SUPPORTED_LANGS } from "./Component/LanguageWrapper";
import SmoothScroll from "./Effects/SmoothScroll";
import PageTransition from "./Effects/PageTransition";
import Preloader from "./Effects/Preloader";
import Cursor from "./Effects/Cursor";
import Hud from "./Component/Hud";
import Stage from "./Component/Stage";
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

// /work/mon-projet (sans langue) → /fr/work/mon-projet
function WorkRedirect() {
  const { slug } = useParams();
  return <LangRedirect page={`work/${slug}`} />;
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <Router>
        <SmoothScroll>
          <PageTransition>
            {/* Fond et nuage de points : un seul exemplaire, derrière toutes les pages */}
            <Stage />
            <Routes>
              {/* Root + legacy redirects → /:lang équivalent */}
              <Route path="/" element={<LangRedirect />} />
              <Route path="/arthur" element={<LangRedirect />} />
              <Route path="/GameJam" element={<LangRedirect page="GameJam" />} />
              <Route path="/Unity" element={<LangRedirect page="Unity" />} />
              <Route path="/Unreal" element={<LangRedirect page="Unreal" />} />
              <Route path="/Incoming" element={<LangRedirect page="Incoming" />} />
              <Route path="/ProjectsWeb" element={<LangRedirect page="ProjectsWeb" />} />
              <Route path="/contactMe" element={<LangRedirect page="contactMe" />} />
              <Route path="/AI" element={<LangRedirect page="AI" />} />
              <Route path="/work/:slug" element={<WorkRedirect />} />

              {/* Routes avec préfixe langue */}
              <Route path="/:lang" element={<LanguageWrapper />}>
                <Route index element={<Arthur />} />
                <Route path="GameJam" element={<GameJam />} />
                <Route path="Unity" element={<UnityPage />} />
                <Route path="Unreal" element={<UnrealPage />} />
                <Route path="Incoming" element={<IncomingPage />} />
                <Route path="ProjectsWeb" element={<ProjectsWeb />} />
                <Route path="contactMe" element={<ContactMe />} />
                <Route path="AI" element={<AIPage />} />
                <Route
                  path="work/:slug"
                  element={
                    <Suspense fallback={<Loader />}>
                      <WorkPage />
                    </Suspense>
                  }
                />
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
