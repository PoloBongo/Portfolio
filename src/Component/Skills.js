import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TLink } from "../Effects/PageTransition";
import SplitReveal from "../Effects/SplitReveal";
import Reveal from "../Effects/Reveal";
import { prefersReducedMotion } from "../Effects/motion";
import { useScrollTo } from "../Effects/SmoothScroll";
import { WORKS, titleOf, workPath } from "../Pages/work";
import { CERTIFICATES } from "./CertificateCarousel";
import { DOMAINS, SKILLS, projectsFor } from "./skillsData";
import "../css/Skills.css";

// Compétences « par la preuve » : chaque compétence mène aux projets où elle est réellement utilisée (leurs technologies
// viennent des fiches projets) ou au certificat qui l'atteste. Un filtre par domaine, les couleurs sont celles des régions
// de la carte. Voir skillsData.js pour la règle de rattachement.
const DEFAULT_SKILL = "Unity";

// Dérive des pastilles : elles flottent, tournent et respirent, chacune à son rythme, comme en apesanteur. Dès que le curseur
// (ou le focus clavier) entre dans la zone, elles reviennent en douceur à leur place d'origine, bien alignées, pour cliquer
// sans courir après elles ; elles repartent à la sortie. Pas de mouvement en « mouvement réduit », ni sur écran tactile
// (pas de survol pour les ranger), ni hors écran.
const seeded = (i, k) => {
  const x = Math.sin((i + 1) * 12.9898 + k * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

function useChipDrift(sectionRef) {
  useEffect(() => {
    const section = sectionRef.current;
    const zone = section && section.querySelector(".skills__chips");
    if (!zone || prefersReducedMotion() || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return undefined;

    const items = Array.from(zone.children).map((li, i) => ({
      li,
      // deux ondes par axe : un mouvement organique, jamais deux pastilles synchrones
      ax: 8 + seeded(i, 1) * 8,
      ay: 6 + seeded(i, 2) * 7,
      bx: 2 + seeded(i, 7) * 4,
      by: 2 + seeded(i, 8) * 3,
      sx: 0.5 + seeded(i, 3) * 0.55,
      sy: 0.45 + seeded(i, 4) * 0.55,
      px: seeded(i, 5) * 6.28,
      py: seeded(i, 6) * 6.28,
      rot: 2 + seeded(i, 9) * 3.5,
      sr: 0.35 + seeded(i, 10) * 0.4,
    }));

    let held = false;
    let amp = 1; // 1 : pleine dérive ; 0 : chaque pastille à sa place
    let clock = 0;
    let visible = false;
    let raf = 0;
    let last = 0;

    const frame = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000 || 0.016);
      last = now;
      clock += dt;
      amp += ((held ? 0 : 1) - amp) * (1 - Math.exp(-dt * (held ? 7 : 2.5))); // rangement vif, reprise douce
      const settled = held && amp < 0.002;
      items.forEach((it) => {
        if (settled) {
          it.li.style.translate = "";
          it.li.style.rotate = "";
          it.li.style.scale = "";
          return;
        }
        const x = (Math.sin(clock * it.sx + it.px) * it.ax + Math.sin(clock * it.sx * 2.3 + it.py) * it.bx) * amp;
        const y = (Math.sin(clock * it.sy + it.py) * it.ay + Math.sin(clock * it.sy * 1.9 + it.px) * it.by) * amp;
        const r = Math.sin(clock * it.sr + it.px) * it.rot * amp;
        const sc = 1 + Math.sin(clock * it.sr * 1.4 + it.py) * 0.045 * amp;
        it.li.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`;
        it.li.style.rotate = `${r.toFixed(2)}deg`;
        it.li.style.scale = sc.toFixed(3);
      });
      // Une fois tout rangé, la boucle s'éteint (elle repart à la sortie)
      raf = settled ? 0 : requestAnimationFrame(frame);
    };
    const wake = () => {
      if (visible && !raf) {
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    };
    const hold = () => {
      held = true;
      wake();
    };
    const release = () => {
      held = false;
      wake();
    };
    const focusOut = (e) => {
      if (!zone.contains(e.relatedTarget)) release();
    };

    zone.addEventListener("pointerenter", hold);
    zone.addEventListener("pointerleave", release);
    zone.addEventListener("focusin", hold);
    zone.addEventListener("focusout", focusOut);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    });
    io.observe(zone);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      zone.removeEventListener("pointerenter", hold);
      zone.removeEventListener("pointerleave", release);
      zone.removeEventListener("focusin", hold);
      zone.removeEventListener("focusout", focusOut);
      items.forEach((it) => {
        it.li.style.translate = "";
        it.li.style.rotate = "";
        it.li.style.scale = "";
      });
    };
  }, [sectionRef]);
}

export default function Skills() {
  const sectionRef = useRef(null);
  useChipDrift(sectionRef);
  const scrollTo = useScrollTo();
  const { t } = useTranslation();
  const { lang = "fr" } = useParams();
  const [domain, setDomain] = useState("all");
  const [selectedId, setSelectedId] = useState(DEFAULT_SKILL);

  const colorOf = useMemo(() => Object.fromEntries(DOMAINS.map((d) => [d.id, d.color])), []);
  const rows = useMemo(
    () => SKILLS.map((skill) => ({ ...skill, works: projectsFor(skill, WORKS) })),
    []
  );
  const selected = rows.find((s) => s.id === selectedId) || rows[0];
  const nameOf = (skill) => skill.name || t(skill.label);
  const visible = (skill) => domain === "all" || skill.domain === domain;

  const chooseDomain = (id) => {
    setDomain(id);
    // La compétence ouverte reste lisible : si elle sort du filtre, on passe à la première de ce domaine
    if (id !== "all" && selected.domain !== id) {
      const first = rows.find((s) => s.domain === id && (s.works.length || s.certs));
      if (first) setSelectedId(first.id);
    }
  };

  const proofCount = (skill) => skill.works.length + (skill.certs ? skill.certs.length : 0) + (skill.note ? 1 : 0);

  return (
    <section ref={sectionRef} className="skills container" id="skills" data-hud={t("Hud.skills")}>
      <header className="section-head">
        <Reveal className="mono eyebrow">(02)</Reveal>
        <SplitReveal text={t("Home.title2")} as="h2" scroll className="section-head__title" />
      </header>

      <div className="skills__filters" role="group" aria-label={t("Skills.filterLabel")}>
        <button type="button" className={`skills__filter${domain === "all" ? " is-on" : ""}`} aria-pressed={domain === "all"} onClick={() => chooseDomain("all")}>
          {t("Skills.all")}
        </button>
        {DOMAINS.map((d) => (
          <button
            type="button"
            key={d.id}
            className={`skills__filter${domain === d.id ? " is-on" : ""}`}
            style={{ "--c": d.color }}
            aria-pressed={domain === d.id}
            onClick={() => chooseDomain(d.id)}
          >
            <i aria-hidden="true" />
            {t(d.title)}
          </button>
        ))}
      </div>

      <div className="skills__board">
        <Reveal as="ul" className="skills__chips" stagger={0.03} y={20}>
          {rows.map((skill) => {
            const on = selected.id === skill.id;
            const n = proofCount(skill);
            return (
              <li key={skill.id} className={visible(skill) ? "" : "is-dim"}>
                <button
                  type="button"
                  className={`skills__chip${on ? " is-on" : ""}${n === 0 ? " is-bare" : ""}`}
                  style={{ "--c": colorOf[skill.domain] }}
                  aria-pressed={on}
                  aria-controls="skills-proof"
                  onClick={() => {
                    setSelectedId(skill.id);
                    // Petit écran : le panneau est sous les pastilles, on y amène la page
                    if (window.matchMedia("(max-width: 900px)").matches) {
                      window.requestAnimationFrame(() => {
                        const panel = document.getElementById("skills-proof");
                        if (panel) scrollTo(panel, { offset: -90, duration: 0.9 });
                      });
                    }
                  }}
                >
                  <i aria-hidden="true" />
                  <span>{nameOf(skill)}</span>
                  {n > 0 && <b aria-label={t("Skills.proofCount", { count: n })}>{n}</b>}
                </button>
              </li>
            );
          })}
        </Reveal>

        <aside className="skills__proof" id="skills-proof" aria-live="polite" style={{ "--c": colorOf[selected.domain] }}>
          <div className="skills__proof-inner" key={selected.id}>
            <span className="mono skills__proof-kick">{t(DOMAINS.find((d) => d.id === selected.domain).title)}</span>
            <h3>{nameOf(selected)}</h3>

            {selected.works.length > 0 && (
              <>
                <p className="mono skills__proof-label">{t("Skills.usedIn")}</p>
                <ul className="skills__projects" data-lenis-prevent>
                  {selected.works.map((work) => (
                    <li key={work.slug}>
                      <TLink to={workPath(lang, work.slug)} label={titleOf(work, t)}>
                        <b>{titleOf(work, t)}</b>
                        <span className="mono">{work.tags}</span>
                        <em>{t(`Work.Tagline.${work.slug}`)}</em>
                      </TLink>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selected.certs && (
              <>
                <p className="mono skills__proof-label">{t("Skills.certifiedBy")}</p>
                <ul className="skills__projects" data-lenis-prevent>
                  {selected.certs.map((i) => (
                    <li key={CERTIFICATES[i].url}>
                      <a href={CERTIFICATES[i].url} target="_blank" rel="noopener noreferrer">
                        <b>{CERTIFICATES[i].title}</b>
                        <span className="mono">Educative · {CERTIFICATES[i].date}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {selected.note && (
              <>
                <p className="mono skills__proof-label">{t("Skills.onGithub")}</p>
                <p className="skills__info">{t(`Skills.note.${selected.id}`)}</p>
              </>
            )}

            {selected.info && <p className="skills__info" dangerouslySetInnerHTML={{ __html: t(selected.info) }} />}

            {proofCount(selected) === 0 && !selected.info && <p className="skills__none">{t("Skills.noProject")}</p>}

            {selected.to && selected.works.length === 0 && !selected.certs && (
              <TLink className="skills__more mono" to={`/${lang}${selected.to}`} label={nameOf(selected)}>
                {t("Skills.seePage")} →
              </TLink>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
