import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TLink } from "../Effects/PageTransition";
import Reveal from "../Effects/Reveal";
import { prefersReducedMotion, hasFinePointer } from "../Effects/motion";
import { hasClip, clipSrc, clipPoster, canAutoplayClips } from "../Pages/clips";
import { posterOf, posterHandlers, videoIdOf } from "../Pages/media";
import { titleOf, workPath } from "../Pages/work";
import { worldOf } from "../Worlds/config";
import { previewTint, clearTint } from "../Worlds/theme";

const pad = (n) => String(n).padStart(2, "0");

// Un seul extrait vidéo joue à la fois (sur tactile : la carte la plus visible)
let activeClip = null;
const playClip = (video) => {
  if (activeClip && activeClip !== video) activeClip.pause();
  activeClip = video;
  video.play().catch(() => {});
};
const stopClip = (video) => {
  video.pause();
  if (activeClip === video) activeClip = null;
};

// Carte d'un projet dans sa catégorie ou sur l'accueil : vignette (l'extrait vidéo joue au survol), titre, accroche.
// Le titre est le lien, étendu à toute la carte. Le survol teinte le nuage aux couleurs du monde du projet.
export default function ProjectCard({ work, index = 0, rank, lead = false }) {
  const { t, i18n } = useTranslation();
  const { lang = "fr" } = useParams();
  const cardRef = useRef(null);
  const clipRef = useRef(null);

  const world = worldOf(work);
  const title = titleOf(work, t);
  const language = (i18n.language || "fr").slice(0, 2);
  const videoId = videoIdOf(work, language);
  const clip = hasClip(work.id);
  const poster = clip ? clipPoster(work.id) : posterOf(work, language);
  const year = work.i18n && i18n.exists(`${work.i18n}.Completion`) ? t(`${work.i18n}.Completion`) : null;

  // Extrait vidéo : chargé à la première intention (survol, focus, ou carte bien visible sur tactile)
  useEffect(() => {
    const card = cardRef.current;
    const video = clipRef.current;
    if (!clip || !video || prefersReducedMotion() || !canAutoplayClips()) return undefined;

    const onPlaying = () => video.classList.add("is-ready");
    video.addEventListener("playing", onPlaying);

    let attached = false;
    const start = () => {
      if (!attached) {
        attached = true;
        video.src = clipSrc(work.id);
      }
      playClip(video);
    };
    const stop = () => stopClip(video);

    const cleanups = [() => video.removeEventListener("playing", onPlaying), () => stopClip(video)];
    if (hasFinePointer()) {
      card.addEventListener("pointerenter", start);
      card.addEventListener("pointerleave", stop);
      card.addEventListener("focusin", start);
      card.addEventListener("focusout", stop);
      cleanups.push(() => {
        card.removeEventListener("pointerenter", start);
        card.removeEventListener("pointerleave", stop);
        card.removeEventListener("focusin", start);
        card.removeEventListener("focusout", stop);
      });
    } else {
      const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), {
        threshold: 0.7,
      });
      observer.observe(card);
      cleanups.push(() => observer.disconnect());
    }
    return () => cleanups.forEach((fn) => fn());
  }, [clip, work.id]);

  // Aperçu du monde : le nuage prend ses couleurs tant que la carte est survolée ou focalisée
  const preview = () => previewTint(world);
  const handlers = posterHandlers(videoId);

  return (
    <Reveal as="article" id={work.anchor} className={`proj${lead ? " proj--lead" : ""}`} delay={(index % 2) * 0.08} y={46}>
      <div
        className="proj__inner"
        ref={cardRef}
        style={{ "--card": world.accent }}
        onPointerEnter={preview}
        onPointerLeave={clearTint}
        onFocus={preview}
        onBlur={clearTint}
        data-cursor="view"
      >
        <div className="proj__media" aria-hidden="true">
          {poster ? (
            <img className="proj__img" src={poster} alt="" loading="lazy" decoding="async" {...(clip ? {} : handlers)} />
          ) : (
            <div className="proj__placeholder">
              <span className="serif">{title}</span>
              <span className="mono">{work.tags}</span>
            </div>
          )}
          {clip && <video ref={clipRef} className="proj__clip" muted loop playsInline preload="none" tabIndex={-1} />}
          {work.inProgress && <span className="proj__badge mono">{t("AIProjects.InProgress")}</span>}
        </div>

        <div className="proj__body">
          <p className="proj__meta mono">
            <span className="proj__index">{pad(rank || work.index + 1)}</span>
            {[year, work.tags].filter(Boolean).map((item) => (
              <span key={item}>{item}</span>
            ))}
          </p>
          <h2 className="proj__title">
            <TLink className="proj__link" to={workPath(lang, work.slug)} label={title}>
              {title}
            </TLink>
          </h2>
          <p className="proj__tagline">{t(`Work.Tagline.${work.slug}`)}</p>
          <span className="proj__cta mono" aria-hidden="true">
            {t("Work.view")} <span className="proj__arrow">→</span>
          </span>
        </div>
      </div>
    </Reveal>
  );
}
