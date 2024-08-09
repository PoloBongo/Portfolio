import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProjectsWeb from "./Projects/ProjectsWeb";
import ProjectsVideosGames from "./Projects/ProjectsVideosGames";
import ContactMe from "./Projects/ContactMe";
import GameJam from "./GameJam/GameJam";
import "./index.css";
import Arthur from "./Arthur";
import Layout from "./Component/Layout";
import reportWebVitals from "./reportWebVitals";

import "./i18n";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/arthur" element={<Arthur />} />
        <Route
          path="/"
          element={
            <Layout canonicalUrl="https://www.arthur-portfolio.dev/arthur">
              <Arthur />
            </Layout>
          }
        />
        <Route path="/gamejam" element={<GameJam />} />
        <Route path="/projectsWeb" element={<ProjectsWeb />} />
        <Route path="/projectsVideosGames" element={<ProjectsVideosGames />} />
        <Route path="/contactMe" element={<ContactMe />} />
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
