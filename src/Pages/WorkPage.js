import React, { Suspense, useLayoutEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import SEO from "../Component/Layout.js";
import Navbar from "../Component/Navbar.js";
import Footer from "../Component/Footer.js";
import FocusLoop from "../Component/FocusLoop.js";
import Button from "../Component/Button";
import ProjectMedia from "../Component/ProjectMedia";
import SplitReveal from "../Effects/SplitReveal";
import Reveal from "../Effects/Reveal";
import { TLink } from "../Effects/PageTransition";
import { gsap, EASE, onReady, prefersReducedMotion } from "../Effects/motion";
import { setFieldTint } from "../Effects/fieldBus";
import ClickFx from "../Effects/ClickFx";
import { applyWorld } from "../Worlds/theme";
import { worldOf } from "../Worlds/config";
import { worldHero } from "../Worlds";
import { getWork, neighbours, titleOf, workPath } from "./work";
import ErrorPage from "./ErrorPage";
import "../css/Work.css";

const BASE_URL = "https://www.arthur-portfolio.dev";

// Fiche technique : champs lus dans les traductions (préfixe du projet + nom du champ)
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
// Les textes utilisent parfois *mot* pour l'italique
const emphasis = (html) => html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");

// Fil d'Ariane : retour à la catégorie, rang du projet dans elle
function Crumb({ work, lang }) {
  const { t } = useTranslation();
  return (
    <nav className="work-crumb mono" aria-label={t("Work.breadcrumb")}>
      <TLink className="work-crumb__back link-line" to={`/${lang}${work.category.path}`} label={t(work.category.labelKey)}>
        <span aria-hidden="true">←</span> {t(work.category.labelKey)}
      </TLink>
      <span className="work-crumb__count">
        {pad(work.index + 1)} / {pad(work.count)}
      </span>
    </nav>
  );
}

function Facts({ items }) {
  if (items.length === 0) return null;
  return (
    <ul className="work-facts mono">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

// Mise en page commune d'un monde sans module sur mesure : titre, accroche, faits, média
function DefaultHero({ title, tagline, crumb, facts, media }) {
  const rootRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return undefined;
      const q = gsap.utils.selector(rootRef);
      const frame = q(".work-stage .case__media")[0];
      const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.out } });
      tl.fromTo(q(".work-crumb > *"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.08 }, 0)
        .fromTo(q(".work-title .split-char"), { yPercent: 118 }, { yPercent: 0, duration: 1.35, stagger: 0.035 }, 0.08)
        .fromTo(q(".work-tagline"), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1 }, 0.5)
        .fromTo(q(".work-facts > *"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.06 }, 0.65)
        .fromTo(
          frame,
          { clipPath: "inset(100% 0% 0% 0% round 22px)" },
          {
            clipPath: "inset(0% 0% 0% 0% round 22px)",
            duration: 1.4,
            ease: EASE.inOut,
            onComplete: () => gsap.set(frame, { clearProps: "clipPath" }),
          },
          0.45
        )
        .fromTo(q(".player__img, .player__clip, .player__placeholder"), { scale: 1.28 }, { scale: 1, duration: 1.9 }, 0.45);
      return onReady(() => tl.play());
    },
    { scope: rootRef, dependencies: [title], revertOnUpdate: true }
  );

  return (
    <header className="work-hero" ref={rootRef} data-work-top>
      <div className="container">
        {crumb}
        <h1 className={`work-title${title.length > 18 ? " work-title--long" : ""}`}>
          <SplitReveal text={title} by="chars" />
        </h1>
        <p className="work-tagline serif">{tagline}</p>
        {facts}
      </div>
      <div className="container work-stage">
        <div className="case__media">{media}</div>
      </div>
    </header>
  );
}

// Projet suivant de la catégorie (la liste boucle) : l'aperçu de son monde se teinte au survol
function NextProject({ work, world, lang }) {
  const { t } = useTranslation();
  const { prev, next } = neighbours(work);
  if (!next) return null;

  const nextWorld = worldOf(next);
  const preview = () => setFieldTint(nextWorld.tint, nextWorld.mix);
  const restore = () => setFieldTint(world.tint, world.mix);

  return (
    <nav className="work-next" aria-label={`${t("Work.next")} / ${t("Work.prev")}`}>
      <TLink
        className="work-next__link"
        to={workPath(lang, next.slug)}
        label={titleOf(next, t)}
        style={{ "--next": nextWorld.accent }}
        onPointerEnter={preview}
        onPointerLeave={restore}
        onFocus={preview}
        onBlur={restore}
      >
        <span className="container work-next__inner">
          <span className="work-next__kicker mono">
            {t("Work.next")} · {pad(next.index + 1)} / {pad(next.count)}
          </span>
          <span className="work-next__title">{titleOf(next, t)}</span>
          <span className="work-next__tagline">{t(`Work.Tagline.${next.slug}`)}</span>
          <svg className="work-next__arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19L19 5M19 5H8M19 5v11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </TLink>
      <div className="container work-next__more mono">
        {prev && prev.slug !== next.slug && (
          <TLink className="link-line" to={workPath(lang, prev.slug)} label={titleOf(prev, t)}>
            ← {t("Work.prev")} : {titleOf(prev, t)}
          </TLink>
        )}
        <TLink className="link-line" to={`/${lang}${work.category.path}`} label={t(work.category.labelKey)}>
          {t("Work.all")} · {t(work.category.labelKey)}
        </TLink>
      </div>
    </nav>
  );
}

function jsonLd({ work, title, tagline, lang, url, categoryName }) {
  const type = work.category.id === "web" || work.category.id === "ai" ? "SoftwareApplication" : "VideoGame";
  const home = `${BASE_URL}/${lang}`;
  const author = { "@type": "Person", name: "Arthur BRU", url: home };
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Arthur BRU", item: home },
          { "@type": "ListItem", position: 2, name: categoryName, item: `${home}${work.category.path}` },
          { "@type": "ListItem", position: 3, name: title, item: url },
        ],
      },
      {
        "@type": "WebPage",
        name: title,
        url,
        description: tagline,
        inLanguage: lang,
        breadcrumb: { "@id": `${url}#breadcrumb` },
      },
      {
        "@type": type,
        name: title,
        description: tagline,
        url,
        author,
        keywords: work.tags,
        ...(type === "SoftwareApplication" ? { applicationCategory: "WebApplication" } : {}),
      },
    ],
  });
}

// Les couleurs du monde habillent toute l'interface tant que la page est là. Rendu en premier : ses effets passent
// avant ceux du contenu (le schéma de Cerebro lit les couleurs de l'interface à son montage).
function WorldTheme({ world }) {
  useLayoutEffect(() => applyWorld(world), [world.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

function WorkView({ work, lang }) {
  const { t, i18n } = useTranslation();
  const world = worldOf(work);
  const Hero = worldHero(work.slug);

  const title = titleOf(work, t);
  const tagline = t(`Work.Tagline.${work.slug}`);
  const categoryName = t(work.category.labelKey);
  const prefix = work.i18n;
  const exists = (field) => prefix && i18n.exists(`${prefix}.${field}`);

  const specs = SPECS.filter(({ field }) => exists(field)).map((spec) => ({ ...spec, value: t(`${prefix}.${spec.field}`) }));
  const year = exists("Completion") ? t(`${prefix}.Completion`) : null;

  let description = null;
  if (work.render) description = work.render(t);
  else if (work.descriptionKey || exists("Description")) {
    description = <div dangerouslySetInnerHTML={{ __html: emphasis(t(work.descriptionKey || `${prefix}.Description`)) }} />;
  }
  const links = work.links || [];

  const url = `${BASE_URL}/${lang}/work/${work.slug}`;
  const description160 = `${tagline} ${work.tags}`;

  const crumb = <Crumb work={work} lang={lang} />;
  const facts = <Facts items={[year, work.tags].filter(Boolean)} />;
  const media = <ProjectMedia project={work} title={title} />;
  const heroProps = { work, world, title, tagline, crumb, facts, media };

  return (
    <div className="page work-page" data-world={world.id}>
      <WorldTheme world={world} />
      <ClickFx slug={work.slug} />
      <SEO
        lang={lang}
        path={`/work/${work.slug}`}
        title={`${title} - ${categoryName} - Arthur BRU`}
        description={description160}
        ogTitle={`${title} - Arthur BRU`}
        ogDescription={tagline}
        structuredData={jsonLd({ work, title, tagline, lang, url, categoryName })}
      />
      <FocusLoop>
        <main id="main" data-hud={`${categoryName} / ${title}`}>
          {Hero ? (
            <Suspense fallback={<div className="work-hero work-hero--pending" data-work-top aria-hidden="true" />}>
              <Hero {...heroProps} />
            </Suspense>
          ) : (
            <DefaultHero {...heroProps} />
          )}

          <section className="work-body container" data-work-body>
            <div className="case__grid">
              <div className="case__main">
                {description && <Reveal className="case__desc">{description}</Reveal>}
                {links.length > 0 && (
                  <Reveal className="case__actions" delay={0.1}>
                    {links.map((link) => (
                      <Button key={link.href} href={link.href} variant={link.primary ? "solid" : undefined}>
                        {link.label || t(link.labelKey)}
                      </Button>
                    ))}
                  </Reveal>
                )}
              </div>

              {specs.length > 0 && (
                <aside className="case__aside">
                  <Reveal as="dl" className="case__specs" delay={0.05}>
                    {specs.map(({ field, label, value, html }) => (
                      <div className="case__spec" key={field}>
                        <dt className="mono">{clean(t(label))}</dt>
                        {html ? <dd dangerouslySetInnerHTML={{ __html: value }} /> : <dd>{value}</dd>}
                      </div>
                    ))}
                  </Reveal>
                </aside>
              )}
            </div>
          </section>

          <NextProject work={work} world={world} lang={lang} />
        </main>
        <Footer />
        <Navbar />
      </FocusLoop>
    </div>
  );
}

export default function WorkPage() {
  const { lang = "fr", slug } = useParams();
  const work = getWork(slug);
  // key : un autre projet repart de zéro (animations d'entrée, état du lecteur)
  return work ? <WorkView key={work.slug} work={work} lang={lang} /> : <ErrorPage />;
}
