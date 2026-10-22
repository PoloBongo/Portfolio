import backgroundPortfolio from "../../img/backgroundReactPortfolio.webp";

// Projets web. anchor : cible des liens #VueJs / #NextJs depuis la page d'accueil
export const WEB_PROJECTS = [
  {
    id: "au-fil-des-images",
    title: "Au fil des images",
    i18n: "WebProjects.AuFilDesImages",
    video: "UXJA-0_h_CY",
    links: [
      { href: "https://www.assoaufildesimages.com", labelKey: "WebProjects.aboutWebsite", primary: true },
    ],
  },
  {
    id: "celtic-la-riche-basket",
    title: "Celtic La Riche Basket",
    i18n: "WebProjects.CelticLaRicheBasket",
    video: "69aCHSjtFrw",
    links: [
      { href: "https://www.celticlarichebasket.fr/", labelKey: "WebProjects.aboutWebsite", primary: true },
      { href: "https://github.com/PoloBongo/WebSite-Basket", labelKey: "VideoGamesProjects.viewMoreCode" },
    ],
  },
  {
    id: "meteo-dashboard",
    anchor: "VueJs",
    title: "Meteo Dashboard",
    i18n: "WebProjects.MeteoDashboard",
    video: "Ybs2jAo-N-I",
    links: [
      {
        href: "https://polobongo.github.io/VueJS_MeteoDashboard/",
        labelKey: "WebProjects.aboutWebsite",
        primary: true,
      },
      { href: "https://github.com/PoloBongo/VueJS_MeteoDashboard", labelKey: "VideoGamesProjects.viewMoreCode" },
    ],
  },
  {
    id: "articles-manager",
    anchor: "NextJs",
    title: "Articles Manager Next Js",
    i18n: "WebProjects.ArticlesManager",
    video: "ozyPAW86O84",
    links: [
      {
        href: "https://next-js-articles-auth-cms-c5vo.vercel.app/",
        labelKey: "WebProjects.aboutWebsite",
        primary: true,
      },
      {
        href: "https://github.com/PoloBongo/NextJs_Articles_Auth_CMS",
        labelKey: "VideoGamesProjects.viewMoreCode",
      },
    ],
  },
  {
    id: "payment-page",
    titleKey: "WebProjects.PaymentPage.PaymentPageTitle",
    i18n: "WebProjects.PaymentPage",
    video: "le0FzwEJX_I",
    links: [],
  },
  {
    id: "eko",
    title: "Eko",
    i18n: "WebProjects.Eko",
    video: "gKIXjwVwrMg",
    links: [{ href: "https://github.com/PoloBongo/eko-commerce-project", labelKey: "VideoGamesProjects.viewMoreCode" }],
  },
  {
    id: "ba-immobilier",
    title: "B.A Immobilier",
    i18n: "WebProjects.BAImmobilier",
    video: "mfMnkY3wAvs",
    links: [],
  },
  {
    id: "portfolio",
    title: "Portfolio",
    i18n: "WebProjects.Portfolio",
    poster: backgroundPortfolio,
    alt: "Portfolio Preview",
    links: [],
  },
];
