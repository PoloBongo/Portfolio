import React, { Suspense, useState, useEffect } from "react";
import { useSpring, animated } from "react-spring";
import "../css/Home.css";

import pikachuWait from "../img/pikachuWait.gif";
import bubbleSpeech from "../img/bubbleSpeech.png";

// Traduction
import { Loader } from "./ComponentTraduction";
import { withTranslation, useTranslation } from "react-i18next";

const LoadT = () => {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
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
    from: { transform: `translateX(0%) rotate(20deg) scale(1.3)` },
    to: {
      transform: `translateX(-${
        windowWidth * 0.55
      }px) rotate(20deg) scale(1.3)`,
    },
    config: { duration: 3000 },
  });

  let targetValue;

  if (currentLanguage === "fr") {
    targetValue = 2119;
  } else if (currentLanguage === "es") {
    targetValue = 1970;
  } else if (currentLanguage === "en") {
    targetValue = 2380;
  } else {
    targetValue = 0;
  }
  const textAnimation = useSpring({
    from: { transform: `translateX(0%) rotate(20deg) scale(1.3) scaleX(-1)` },
    to: {
      transform: `translateX(-${targetValue}px) rotate(20deg) scale(1.3) scaleX(-1)`,
    },
    config: { duration: 3000 },
  });

  return (
    <div>
      <div className="pikachu">
        <animated.img
          src={pikachuWait}
          alt="Pikachu"
          style={pikachuAnimation}
        />
        <animated.img
          src={bubbleSpeech}
          alt="Pikachu"
          className="bubbleStyle"
          style={bubbleAnimation}
        />
        <animated.div className="textStyle" style={textAnimation}>
          {t("Welcome")}
        </animated.div>
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
