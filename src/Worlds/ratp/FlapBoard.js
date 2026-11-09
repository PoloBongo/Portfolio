import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "../../Effects/motion";

// W3 · le tableau à palettes, en complément de la scène du monde RATP. Chaque caractère est une palette en 3D CSS : elle
// tombe, découvre la suivante et claque à l'arrivée, avec un retard de colonne en colonne. Le texte reste lisible à tout
// moment, les palettes passent par les lettres réelles de l'alphabet. En dessous, la ligne de métro se dessine au
// défilement, station par station. Le texte courant est dupliqué en clair pour les lecteurs d'écran.
const COLS = 18;
const ALPHA = " ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const BOARDS = [
  [
    ["CHATELET", "2"],
    ["NATION", "5"],
    ["LA DEFENSE", "8"],
  ],
  [
    ["GARE DE LYON", "1"],
    ["BASTILLE", "3"],
    ["CONCORDE", "9"],
  ],
];
const STATIONS = ["La Défense", "Charles de Gaulle", "Concorde", "Châtelet", "Bastille", "Nation"];

const line = (stop, min) => `${stop.padEnd(COLS - 6, " ")}${min.padStart(2, " ")} MIN`;

export default function FlapBoard() {
  const { t } = useTranslation();
  const rootRef = useRef(null);
  const boardRef = useRef(null);
  const pathRef = useRef(null);
  const [board, setBoard] = useState(0);
  const state = useRef(BOARDS[0].map(() => Array(COLS).fill(" ")));
  const reduced = prefersReducedMotion();

  const flapsOf = () => [...boardRef.current.querySelectorAll(".rt-row")].map((r) => [...r.querySelectorAll(".rt-flap")]);

  const flip = (flap, from, to, delay) => {
    const [tp, bt, ft, fb] = flap.children;
    tp.textContent = to;
    bt.textContent = from;
    ft.textContent = from;
    fb.textContent = to;
    gsap.fromTo(ft, { rotateX: 0 }, { rotateX: -90, duration: 0.07, ease: "power1.in", delay });
    gsap.fromTo(fb, { rotateX: 90 }, { rotateX: 0, duration: 0.08, ease: "power1.out", delay: delay + 0.07, onComplete: () => (bt.textContent = to) });
  };
  const roll = (flaps, r, c, target, delay) => {
    const from = ALPHA.indexOf(state.current[r][c]);
    const to = ALPHA.indexOf(target);
    if (from === to) return;
    const steps = (to - from + ALPHA.length) % ALPHA.length;
    const hops = Math.min(steps, 7);
    for (let i = 1; i <= hops; i += 1) {
      const a = ALPHA[(to - (hops - i + 1) + ALPHA.length) % ALPHA.length];
      const z = i === hops ? target : ALPHA[(to - (hops - i) + ALPHA.length) % ALPHA.length];
      flip(flaps[r][c], i === 1 ? state.current[r][c] : a, z, delay + i * 0.11);
    }
    state.current[r][c] = target;
  };
  const show = (index) => {
    const flaps = flapsOf();
    BOARDS[index].forEach(([stop, min], r) => [...line(stop, min)].forEach((ch, c) => roll(flaps, r, c, ch, r * 0.12 + c * 0.03)));
  };

  // Mouvement réduit : le texte est posé tel quel, sans palettes qui tournent
  const paint = (index) => {
    const flaps = flapsOf();
    BOARDS[index].forEach(([stop, min], r) =>
      [...line(stop, min)].forEach((ch, c) => {
        const [tp, bt, ft, fb] = flaps[r][c].children;
        [tp, bt, ft, fb].forEach((el) => (el.textContent = ch));
        state.current[r][c] = ch;
      })
    );
  };

  // L'annonce change toutes les 5 s ; un clic force la suivante
  useEffect(() => {
    if (reduced) {
      paint(board);
      return undefined;
    }
    show(board);
    const id = setInterval(() => setBoard((b) => (b + 1) % BOARDS.length), 5000);
    return () => {
      clearInterval(id);
      flapsOf().flat().forEach((f) => gsap.killTweensOf(f.children));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!boardRef.current) return;
    if (reduced) paint(board);
    else show(board);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // La ligne se dessine au défilement, une station après l'autre
  useGSAP(
    () => {
      const path = pathRef.current;
      if (!path) return undefined;
      const len = path.getTotalLength();
      const dots = gsap.utils.toArray(".rt-station", rootRef.current);
      if (reduced) {
        path.style.strokeDasharray = "none";
        return undefined;
      }
      gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(dots, { scale: 0, opacity: 0 });
      const tl = gsap.timeline({
        scrollTrigger: { trigger: rootRef.current, start: "top 75%", end: "bottom 45%", scrub: 0.6 },
      });
      tl.to(path, { strokeDashoffset: 0, ease: "none", duration: 1 }, 0);
      dots.forEach((d, i) => tl.to(d, { scale: 1, opacity: 1, duration: 0.08, ease: "back.out(2)" }, (i / (dots.length - 1)) * 0.92));
      return () => {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      };
    },
    { scope: rootRef }
  );
  useEffect(() => () => ScrollTrigger.refresh(), []);

  const current = BOARDS[board];
  return (
    <section className="rt-board container" ref={rootRef} aria-label={t("Worlds.rt.label")}>
      <p className="rt-board__top mono">{t("Worlds.rt.top")}</p>
      <div className="rt-board__panel" ref={boardRef} onClick={() => setBoard((b) => (b + 1) % BOARDS.length)} data-cursor="view">
        {BOARDS[0].map((_, r) => (
          <div className="rt-row" key={r} aria-hidden="true">
            {Array.from({ length: COLS }, (__, c) => (
              <span className="rt-flap" key={c}>
                <i className="t" />
                <i className="b" />
                <i className="ft" />
                <i className="fb" />
              </span>
            ))}
          </div>
        ))}
      </div>
      <ul className="sr-only" aria-live="polite">
        {current.map(([stop, min]) => (
          <li key={stop}>
            {stop} : {min} min
          </li>
        ))}
      </ul>
      <p className="rt-board__hint mono">{t("Worlds.rt.hint")}</p>
      <div className="rt-line" aria-hidden="true">
        <svg viewBox="0 0 1000 80" preserveAspectRatio="none">
          <path ref={pathRef} d="M 20 40 H 980" />
        </svg>
        <ol>
          {STATIONS.map((s, i) => (
            <li key={s} style={{ left: `${2 + (i / (STATIONS.length - 1)) * 96}%` }}>
              <i className="rt-station" />
              <span className="mono">{s}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
