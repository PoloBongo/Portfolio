import { onReady } from "../motion";
import { impact } from "./impact";
import { startTilt } from "./tilt";
import { verifierMini } from "./mini";
import "../../css/Anime.css";

// Kit « anime » de la refonte manga, chargé à part après le premier rendu (jamais en mouvement réduit) :
// - un clic sur un lien qui change de page frappe l'écran (image d'impact, Effects/anime/impact.js) avant la transition ;
// - chaque titre de section arrive comme un coup : lignes de concentration derrière lui, onomatopée tamponnée à côté
//   (elle reste imprimée sur la page, comme dans une case), petite secousse, et le fond WebGL réagit.

const TITLES = ".section-head, .mg-chap__head, .page-hero, [data-slam]";
const SOUNDS = ["ドン", "ゴゴゴ", "バン", "ドドド", "ズン"];

const internalLink = (event) => {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null;
  const a = event.target.closest && event.target.closest("a[href]");
  if (!a || a.target === "_blank" || a.hasAttribute("download")) return null;
  const url = new URL(a.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  if (url.pathname === window.location.pathname) return null;
  return url;
};

// Le compagnon de l'accueil est à l'écran : au clic, il plonge dans la case (sa propre incision, Effects/manga/cover.js)
const compagnonLa = () => {
  const b = document.querySelector(".mg-buddy.is-on");
  return !!b && window.getComputedStyle(b).display !== "none";
};

const onClick = (event) => {
  const url = internalLink(event);
  if (!url) return;
  // Chapitre 2 : la porte cliquée s'ouvre en grand pendant que le rideau se lève
  const porte = event.target.closest(".mg-world");
  if (porte) porte.classList.add("is-open");
  if (compagnonLa()) return;
  // Clavier : le centre du lien
  let { clientX: x, clientY: y } = event;
  if (event.detail === 0) {
    const r = event.target.closest("a").getBoundingClientRect();
    x = r.left + r.width / 2;
    y = r.top + r.height / 2;
  }
  impact({ x, y, text: /\/work\//.test(url.pathname) ? "ドン" : "バン" });
};

let count = 0;
const slam = (host) => {
  host.classList.add("ax-host");
  const burst = document.createElement("i");
  burst.className = "ax-burst";
  burst.setAttribute("aria-hidden", "true");
  host.prepend(burst);
  // Les en-têtes de page ont déjà leur kana vertical : pas d'onomatopée en plus
  if (!host.querySelector(".ax-stamp, .page-hero__kana")) {
    const stamp = document.createElement("b");
    stamp.className = "ax-stamp";
    stamp.setAttribute("aria-hidden", "true");
    stamp.textContent = host.dataset.slam || SOUNDS[count % SOUNDS.length];
    count += 1;
    host.appendChild(stamp);
  }
  // relance l'animation
  void host.offsetWidth;
  host.classList.add("ax-hit");
  const r = host.getBoundingClientRect();
  window.dispatchEvent(
    new CustomEvent("anime:impact", { detail: { x: r.left + r.width * 0.3, y: r.top + Math.min(r.height, 260) * 0.5, strength: 0.45 } })
  );
  setTimeout(() => burst.remove(), 900);
};

// Les emblèmes 3D des portes du chapitre 2 (chargés à part, seulement quand les portes sont dans la page)
let emblemes = null;
const verifierEmblemes = () => {
  const liste = document.querySelector(".mg-worlds");
  if (liste && !emblemes) {
    emblemes = { liste, fin: null };
    const moi = emblemes;
    import("./emblemes").then(({ creerEmblemes }) => {
      if (emblemes === moi && moi.liste.isConnected) moi.fin = creerEmblemes(moi.liste);
    });
  } else if (emblemes && (!liste || liste !== emblemes.liste)) {
    if (emblemes.fin) emblemes.fin();
    emblemes = null;
    if (liste) verifierEmblemes();
  }
};

export function startAnime() {
  document.addEventListener("click", onClick, true);
  const stopTilt = startTilt();

  const seen = new WeakSet();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        io.unobserve(entry.target);
        onReady(() => slam(entry.target));
      });
    },
    { rootMargin: "0px 0px -28% 0px" }
  );
  const scan = () => {
    verifierMini();
    verifierEmblemes();
    document.querySelectorAll(TITLES).forEach((el) => {
      if (seen.has(el) || el.dataset.axWatched) return;
      el.dataset.axWatched = "1";
      io.observe(el);
    });
  };
  scan();
  // Les pages changent sans rechargement : on surveille les nouveaux titres
  let pending = 0;
  const mo = new MutationObserver(() => {
    if (!pending)
      pending = requestAnimationFrame(() => {
        pending = 0;
        scan();
      });
  });
  mo.observe(document.getElementById("root") || document.body, { childList: true, subtree: true });

  return () => {
    stopTilt();
    document.removeEventListener("click", onClick, true);
    io.disconnect();
    mo.disconnect();
  };
}

export { impact };
