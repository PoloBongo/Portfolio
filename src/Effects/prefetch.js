// Préchargement des routes lourdes avant d'y aller (survol d'un lien, début d'une transition).
// Chaque route enregistre sa fonction (voir Pages/lazyPages.js) ; prefetch() les appelle toutes avec l'adresse visée.
const handlers = [];

export const registerPrefetch = (handler) => {
  handlers.push(handler);
};

const settle = (value) => Promise.resolve(value).catch(() => {});

export const prefetch = (pathname) => Promise.all(handlers.map((handler) => settle(handler(pathname))));
