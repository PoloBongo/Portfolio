// Vignettes des projets : image du projet ou miniature YouTube, avec repli quand la version HD n'existe pas.
export const ytThumb = (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
export const ytThumbFallback = (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

// Identifiant YouTube du projet, éventuellement propre à la langue ({ fr, en, es })
export const videoIdOf = (project, lang) =>
  project.video && typeof project.video === "object" ? project.video[lang] || project.video.en : project.video;

export const posterOf = (project, lang) => {
  const videoId = videoIdOf(project, lang);
  return project.poster || (videoId ? ytThumb(videoId) : null);
};

// Gestionnaires d'une <img> de vignette YouTube : YouTube renvoie une vignette grise de 120×90 (ou une erreur)
// quand la version HD n'existe pas
export const posterHandlers = (videoId) => ({
  onError: (e) => {
    const img = e.currentTarget;
    if (videoId && !img.dataset.fallback) {
      img.dataset.fallback = "1";
      img.src = ytThumbFallback(videoId);
    }
  },
  onLoad: (e) => {
    const img = e.currentTarget;
    if (videoId && img.naturalWidth <= 120 && !img.dataset.fallback) {
      img.dataset.fallback = "1";
      img.src = ytThumbFallback(videoId);
    }
  },
});
