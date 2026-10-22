import { useEffect, useRef } from "react";

const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]';

const isShown = (el) => {
  const style = window.getComputedStyle(el);
  return (
    style.visibility !== "hidden" && style.display !== "none" && el.getClientRects().length > 0
  );
};

// Ordre de tabulation réel du navigateur : tabindex positifs (croissant), puis ordre du DOM.
// Calculé à chaque Tab, donc les éléments ajoutés ou masqués ensuite sont pris en compte.
export function getTabbables(container) {
  const all = Array.from(container.querySelectorAll(TABBABLE)).filter(
    (el) => el.tabIndex >= 0 && isShown(el) && !el.closest("[inert]")
  );
  const positive = all.filter((el) => el.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);
  const natural = all.filter((el) => el.tabIndex === 0);
  return [...positive, ...natural];
}

// Piège le Tab / Shift+Tab entre le premier et le dernier élément focusable de la page.
// Plus besoin de numéroter les tabIndex à la main : l'ordre du DOM suffit.
export default function FocusLoop({ children }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const initial = getTabbables(container);
    if (initial.length > 0) initial[0].focus({ preventScroll: true });

    const handleTab = (e) => {
      if (e.key !== "Tab") return;
      // Le menu ouvert gère lui-même son piège de focus
      if (e.target.closest && e.target.closest("[data-focus-trap]")) return;

      const items = getTabbables(container);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

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
