// Refonte « manga » : dit à l'interface fixe (logo, menu, bandeau, barre du bas) si elle se trouve au-dessus du papier
// ou d'une page noire, pour qu'elle change d'encre. Deux classes sur <html> : mg-top-paper et mg-bottom-paper.
export function watchPaper(root) {
  const html = document.documentElement;
  const cover = root.querySelector(".mg-cover");
  const darks = Array.from(root.querySelectorAll("[data-dark]"));
  let raf = 0;

  const paperAt = (y) => {
    const m = root.getBoundingClientRect();
    if (y < m.top || y >= m.bottom) return false;
    // Sur la couverture : les bandes noires du plan sur les yeux, puis le rideau d'encre de la fin
    const c = cover.getBoundingClientRect();
    const span = c.height - window.innerHeight;
    if (span > 0 && c.bottom > y) {
      const prog = -c.top / span;
      if (prog > 0.9 || (prog > 0.395 && prog < 0.555)) return false;
    }
    return !darks.some((el) => {
      const r = el.getBoundingClientRect();
      return y >= r.top && y < r.bottom;
    });
  };

  const update = () => {
    raf = 0;
    html.classList.toggle("mg-top-paper", paperAt(46));
    html.classList.toggle("mg-bottom-paper", paperAt(window.innerHeight - 24));
  };
  const ask = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };

  // Tout l'accueil prend le rouge de la couverture et la police de titre manga (voir la fin de css/Manga.css)
  html.classList.add("mg-home");
  window.addEventListener("scroll", ask, { passive: true });
  window.addEventListener("resize", ask);
  update();

  return () => {
    window.removeEventListener("scroll", ask);
    window.removeEventListener("resize", ask);
    if (raf) cancelAnimationFrame(raf);
    html.classList.remove("mg-home", "mg-top-paper", "mg-bottom-paper");
  };
}
