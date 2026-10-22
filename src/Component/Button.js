import React from "react";
import { TLink } from "../Effects/PageTransition";
import Magnetic from "../Effects/Magnetic";

const Arrow = () => (
  <svg className="btn__arrow" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 12L12 4M12 4H5.5M12 4v6.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Bouton pilule : le texte roule vers le haut et le fond se remplit au survol.
// to : route interne (rideau de transition) · href : lien externe ou ancre · sinon <button>
export default function Button({
  to,
  href,
  children,
  variant,
  size,
  arrow = true,
  magnetic = true,
  className = "",
  ...rest
}) {
  const classes = ["btn", variant === "solid" && "btn--solid", size === "small" && "btn--small", className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <span className="btn__text">
        <span className="btn__text-in">{children}</span>
        <span className="btn__text-in btn__text-in--clone" aria-hidden="true">
          {children}
        </span>
      </span>
      {arrow && <Arrow />}
    </>
  );

  let element;
  if (to) {
    element = (
      <TLink to={to} className={classes} {...rest}>
        {content}
      </TLink>
    );
  } else if (href) {
    const external = /^https?:/.test(href);
    element = (
      <a
        href={href}
        className={classes}
        {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        {...rest}
      >
        {content}
      </a>
    );
  } else {
    element = (
      <button type="button" className={classes} {...rest}>
        {content}
      </button>
    );
  }

  return magnetic ? <Magnetic>{element}</Magnetic> : element;
}
