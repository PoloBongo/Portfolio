import React from "react";
import ReactDOM from "react-dom/client";
import ProjectsWeb from "./Projects/ProjectsWeb";
import ProjectsVideosGames from "./Projects/ProjectsVideosGames";
import ContactMe from "./Projects/ContactMe";
import "./index.css";
import Home from "./Home";
import reportWebVitals from "./reportWebVitals";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./i18n";

const router = createBrowserRouter([
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/projectsWeb",
    element: <ProjectsWeb />,
  },
  {
    path: "/projectsVideosGames",
    element: <ProjectsVideosGames />,
  },
  {
    path: "/contactMe",
    element: <ContactMe />,
  },
]);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

reportWebVitals();
