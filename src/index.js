import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import ProjectsWeb from "./Projects/ProjectsWeb";
import ProjectsVideosGames from "./Projects/ProjectsVideosGames";
import ContactMe from "./Projects/ContactMe";
import "./index.css";
import Arthur from "./Arthur";
import reportWebVitals from "./reportWebVitals";

import "./i18n";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/arthur" element={<Arthur />} />
        <Route path="/" element={<Arthur />} />
        <Route path="/projectsWeb" element={<ProjectsWeb />} />
        <Route path="/projectsVideosGames" element={<ProjectsVideosGames />} />
        <Route path="/contactMe" element={<ContactMe />} />
      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
