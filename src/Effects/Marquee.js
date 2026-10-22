import React, { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./motion";

// Bandeau de texte infini. Le défilement de la page l'accélère et inverse son sens.
export default function Marquee({ items, speed = 70, reverse = false, className = "" }) {
  const rootRef = useRef(null);
  const trackRef = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const track = trackRef.current;
      const groupWidth = track.scrollWidth / 2;

      const tween = gsap.fromTo(
        track,
        { xPercent: reverse ? -50 : 0 },
        {
          xPercent: reverse ? 0 : -50,
          ease: "none",
          repeat: -1,
          duration: groupWidth / speed,
        }
      );

      // Les polices changent la largeur du texte : on recalcule la durée pour garder la même vitesse
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => tween.duration(track.scrollWidth / 2 / speed));
      }

      ScrollTrigger.create({
        trigger: rootRef.current,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          const boost = Math.min(Math.abs(self.getVelocity()) / 260, 5);
          tween.timeScale(self.direction * (1 + boost));
          gsap.to(tween, { timeScale: self.direction, duration: 1, ease: "power3.out", overwrite: true });
        },
      });
    },
    { scope: rootRef }
  );

  const group = (key) => (
    <div className="marquee__group" aria-hidden={key === "b" ? "true" : undefined} key={key}>
      {items.map((item, i) => (
        <React.Fragment key={`${key}-${i}`}>
          <span className="marquee__item">{item}</span>
          <span className="marquee__sep" aria-hidden="true">
            ✦
          </span>
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className={`marquee ${className}`} ref={rootRef}>
      <div className="marquee__track" ref={trackRef}>
        {group("a")}
        {group("b")}
      </div>
    </div>
  );
}
