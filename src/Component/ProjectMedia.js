import React, { useEffect, useRef, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { useTranslation } from "react-i18next";
import Parallax from "../Effects/Parallax";
import { prefersReducedMotion } from "../Effects/motion";
import { hasClip, clipSrc, clipPoster, canAutoplayClips } from "../Pages/clips";
import Button from "./Button";

const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
const ytThumbFallback = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M8 5.2v13.6a.6.6 0 0 0 .92.5l10.6-6.8a.6.6 0 0 0 0-1L8.92 4.7A.6.6 0 0 0 8 5.2Z" fill="currentColor" />
  </svg>
);

// Les builds Unity pèsent plusieurs dizaines de Mo : ce composant n'est monté qu'au clic sur « Jouer »
function UnityGame({ build, labels, onStop }) {
  const { unityProvider, loadingProgression, isLoaded, requestFullscreen, unload, UNSAFE__unityInstance } =
    useUnityContext(build);

  // Libère l'instance WebGL quand le jeu est arrêté (si elle a eu le temps de démarrer)
  const instance = useRef(null);
  const quit = useRef(null);
  instance.current = UNSAFE__unityInstance;
  quit.current = unload;
  useEffect(
    () => () => {
      if (instance.current && quit.current) quit.current().catch(() => {});
    },
    []
  );

  return (
    <div className="player__game">
      <Unity unityProvider={unityProvider} className="player__unity" />

      {loadingProgression < 1 && (
        <div className="player__loading" role="status">
          <span className="mono">{labels.loading}</span>
          <div className="player__bar">
            <i style={{ transform: `scaleX(${loadingProgression})` }} />
          </div>
          <span className="player__percent">{Math.round(loadingProgression * 100)}%</span>
        </div>
      )}

      {isLoaded && (
        <span className="player__live mono">
          <i aria-hidden="true" />
          {labels.inProgress}
        </span>
      )}

      <div className="player__controls">
        <button type="button" className="player__chip" onClick={() => requestFullscreen(true)} disabled={!isLoaded}>
          {labels.fullscreen}
        </button>
        <button type="button" className="player__chip" onClick={onStop}>
          {labels.stop}
        </button>
      </div>
    </div>
  );
}

// Cadre média d'un projet : image / vignette YouTube → vidéo ou jeu jouable, à la demande
export default function ProjectMedia({ project, title }) {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState("poster");
  const frameRef = useRef(null);
  const confirmRef = useRef(null);
  const clipRef = useRef(null);

  const lang = (i18n.language || "fr").slice(0, 2);
  const videoId =
    project.video && typeof project.video === "object"
      ? project.video[lang] || project.video.en
      : project.video;
  const hasGame = !!project.game;
  const posterSrc = project.poster || (videoId ? ytThumb(videoId) : null);
  const g = project.gameLabels || {};

  const startGame = () => setMode(project.alertKey ? "confirm" : "game");
  const primary = () => (videoId ? setMode("video") : startGame());
  const back = () => setMode("poster");

  // Extrait vidéo muet en boucle : chargé à l'approche de l'écran, lu seulement quand il est visible
  const clip = hasClip(project.id);
  useEffect(() => {
    const video = clipRef.current;
    if (!clip || mode !== "poster" || !video || prefersReducedMotion() || !canAutoplayClips()) return undefined;

    const onPlaying = () => video.classList.add("is-ready");
    video.addEventListener("playing", onPlaying);

    let attached = false;
    const loader = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !attached) {
          attached = true;
          video.src = clipSrc(project.id);
        }
      },
      { rootMargin: "400px 0px" }
    );
    const player = new IntersectionObserver(
      ([entry]) => {
        if (!attached) return;
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3 }
    );
    loader.observe(video);
    player.observe(video);

    return () => {
      loader.disconnect();
      player.disconnect();
      video.removeEventListener("playing", onPlaying);
      video.pause();
    };
  }, [clip, mode, project.id]);

  // Échap ramène à la vignette
  useEffect(() => {
    if (mode === "poster") return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setMode("poster");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode]);

  useEffect(() => {
    if (mode === "confirm" && confirmRef.current) {
      const play = confirmRef.current.querySelector("button:last-of-type");
      if (play) play.focus({ preventScroll: true });
    }
  }, [mode]);

  const onPosterError = (e) => {
    const img = e.currentTarget;
    if (videoId && !img.dataset.fallback) {
      img.dataset.fallback = "1";
      img.src = ytThumbFallback(videoId);
    }
  };
  // YouTube renvoie une vignette grise de 120×90 quand la version HD n'existe pas
  const onPosterLoad = (e) => {
    const img = e.currentTarget;
    if (videoId && img.naturalWidth <= 120 && !img.dataset.fallback) {
      img.dataset.fallback = "1";
      img.src = ytThumbFallback(videoId);
    }
  };

  const canPlay = !!videoId || hasGame;

  return (
    <div className={`player player--${mode}`} ref={frameRef}>
      <div className="player__poster">
        {posterSrc ? (
          <Parallax amount={7} className="player__parallax">
            <img
              className="player__img"
              src={posterSrc}
              alt={project.alt || title}
              loading="lazy"
              decoding="async"
              onError={onPosterError}
              onLoad={onPosterLoad}
            />
            {clip && (
              <video
                ref={clipRef}
                className="player__clip"
                poster={clipPoster(project.id)}
                muted
                loop
                playsInline
                preload="none"
                tabIndex={-1}
                aria-hidden="true"
              />
            )}
          </Parallax>
        ) : (
          <div className="player__placeholder" aria-hidden="true">
            <span className="serif">{title}</span>
            <span className="mono">{project.tags}</span>
          </div>
        )}
        <span className="player__shade" aria-hidden="true" />

        {project.inProgress && (
          <span className="player__badge mono">
            <i aria-hidden="true" />
            {t("AIProjects.InProgress")}
          </span>
        )}
      </div>

      {mode === "poster" && canPlay && (
        <>
          <button
            type="button"
            className="player__play"
            onClick={primary}
            data-cursor="play"
            data-cursor-text="Play"
            aria-label={t(videoId ? "VideoGamesProjects.playVideo" : "VideoGamesProjects.playProjects")}
          >
            <PlayIcon />
          </button>
          {videoId && hasGame && (
            <button type="button" className="player__chip player__chip--game" onClick={startGame}>
              <PlayIcon />
              {t("VideoGamesProjects.playProjects")}
            </button>
          )}
          {project.hintKey && <p className="player__hint mono">{t(project.hintKey)}</p>}
        </>
      )}

      {mode === "video" && videoId && (
        <>
          <iframe
            className="player__frame"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <div className="player__controls">
            <button type="button" className="player__chip" onClick={back}>
              {t("VideoGamesProjects.stopVideo")}
            </button>
          </div>
        </>
      )}

      {mode === "confirm" && (
        <div className="player__confirm" ref={confirmRef} role="dialog" aria-label={title}>
          <p>{t(project.alertKey)}</p>
          <div className="player__confirm-actions">
            <Button size="small" arrow={false} magnetic={false} onClick={back}>
              {t("VideoGamesProjects.stopProjects")}
            </Button>
            <Button
              size="small"
              variant="solid"
              arrow={false}
              magnetic={false}
              onClick={() => setMode("game")}
            >
              {t("VideoGamesProjects.playProjects")}
            </Button>
          </div>
        </div>
      )}

      {mode === "game" && hasGame && (
        <UnityGame
          build={project.game}
          onStop={back}
          labels={{
            loading: t(g.loading || "GameJam.Chocolato.LoadingGame"),
            inProgress: t(g.inProgress || "GameJam.Chocolato.GameInProgress"),
            fullscreen: t("VideoGamesProjects.fullScreenGame"),
            stop: t("VideoGamesProjects.stopProjects"),
          }}
        />
      )}
    </div>
  );
}
