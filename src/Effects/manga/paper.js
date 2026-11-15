// Refonte « manga » : dit à l'interface fixe (logo, menu, bandeau, barre du bas) si elle se trouve au-dessus du papier
// ou d'une page noire, pour qu'elle change d'encre. Classes sur <html> : mg-top-paper et mg-bottom-paper ; et
// mg-couvre quand l'accueil manga (opaque) couvre tout l'écran : les fonds WebGL derrière lui (Stage, aurore) se
// mettent alors en pause.
// Les positions des sections sont mesurées une fois (et à chaque changement de taille de la page), puis comparées au
// défilement : aucune lecture de mise en page pendant qu'on fait défiler.
export function watchPaper(root) {
  const html = document.documentElement;
  const cover = root.querySelector(".mg-cover");
  const darks = Array.from(root.querySelectorAll("[data-dark]"));
  let raf = 0;
  let geo = null;
  // Lus dans les évènements (début d'image, mise en page propre) : les lire dans requestAnimationFrame, après les
  // écritures de GSAP et de three.js, forçait une mise en page complète à chaque image
  let sy = window.scrollY;
  let hFen = window.innerHeight;

  const mesurer = () => {
    const y = window.scrollY;
    const m = root.getBoundingClientRect();
    const c = cover.getBoundingClientRect();
    geo = {
      haut: m.top + y,
      bas: m.bottom + y,
      couv: c.top + y,
      hautCouv: c.height,
      noirs: darks.map((el) => {
        const r = el.getBoundingClientRect();
        return [r.top + y, r.bottom + y];
      }),
    };
  };

  // y : position dans la fenêtre ; sy : défilement
  const paperAt = (y, sy) => {
    const d = y + sy;
    if (d < geo.haut || d >= geo.bas) return false;
    // Sur la couverture : les bandes noires du plan sur les yeux, puis le rideau d'encre de la fin
    const span = geo.hautCouv - hFen;
    if (span > 0 && geo.couv + geo.hautCouv > d) {
      const prog = (sy - geo.couv) / span;
      if (prog > 0.9 || (prog > 0.395 && prog < 0.555)) return false;
    }
    return !geo.noirs.some(([a, b]) => d >= a && d < b);
  };

  const update = () => {
    raf = 0;
    if (!geo) mesurer();
    const h = hFen;
    html.classList.toggle("mg-top-paper", paperAt(46, sy));
    html.classList.toggle("mg-bottom-paper", paperAt(h - 24, sy));
    html.classList.toggle("mg-couvre", sy >= geo.haut && sy + h <= geo.bas);
  };
  const ask = () => {
    sy = window.scrollY;
    if (!raf) raf = requestAnimationFrame(update);
  };
  const remesurer = () => {
    geo = null;
    hFen = window.innerHeight;
    ask();
  };

  // Tout l'accueil prend le rouge de la couverture et la police de titre manga (voir la fin de css/Manga.css)
  html.classList.add("mg-home");
  window.addEventListener("scroll", ask, { passive: true });
  window.addEventListener("resize", remesurer);
  // La page change de hauteur (images, polices, sections qui se déplient) : on remesure
  const ro = new ResizeObserver(remesurer);
  ro.observe(document.body);
  ro.observe(root);
  update();

  return () => {
    window.removeEventListener("scroll", ask);
    window.removeEventListener("resize", remesurer);
    ro.disconnect();
    if (raf) cancelAnimationFrame(raf);
    html.classList.remove("mg-home", "mg-top-paper", "mg-bottom-paper", "mg-couvre");
  };
}
