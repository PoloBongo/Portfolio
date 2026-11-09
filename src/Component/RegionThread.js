import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { titleOf } from "../Pages/work";

// Le fil de la région : une bande fine collée en haut des pages de catégorie. Un nœud par projet, cliquable, aux couleurs
// de la région (Web lime, IA menthe, Jeu rose, comme la carte de l'accueil), et le repère qui suit le projet affiché dans
// le showcase ou dans la grille. Le survol d'un nœud montre son nom au-dessus du repère.
const COLORS = { web: "#d9ff4a", ai: "#63e6be", unity: "#ff5fa8", unreal: "#ff5fa8", gamejam: "#ff5fa8" };

const pad = (n) => String(n).padStart(2, "0");

export default function RegionThread({ works, active, onSelect }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(null);
  const n = works.length;
  if (n < 2) return null;

  const color = COLORS[works[0].category && works[0].category.id] || COLORS.web;
  const at = (i) => `${((i / (n - 1)) * 100).toFixed(3)}%`;
  const shown = hover != null ? hover : active;

  return (
    <div className="rthread-wrap">
      <nav className="rthread" aria-label={t("Work.projects")} style={{ "--c": color }}>
        <div className="rthread__rail" aria-hidden="true">
          <i className="rthread__fill" style={{ width: at(active) }} />
        </div>

        <ol className="rthread__nodes">
          {works.map((work, i) => (
            <li key={work.id} style={{ left: at(i) }}>
              <button
                type="button"
                className={`rthread__knot${i <= active ? " is-done" : ""}${i === active ? " is-cur" : ""}`}
                aria-label={`${pad(i + 1)} ${titleOf(work, t)}`}
                aria-current={i === active ? "true" : undefined}
                onClick={() => onSelect(i)}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                data-cursor="view"
              >
                <i aria-hidden="true" />
                <span className="rthread__n mono" aria-hidden="true">
                  {pad(i + 1)}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <span className="rthread__pin" style={{ left: at(active) }} aria-hidden="true">
          <svg viewBox="0 0 100 140" focusable="false">
            <path d="M50 0C22 0 0 22 0 50c0 38 50 90 50 90s50-52 50-90C100 22 78 0 50 0z" fill="currentColor" />
            <circle cx="50" cy="50" r="18" fill="var(--bg)" />
          </svg>
        </span>
        <span
          className="rthread__label mono"
          style={{ left: at(shown), "--shift": shown === 0 ? "0%" : shown === n - 1 ? "-100%" : "-50%" }}
          aria-hidden="true"
        >
          {pad(shown + 1)} · {titleOf(works[shown], t)}
        </span>
      </nav>
    </div>
  );
}
