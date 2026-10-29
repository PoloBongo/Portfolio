import React, { useEffect, useRef } from "react";
import { gsap, hasFinePointer } from "./motion";
import { subscribeCursorHint } from "./cursorBus";

const INTERACTIVE = 'a, button, [role="button"], label[for], summary, [data-cursor]';
const TEXTUAL = 'input, textarea, select, [contenteditable="true"]';

// Curseur custom : point précis + anneau qui suit avec inertie.
// L'état visuel vient de data-cursor="view|play|drag|query" et data-cursor-text sur n'importe quel élément
// (« query » : zone où le curseur interroge le nuage de points).
export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    if (!hasFinePointer()) return undefined;

    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    const root = document.documentElement;

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });
    const dotX = gsap.quickTo(dot, "x", { duration: 0.1, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.1, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });

    let shown = false;

    const setState = (state, text = "") => {
      ring.dataset.state = state;
      dot.dataset.state = state;
      label.textContent = text;
    };

    // L'état venu du DOM (survol) est retenu ; un indice de la scène 3D (objet qu'on peut tourner) passe devant
    let base = { state: "idle", text: "" };
    let hint = null;
    const apply = () => (hint ? setState(hint.state, hint.text) : setState(base.state, base.text));
    const setBase = (state, text = "") => {
      base = { state, text };
      apply();
    };
    const offHint = subscribeCursorHint((next) => {
      hint = next;
      apply();
    });

    const onMove = (e) => {
      if (!shown) {
        shown = true;
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY });
        root.classList.add("has-cursor");
        dot.classList.add("is-visible");
        ring.classList.add("is-visible");
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    const onOver = (e) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("iframe")) {
        setBase("hide");
        return;
      }
      if (target.closest(TEXTUAL)) {
        setBase("text");
        return;
      }
      const el = target.closest(INTERACTIVE);
      if (!el) {
        setBase("idle");
        return;
      }
      setBase(el.dataset.cursor || "link", el.dataset.cursorText || "");
    };

    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");
    const onLeave = () => {
      dot.classList.remove("is-visible");
      ring.classList.remove("is-visible");
    };
    const onEnter = () => {
      if (!shown) return;
      dot.classList.add("is-visible");
      ring.classList.add("is-visible");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    root.addEventListener("mouseenter", onEnter);

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      root.removeEventListener("mouseleave", onLeave);
      root.removeEventListener("mouseenter", onEnter);
      offHint();
      root.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div className="cursor" aria-hidden="true">
      <div className="cursor__dot" ref={dotRef} data-state="idle" />
      <div className="cursor__ring" ref={ringRef} data-state="idle">
        <span className="cursor__label" ref={labelRef} />
      </div>
    </div>
  );
}
