import React, { useRef } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import SplitReveal from "../Effects/SplitReveal";
import Button from "./Button";
import ProjectMedia from "./ProjectMedia";
import { gsap, ScrollTrigger, EASE, onReady, prefersReducedMotion } from "../Effects/motion";

// Fiche technique : champs lus dans les traductions (clé du projet + nom du champ)
const SPECS = [
  { field: "Langage", label: "VideoGamesProjects.Langage" },
  { field: "ToolsUsed", label: "VideoGamesProjects.ToolsUsed", html: true },
  { field: "Duration", label: "VideoGamesProjects.Duration" },
  { field: "Completion", label: "VideoGamesProjects.Completion" },
  { field: "TeamSize", label: "VideoGamesProjects.TeamSize" },
  { field: "Role", label: "VideoGamesProjects.Role" },
];

const clean = (label) => label.replace(/\s*:\s*$/, "");
const pad = (n) => String(n).padStart(2, "0");

// Un projet = numéro, titre, média jouable, fiche technique, description, liens
export default function ProjectCase({ project, index }) {
  const { t, i18n } = useTranslation();
  const rootRef = useRef(null);

  const title = project.titleKey ? t(project.titleKey) : project.title;
  const prefix = project.i18n;
  const exists = (field) => prefix && i18n.exists(`${prefix}.${field}`);

  const specs = SPECS.filter(({ field }) => exists(field)).map((spec) => ({
    ...spec,
    value: t(`${prefix}.${spec.field}`),
  }));
  const year = exists("Completion") ? t(`${prefix}.Completion`) : null;
  const language = exists("Langage") ? t(`${prefix}.Langage`) : null;

  // Les textes utilisent parfois *mot* pour l'italique
  const emphasis = (html) => html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

  let description = null;
  if (project.render) description = project.render(t);
  else if (project.descriptionKey || exists("Description")) {
    description = (
      <div
        dangerouslySetInnerHTML={{
          __html: emphasis(t(project.descriptionKey || `${prefix}.Description`)),
        }}
      />
    );
  }

  const links = project.links || [];

  // Entrée du projet quand il arrive dans le viewport : trait, média qui se dévoile, textes en cascade
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(rootRef);
      const media = q(".case__media")[0];
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      tl.fromTo(q(".case__rule"), { scaleX: 0 }, { scaleX: 1, duration: 1.5, ease: EASE.inOut }, 0)
        .fromTo(
          q(".case__index, .case__meta"),
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 },
          0.1
        )
        .fromTo(
          media,
          { clipPath: "inset(100% 0% 0% 0% round 22px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 22px)",
            duration: 1.4,
            ease: EASE.inOut,
            onComplete: () => gsap.set(media, { clearProps: "clipPath" }),
          },
          0.15
        )
        .fromTo(q(".player__img, .player__clip, .player__placeholder"), { scale: 1.28 }, { scale: 1, duration: 1.9 }, 0.15)
        .fromTo(
          q(".case__spec"),
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.07 },
          0.45
        )
        .fromTo(
          q(".case__desc, .case__actions"),
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 1, stagger: 0.1 },
          0.7
        );

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top 78%",
        once: true,
        onEnter: () => onReady(() => tl.play()),
      });
    },
    { scope: rootRef }
  );

  return (
    <article className="case" id={project.anchor} ref={rootRef}>
      <header className="case__head">
        <span className="case__index mono">{pad(index)}</span>
        <span className="case__rule" aria-hidden="true" />
        {(year || language) && (
          <span className="case__meta mono">{[year, language].filter(Boolean).join(" · ")}</span>
        )}
      </header>

      <h2 className="case__title">
        <SplitReveal text={title} scroll />
      </h2>

      <div className="case__grid">
        <div className="case__main">
          <div className="case__media">
            <ProjectMedia project={project} title={title} />
          </div>

          {description && <div className="case__desc">{description}</div>}

          {links.length > 0 && (
            <div className="case__actions">
              {links.map((link) => (
                <Button key={link.href} href={link.href} variant={link.primary ? "solid" : undefined}>
                  {link.label || t(link.labelKey)}
                </Button>
              ))}
            </div>
          )}
        </div>

        {specs.length > 0 && (
          <aside className="case__aside">
            <dl className="case__specs">
              {specs.map(({ field, label, value, html }) => (
                <div className="case__spec" key={field}>
                  <dt className="mono">{clean(t(label))}</dt>
                  {html ? <dd dangerouslySetInnerHTML={{ __html: value }} /> : <dd>{value}</dd>}
                </div>
              ))}
            </dl>
          </aside>
        )}
      </div>
    </article>
  );
}
