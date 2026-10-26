import React, { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, EASE } from "./motion";
import { announceBuild, introMode, releaseIntro } from "./intro";
import { whenLoaded } from "./ready";
import { isSoundOn, play } from "./sound";

// Les trois langues du site, puis le nom : le compteur de chargement les rythme
const GREETINGS = ["Bonjour", "Hello", "Hola", "Arthur BRU"];

const pad = (n) => String(n).padStart(2, "0");
const BUILD = (() => {
  const d = new Date();
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
})();

// Journal de démarrage. `wait` : la ligne se valide quand la scène 3D est réellement chargée.
const logFor = (mode) => {
  if (mode === "short") {
    return [
      { text: "init latent_space v5.1", state: "", tone: "dim" },
      { text: "mount /embeddings", state: "ok", tone: "ok" },
      { text: "ready", state: "online", tone: "go" },
    ];
  }
  return [
    { text: "init latent_space v5.1", state: "", tone: "dim" },
    { text: "mount /embeddings", state: "ok", tone: "ok" },
    { text: "embed projects", state: "ok", tone: "ok" },
    { text: "load field.points", state: "ok", tone: "ok", wait: true },
    { text: "sync audio bus", state: isSoundOn() ? "armed" : "muted", tone: "dim" },
    { text: "ready", state: "online", tone: "go" },
  ];
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const WAIT_CAP = 7000;

export default function Preloader() {
  const rootRef = useRef(null);
  const [done, setDone] = useState(introMode === "none");
  const [log] = useState(() => (introMode === "none" ? [] : logFor(introMode)));

  useGSAP(
    () => {
      if (introMode === "none") return undefined;

      const q = gsap.utils.selector(rootRef.current);
      // Un peu plus lent qu'avant : chaque salutation reste lisible (~0,7 s) avant que le nuage n'écrive le nom
      const duration = introMode === "full" ? 2.8 : 1.1;
      const counter = { value: 0 };
      const countEl = q(".preloader__count span")[0];
      const greetEl = q(".preloader__greet span")[0];
      const lines = q(".preloader__line");
      const texts = q(".preloader__line-text");
      const states = q(".preloader__line-state");

      const paint = () => {
        countEl.textContent = String(Math.round(counter.value)).padStart(3, "0");
      };

      // Chargements déclarés par la page (nuage de points) : évalués au dernier moment, plafonnés dans le temps
      let loaded = null;
      const whenAssetsReady = () => {
        if (!loaded) loaded = Promise.race([whenLoaded(), wait(WAIT_CAP)]);
        return loaded;
      };
      const needsWait = log.some((line) => line.wait);

      gsap.set(states, { opacity: 0 });

      const tl = gsap.timeline();
      tl.from(q(".preloader__corner"), { opacity: 0, duration: 0.8, stagger: 0.08 }, 0)
        .from(q(".preloader__meta"), { opacity: 0, y: 14, duration: 0.7, ease: EASE.out, stagger: 0.1 }, 0)
        // Le compteur monte jusqu'à 90 % : la fin attend le chargement réel
        .to(counter, { value: 90, duration, ease: "power2.inOut", onUpdate: paint }, 0.1)
        .fromTo(q(".preloader__rail i"), { scaleX: 0 }, { scaleX: 0.9, duration, ease: "power2.inOut" }, 0.1);

      // Journal tapé ligne à ligne
      const gap = duration / log.length;
      log.forEach((line, i) => {
        const at = 0.15 + gap * i;
        tl.fromTo(lines[i], { opacity: 0 }, { opacity: 1, duration: 0.15 }, at).fromTo(
          texts[i],
          { clipPath: "inset(0 100% 0 0)" },
          {
            clipPath: "inset(0 0% 0 0)",
            duration: Math.min(0.5, gap * 0.9),
            ease: `steps(${line.text.length + 2})`,
          },
          at
        );

        if (line.wait) {
          // Clignote tant que la scène n'est pas prête, puis passe à « ok »
          tl.add(() => {
            const el = states[i];
            el.textContent = "···";
            el.classList.add("is-wait");
            gsap.set(el, { opacity: 1 });
            whenAssetsReady().then(() => {
              el.textContent = line.state;
              el.classList.remove("is-wait");
            });
          }, at + gap * 0.9);
        } else if (line.state) {
          tl.set(states[i], { opacity: 1 }, at + gap * 0.9);
        }
      });

      const step = duration / GREETINGS.length;
      GREETINGS.forEach((word, i) => {
        const at = 0.1 + step * i;
        tl.add(() => {
          greetEl.textContent = word;
        }, at).fromTo(greetEl, { yPercent: 110 }, { yPercent: 0, duration: 0.55, ease: EASE.out }, at);
        if (i < GREETINGS.length - 1) {
          tl.to(greetEl, { yPercent: -110, duration: 0.3, ease: "power3.in" }, at + step - 0.3);
        }
        // Sur l'accueil, le nuage commence à écrire le nom derrière le rideau dès la troisième salutation
        if (i === 2 && introMode === "full") tl.add(announceBuild, at);
      });

      // Pause à 90 % tant que le chargement n'est pas terminé
      tl.addLabel("hold", duration + 0.2).add(() => {
        if (!needsWait) return;
        tl.pause();
        whenAssetsReady().then(() => tl.play());
      }, "hold");

      tl.to(counter, { value: 100, duration: 0.45, ease: "power2.out", onUpdate: paint }, "hold+=0.02")
        .to(q(".preloader__rail i"), { scaleX: 1, duration: 0.45, ease: "power2.out" }, "hold+=0.02")
        .addLabel("exit", ">+0.3")
        .add(() => play("boot"), "exit")
        .add(announceBuild, "exit")
        .to(q(".preloader__corner"), { opacity: 0, duration: 0.4 }, "exit")
        .to(
          q(".preloader__ui > *:not(.preloader__corner)"),
          { opacity: 0, y: -28, duration: 0.5, ease: EASE.inOut, stagger: 0.04 },
          "exit"
        )
        .add(() => {
          releaseIntro();
          document.documentElement.classList.remove("is-intro");
        }, "exit+=0.35")
        .to(q(".preloader__panel--top"), { yPercent: -100, duration: 1.05, ease: EASE.inOut }, "exit+=0.3")
        .to(q(".preloader__panel--bottom"), { yPercent: 100, duration: 1.05, ease: EASE.inOut }, "exit+=0.3")
        .add(() => setDone(true));

      // Passable : un clic ou une touche accélère la séquence (le chargement réel reste attendu)
      const root = rootRef.current;
      const skip = () => tl.timeScale(4);
      root.addEventListener("pointerdown", skip, { once: true });
      window.addEventListener("keydown", skip, { once: true });

      return () => {
        root.removeEventListener("pointerdown", skip);
        window.removeEventListener("keydown", skip);
      };
    },
    { scope: rootRef }
  );

  if (done) return null;

  return (
    <div className="preloader" ref={rootRef} aria-hidden="true">
      <div className="preloader__panel preloader__panel--top" />
      <div className="preloader__panel preloader__panel--bottom" />
      <div className="preloader__ui">
        <i className="preloader__corner hud__corner hud__corner--tl" />
        <i className="preloader__corner hud__corner hud__corner--tr" />
        <i className="preloader__corner hud__corner hud__corner--bl" />
        <i className="preloader__corner hud__corner hud__corner--br" />
        <span className="preloader__meta mono">latent_space v5.1</span>
        <span className="preloader__meta preloader__meta--right mono">Build {BUILD}</span>
        <div className="preloader__greet">
          <span>{GREETINGS[0]}</span>
        </div>
        <ul className="preloader__log mono">
          {log.map((line) => (
            <li className="preloader__line" key={line.text}>
              <span className="preloader__line-text">&gt; {line.text}</span>
              <span className="preloader__line-dots" />
              <span className={`preloader__line-state preloader__line-state--${line.tone}`}>
                {line.state}
              </span>
            </li>
          ))}
        </ul>
        <div className="preloader__count">
          <span>000</span>
        </div>
        <div className="preloader__rail">
          <i />
        </div>
      </div>
    </div>
  );
}
