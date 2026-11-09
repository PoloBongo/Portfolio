import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import RagDiagram, { RAG_STEPS, RAG_QUESTIONS } from "../../Component/RagDiagram";
import { ScrollTrigger } from "../../Effects/motion";
import { useScrollTo } from "../../Effects/SmoothScroll";

const pad = (n) => String(n).padStart(2, "0");
const N = RAG_STEPS.starts.length;
// Le parcours occupe 92 % du défilement épinglé, la fin (la réponse écrite) reste affichée un instant
const HOLD = 0.92;
const chapterAt = (p) => {
  const time = Math.min(1, p / HOLD) * RAG_STEPS.end;
  let k = 0;
  RAG_STEPS.starts.forEach((start, i) => {
    if (time >= start) k = i;
  });
  return k;
};

// Le schéma du pipeline RAG en plein écran, piloté par le défilement : cinq chapitres, un par étape. Le texte de chaque
// chapitre explique ce que montre le schéma à cet instant ; la barre des étapes est cliquable.
export default function CerebroChapters({ tags }) {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const scrub = useRef(null);
  const [chapter, setChapter] = useState(0);
  // asked : la question posée et le nombre de clics (cliquer la même question la rejoue)
  const [asked, setAsked] = useState({ i: 0, n: 0 });
  const question = asked.i;
  const progress = useRef(0);
  const scrollTo = useScrollTo();

  // Poser une question lance l'animation : le schéma est reconstruit, replacé au début de la recherche (la question se tape),
  // puis le défilement avance seul à la vitesse de l'animation jusqu'à la réponse. Un coup de molette reprend la main.
  // Au premier rendu (n = 0) on ne fait rien ; en mouvement réduit on se contente de replacer le schéma.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const sync = () => {
      if (scrub.current) scrub.current.seek(Math.min(1, progress.current / HOLD));
    };
    if (asked.n === 0) {
      const id = setTimeout(sync, 60);
      return () => clearTimeout(id);
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const range = root.offsetHeight - window.innerHeight;
    const frac = (time) => (time / RAG_STEPS.end) * HOLD;
    const from = RAG_STEPS.starts[1];
    const id = setTimeout(() => {
      if (reduced) {
        sync();
        return;
      }
      scrollTo(Math.round(top + frac(from) * range), { immediate: true, force: true });
      setTimeout(
        () => scrollTo(Math.round(top + HOLD * range), { duration: RAG_STEPS.end - from, easing: (u) => u, force: true }),
        120
      );
    }, 80);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asked.n]);

  useGSAP(
    () => {
      const trigger = ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progress.current = self.progress;
          if (scrub.current) scrub.current.seek(Math.min(1, self.progress / HOLD));
          setChapter(chapterAt(self.progress));
        },
      });
      return () => trigger.kill();
    },
    { scope: rootRef }
  );

  const go = (i) => {
    const root = rootRef.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY;
    const range = root.offsetHeight - window.innerHeight;
    const frac = (RAG_STEPS.starts[i] / RAG_STEPS.end) * HOLD + 0.004;
    scrollTo(Math.round(top + frac * range), { duration: 1.4 });
  };

  return (
    <section className="w-cerebro__chapters" ref={rootRef} aria-label={t("Worlds.cerebro.label")}>
      <div className="w-cerebro__pin">
        <div className="w-cerebro__caption container">
          <div className="w-cerebro__chapter" aria-live="polite">
            <p className="mono w-cerebro__kick">
              {pad(chapter + 1)} / {pad(N)}
            </p>
            <h2>{t(`Worlds.cerebro.c${chapter + 1}.title`)}</h2>
            <p>{t(`Worlds.cerebro.c${chapter + 1}.text`)}</p>
          </div>
          <ol className="w-cerebro__steps" aria-label={t("Worlds.cerebro.label")}>
            {Array.from({ length: N }, (_, i) => (
              <li key={i}>
                <button
                  type="button"
                  className={`mono${i === chapter ? " is-cur" : ""}${i < chapter ? " is-done" : ""}`}
                  aria-current={i === chapter ? "step" : undefined}
                  onClick={() => go(i)}
                >
                  <span>{pad(i + 1)}</span> <b>{t(`Worlds.cerebro.c${i + 1}.title`)}</b>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="w-cerebro__questions container" role="group" aria-label={t("Worlds.cerebro.pick")}>
          <span className="mono">{t("Worlds.cerebro.pick")}</span>
          {RAG_QUESTIONS.map((key, i) => (
            <button type="button" key={key} className={i === question ? "is-cur" : ""} aria-pressed={i === question} onClick={() => setAsked((a) => ({ i, n: a.n + 1 }))}>
              {t(key)}
            </button>
          ))}
        </div>
        <div className="w-cerebro__stage">
          <RagDiagram tags={tags} scrub={scrub} scenario={question} />
        </div>
      </div>
    </section>
  );
}
