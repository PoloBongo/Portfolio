import { useEffect, useRef } from "react";

export default function FocusLoop({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let focusables = Array.from(
      container.querySelectorAll('[tabindex]:not([tabindex="-1"])')
    );

    focusables.sort((a, b) => {
      return (a.tabIndex || 0) - (b.tabIndex || 0);
    });

    if (focusables.length === 0) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    first.focus();

    const handleTab = (e) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleTab);

    return () => {
      container.removeEventListener("keydown", handleTab);
    };
  }, []);

  return <div ref={containerRef}>{children}</div>;
}
