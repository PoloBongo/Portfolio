import React, { Suspense, useState, useEffect, useMemo } from "react";

// Traduction
import { Loader } from "./ComponentTraduction";
import { useTranslation } from "react-i18next";

const TypingAnimationT = () => {
  const { t, i18n } = useTranslation();
  const [phrases, setPhrases] = useState([
    t("Home.developerJV"),
    t("Home.developerWeb"),
  ]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateTranslation = useMemo(() => {
    return () => {
      const newPhrases = [t("Home.developerJV"), t("Home.developerWeb")];
      setPhrases(newPhrases);
      setDisplayedText("");
      setCurrentIndex(0);
      setIsDeleting(false);
      setCurrentPhraseIndex(0);
    };
  }, [t]);

  useEffect(() => {
    const typingInterval = setInterval(() => {
      const currentText = phrases[currentPhraseIndex];
      if (currentIndex < currentText.length && !isDeleting) {
        setDisplayedText((prevText) => prevText + currentText[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      } else if (currentIndex > 31 && isDeleting) {
        if (currentText[currentIndex] === "développeur") {
          setDisplayedText((prevText) => prevText.slice(0, -1));
          setCurrentIndex((prevIndex) => prevIndex - 1);
        }
      } else {
        setIsDeleting((prevDeleting) => !prevDeleting);
        if (isDeleting) {
          setCurrentPhraseIndex((prevIndex) =>
            prevIndex === phrases.length - 1 ? 0 : prevIndex + 1
          );
        }
      }

      if (isDeleting && currentIndex === 31) {
        updateTranslation();
      }
    }, 140);

    return () => {
      clearInterval(typingInterval);
    };
  }, [
    currentIndex,
    isDeleting,
    phrases,
    currentPhraseIndex,
    updateTranslation,
  ]);

  useEffect(() => {
    updateTranslation();
  }, [i18n.language, updateTranslation]);

  return (
    <div>
      <p className="fontsBold">{displayedText}</p>
    </div>
  );
};

export default function TypingAnimation() {
  return (
    <Suspense fallback={<Loader />}>
      <TypingAnimationT />
    </Suspense>
  );
}
