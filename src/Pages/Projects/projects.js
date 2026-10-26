import backgroundPortfolio from "../../img/backgroundReactPortfolio.webp";

// Projets web. anchor : cible des liens #VueJs / #NextJs depuis la page d'accueil
export const WEB_PROJECTS = [
  {
    id: "au-fil-des-images",
    title: "Au fil des images",
    tags: "Next.js · Supabase · Vercel",
    i18n: "WebProjects.AuFilDesImages",
    video: "UXJA-0_h_CY",
    links: [
      { href: "https://www.assoaufildesimages.com", labelKey: "WebProjects.aboutWebsite", primary: true },
    ],
  },
  {
    id: "celtic-la-riche-basket",
    title: "Celtic La Riche Basket",
    tags: "PHP · MySQL · Stripe",
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
    tags: "Vue 3 · Chart.js",
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
    tags: "Next.js 15 · MongoDB · NextAuth",
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
    tags: "Stripe · PayPal",
    i18n: "WebProjects.PaymentPage",
    video: "le0FzwEJX_I",
    links: [],
  },
  {
    id: "eko",
    title: "Eko",
    tags: "PHP · Stripe · MySQL",
    i18n: "WebProjects.Eko",
    video: "gKIXjwVwrMg",
    links: [{ href: "https://github.com/PoloBongo/eko-commerce-project", labelKey: "VideoGamesProjects.viewMoreCode" }],
  },
  {
    id: "ba-immobilier",
    title: "B.A Immobilier",
    tags: "HTML · CSS · JavaScript",
    i18n: "WebProjects.BAImmobilier",
    video: "mfMnkY3wAvs",
    links: [],
  },
  {
    id: "portfolio",
    title: "Portfolio",
    tags: "React · GSAP · Three.js",
    i18n: "WebProjects.Portfolio",
    poster: backgroundPortfolio,
    alt: "Portfolio Preview",
    links: [],
  },
];
