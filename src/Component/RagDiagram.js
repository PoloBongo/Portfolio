import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { gsap, EASE, onReady, prefersReducedMotion } from "../Effects/motion";
import "../css/Diagram.css";

// Schéma animé du pipeline RAG de Cerebro, dans le langage du nuage de points du site : un espace
// vectoriel (Qdrant) qui se balance, une requête en anneau menthe qui y entre et allume ses voisins.
// Le canvas porte le spatial (nuage, vols de particules) ; le HTML porte l'interface (saisie, liste
// reclassée, modèle, réponse) : du vrai texte, net à toutes les tailles. Tout est placé dans un
// repère W × H propre à chaque disposition, le HTML en déduit des pourcentages.

const TAU = Math.PI * 2;
const TILT = 0.4; // inclinaison de la caméra
const SWAY = 0.5; // amplitude du balancement
const NARROW = "(max-width: 560px)";

// Deux dispositions pour les mêmes éléments et les mêmes animations : large (16:9, le flux va de gauche
// à droite) et haute (mobile, le flux descend : question, espace, reranking, modèle, réponse).
const LAYOUTS = {
  wide: {
    W: 960,
    H: 540,
    space: { x: 316, y: 250, r: 142 },
    sheet: { x: 46, y: 90, w: 64, h: 92 },
    col: { x: 566, w: 364 },
    input: { y: 80, h: 44 },
    slot: { y: 166, h: 24, gap: 9 },
    model: { y: 342, h: 40 },
    answer: { y: 400, h: 68 },
  },
  tall: {
    W: 600,
    H: 880,
    tall: true,
    space: { x: 300, y: 285, r: 135 },
    sheet: { x: 20, y: 150, w: 64, h: 92 },
    col: { x: 24, w: 552 },
    input: { y: 86, h: 40 },
    slot: { y: 484, h: 30, gap: 8 },
    model: { y: 682, h: 44 },
    answer: { y: 738, h: 66 },
  },
};

const slotMid = (L, i) => L.slot.y + i * (L.slot.h + L.slot.gap) + L.slot.h / 2;
const listHeight = (L) => 5 * L.slot.h + 4 * L.slot.gap;
const stepPercent = (L) => ((L.slot.h + L.slot.gap) / L.slot.h) * 100; // pas d'une ligne, en % de sa hauteur
const ringFrom = (L) =>
  L.tall
    ? { x: L.col.x + L.col.w / 2, y: L.input.y + L.input.h }
    : { x: L.col.x, y: L.input.y + L.input.h / 2 };
const ringCtrl = (L, from) => (L.tall ? { x: from.x - 80, y: from.y + 50 } : { x: from.x - 120, y: from.y + 10 });
const sheetZones = (L) => ({
  text: [L.sheet.x + 27, L.sheet.y + 33],
  table: [L.sheet.x + 32, L.sheet.y + 57],
  image: [L.sheet.x + 32, L.sheet.y + 78],
});

// Candidats remontés par la recherche (dans l'ordre de similarité) : score avant et après le cross-encoder.
// Seules les images sont reclassées, texte et tableaux gardent leur score de recherche.
const GATE = 0.78;
const CANDIDATES = [
  { kind: "IMG", page: 3, from: 0.84, to: 0.94 },
  { kind: "TXT", page: 12, from: 0.81, to: 0.81 },
  { kind: "IMG", page: 8, from: 0.77, to: 0.38 },
  { kind: "TBL", page: 7, from: 0.72, to: 0.72 },
  { kind: "IMG", page: 5, from: 0.69, to: 0.89 },
];
const ORDER = CANDIDATES.map((_, i) => i).sort((a, b) => CANDIDATES[b].to - CANDIDATES[a].to);
const ROWS = CANDIDATES.map((c, i) => ({ ...c, slot: ORDER.indexOf(i), pass: c.to >= GATE }));
const PASSING = ROWS.filter((r) => r.pass).sort((a, b) => a.slot - b.slot);

// Fragments du PDF : zone d'origine sur la feuille, grappe visée dans l'espace, instant de départ
const INGEST = [
  ["text", 0, 1.0, 6],
  ["table", 2, 1.65, 4],
  ["image", 6, 2.15, 4],
].flatMap(([zone, to, start, count]) =>
  Array.from({ length: count }, (_, i) => ({ zone, to, at: start + i * 0.1 }))
);

// Grappes de l'espace : col 0 = collection texte (violet), 1 = collection images (bleu pervenche)
const CLUSTERS = [
  { c: [-0.55, 0.3, 0.45], n: 30, col: 0 }, // 0 reçoit le texte ingéré
  { c: [0.55, 0.45, -0.15], n: 24, col: 0 },
  { c: [-0.05, -0.5, 0.55], n: 24, col: 0 }, // 2 reçoit les tableaux
  { c: [-0.35, -0.3, -0.6], n: 22, col: 0 },
  { c: [0.58, -0.05, 0.5], n: 28, col: 0 }, // 4 voisins « texte » de la requête
  { c: [0.3, 0.5, 0.55], n: 28, col: 1 }, // 5 voisins « image » de la requête
  { c: [-0.45, -0.4, 0.45], n: 20, col: 1 }, // 6 reçoit les images ingérées
];
const QUERY = [0.45, 0.22, 0.52];

// Déroulé (secondes) : une boucle complète, chaque étape allume un repère du rail
const T = { retrieve: 3.6, rerank: 7.9, generate: 10.3, stream: 12.0, reset: 15.4, end: 16.4 };
const T_STATIC = 15.3; // image fixe en mouvement réduit : la réponse est écrite

const mulberry32 = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const gauss = (rnd) => Math.sqrt(-2 * Math.log(Math.max(rnd(), 1e-6))) * Math.cos(TAU * rnd());
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// Pastille lumineuse préparée une fois : le nuage la redessine à toutes les tailles
function makeSprite(rgb) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.14, rgba(rgb, 1));
  grad.addColorStop(0.32, rgba(rgb, 0.55));
  grad.addColorStop(0.62, rgba(rgb, 0.12));
  grad.addColorStop(1, rgba(rgb, 0));
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

// Courbe de Bézier quadratique : écrit le point de paramètre t dans out
function bezier(a, c, b, t, out) {
  const u = 1 - t;
  out.x = u * u * a.x + 2 * u * t * c.x + t * t * b.x;
  out.y = u * u * a.y + 2 * u * t * c.y + t * t * b.y;
  return out;
}

// Points de l'espace (coordonnées dans la sphère unité), voisins de la requête, fragments ingérés
function buildCloud() {
  const rnd = mulberry32(11);
  const pts = [];
  const add = (c, sigma, col, cluster, ing = -1) => {
    let x = c[0] + gauss(rnd) * sigma;
    let y = c[1] + gauss(rnd) * sigma;
    let z = c[2] + gauss(rnd) * sigma;
    const len = Math.hypot(x, y, z);
    if (len > 0.96) {
      x *= 0.96 / len;
      y *= 0.96 / len;
      z *= 0.96 / len;
    }
    pts.push({ x, y, z, col, cluster, ing, sx: 0, sy: 0, d: 0, f: 1 });
    return pts.length - 1;
  };

  CLUSTERS.forEach((g, i) => {
    for (let k = 0; k < g.n; k++) add(g.c, 0.13, g.col, i);
  });
  for (let k = 0; k < 30; k++) add([0, 0, 0], 0.5, k % 3 === 0 ? 1 : 0, -1);

  const ingest = INGEST.map((f, i) => add(CLUSTERS[f.to].c, 0.1, CLUSTERS[f.to].col, f.to, i));

  // Les voisins de la requête : les plus proches dans chaque collection (hors vecteurs ingérés)
  const nearest = (cluster, count) =>
    pts
      .map((p, i) => ({ i, p, d: Math.hypot(p.x - QUERY[0], p.y - QUERY[1], p.z - QUERY[2]) }))
      .filter((o) => o.p.cluster === cluster)
      .sort((a, b) => a.d - b.d)
      .slice(0, count)
      .map((o) => o.i);
  const txt = nearest(4, 2);
  const img = nearest(5, 3);

  // Même ordre que les lignes de la liste : IMG, TXT, IMG, TBL, IMG
  return { pts, ingest, neighbors: [img[0], txt[0], img[1], txt[1], img[2]] };
}

// Position et taille des éléments HTML, en unités du repère de la disposition
const box = (x, y, w, h) => ({ "--x": x, "--y": y, "--w": w, "--h": h });
const at = (x, y) => ({ "--x": x, "--y": y });

// Disposition haute sur petit écran (le cadre devient plus haut, voir Projects.css)
function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia(NARROW).matches);
  useEffect(() => {
    const mq = window.matchMedia(NARROW);
    const update = () => setNarrow(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return narrow;
}

export default function RagDiagram({ tags }) {
  const { t } = useTranslation();
  const narrow = useNarrow();
  const L = LAYOUTS[narrow ? "tall" : "wide"];
  const rootRef = useRef(null);
  const canvasRef = useRef(null);

  const question = t("AIProjects.Diagram.Question");
  const questionRef = useRef(question);
  questionRef.current = question;

  useGSAP(
    () => {
      const root = rootRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!root || !ctx) return undefined;

      const { W, H, space, sheet: sheetBox, col, slot, model: modelBox, answer: answerBox } = L;
      const q = gsap.utils.selector(root);
      const reduced = prefersReducedMotion();
      const stepY = stepPercent(L);
      const from = ringFrom(L);
      const ctrl = ringCtrl(L, from);

      // Couleurs lues dans les variables CSS : le schéma suit Design.css
      const css = getComputedStyle(root);
      const color = (name, fallback) => hexToRgb(css.getPropertyValue(name).trim() || fallback);
      const violet = color("--violet", "#bc63ff");
      const mint = color("--mint", "#63e6be");
      const peri = color("--rag-peri", "#7c8cff");
      const sprite = { violet: makeSprite(violet), peri: makeSprite(peri), mint: makeSprite(mint) };

      const { pts, ingest, neighbors } = buildCloud();
      const rnd = mulberry32(5);
      const zones = sheetZones(L);
      const fragments = INGEST.map((f) => ({
        ...f,
        x: zones[f.zone][0] + (rnd() - 0.5) * 18,
        y: zones[f.zone][1] + (rnd() - 0.5) * 12,
        bend: 30 + rnd() * 50,
      }));

      // État animé : la timeline GSAP pilote ces valeurs, draw() les lit à chaque image
      const S = {
        phase: 0.7,
        speed: 1,
        fly: INGEST.map(() => ({ t: 0, a: 0 })),
        ing: INGEST.map(() => ({ a: 0, flash: 0 })),
        ring: { t: 0, a: 0 },
        wave: 0,
        links: 0,
        nb: neighbors.map(() => ({ a: 0 })),
        cand: ROWS.map(() => ({ t: 0, a: 0 })),
        pk: PASSING.map(() => ({ t: 0, a: 0 })),
        tk: Array.from({ length: 9 }, () => ({ t: 0, a: 0 })),
      };

      const view = { dpr: 1, k: 1 };
      const cam = { ca: 1, sa: 0, ct: 1, st: 0 };
      const trail = [];
      const P = { x: 0, y: 0 };
      const query = { sx: 0, sy: 0, d: 0, f: 1 };
      const hits = [];

      // Le pointeur est une requête de plus : l'anneau du curseur éclaire les points qu'il contient
      const hover = { x: 0, y: 0, tx: 0, ty: 0, a: 0, on: false };

      const project = (x, y, z, out) => {
        const x1 = x * cam.ca + z * cam.sa;
        const z1 = -x * cam.sa + z * cam.ca;
        const y2 = y * cam.ct - z1 * cam.st;
        const z2 = y * cam.st + z1 * cam.ct;
        const f = 1 / (1 - z2 * 0.3);
        out.sx = space.x + x1 * space.r * f;
        out.sy = space.y - y2 * space.r * f;
        out.d = (z2 + 1) / 2;
        out.f = f;
      };

      // Repères : contour de l'espace, anneau pointillé, liaisons entre les étapes
      const guides = (tilt) => {
        const { k } = view;
        ctx.strokeStyle = "rgba(243,240,234,0.1)";
        ctx.beginPath();
        ctx.arc(space.x, space.y, space.r, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = "rgba(243,240,234,0.07)";
        ctx.beginPath();
        ctx.ellipse(space.x, space.y, space.r, space.r * Math.sin(tilt), 0, 0, TAU);
        ctx.stroke();

        ctx.setLineDash([2 / k, 9 / k]);
        ctx.lineDashOffset = (-S.phase * 14) / k;
        const flash = S.wave > 0 && S.wave < 1 ? Math.pow(1 - S.wave, 2) : 0;
        ctx.strokeStyle = rgba(mint, 0.14 + 0.5 * flash);
        ctx.beginPath();
        ctx.arc(space.x, space.y, space.r + 14, 0, TAU);
        ctx.stroke();

        ctx.setLineDash([3 / k, 6 / k]);
        ctx.lineDashOffset = 0;
        ctx.strokeStyle = "rgba(243,240,234,0.15)";
        const link = (a, c, b) => {
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.quadraticCurveTo(c.x, c.y, b.x, b.y);
          ctx.stroke();
        };
        const pdf = { x: sheetBox.x + sheetBox.w + 10, y: sheetBox.y + 48 };
        if (L.tall) {
          // PDF → espace, saisie → espace, espace → liste
          link(pdf, { x: pdf.x + 40, y: pdf.y - 10 }, { x: space.x - space.r * 0.9, y: space.y - 40 });
          link(from, ctrl, { x: space.x + space.r * 0.2, y: space.y - space.r * 0.97 });
          link(
            { x: space.x + space.r * 0.75, y: space.y + space.r * 0.7 },
            { x: col.x + col.w - 6, y: space.y + space.r + 24 },
            { x: col.x + col.w - 12, y: slot.y - 8 }
          );
        } else {
          link(pdf, { x: pdf.x + 50, y: pdf.y + 12 }, { x: space.x - space.r * 0.82, y: space.y - 34 });
          link(from, ctrl, { x: space.x + space.r * 0.62, y: space.y - space.r * 0.6 });
          link(
            { x: space.x + space.r + 10, y: space.y + 6 },
            { x: (space.x + space.r + col.x) / 2 + 10, y: space.y + 6 },
            { x: col.x - 12, y: slotMid(L, 2) }
          );
        }
        // liste → modèle → réponse
        ctx.beginPath();
        ctx.moveTo(col.x + 22, slot.y + listHeight(L) + 6);
        ctx.lineTo(col.x + 22, modelBox.y - 4);
        ctx.moveTo(col.x + 22, modelBox.y + modelBox.h + 4);
        ctx.lineTo(col.x + 22, answerBox.y - 4);
        ctx.stroke();
        ctx.setLineDash([]);
      };

      const draw = () => {
        const { dpr, k } = view;
        ctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
        ctx.clearRect(0, 0, W, H);
        ctx.lineWidth = 1 / k;
        ctx.lineCap = "round";
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        // Caméra : léger balancement autour de la face avant, qui penche vers le pointeur
        const yaw = SWAY * Math.sin(S.phase) + hover.a * clamp(((hover.x - space.x) / W) * 1.1, -0.3, 0.3);
        const tilt =
          TILT + 0.04 * Math.sin(S.phase * 0.7 + 1.3) + hover.a * clamp(((hover.y - space.y) / H) * 0.2, -0.1, 0.1);
        cam.ca = Math.cos(yaw);
        cam.sa = Math.sin(yaw);
        cam.ct = Math.cos(tilt);
        cam.st = Math.sin(tilt);
        for (const p of pts) project(p.x, p.y, p.z, p);
        project(QUERY[0], QUERY[1], QUERY[2], query);

        guides(tilt);

        // Le nuage : addition de lumière, comme le champ de points de la page d'accueil
        ctx.globalCompositeOperation = "lighter";
        for (const p of pts) {
          const ing = p.ing >= 0 ? S.ing[p.ing] : null;
          const a = (0.16 + 0.84 * p.d * p.d) * (ing ? ing.a : 1);
          if (a < 0.02) continue;
          const s = (4.5 + 7 * p.d) * p.f * (ing ? 1 + 0.5 * ing.flash : 1);
          ctx.globalAlpha = Math.min(1, a);
          ctx.drawImage(p.col ? sprite.peri : sprite.violet, p.sx - s, p.sy - s, s * 2, s * 2);
          if (ing && ing.flash > 0.01) {
            const f = s * (1.5 + ing.flash * 2.2);
            ctx.globalAlpha = ing.flash * 0.85;
            ctx.drawImage(sprite.mint, p.sx - f, p.sy - f, f * 2, f * 2);
          }
        }

        // Voisins de la requête : halo menthe
        neighbors.forEach((idx, i) => {
          const a = S.nb[i].a;
          if (a < 0.01) return;
          const p = pts[idx];
          const s = (10 + 7 * p.d) * p.f * (0.7 + 0.5 * a);
          ctx.globalAlpha = Math.min(1, a * (0.4 + 0.6 * p.d));
          ctx.drawImage(sprite.mint, p.sx - s, p.sy - s, s * 2, s * 2);
        });

        // Points sous l'anneau du curseur (104 px de diamètre) : halo menthe, liens vers les plus proches
        hits.length = 0;
        if (hover.a > 0.02) {
          const reach = 52 / k;
          for (const p of pts) {
            if (p.d < 0.3 || (p.ing >= 0 && S.ing[p.ing].a < 0.5)) continue;
            const dist = Math.hypot(p.sx - hover.x, p.sy - hover.y);
            if (dist > reach) continue;
            const near = 1 - dist / reach;
            const s = (9 + 6 * p.d) * p.f * (0.6 + 0.6 * near);
            ctx.globalAlpha = hover.a * near * (0.4 + 0.6 * p.d);
            ctx.drawImage(sprite.mint, p.sx - s, p.sy - s, s * 2, s * 2);
            hits.push({ p, dist, near });
          }
          hits.sort((a, b) => a.dist - b.dist);
          hits.length = Math.min(hits.length, 5);
        }

        // Fragments du PDF en vol vers leur vecteur
        fragments.forEach((f, i) => {
          const fl = S.fly[i];
          if (fl.a < 0.01) return;
          const target = pts[ingest[i]];
          bezier(
            { x: f.x, y: f.y },
            { x: (f.x + target.sx) / 2 - 10, y: Math.min(f.y, target.sy) - f.bend },
            { x: target.sx, y: target.sy },
            fl.t,
            P
          );
          const s = 8 + 3 * Math.sin(fl.t * Math.PI);
          ctx.globalAlpha = fl.a;
          ctx.drawImage(f.zone === "image" ? sprite.peri : sprite.violet, P.x - s, P.y - s, s * 2, s * 2);
        });

        // Liens requête → voisins, onde d'arrivée
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        hits.forEach(({ p, near }) => {
          ctx.strokeStyle = rgba(mint, 0.5 * hover.a * (0.35 + 0.65 * near));
          ctx.beginPath();
          ctx.moveTo(hover.x, hover.y);
          ctx.lineTo(p.sx, p.sy);
          ctx.stroke();
        });
        if (S.links > 0.01) {
          neighbors.forEach((idx, i) => {
            const a = S.nb[i].a;
            if (a < 0.01) return;
            const p = pts[idx];
            ctx.strokeStyle = rgba(mint, 0.55 * S.links * Math.min(1, a * 1.4) * (0.4 + 0.6 * p.d));
            ctx.beginPath();
            ctx.moveTo(query.sx, query.sy);
            ctx.lineTo(p.sx, p.sy);
            ctx.stroke();
          });
        }
        if (S.wave > 0.001 && S.wave < 0.999) {
          ctx.strokeStyle = rgba(mint, 0.6 * Math.pow(1 - S.wave, 1.6));
          ctx.lineWidth = 1.4 / k;
          ctx.beginPath();
          ctx.arc(query.sx, query.sy, 8 + S.wave * space.r * 0.9, 0, TAU);
          ctx.stroke();
          ctx.lineWidth = 1 / k;
        }

        // La requête : anneau menthe qui laisse une traînée pendant son vol
        if (S.ring.a > 0.01) {
          bezier(from, ctrl, { x: query.sx, y: query.sy }, S.ring.t, P);
          if (S.ring.t > 0 && S.ring.t < 0.999) {
            trail.push({ x: P.x, y: P.y });
            if (trail.length > 16) trail.shift();
          }
          for (let i = 1; i < trail.length; i++) {
            const u = i / trail.length;
            ctx.strokeStyle = rgba(mint, 0.5 * u * S.ring.a);
            ctx.lineWidth = (0.5 + 2.4 * u) / k;
            ctx.beginPath();
            ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
            ctx.lineTo(trail[i].x, trail[i].y);
            ctx.stroke();
          }
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = S.ring.a;
          ctx.drawImage(sprite.mint, P.x - 28, P.y - 28, 56, 56);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
          ctx.strokeStyle = rgba(mint, S.ring.a);
          ctx.lineWidth = 1.5 / k;
          ctx.beginPath();
          ctx.arc(P.x, P.y, 11 + 1.2 * Math.sin(S.phase * 5), 0, TAU);
          ctx.stroke();
          ctx.fillStyle = rgba(mint, S.ring.a);
          ctx.beginPath();
          ctx.arc(P.x, P.y, 2.4, 0, TAU);
          ctx.fill();
          ctx.lineWidth = 1 / k;
        } else if (trail.length) {
          trail.length = 0;
        }

        // Candidats qui quittent l'espace pour la liste, contexte vers le modèle, jetons vers la réponse
        ctx.globalCompositeOperation = "lighter";
        const chip = (x, y, w, h, a) => {
          ctx.globalAlpha = a;
          ctx.drawImage(sprite.mint, x - 14, y - 14, 28, 28);
          ctx.fillStyle = rgba(mint, 1);
          ctx.fillRect(x - w / 2, y - h / 2, w, h);
        };
        neighbors.forEach((idx, i) => {
          const c = S.cand[i];
          if (c.a < 0.01) return;
          const p = pts[idx];
          const to = { x: col.x - 8, y: slotMid(L, i) };
          const bend = L.tall
            ? { x: (p.sx + to.x) / 2 + 40, y: (p.sy + to.y) / 2 }
            : { x: (p.sx + to.x) / 2, y: Math.min(p.sy, to.y) - 34 };
          bezier({ x: p.sx, y: p.sy }, bend, to, c.t, P);
          chip(P.x, P.y, 10, 5, c.a);
        });
        PASSING.forEach((row, i) => {
          const pk = S.pk[i];
          if (pk.a < 0.01) return;
          const start = { x: col.x + 6, y: slotMid(L, row.slot) };
          const end = { x: col.x + 22, y: modelBox.y + modelBox.h / 2 };
          bezier(start, { x: col.x - 18, y: (start.y + end.y) / 2 }, end, pk.t, P);
          chip(P.x, P.y, 6, 6, pk.a);
        });
        S.tk.forEach((tk, i) => {
          if (tk.a < 0.01) return;
          const x = col.x + 22 + ((i * 7) % 5) * 5 - 10;
          const y = modelBox.y + modelBox.h + 2 + tk.t * (answerBox.y - modelBox.y - modelBox.h);
          chip(x, y, 3, 8, tk.a);
        });
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      };

      const resize = () => {
        const w = root.clientWidth;
        const h = root.clientHeight;
        if (!w || !h) return;
        view.dpr = Math.min(window.devicePixelRatio || 1, 2);
        view.k = w / W;
        canvas.width = Math.round(w * view.dpr);
        canvas.height = Math.round(h * view.dpr);
        draw();
      };

      const tick = (time, delta) => {
        const dt = Math.min(delta, 50) / 1000;
        S.phase += dt * S.speed * 0.55;
        hover.a += ((hover.on ? 1 : 0) - hover.a) * (1 - Math.exp(-dt * 8));
        hover.x += (hover.tx - hover.x) * (1 - Math.exp(-dt * 14));
        hover.y += (hover.ty - hover.y) * (1 - Math.exp(-dt * 14));
        draw();
      };

      const onMove = (e) => {
        if (e.pointerType !== "mouse") return;
        const r = root.getBoundingClientRect();
        hover.tx = ((e.clientX - r.left) / r.width) * W;
        hover.ty = ((e.clientY - r.top) / r.height) * H;
        if (!hover.on) {
          hover.x = hover.tx;
          hover.y = hover.ty;
          hover.on = true;
        }
      };
      const onLeave = () => {
        hover.on = false;
      };

      // --- Éléments HTML pilotés par la timeline ------------------------------------------------
      const sheet = q(".rag__sheet");
      const zoneEls = { text: q(".rag__zone--text"), table: q(".rag__zone--table"), image: q(".rag__zone--image") };
      const tag = (name) => q(`.rag__tag--${name}`);
      const input = q(".rag__input");
      const typed = q(".rag__typed")[0];
      const list = q(".rag__list")[0];
      const scan = q(".rag__scan");
      const rows = q(".rag__row");
      const modelEl = q(".rag__model");
      const core = q(".rag__core");
      const answer = q(".rag__answer");
      const lines = q(".rag__line");
      const bars = q(".rag__bar");
      const cursor = q(".rag__cursor");
      const steps = q(".rag__step");
      const stepBars = q(".rag__step-bar");

      const setStep = (n) =>
        steps.forEach((el, i) => {
          el.classList.toggle("is-active", i === n);
          el.classList.toggle("is-done", i < n);
        });

      const resetDom = () => {
        typed.textContent = "";
        list.classList.remove("has-gate");
        modelEl.forEach((el) => el.classList.remove("is-live"));
        rows.forEach((row, i) => {
          row.classList.remove("is-scanned", "is-pass", "is-fail");
          row.querySelector(".rag__rank").textContent = String(i + 1);
          row.querySelector(".rag__score").textContent = ROWS[i].from.toFixed(2);
        });
        setStep(-1);
      };

      // --- Timeline ----------------------------------------------------------------------------
      const tl = gsap.timeline({ paused: true, repeat: reduced ? 0 : -1, defaults: { ease: EASE.soft } });
      const GHOST = 0.32; // opacité des stations avant leur étape

      resetDom();
      tl.call(resetDom, null, 0);
      tl.set(sheet, { autoAlpha: 0 }, 0);
      tl.set([tag("ingest"), tag("embed"), tag("rerank"), tag("sse")], { autoAlpha: 0 }, 0);
      tl.set([input, modelEl, answer], { autoAlpha: GHOST }, 0);
      tl.set(rows, { autoAlpha: 0, yPercent: 0 }, 0);
      tl.set(lines, { clipPath: "inset(0 100% 0 0)" }, 0);
      tl.set(cursor, { autoAlpha: 0 }, 0);
      tl.set(scan, { autoAlpha: 0, top: "0%" }, 0);
      tl.set(S, { speed: 1, wave: 0, links: 0 }, 0);

      // 01 — Ingestion : le PDF se découpe, chaque fragment devient un vecteur de l'espace
      tl.call(() => setStep(0), null, 0);
      tl.fromTo(sheet, { autoAlpha: 0, yPercent: 8, scale: 0.94 }, { autoAlpha: 1, yPercent: 0, scale: 1, duration: 0.9 }, 0.15);
      tl.fromTo(tag("ingest"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6 }, 0.55);
      [
        ["text", violet, 0.8],
        ["table", violet, 1.5],
        ["image", peri, 2.0],
      ].forEach(([zone, rgb, when]) => {
        tl.to(zoneEls[zone], { stroke: rgba(rgb, 1), duration: 0.4 }, when);
      });
      fragments.forEach((f, i) => {
        tl.set(S.fly[i], { a: 1 }, f.at);
        tl.fromTo(S.fly[i], { t: 0 }, { t: 1, duration: 1.15, ease: "power2.inOut" }, f.at);
        tl.set(S.fly[i], { a: 0 }, f.at + 1.12);
        tl.fromTo(S.ing[i], { a: 0 }, { a: 1, duration: 0.5, ease: "power2.out" }, f.at + 1.05);
        tl.fromTo(S.ing[i], { flash: 1 }, { flash: 0, duration: 1.0, ease: "power2.out" }, f.at + 1.05);
      });
      tl.to([sheet, tag("ingest")], { autoAlpha: 0, duration: 0.7 }, 3.1);

      // 02 — Recherche : la question devient un vecteur, ses voisins s'allument
      tl.call(() => setStep(1), null, T.retrieve);
      tl.to(input, { autoAlpha: 1, duration: 0.5 }, T.retrieve);
      const typing = { n: 0 };
      tl.fromTo(
        typing,
        { n: 0 },
        {
          n: 1,
          duration: 1.1,
          ease: "none",
          onUpdate: () => {
            const text = questionRef.current;
            typed.textContent = text.slice(0, Math.round(typing.n * text.length));
          },
        },
        T.retrieve + 0.3
      );
      tl.fromTo(input, { "--flash": 0 }, { "--flash": 1, duration: 0.2, yoyo: true, repeat: 1 }, 5.0);
      tl.fromTo(S.ring, { a: 0 }, { a: 1, duration: 0.2 }, 5.05);
      tl.fromTo(S.ring, { t: 0 }, { t: 1, duration: 1.15, ease: "power3.inOut" }, 5.05);
      tl.fromTo(tag("embed"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 5.15);
      tl.to(tag("embed"), { autoAlpha: 0, duration: 0.4 }, 6.3);
      tl.to(S, { speed: 0, duration: 0.9, ease: "power2.out" }, 5.3);
      tl.fromTo(S, { wave: 0 }, { wave: 1, duration: 1.1, ease: "power2.out" }, 6.2);
      tl.fromTo(S, { links: 0 }, { links: 1, duration: 0.5 }, 6.25);
      neighbors.forEach((_, i) => {
        tl.fromTo(S.nb[i], { a: 0 }, { a: 1, duration: 0.4 }, 6.25 + i * 0.07);
        const go = 6.9 + i * 0.09;
        tl.set(S.cand[i], { a: 1 }, go);
        tl.fromTo(S.cand[i], { t: 0 }, { t: 1, duration: 0.85, ease: "power2.inOut" }, go);
        tl.set(S.cand[i], { a: 0 }, go + 0.85);
        tl.to(S.nb[i], { a: 0.4, duration: 0.6 }, go);
        tl.fromTo(rows[i], { autoAlpha: 0, xPercent: -3 }, { autoAlpha: 1, xPercent: 0, duration: 0.45 }, go + 0.65);
      });
      tl.to(S, { links: 0.3, duration: 0.6 }, 7.8);

      // 03 — Reranking : le cross-encoder rescore les images, le seuil écarte le reste
      tl.call(() => setStep(2), null, T.rerank);
      tl.fromTo(tag("rerank"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, T.rerank - 0.3);
      tl.fromTo(scan, { autoAlpha: 0, top: "0%" }, { autoAlpha: 1, top: "100%", duration: 1.05, ease: "power1.inOut" }, T.rerank);
      tl.to(scan, { autoAlpha: 0, duration: 0.2 }, T.rerank + 1.05);
      ROWS.forEach((row, i) => {
        const when = T.rerank + 1.05 * ((i + 0.5) / ROWS.length);
        tl.call(() => rows[i].classList.add("is-scanned"), null, when);
        if (row.kind !== "IMG") return;
        const score = { v: row.from };
        const label = rows[i].querySelector(".rag__score");
        tl.to(
          score,
          {
            v: row.to,
            duration: 0.5,
            ease: "power2.out",
            onUpdate: () => {
              label.textContent = score.v.toFixed(2);
            },
          },
          when
        );
        tl.to(bars[i], { scaleX: row.to, duration: 0.5, ease: "power2.out" }, when);
      });
      tl.call(() => list.classList.add("has-gate"), null, T.rerank + 1.4);
      ROWS.forEach((row, i) => {
        tl.to(rows[i], { yPercent: (row.slot - i) * stepY, duration: 0.9, ease: "power3.inOut" }, T.rerank + 1.65 + i * 0.05);
        tl.call(
          () => {
            rows[i].querySelector(".rag__rank").textContent = String(row.slot + 1);
            rows[i].classList.add(row.pass ? "is-pass" : "is-fail");
          },
          null,
          T.rerank + 2.1
        );
        if (!row.pass) tl.to(rows[i], { autoAlpha: 0.28, duration: 0.5 }, T.rerank + 2.3);
      });

      // 04 — Génération : le contexte retenu part vers le modèle
      tl.call(() => setStep(3), null, T.generate);
      tl.to(modelEl, { autoAlpha: 1, duration: 0.5 }, T.generate);
      PASSING.forEach((_, i) => {
        const go = T.generate + 0.15 + i * 0.12;
        tl.set(S.pk[i], { a: 1 }, go);
        tl.fromTo(S.pk[i], { t: 0 }, { t: 1, duration: 0.75, ease: "power2.inOut" }, go);
        tl.set(S.pk[i], { a: 0 }, go + 0.75);
      });
      tl.call(() => modelEl.forEach((el) => el.classList.add("is-live")), null, T.generate + 0.8);
      tl.fromTo(core, { scale: 1 }, { scale: 1.3, duration: 0.28, yoyo: true, repeat: 3, ease: "sine.inOut" }, T.generate + 0.85);

      // 05 — Streaming : les jetons SSE écrivent la réponse
      tl.call(() => setStep(4), null, T.stream);
      tl.to(answer, { autoAlpha: 1, duration: 0.5 }, T.stream);
      tl.fromTo(tag("sse"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, T.stream);
      S.tk.forEach((tk, i) => {
        const go = T.stream + 0.25 + i * 0.27;
        tl.set(tk, { a: 1 }, go);
        tl.fromTo(tk, { t: 0 }, { t: 1, duration: 0.5, ease: "power1.in" }, go);
        tl.set(tk, { a: 0 }, go + 0.5);
      });
      [
        [0, 92, 1.0],
        [1, 84, 1.0],
        [2, 52, 0.7],
      ].forEach(([i, width, dur], n) => {
        const go = T.stream + 0.4 + n * 1.05;
        tl.to(lines[i], { clipPath: "inset(0 0% 0 0)", duration: dur, ease: "steps(9)" }, go);
        tl.set(cursor, { autoAlpha: 1, left: "5%", top: `${24 + i * 24}%` }, go);
        tl.to(cursor, { left: `${5 + width}%`, duration: dur, ease: "steps(9)" }, go);
      });
      tl.to(cursor, { autoAlpha: 0, duration: 0.2 }, T.stream + 3.25);

      // Retour au point de départ, en fondu
      tl.to([rows, scan], { autoAlpha: 0, duration: 0.5 }, T.reset);
      tl.to([input, modelEl, answer], { autoAlpha: GHOST, duration: 0.6 }, T.reset);
      tl.to([tag("rerank"), tag("sse")], { autoAlpha: 0, duration: 0.4 }, T.reset);
      tl.to(lines, { opacity: 0, duration: 0.4 }, T.reset);
      tl.set(lines, { opacity: 1 }, T.reset + 0.9);
      tl.to(S.ring, { a: 0, duration: 0.5 }, T.reset);
      tl.to(S, { links: 0, duration: 0.5 }, T.reset);
      tl.to(S.nb, { a: 0, duration: 0.5 }, T.reset);
      tl.to(S.ing, { a: 0, duration: 0.7 }, T.reset + 0.1);
      tl.to(stepBars, { scaleX: 0, duration: 0.5, ease: "power2.out" }, T.reset);
      tl.to(S, { speed: 1, duration: 0.7, ease: "power2.in" }, T.reset + 0.2);
      tl.call(() => setStep(-1), null, T.reset);

      // Avancement du rail : une barre par étape, remplie pendant sa durée
      const bounds = [0, T.retrieve, T.rerank, T.generate, T.stream, T.reset];
      stepBars.forEach((bar, i) => {
        tl.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: bounds[i + 1] - bounds[i], ease: "none" }, bounds[i]);
      });
      tl.set({}, {}, T.end);

      // Pose les états de départ posés par la timeline (la boucle ne démarre qu'à l'écran)
      tl.seek(0.001, true).seek(0, true);

      // Aide au debug : window.__rag.tl.pause().seek(7, false) fige le schéma à un instant précis
      if (process.env.NODE_ENV === "development") window.__rag = { tl, S };

      // --- Démarrage, visibilité, taille --------------------------------------------------------
      let running = false;
      const run = (on) => {
        if (on === running) return;
        running = on;
        if (on) {
          tl.play();
          gsap.ticker.add(tick);
        } else {
          tl.pause();
          gsap.ticker.remove(tick);
        }
      };

      const resizer = new ResizeObserver(resize);
      resizer.observe(root);
      resize();

      let io = null;
      let stopReady = () => {};
      if (reduced) {
        // Mouvement réduit : une image fixe, la réponse est écrite
        root.classList.add("is-static");
        tl.seek(T_STATIC, false);
        draw();
      } else {
        io = new IntersectionObserver(([entry]) => run(entry.isIntersecting), { threshold: 0.25 });
        stopReady = onReady(() => io.observe(root));
        root.addEventListener("pointermove", onMove);
        root.addEventListener("pointerleave", onLeave);
      }

      return () => {
        stopReady();
        if (io) io.disconnect();
        resizer.disconnect();
        root.removeEventListener("pointermove", onMove);
        root.removeEventListener("pointerleave", onLeave);
        gsap.ticker.remove(tick);
      };
    },
    { scope: rootRef, dependencies: [L], revertOnUpdate: true }
  );

  return (
    <div
      className="rag"
      ref={rootRef}
      role="img"
      aria-label={t("AIProjects.Diagram.Alt")}
      data-cursor="query"
      style={{ "--vw": L.W, "--vh": L.H }}
    >
      <canvas className="rag__canvas" ref={canvasRef} />

      {tags && <span className="rag__caption mono">{tags}</span>}

      {/* Source : le PDF, avec ses trois natures de contenu */}
      <svg
        className="rag__box rag__sheet"
        viewBox="0 0 64 92"
        style={box(L.sheet.x, L.sheet.y, L.sheet.w, L.sheet.h)}
      >
        <path className="rag__paper" d="M4 1.5h40l16 16v73H4z" />
        <path className="rag__fold" d="M44 1.5v16h16" />
        <g className="rag__zone rag__zone--text">
          <path d="M12 26h30M12 33h36M12 40h24" />
        </g>
        <g className="rag__zone rag__zone--table">
          <rect x="12" y="48" width="40" height="18" />
          <path d="M12 54h40M12 60h40M25.5 48v18M38.5 48v18" />
        </g>
        <g className="rag__zone rag__zone--image">
          <rect x="12" y="70" width="40" height="16" />
          <path d="M12 84l11-9 8 6 7-5 14 8" />
          <circle cx="44" cy="76" r="2" />
        </g>
      </svg>

      <p className="rag__tag rag__tag--ingest" style={at(L.sheet.x - 2, L.sheet.y + L.sheet.h + 14)}>
        PDF<span className="rag__more"> → {t("AIProjects.Diagram.Step1")}</span>
        <small>{t("AIProjects.Diagram.IngestSub")}</small>
      </p>
      <p className="rag__tag rag__tag--space rag__tag--center" style={at(L.space.x, L.space.y + L.space.r + 20)}>
        Qdrant
        <small>cerebro_text · cerebro_images</small>
        <small className="rag__sub2">{t("AIProjects.Diagram.SpaceSub")}</small>
      </p>

      {/* Question → candidats reclassés → modèle → réponse */}
      <p
        className={`rag__tag rag__tag--embed${L.tall ? "" : " rag__tag--right"}`}
        style={
          L.tall
            ? at(L.col.x + L.col.w / 2 + 16, L.input.y + L.input.h + 10)
            : at(L.col.x - 10, L.input.y - 20)
        }
      >
        E5 · embedding
      </p>
      <div className="rag__box rag__input" style={box(L.col.x, L.input.y, L.col.w, L.input.h)}>
        <span className="rag__prompt">›</span>
        <span className="rag__typed" />
      </div>

      <p className="rag__tag rag__tag--rerank" style={at(L.col.x, L.slot.y - 22)}>
        Rerank · cross-encoder
        <small>mMiniLM</small>
      </p>
      <div
        className="rag__box rag__list"
        style={{
          ...box(L.col.x, L.slot.y, L.col.w, listHeight(L)),
          "--gap": `${((L.slot.gap / listHeight(L)) * 100).toFixed(2)}%`,
        }}
      >
        {ROWS.map((row, i) => (
          <div className="rag__slot" key={i}>
            <div className={`rag__row${row.kind === "IMG" ? " is-img" : ""}`}>
              <span className="rag__rank">{i + 1}</span>
              <span className="rag__id">
                {row.kind} p.{row.page}
              </span>
              <span className="rag__track">
                <i className="rag__bar" style={{ transform: `scaleX(${row.from})` }} />
              </span>
              <span className="rag__score">{row.from.toFixed(2)}</span>
            </div>
          </div>
        ))}
        <i className="rag__scan" />
      </div>

      <div className="rag__box rag__model" style={box(L.col.x, L.model.y, L.col.w, L.model.h)}>
        <span className="rag__core" />
        <span className="rag__model-name">
          Mistral-7B
          <small>OVH AI Endpoints</small>
        </span>
      </div>
      <p
        className="rag__tag rag__tag--sse rag__tag--right"
        style={at(L.col.x + L.col.w - 18, L.model.y + L.model.h / 2 - 6)}
      >
        SSE · streaming
      </p>
      <div className="rag__box rag__answer" style={box(L.col.x, L.answer.y, L.col.w, L.answer.h)}>
        <i className="rag__line" style={{ "--ly": "24%", "--lw": "92%" }} />
        <i className="rag__line" style={{ "--ly": "48%", "--lw": "84%" }} />
        <i className="rag__line" style={{ "--ly": "72%", "--lw": "52%" }} />
        <i className="rag__cursor" />
      </div>

      {/* Rail : l'étape en cours s'allume */}
      <ol className="rag__rail">
        {[1, 2, 3, 4, 5].map((n) => (
          <li className="rag__step" key={n}>
            <span className="rag__step-n">0{n}</span>
            <span className="rag__step-name">{t(`AIProjects.Diagram.Step${n}`)}</span>
            <i className="rag__step-bar" />
          </li>
        ))}
      </ol>
    </div>
  );
}
