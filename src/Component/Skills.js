import React, { useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TLink } from "../Effects/PageTransition";
import SplitReveal from "../Effects/SplitReveal";
import Reveal from "../Effects/Reveal";
import { gsap, Flip, EASE, prefersReducedMotion } from "../Effects/motion";

// Compétences regroupées par domaine, le web et l'IA d'abord.
// to : page de projets liée · info : texte déroulant · name : nom propre affiché tel quel (sinon label = clé de traduction)
const GROUPS = [
  {
    id: "web",
    title: "Skills.web",
    items: [
      { id: "JavaScript", label: "Home.JavaScript", to: "/ProjectsWeb" },
      { id: "TypeScript", label: "Home.TypeScript", to: "/ProjectsWeb#NextJs" },
      { id: "React", label: "Home.React" },
      { id: "NextJs", label: "Home.NextJs", to: "/ProjectsWeb#NextJs" },
      { id: "VueJs", label: "Home.VueJs", to: "/ProjectsWeb#VueJs" },
      { id: "ChartJs", label: "Home.ChartJs", to: "/ProjectsWeb#VueJs" },
      { id: "HTML", label: "Home.HTML", to: "/ProjectsWeb" },
      { id: "CSS", label: "Home.CSS", to: "/ProjectsWeb" },
      { id: "Bootstrap", label: "Home.Bootstrap", to: "/ProjectsWeb" },
      { id: "PHP", label: "Home.PHP", to: "/ProjectsWeb" },
      { id: "Symphony", label: "Home.Symphony" },
    ],
  },
  {
    id: "ai",
    title: "Skills.ai",
    items: [
      { id: "LLM", name: "LLM", to: "/AI" },
      { id: "RAG", name: "RAG", to: "/AI" },
      { id: "MCP", name: "MCP", to: "/AI" },
      { id: "LangChain", name: "LangChain", to: "/AI" },
      { id: "n8n", name: "n8n", to: "/AI" },
      { id: "Qdrant", name: "Qdrant", to: "/AI" },
      { id: "Ollama", name: "Ollama", to: "/AI" },
      { id: "Streamlit", name: "Streamlit", to: "/AI" },
    ],
  },
  {
    id: "tools",
    title: "Skills.tools",
    items: [
      { id: "Python", label: "Home.Python", to: "/AI" },
      { id: "MySQL", label: "Home.MySQL", info: "Home.MySQLDescription" },
      { id: "Git", label: "Home.Git", info: "Home.GitDescription" },
      { id: "DevOps", label: "Home.DevOps", info: "Home.DevOpsDescription" },
    ],
  },
  {
    id: "game",
    title: "Skills.game",
    items: [
      { id: "Unity", label: "Home.Unity", to: "/Unity" },
      { id: "CSharp", label: "Home.C#", to: "/Unity" },
      { id: "Cpp", label: "Home.C++", to: "/Unreal" },
      { id: "C", label: "Home.C" },
      { id: "LUA", label: "Home.LUA" },
    ],
  },
];

const Arrow = () => (
  <svg className="skill__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 19L19 5M19 5H8M19 5v11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const Plus = () => (
  <svg className="skill__icon skill__icon--plus" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export default function Skills() {
  const { t } = useTranslation();
  const { lang = "fr" } = useParams();
  const rootRef = useRef(null);
  const flipState = useRef(null);
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    if (!prefersReducedMotion()) {
      flipState.current = Flip.getState(rootRef.current.querySelectorAll(".skill"));
    }
    setOpenId((current) => (current === id ? null : id));
  };

  // La grille se réorganise en douceur quand une carte s'ouvre ou se referme
  useLayoutEffect(() => {
    if (!flipState.current) return;
    Flip.from(flipState.current, {
      duration: 0.85,
      ease: EASE.inOut,
      scale: false,
      simple: true,
      onComplete: () => gsap.set(rootRef.current.querySelectorAll(".skill"), { clearProps: "width,height" }),
    });
    flipState.current = null;
    if (openId) {
      gsap.fromTo(
        rootRef.current.querySelector(".skill.is-open .skill__info"),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, delay: 0.3, ease: EASE.out }
      );
    }
  }, [openId]);

  // Halo qui suit le curseur à l'intérieur de la carte survolée
  const onPointerMove = (e) => {
    const tile = e.target.closest(".skill");
    if (!tile) return;
    const rect = tile.getBoundingClientRect();
    tile.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    tile.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <section className="skills container" id="skills" ref={rootRef} data-hud={t("Hud.skills")}>
      <header className="section-head">
        <Reveal className="mono eyebrow">(02)</Reveal>
        <SplitReveal text={t("Home.title2")} as="h2" scroll className="section-head__title" />
      </header>

      <div className="skills__layout">
        <div className="skills__stage" data-stage="skills" aria-hidden="true">
          <span className="skills__caption mono">{t("Stage.caption")}</span>
        </div>

        <div className="skills__groups">
          {GROUPS.map((group) => (
            <div className="skills__group" key={group.id}>
              <Reveal as="h3" className="skills__group-title mono">
                {t(group.title)}
              </Reveal>
              <Reveal as="ul" className="skills__grid" stagger={0.045} y={28} onPointerMove={onPointerMove}>
                {group.items.map((skill) => {
                  const open = openId === skill.id;
                  const name = skill.name || t(skill.label);
                  const body = (
                    <>
                      <span className="skill__name">{name}</span>
                      {skill.to ? <Arrow /> : skill.info ? <Plus /> : null}
                    </>
                  );
                  return (
                    <li className={`skill${open ? " is-open" : ""}`} key={skill.id}>
                      {skill.to && (
                        <TLink className="skill__body" to={`/${lang}${skill.to}`} label={name}>
                          {body}
                        </TLink>
                      )}
                      {skill.info && (
                        <>
                          <button
                            type="button"
                            className="skill__body"
                            aria-expanded={open}
                            aria-controls={`skill-info-${skill.id}`}
                            onClick={() => toggle(skill.id)}
                          >
                            {body}
                          </button>
                          <p
                            className="skill__info"
                            id={`skill-info-${skill.id}`}
                            hidden={!open}
                            dangerouslySetInnerHTML={{ __html: t(skill.info) }}
                          />
                        </>
                      )}
                      {!skill.to && !skill.info && <div className="skill__body">{body}</div>}
                    </li>
                  );
                })}
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
