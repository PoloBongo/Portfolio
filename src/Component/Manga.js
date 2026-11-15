import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ScrollTrigger, onReady, prefersReducedMotion } from "../Effects/motion";
import { TLink } from "../Effects/PageTransition";
import "@fontsource/dela-gothic-one/latin-400.css";
import "../css/Manga.css";

// Étapes du parcours (mêmes textes que la carte : clés Carte.step.*)
const STEP_KEYS = ["lycee", "bachelor", "equipe", "master", "basket"];

// L'avatar joue dans trois cases : poses rendues depuis le modèle 3D (avatar-arthur-manga/labo/poses.mjs)
const FIGURES = {
  lycee: { src: "/avatar/pose-marche.webp", w: 315, h: 720 },
  equipe: { src: "/avatar/pose-salut.webp", w: 374, h: 720 },
  master: { src: "/avatar/pose-course.webp", w: 445, h: 720 },
};

// Les trois mondes : mêmes pages et mêmes couleurs que les régions de la carte
const WORLDS = [
  { id: "web", to: "/ProjectsWeb", color: "#d9ff4a" },
  { id: "ai", to: "/AI", color: "#63e6be" },
  { id: "game", to: "/Unity", color: "#ff5fa8" },
];

// Le compagnon : un mot de l'avatar par section de l'accueil (clés Manga.tip.*)
const TIPS = ["c1", "c2", "work", "fil", "skills", "certs", "footer"];

// Trame qui grossit vers le bas : le passage des pages claires aux pages noires
const FLOOD_ROWS = Array.from({ length: 11 }, (_, i) => i);

// Refonte « manga » : le site se lit comme un tome dont Arthur est le héros. La couverture (avatar 3D animé), puis le
// chapitre 1 (le parcours, en cases) et le chapitre 2 (les trois mondes), avant les pages noires (projets, compétences).
// La scène 3D et la mise en scène sont chargées à part (Effects/manga/cover.js). En mouvement réduit : une affiche fixe.
export default function Manga() {
  const { t } = useTranslation();
  const { lang = "fr" } = useParams();
  const rootRef = useRef(null);
  const coverRef = useRef(null);
  const hostRef = useRef(null);
  const pokeRef = useRef(null);
  const buddyRef = useRef(null);
  // La scène lit les textes au moment où elle en a besoin (sa bulle selon l'heure) : la fonction passe par une référence
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    const root = rootRef.current;
    const cover = coverRef.current;
    const host = hostRef.current;
    let dead = false;
    const cleanups = [];

    // L'interface fixe (logo, menu, barre du bas) passe à l'encre noire tant qu'elle est au-dessus du papier
    import("../Effects/manga/paper").then(({ watchPaper }) => {
      if (!dead) cleanups.push(watchPaper(root));
    });

    if (prefersReducedMotion()) {
      root.classList.add("is-still");
      return () => {
        dead = true;
        cleanups.forEach((fn) => fn());
      };
    }

    import("../Effects/manga/cover").then(({ createCover }) => {
      if (dead) return;
      const scene = createCover(root, { host, poke: pokeRef.current, buddy: buddyRef.current, t: (cle) => tRef.current(cle) });
      cleanups.push(() => scene.dispose());

      const size = () => {
        const r = host.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) scene.resize(Math.round(r.width), Math.round(r.height));
      };
      size();
      const ro = new ResizeObserver(size);
      ro.observe(host);
      cleanups.push(() => ro.disconnect());

      const trigger = ScrollTrigger.create({
        trigger: cover,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => scene.setProgress(self.progress),
      });
      cleanups.push(() => trigger.kill());
      scene.setProgress(trigger.progress);

      // Aucun rendu tant que la couverture n'est pas à l'écran
      const io = new IntersectionObserver(([entry]) => scene.run(entry.isIntersecting), { threshold: 0 });
      io.observe(cover);
      cleanups.push(() => io.disconnect());

      // L'entrée ne se joue qu'une fois le préchargeur et le rideau de page ouverts
      cleanups.push(onReady(() => scene.start()));
    });

    return () => {
      dead = true;
      cleanups.forEach((fn) => fn());
    };
  }, []);

  const steps = STEP_KEYS.map((key) => ({
    key,
    kick: t(`Carte.step.${key}.kick`),
    title: t(`Carte.step.${key}.title`),
    text: t(`Carte.step.${key}.text`),
    list: t(`Carte.step.${key}.list`, { returnObjects: true, defaultValue: [] }),
  }));

  return (
    <div ref={rootRef} className="manga">
      <section ref={coverRef} className="mg-cover" aria-labelledby="mg-nom" data-hud={t("Hud.hero")}>
        <div className="mg-cover__stick">
          {/* La feuille : tout ce qui est imprimé sur la page. À la fin de la couverture, Arthur la tourne. */}
          <div className="mg-sheet">
          <div className="mg-tone" aria-hidden="true" />
          <div className="mg-block" aria-hidden="true" />
          <div className="mg-speed" aria-hidden="true" />
          <p className="mg-kana" aria-hidden="true">
            アルチュール
          </p>
          <p className="mg-head mono">
            <span>Portfolio</span>
            <span>{t("Manga.volume")}</span>
            <span>{t("Manga.genre")}</span>
          </p>
          <h1 id="mg-nom" className="mg-title">
            <span>Arthur</span> <span>Bru</span>
          </h1>
          <p className="mg-roles">
            <span>{t("Hero.roleWeb")}</span>
            <span>{t("Hero.roleAI")}</span>
            <span>{t("Hero.roleGame")}</span>
          </p>
          <img className="mg-poster" src="/avatar/affiche.webp" alt={t("Manga.posterAlt")} width="420" height="1100" />
          </div>
          {/* Le revers de la page pendant qu'il la tourne */}
          <div className="mg-flap" aria-hidden="true">
            <i />
          </div>
          <div ref={hostRef} className="mg-gl" aria-hidden="true" />
          <div className="mg-sfx" aria-hidden="true">
            {t("Manga.sfx")}
          </div>
          <div className="mg-bubble mg-bubble--hi" data-say="hi" aria-hidden="true">
            {t("Manga.hi")}
          </div>
          <div className="mg-bubble mg-bubble--hi mg-bubble--idle" data-say="hey" aria-hidden="true">
            {t("Manga.hey")}
          </div>
          <div className="mg-bubble mg-bubble--hi mg-bubble--idle" data-say="idle" aria-hidden="true">
            {t("Manga.idle")}
          </div>
          {/* « Toc toc » : il frappe à l'écran quand plus rien ne bouge */}
          <div className="mg-knock" aria-hidden="true">
            <span>{t("Manga.knock")}</span>
            <span>{t("Manga.knock")}</span>
            <i />
          </div>
          {/* Plan serré sur les yeux, juste avant qu'il parte en courant */}
          <div className="mg-focus" aria-hidden="true" />
          <div className="mg-bars" aria-hidden="true">
            <i />
            <i />
            <b>{t("Manga.go")}</b>
          </div>
          <div className="mg-bubble mg-bubble--talk">
            <strong>{t("Carte.helloTitle")}</strong>
            <span>{t("Manga.talk")}</span>
          </div>
          <button ref={pokeRef} type="button" className="mg-poke" aria-label={t("Manga.poke")} />
          <em className="mg-scroll mono">{t("Manga.scroll")}</em>
        </div>
      </section>

      <section className="mg-chap" aria-labelledby="mg-c1">
        <header className="mg-chap__head" data-dark>
          <span className="mono">{t("Manga.c1.kick")}</span>
          <h2 id="mg-c1">{t("Manga.c1.title")}</h2>
          <p>{t("Manga.c1.text")}</p>
        </header>
        <ol className="mg-page">
          {steps.map((s, i) => (
            <li className={`mg-case${FIGURES[s.key] ? " mg-case--fig" : ""}${s.key === "basket" ? " mg-case--hoop" : ""}`} key={s.key} data-ink>
              {FIGURES[s.key] && (
                <img className="mg-case__fig" src={FIGURES[s.key].src} alt="" width={FIGURES[s.key].w} height={FIGURES[s.key].h} loading="lazy" />
              )}
              <span className="mg-case__n" aria-hidden="true">
                {i + 1}
              </span>
              <span className="mono">{s.kick}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              {s.list.length > 0 && (
                <ul>
                  {s.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {s.key === "basket" && (
                <>
                  {/* Le panier : le compagnon y tire quand on appuie sur le bouton */}
                  <div className="mg-hoop" aria-hidden="true">
                    <i className="mg-hoop__board" />
                    <i className="mg-hoop__rim" />
                    <i className="mg-hoop__net" />
                    <b className="mg-hoop__sfx">{t("Manga.swish")}</b>
                  </div>
                  <button type="button" className="mg-shoot mono" data-shoot>
                    {t("Manga.shoot")} →
                  </button>
                </>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mg-chap mg-chap--worlds" aria-labelledby="mg-c2">
        <header className="mg-chap__head">
          <span className="mono">{t("Manga.c2.kick")}</span>
          <h2 id="mg-c2">{t("Manga.c2.title")}</h2>
          <p>{t("Manga.c2.text")}</p>
        </header>
        <ul className="mg-worlds">
          {WORLDS.map((w) => (
            <li className="mg-world" key={w.id} style={{ "--c": w.color }} data-ink>
              <TLink to={`/${lang}${w.to}`} label={t(`Carte.region.${w.id}`)}>
                <b>{t(`Carte.region.${w.id}`)}</b>
                <span>{t(`Hero.tag.${w.id}`)}</span>
                <em className="mono">{t(`Hero.enter.${w.id}`)} →</em>
              </TLink>
            </li>
          ))}
        </ul>
      </section>

      {/* Le compagnon : après la couverture, l'avatar s'installe dans le coin de l'écran et accompagne tout l'accueil.
          Il est rendu hors de la page (portail) pour rester au-dessus de toutes les sections. */}
      {createPortal(
        <div ref={buddyRef} className="mg-buddy">
          <div className="mg-buddy__gl" aria-hidden="true" />
          <p className="mg-buddy__tip" aria-hidden="true">
            {TIPS.map((key) => (
              <span key={key} data-tip={key}>
                {t(`Manga.tip.${key}`)}
              </span>
            ))}
          </p>
          <b className="mg-buddy__sfx" data-sfx="kobe" aria-hidden="true">
            {t("Manga.kobe")}
          </b>
          <b className="mg-buddy__sfx" data-sfx="clac" aria-hidden="true">
            {t("Manga.stamp")}
          </b>
          <button type="button" className="mg-buddy__poke" aria-label={t("Manga.poke")} />
          <button type="button" className="mg-buddy__close" aria-label={t("Manga.hide")}>
            ×
          </button>
        </div>,
        document.body
      )}

      <div className="mg-flood" aria-hidden="true" data-dark>
        {FLOOD_ROWS.map((i) => (
          <i key={i} style={{ "--k": i }} />
        ))}
      </div>
    </div>
  );
}
