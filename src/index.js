import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "./css/Design.css";
import "./css/Shell.css";
import "./css/Tome.css";
import React, { Suspense, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import ErrorPage from "./Pages/ErrorPage";
import { WorkPage, ProjectsWeb, ContactMe, GameJam, UnityPage, UnrealPage, IncomingPage, AIPage } from "./Pages/lazyPages";
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
import { initCopyText } from "./Effects/CopyText";
import i18n from "./i18n";

import "./i18n";

// Sons d'interface (désactivés par défaut) : l'AudioContext n'est créé qu'au premier geste
initSound();
initUiSounds();

// Pas de surlignage au double clic ; un clic sur un texte le copie (avec un effet)
initCopyText();

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

// Page chargée à part : écran de chargement le temps du premier téléchargement (les transitions l'attendent)
const Page = ({ children }) => <Suspense fallback={<Loader />}>{children}</Suspense>;

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
                <Route path="GameJam" element={<Page><GameJam /></Page>} />
                <Route path="Unity" element={<Page><UnityPage /></Page>} />
                <Route path="Unreal" element={<Page><UnrealPage /></Page>} />
                <Route path="Incoming" element={<Page><IncomingPage /></Page>} />
                <Route path="ProjectsWeb" element={<Page><ProjectsWeb /></Page>} />
                <Route path="contactMe" element={<Page><ContactMe /></Page>} />
                <Route path="AI" element={<Page><AIPage /></Page>} />
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

// Refonte manga : effets « anime » (images d'impact, onomatopées, coups de titre), chargés à part, après le rendu
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const startAnime = () => import("./Effects/anime").then(({ startAnime: start }) => start());
  if ("requestIdleCallback" in window) window.requestIdleCallback(startAnime, { timeout: 2500 });
  else setTimeout(startAnime, 1200);
}
