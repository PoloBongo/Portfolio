import React, { useState, useEffect } from "react";

const Fade = () => {
  const [fadeIn, setFadeIn] = useState(true);

  useEffect(() => {
    const fadeDuration = 1000;

    if (fadeIn) {
      const timeout = setTimeout(
        () => {
          setFadeIn(false);
        },
        fadeDuration
      );

      return () => {
        clearTimeout(timeout);
      };
    } else {
      const setHOpacity = document.querySelector(".fade-in");
      if (setHOpacity) {
        setHOpacity.style.opacity = "0";
      }
    }
  }, [fadeIn]);

  return <div className={fadeIn ? "fade-in" : "fade-out"}></div>;
};

export default Fade;
