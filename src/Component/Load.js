import React, { Suspense, useState, useEffect } from "react";
import { useSpring, animated } from "react-spring";
import "../css/Home.css";

import pikachuWait from "../img/pikachuWait.webp";
import bubbleSpeechFR from "../img/bubbleSpeechFR.webp";
import bubbleSpeechEN from "../img/bubbleSpeechEN.webp";
import bubbleSpeechES from "../img/bubbleSpeechES.webp";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation, useTranslation } from "react-i18next";

const LoadT = () => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    sessionStorage.setItem("ShowTitleInNavbar", "true");
    const handleTarget = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleTarget);

    return () => {
      window.removeEventListener("resize", handleTarget);
    };
  }, []);

  const pikachuAnimation = useSpring({
    from: { transform: `translateX(0%)` },
    to: { transform: `translateX(-${windowWidth * 0.55}px)` },
    config: { duration: 3000 },
  });

  const bubbleAnimation = useSpring({
    from: { transform: `translateX(0%) scale(1.3)` },
    to: {
      transform: `translateX(-${windowWidth * 0.55}px) scale(1.3)`,
    },
    config: { duration: 3000 },
  });

  let bubbleImage;

  if (currentLanguage === "fr") {
    bubbleImage = bubbleSpeechFR;
  } else if (currentLanguage === "es") {
    bubbleImage = bubbleSpeechEN;
  } else if (currentLanguage === "en") {
    bubbleImage = bubbleSpeechES;
  } else {
    bubbleImage = bubbleSpeechEN;
  }

  return (
    <div>
      <div className="pikachu">
        <animated.img
          src={pikachuWait}
          alt="Pikachu"
          style={pikachuAnimation}
          loading="lazy"
        />
        <animated.img
          src={bubbleImage}
          alt="Pikachu"
          className="bubbleStyle"
          style={bubbleAnimation}
          loading="lazy"
        />
      </div>
    </div>
  );
};

const TranslatedLoad = withTranslation()(LoadT);

export default function Load() {
  return (
    <Suspense fallback={<Loader />}>
      <TranslatedLoad />
    </Suspense>
  );
}
