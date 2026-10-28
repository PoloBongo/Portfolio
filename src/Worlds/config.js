// Un monde = la peau d'une page projet : couleurs de l'interface, forme et teinte du nuage de points,
// éventuellement un module sur mesure (voir index.js). La coque (HUD, menu, curseur, grain, courbes d'animation)
// ne change jamais.
//
// Par défaut un projet prend le monde de sa catégorie : les couleurs et formes des trois actes du hero (Hero.js).
// WORLDS surcharge, projet par projet.
const GAME = { accent: "#ff5fa8", tint: [1, 0.37, 0.66], shape: "pad" };

const CATEGORY_WORLDS = {
  web: { accent: "#d9ff4a", tint: [0.85, 1, 0.29], shape: "browser" },
  ai: { accent: "#63e6be", tint: [0.39, 0.9, 0.75], shape: "network" },
  unity: GAME,
  unreal: GAME,
  gamejam: GAME,
};

// Champs d'un monde :
//  accent / secondary : couleur principale de l'interface (--violet) et couleur « interrogée » (--mint)
//  bg / bgRaised / bgSunken : fonds ; tint / mix : couleur du nuage (0-1) et dose ; shape : forme du nuage
//  cloud : pose du nuage sur la page (x, y, size, rot, show, flow, aurora), valeurs de buildWorkKeys par défaut
const WORLDS = {
  // Cerebro : l'espace latent lui-même, nuit profonde, menthe pour la matière et violet pour la requête
  cerebro: {
    accent: "#63e6be",
    secondary: "#b79bff",
    bg: "#05060c",
    bgRaised: "#0a0c18",
    bgSunken: "#03040a",
    cloud: { x: 0.8, y: 0.5, size: 0.4, show: 0.8, aurora: 0.7 },
  },
  // SEO Autopilot : un éditeur de nœuds sur papier pointillé, le seul monde en thème clair (encre sombre)
  "seo-autopilot": {
    accent: "#ff5a47",
    secondary: "#4b5bd7",
    ink: "#1c1c24",
    bg: "#f3f1ec",
    bgRaised: "#ffffff",
    bgSunken: "#e9e5dc",
    shape: "network",
    tint: [0.29, 0.36, 0.84],
    cloud: { show: 0.1, aurora: 0 },
  },
  // Au fil des images : un fil et des cadres photo suspendus, crème et aubergine (thème clair)
  "au-fil-des-images": {
    accent: "#ff7a59",
    secondary: "#6b3fb5",
    ink: "#2b1650",
    bg: "#f7f0e6",
    bgRaised: "#fffaf2",
    bgSunken: "#efe5d6",
    shape: "network",
    tint: [1, 0.48, 0.35],
    cloud: { show: 0.08, aurora: 0 },
  },
  // Depths Of Hue : la coursive d'un sous-marin, hublots vert menthe, corail pour la couleur qui revient
  "depths-of-hue": {
    accent: "#36e3a1",
    secondary: "#ff7f8a",
    bg: "#031a1c",
    bgRaised: "#062428",
    bgSunken: "#021012",
    shape: "sphere",
    tint: [0.21, 0.89, 0.63],
    cloud: { show: 0.5, aurora: 0.4 },
  },
  // Shadow Scholar : nuit bleutée, corail de l'emblème, acier des traits de vitesse
  "shadow-scholar": {
    accent: "#e5566d",
    secondary: "#4a86d6",
    bg: "#03050f",
    bgRaised: "#0a1020",
    bgSunken: "#02030a",
    shape: "noise",
    tint: [0.9, 0.34, 0.43],
    cloud: { show: 0.45, aurora: 0.3 },
  },
  // Funfair : la fête foraine de nuit, jaune des titres et des ampoules
  funfair: {
    accent: "#f4c430",
    secondary: "#2e9b4a",
    bg: "#0b0d1c",
    bgRaised: "#14172e",
    bgSunken: "#070812",
    shape: "lattice",
    tint: [0.96, 0.77, 0.19],
    cloud: { show: 0.5, aurora: 0.3 },
  },
  // Stay Soul : pixel art noir, lavande de la trame, crème des lettres
  "stay-soul": {
    accent: "#a99ad6",
    secondary: "#f1f0e4",
    bg: "#07050c",
    bgRaised: "#100c18",
    bgSunken: "#050309",
    shape: "lattice",
    tint: [0.66, 0.6, 0.84],
    cloud: { show: 0.4, aurora: 0.2 },
  },
  // Choco Blast : cacao, rose bonbon du menu, jaune des liserés
  "choco-blast": {
    accent: "#f0158f",
    secondary: "#f5c400",
    bg: "#2e1403",
    bgRaised: "#3a1c08",
    bgSunken: "#220e02",
    shape: "noise",
    tint: [0.94, 0.08, 0.56],
    cloud: { show: 0.4, aurora: 0.2 },
  },
  // celtic-la-riche-basket : l'affiche de club et son ballon qui rebondit
  "celtic-la-riche-basket": {
    accent: "#ff7a1a",
    secondary: "#f4efe2",
    bg: "#07281c",
    bgRaised: "#0b3a29",
    bgSunken: "#051d14",
    shape: "sphere",
    tint: [1, 0.48, 0.1],
    cloud: { show: 0.45, aurora: 0.3 },
  },
  // meteo-dashboard : une vitre sous la pluie, la buée essuyée par le curseur
  "meteo-dashboard": {
    accent: "#ffc857",
    secondary: "#cfe0ee",
    bg: "#0f1d2e",
    bgRaised: "#162b43",
    bgSunken: "#0a1522",
    shape: "network",
    tint: [0.62, 0.78, 0.95],
    cloud: { show: 0.45, aurora: 0.4 },
  },
  // articles-manager : la une d'un quotidien (thème clair)
  "articles-manager": {
    accent: "#c8321e",
    secondary: "#3a362c",
    ink: "#141414",
    bg: "#ece5d6",
    bgRaised: "#f6f1e4",
    bgSunken: "#e1d9c6",
    shape: "stack",
    tint: [0.78, 0.2, 0.12],
    cloud: { show: 0.08, aurora: 0 },
  },
  // eko : la marketplace en Memphis, pêche et corail, formes plates (thème clair)
  eko: {
    accent: "#c93b28",
    secondary: "#2f6fd6",
    ink: "#1b1b1f",
    bg: "#fff0cf",
    bgRaised: "#fff7e3",
    bgSunken: "#ffe6b0",
    shape: "network",
    tint: [0.93, 0.31, 0.23],
    cloud: { show: 0.06, aurora: 0 },
  },
  // ba-immobilier : anthracite et turquoise, plan d'architecte filaire
  "ba-immobilier": {
    accent: "#1fb8c4",
    secondary: "#f2b97a",
    bg: "#232527",
    bgRaised: "#2b2e31",
    bgSunken: "#1b1d1f",
    shape: "lattice",
    tint: [0.12, 0.72, 0.77],
    cloud: { show: 0.45, aurora: 0.3 },
  },
  // ratp : l'affiche du jeu, le quai et son tableau à palettes
  ratp: {
    accent: "#12d8dc",
    secondary: "#1d6fc4",
    bg: "#0a1018",
    bgRaised: "#101a28",
    bgSunken: "#060b11",
    shape: "lattice",
    tint: [0.07, 0.85, 0.86],
    cloud: { show: 0.45, aurora: 0.3 },
  },
  // angry-birds : le jeu tel quel, l'oiseau tiré sur la tour de bois (thème clair)
  "angry-birds": {
    accent: "#e0242e",
    secondary: "#3fbf4d",
    ink: "#2a1d12",
    bg: "#b9cbd9",
    bgRaised: "#cddae5",
    bgSunken: "#a9bfd0",
    shape: "noise",
    tint: [0.88, 0.14, 0.18],
    cloud: { show: 0.08, aurora: 0 },
  },
  // navy-bongo : le pont du voilier, la mer qui houle et le HUD du jeu
  "navy-bongo": {
    accent: "#f2b134",
    secondary: "#e0405b",
    bg: "#0a2c4d",
    bgRaised: "#0f3a63",
    bgSunken: "#072034",
    shape: "sphere",
    tint: [0.95, 0.69, 0.2],
    cloud: { show: 0.45, aurora: 0.4 },
  },
  // spacial-race : la route sous la neige, la gravité qui s'inverse (thème clair)
  "spacial-race": {
    accent: "#ff7a1a",
    secondary: "#f2b521",
    ink: "#1b1d20",
    bg: "#d3d8dc",
    bgRaised: "#e4e8eb",
    bgSunken: "#c4cacf",
    shape: "noise",
    tint: [1, 0.48, 0.1],
    cloud: { show: 0.08, aurora: 0 },
  },
  // payment-page : streetwear et ticket de caisse qui s'imprime
  "payment-page": {
    accent: "#e8ff2e",
    secondary: "#f4f4ef",
    bg: "#0c0c0c",
    bgRaised: "#151515",
    bgSunken: "#070707",
    shape: "stack",
    tint: [0.91, 1, 0.18],
    cloud: { show: 0.45, aurora: 0.2 },
  },
  // portfolio : le site qui se décrit lui-même (nuage de points violet)
  portfolio: {
    accent: "#bc63ff",
    secondary: "#63e6be",
    bg: "#0a0a0f",
    bgRaised: "#12121a",
    bgSunken: "#07070b",
    shape: "name",
    tint: [0.74, 0.39, 1],
    cloud: { show: 0.7, aurora: 0.6 },
  },
  // ui-ux-cooking : la cuisine low-poly et sa poêle qui flambe (thème clair)
  "ui-ux-cooking": {
    accent: "#e0782f",
    secondary: "#4ab8d8",
    ink: "#2b1f18",
    bg: "#d6c9b8",
    bgRaised: "#e6dccd",
    bgSunken: "#c7b9a6",
    shape: "noise",
    tint: [0.88, 0.47, 0.18],
    cloud: { show: 0.08, aurora: 0 },
  },
  // unity-rl : le terrain de foot sur un toit, en écran partagé
  "unity-rl": {
    accent: "#00f0f0",
    secondary: "#ff1744",
    bg: "#12240f",
    bgRaised: "#1a3315",
    bgSunken: "#0c1a0a",
    shape: "sphere",
    tint: [0, 0.94, 0.94],
    cloud: { show: 0.45, aurora: 0.3 },
  },
  // inventory : les ruines de grès, le mannequin et la barre d'objets
  inventory: {
    accent: "#ffb04a",
    secondary: "#5fc9d6",
    bg: "#2a1a12",
    bgRaised: "#37231a",
    bgSunken: "#1f130d",
    shape: "stack",
    tint: [1, 0.69, 0.29],
    cloud: { show: 0.45, aurora: 0.3 },
  },
  // attraction-flow : le parc vu de dessus, ses allées et ses visiteurs (thème clair)
  "attraction-flow": {
    accent: "#e0781d",
    secondary: "#3c8dde",
    ink: "#1e2a24",
    bg: "#bfeed8",
    bgRaised: "#d3f5e5",
    bgSunken: "#aee3c9",
    shape: "network",
    tint: [0.24, 0.55, 0.87],
    cloud: { show: 0.08, aurora: 0 },
  },
};

// Palettes des scènes : [fond, accent, second accent, surface, encre] (variables --w0…--w4 du cadre)
export const PALETTES = {
  "seo-autopilot": ["#f3f1ec", "#ff5a47", "#4b5bd7", "#ffffff", "#1c1c24"],
  "au-fil-des-images": ["#f7f0e6", "#ff7a59", "#6b3fb5", "#ffc65c", "#2b1650"],
  "depths-of-hue": ["#031a1c", "#36e3a1", "#ff7f8a", "#0b3b3f", "#e4fff4"],
  "shadow-scholar": ["#03050f", "#4a86d6", "#e5566d", "#0e1530", "#f4f6ff"],
  funfair: ["#0b0d1c", "#f4c430", "#c8202a", "#2e9b4a", "#fff3d1"],
  "stay-soul": ["#07050c", "#7b69a8", "#a99ad6", "#35264d", "#f1f0e4"],
  "choco-blast": ["#2e1403", "#f0158f", "#f5c400", "#5a2a12", "#fff3cf"],
  "celtic-la-riche-basket": ["#0e6b47", "#ff7a1a", "#07281c", "#101010", "#f4efe2"],
  "meteo-dashboard": ["#274b73", "#ffc857", "#0f1d2e", "#cfe0ee", "#e9f2ff"],
  "articles-manager": ["#ece5d6", "#c8321e", "#a69e8a", "#3a362c", "#141414"],
  eko: ["#ffb391", "#ec4e3a", "#3369d0", "#3b3b40", "#1b1b1f"],
  "ba-immobilier": ["#232527", "#1fb8c4", "#f2b97a", "#303337", "#e8e8e6"],
  ratp: ["#0a1018", "#12d8dc", "#1d6fc4", "#49b8a5", "#f4fbfb"],
  "angry-birds": ["#a9bfd0", "#e0242e", "#3fbf4d", "#a9774b", "#2a1d12"],
  "navy-bongo": ["#0f4c81", "#f2b134", "#e0405b", "#8a4f2b", "#eaf6ff"],
  "spacial-race": ["#c9ced2", "#f2b521", "#ff7a1a", "#6f757b", "#1b1d20"],
  "payment-page": ["#0c0c0c", "#e8ff2e", "#f4f4ef", "#6e6e68", "#1a1a1a"],
  portfolio: ["#0a0a0f", "#bc63ff", "#63e6be", "#12121a", "#f3f0ea"],
  "ui-ux-cooking": ["#cdbfae", "#e0782f", "#4ab8d8", "#6c86b3", "#2b1f18"],
  "unity-rl": ["#86b872", "#00f0f0", "#ff1744", "#7f9cc8", "#f6f6f0"],
  inventory: ["#2a1a12", "#ffb04a", "#5fc9d6", "#8c6a4f", "#f4e6d2"],
  "attraction-flow": ["#9fe5c4", "#f2994a", "#3c8dde", "#d9bd96", "#1e2a24"],
};

// Polices Google chargées par le monde (une feuille, display=swap)
export const FONTS = {
  "seo-autopilot":
    "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap",
  "au-fil-des-images":
    "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=Figtree:wght@400;500;700&display=swap",
  "depths-of-hue":
    "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..600;1,300..600&family=Jost:wght@300;400;500&display=swap",
  "shadow-scholar": "https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@400;600;700&display=swap",
  funfair: "https://fonts.googleapis.com/css2?family=Bevan:ital@0;1&family=Rubik:wght@400;600;800&display=swap",
  "stay-soul": "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap",
  "choco-blast": "https://fonts.googleapis.com/css2?family=Bangers&family=Nunito:wght@400;700;900&display=swap",
  "celtic-la-riche-basket": "https://fonts.googleapis.com/css2?family=Anton&family=Barlow+Condensed:wght@400;600;700&display=swap",
  "meteo-dashboard": "https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@200;300;400;600&display=swap",
  "articles-manager": "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Newsreader:ital,opsz,wght@0,6..72,400..600;1,6..72,400..600&display=swap",
  eko: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&display=swap",
  "ba-immobilier": "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&family=Share+Tech+Mono&display=swap",
  ratp: "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Overpass+Mono:wght@400;700&display=swap",
  "angry-birds": "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;800&family=Patrick+Hand&display=swap",
  "navy-bongo": "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=IM+Fell+English:ital@0;1&display=swap",
  "spacial-race": "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;600;700&display=swap",
  "payment-page": "https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,400..900&family=Courier+Prime:wght@400;700&display=swap",
  "ui-ux-cooking": "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;800&family=Nunito:wght@400;700;900&display=swap",
  "unity-rl": "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700&display=swap",
  inventory: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700&display=swap",
  "attraction-flow": "https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;800&family=Nunito:wght@400;700;900&display=swap",
};

export function worldOf(work) {
  return { id: work.slug, mix: 0.9, ...CATEGORY_WORLDS[work.category.id], ...WORLDS[work.slug] };
}
